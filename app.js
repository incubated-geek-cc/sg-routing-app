const express = require("express");
const config = require("dotenv").config();

const PORT = process.env.PORT;

const OPENCAGE_API_KEY=process.env.OPENCAGE_API_KEY;

// routing api keys
const ONEMAP_EMAIL = process.env.ONEMAP_EMAIL;
const ONEMAP_PASSWORD = process.env.ONEMAP_PASSWORD;

const GRAPHHOPPER_API_KEY=process.env.GRAPHHOPPER_API_KEY;

const TRAVEL_TIME_APP_ID=process.env.TRAVEL_TIME_APP_ID;
const TRAVEL_TIME_API_KEY=process.env.TRAVEL_TIME_API_KEY;

const LOCATION_IQ_API_TOKEN=process.env.LOCATION_IQ_API_TOKEN; // still used for LocationIQ routing

const GEOCODE_XYZ_KEY=process.env.GEOCODE_XYZ_KEY || ""; // optional; free tier works without it

// basemap tile proxy + cache
const BASEMAP_API_KEY=process.env.BASEMAP_API_KEY;
const TILE_CACHE_DIR=process.env.TILE_CACHE_DIR || require("path").join(__dirname, "tile_cache");
const TILE_CACHE_DAYS=parseFloat(process.env.TILE_CACHE_DAYS || "30");     // re-fetch a cached tile after this many days
const TILE_CACHE_MAX_ZOOM=parseInt(process.env.TILE_CACHE_MAX_ZOOM || "17", 10); // deeper zooms pass through uncached (disk size)

const fs = require("fs");
const path = require("path");
const request = require("request");
const favicon = require("serve-favicon");
const engine = require("consolidate");
const compression = require('compression');

// ======================= ONEMAP TOKEN (auto-renew) =========================
const authOptions={
    url: 'https://www.onemap.gov.sg/api/auth/post/getToken',
    method: 'POST',
    json: true,
    body: {
      email: ONEMAP_EMAIL,
      password: ONEMAP_PASSWORD
    }
};
var ONEMAP_API_TOKEN = ""; // Onemap API Token

function renewOneMapToken() {
  return new Promise((resolve) => {
    request(authOptions, (err, res, body) => {
      if (!err && body && body.access_token) {
        ONEMAP_API_TOKEN = body.access_token;
        console.log("OneMap token renewed");
      } else {
        console.error("OneMap token renewal failed:", err ? err.message : body);
      }
      resolve(ONEMAP_API_TOKEN);
    });
  });
}
renewOneMapToken();
setInterval(renewOneMapToken, 2.5 * 24 * 60 * 60 * 1000); // OneMap tokens last 3 days; renew every 2.5

var router = express.Router();
router.use(express.urlencoded({ extended: true}));
router.use(express.json());
router.use((req, res, next) => { // router middleware
    res.setHeader('Access-Control-Allow-Origin', process.env.ORIGIN || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');
    next();
});

const app = express();
// Compress all HTTP responses
app.use(compression());
// REGISTER ALL ROUTES -------------------------------
app.use("/api", router); // all of the routes will be prefixed with /api

// set up express app properties
app.use(express.static(path.join(__dirname, "public")))
.set("views", path.join(__dirname, "views"))
.engine("html", engine.mustache)
.use(favicon(path.join(__dirname, "public", "img/favicon.ico")))
.set("view engine", "html")
.get("/", (req, res) => res.render("index.html"))
.get("/index.html", (req, res) => res.render("index.html"))
.listen(PORT, () => {
  console.log(`SG Transportation Routing App [using Proxy] is listening on port ${PORT}!`)
  // require("openurl").open(`http://localhost:${PORT}/index.html`)
});

function concatParams(baseUrl, params={}) {
  let fullUrl=baseUrl;
  let counter=0;
  for(let p in params) {
    if(counter>0) {
      fullUrl+="&";
    }
    fullUrl+=p+"="+params[p];
    counter++;
  }
  return fullUrl;
}

// OpenCage Geocoding
router.get("/opencage/geocode/json/v1/:language/:q", (req, res) => {
  let baseUrl="https://api.opencagedata.com/geocode/v1/json?";
  let params=req.params;
  params["key"]=OPENCAGE_API_KEY;
  params["no_annotations"]="1";
  let fullUrl=concatParams(baseUrl,params);
  request({ url: fullUrl }, (err, response, body) => {
    if (err || response.statusCode !== 200) {
      return res.status(500).json({
        type: "error",
        message: (err !== null && typeof err.message !== "undefined") ? err.message : "Error. Unabled to retrieve data from OpenCageData Geocoding API."
      });
    }
    res.json(JSON.parse(body))
  })
});


// ======================= REVERSE GEOCODING (replaces LocationIQ) =========================
// Response keeps LocationIQ's shape: { address: { road, suburb, town, neighbourhood, postcode }, display_name, source }
// so the front end's getFirstAvailableLocation(obj.address) works unchanged.

const cleanVal = (v) => (v === undefined || v === null || /^(nil|null|)$/i.test(String(v).trim())) ? undefined : String(v).trim();

function getJson(options) {
  return new Promise((resolve) => {
    request(Object.assign({ json: true, timeout: 8000 }, options), (err, response, body) => {
      if (err || !response || response.statusCode !== 200) return resolve(null);
      if (typeof body === "string") { try { body = JSON.parse(body); } catch (_) { return resolve(null); } }
      resolve(body);
    });
  });
}

// 1st choice: OneMap reverse geocode (Singapore-specific, uses the token we already hold)
async function oneMapReverse(lat, lon, retry=true) {
  const url = concatParams("https://www.onemap.gov.sg/api/public/revgeocode?", {
    location: `${lat},${lon}`, buffer: "50", addressType: "All", otherFeatures: "N"
  });
  const body = await getJson({ url, headers: { "Accept": "application/json", "Authorization": `Bearer ${ONEMAP_API_TOKEN}` } });
  if (body && body.error && retry) { await renewOneMapToken(); return oneMapReverse(lat, lon, false); }
  const hit = body && Array.isArray(body.GeocodeInfo) && body.GeocodeInfo[0];
  if (!hit) return null;
  const road = cleanVal(hit.ROAD);
  const building = cleanVal(hit.BUILDINGNAME);
  const block = cleanVal(hit.BLOCK);
  if (!road && !building) return null;
  return {
    source: "OneMap",
    display_name: [block, road, building, cleanVal(hit.POSTALCODE)].filter(Boolean).join(", "),
    address: { road: road || building, neighbourhood: building, house_number: block, postcode: cleanVal(hit.POSTALCODE), country: "Singapore", country_code: "sg" }
  };
}

// 2nd choice: geocode.xyz free tier (same GET style as geocode_sites.js)
async function geocodeXyzReverse(lat, lon) {
  const params = { json: "1" };
  if (GEOCODE_XYZ_KEY) params["auth"] = GEOCODE_XYZ_KEY;
  const body = await getJson({ url: concatParams(`https://geocode.xyz/${lat},${lon}?`, params), headers: { "Accept": "application/json" } });
  if (!body || body.error) return null;
  const road = cleanVal(typeof body.staddress === "string" ? body.staddress : undefined);
  const town = cleanVal(typeof body.city === "string" ? body.city : undefined);
  if (!road && !town) return null;
  return {
    source: "geocode.xyz",
    display_name: [cleanVal(body.stnumber), road, town, cleanVal(body.postal)].filter(Boolean).join(", "),
    address: { road, town, house_number: cleanVal(body.stnumber), postcode: cleanVal(body.postal), country: "Singapore", country_code: "sg" }
  };
}

async function reverseGeocodeHandler(req, res) {
  const lat = parseFloat(req.params.lat), lon = parseFloat(req.params.lon);
  if (!isFinite(lat) || !isFinite(lon)) {
    return res.status(400).json({ type: "error", message: "Error. Invalid latitude/longitude." });
  }
  const result = (await oneMapReverse(lat, lon)) || (await geocodeXyzReverse(lat, lon));
  if (result) return res.json(result);
  // Last resort: never break the front end; show coordinates as the label
  const label = `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
  res.json({ source: "coordinates", display_name: label, address: { road: label } });
}

router.get("/reverse/geocode/json/:lat/:lon", reverseGeocodeHandler);
// Old path kept as an alias so the existing front end works without edits
router.get("/locationiq/geocode/json/v4/:lat/:lon", reverseGeocodeHandler);


// Onemap Routing API
router.get("/onemap/directions/json/:routeType/:start/:end", (req, res) => {
  let baseUrl="https://www.onemap.gov.sg/api/public/routingsvc/route?"; // call onemap routing api via a proxy
  // https://www.onemap.gov.sg/api/public/routingsvc/route?start=1.319728%2C103.8421&end=1.319728905%2C103.8421581&routeType=walk
  let params=req.params;
  let fullUrl=concatParams(baseUrl,params);

  const callOneMap = (retry) => request({
    url: fullUrl,
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Authorization": `Bearer ${ONEMAP_API_TOKEN}`
    }
  }, async (err, response, body) => {
    if (err || !response) {
      return res.status(500).json({ type: "error", message: (err && err.message) ? err.message : "Error. Unabled to retrieve data from OneMap's Routing API." });
    }
    let immediateResponse;
    try { immediateResponse=JSON.parse(body); } catch (_) { immediateResponse={ error: "Invalid response from OneMap" }; }
    if(typeof immediateResponse["error"] !== "undefined" || response.statusCode === 401) {
      if (retry) { await renewOneMapToken(); return callOneMap(false); } // renew token and try once more
      return res.status(500).json({ type: "error", message: immediateResponse["error"] || "OneMap authorisation failed" });
    } else if (response.statusCode !== 200) {
      return res.status(500).json({ type: "error", message: "Error. Unabled to retrieve data from OneMap's Routing API." });
    }
    res.json(immediateResponse)
  });
  callOneMap(true);
});

router.get("/graphhopper/route/json/:locale/:point_o/:point_d/:elevation/:profile", (req, res) => {
  let baseUrl="https://graphhopper.com/api/1/route?";
  let params=req.params;
  params["type"]="json";
  params["key"]=GRAPHHOPPER_API_KEY;

  let fullUrl=concatParams(baseUrl,params);
  fullUrl=fullUrl.replace("point_o","point");
  fullUrl=fullUrl.replace("point_d","point");

  request({ url: fullUrl }, (err, response, body) => {
    if (err || response.statusCode !== 200) {
      return res.status(500).json({
        type: "error",
        message: (err !== null && typeof err.message !== "undefined") ? err.message : "Error. Unabled to retrieve data from  GraphHopper's Routing API."
      });
    }
    res.json(JSON.parse(body))
  })
});


// LocationIQ routing (unchanged)
// https://us1.locationiq.com/v1/directions/driving/{lng,lat;lng,lat}?key=<TOKEN>&alternatives=true&steps=true&geometries=polyline&overview=full&annotations=true
router.get("/locationiq/v1/route/json/:start_point/:end_point/:type", (req, res) => {
  let params=req.params;
  let baseUrl=`https://us1.locationiq.com/v1/directions/${params["type"]}/${params["start_point"]};${params["end_point"]}?`;

  delete params["type"];
  delete params["start_point"];
  delete params["end_point"];

  params["key"]=LOCATION_IQ_API_TOKEN;
  params["alternatives"]="true";
  params["steps"]="true";
  params["geometries"]="polyline";
  params["overview"]="full";
  params["annotations"]="true";
  let fullUrl=concatParams(baseUrl,params);

  request({
    "url": fullUrl,
    "method": "GET",
    "json": true,
    "headers": {
      "Accept": "application/json",
      "Accept-Language": "en",
      "X-Api-Key": LOCATION_IQ_API_TOKEN
    }
  }, (err, response, body) => {
    if (err || response.statusCode !== 200) {
      return res.status(500).json({
        type: "error",
        message: (err !== null && typeof err.message !== "undefined") ? err.message : "Error. Unabled to retrieve data from LocationIQ's Routing API."
      });
    }
    res.json(body);
  })
});


// ======================= BASEMAP TILE PROXY + DISK CACHE (hides the key) =========================
// Front end: L.tileLayer('api/basemap/{z}/{x}/{y}.png', ...)
const TILE_BOUNDS = { minLat: 1.10, maxLat: 1.62, minLng: 103.45, maxLng: 104.17 }; // Singapore + margin
const TILE_MIN_ZOOM = 9, TILE_MAX_ZOOM = 19; // 19 because detectRetina requests one level deeper
const lng2tileX = (lng, z) => Math.floor((lng + 180) / 360 * Math.pow(2, z));
const lat2tileY = (lat, z) => {
  const r = lat * Math.PI / 180;
  return Math.floor((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * Math.pow(2, z));
};
const inflightTiles = new Map(); // one upstream fetch per tile, even if many browsers ask at once

function fetchTileUpstream(z, x, y) {
  const tileUrl = `https://basemaps.cartocdn.com/rastertiles/voyager/${z}/${x}/${y}.png?key=${BASEMAP_API_KEY}`;
  return new Promise((resolve, reject) => {
    request({ url: tileUrl, encoding: null, timeout: 10000 }, (err, response, body) => {
      if (err) return reject(err);
      const type = String(response.headers["content-type"] || "");
      if (response.statusCode !== 200 || !type.startsWith("image/") || !body || !body.length) {
        return reject(new Error(`Tile upstream returned ${response.statusCode}`));
      }
      resolve(body);
    });
  });
}

async function writeTileAtomic(file, buf) {
  await fs.promises.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
  await fs.promises.writeFile(tmp, buf);
  await fs.promises.rename(tmp, file); // never leaves a half-written tile in the cache
}

function sendTile(res, buf, cacheStatus) {
  res.set({
    "Content-Type": "image/png",
    "Cache-Control": "public, max-age=604800", // browsers keep tiles 7 days
    "X-Tile-Cache": cacheStatus
  });
  res.send(buf);
}

router.get("/basemap/:z/:x/:file", async (req, res) => {
  const m = /^(\d+)\.png$/.exec(req.params.file);
  const z = parseInt(req.params.z, 10), x = parseInt(req.params.x, 10), y = m ? parseInt(m[1], 10) : NaN;
  if (![z, x, y].every(Number.isInteger) || z < TILE_MIN_ZOOM || z > TILE_MAX_ZOOM) return res.sendStatus(400);

  // Only Singapore tiles, so the proxy can't be used as a free world tile server
  if (x < lng2tileX(TILE_BOUNDS.minLng, z) || x > lng2tileX(TILE_BOUNDS.maxLng, z) ||
      y < lat2tileY(TILE_BOUNDS.maxLat, z) || y > lat2tileY(TILE_BOUNDS.minLat, z)) {
    return res.sendStatus(404);
  }

  // Deter hotlinking from other sites (Referer can be faked: a deterrent, not security)
  const allowedOrigin = process.env.ORIGIN;
  if (allowedOrigin && allowedOrigin !== "*") {
    const referer = req.get("referer") || "";
    if (!referer.startsWith(allowedOrigin)) return res.sendStatus(403);
  }

  const useCache = z <= TILE_CACHE_MAX_ZOOM;
  const file = path.join(TILE_CACHE_DIR, String(z), String(x), `${y}.png`);
  let stale = null;

  if (useCache) {
    try {
      const st = await fs.promises.stat(file);
      const buf = await fs.promises.readFile(file);
      if ((Date.now() - st.mtimeMs) / 86400000 < TILE_CACHE_DAYS) return sendTile(res, buf, "HIT");
      stale = buf; // too old: try to refresh, but keep it in case upstream is down
    } catch (_) { /* not cached yet */ }
  }

  const key = `${z}/${x}/${y}`;
  try {
    let job = inflightTiles.get(key);
    if (!job) {
      job = fetchTileUpstream(z, x, y).then(async (buf) => {
        if (useCache) { try { await writeTileAtomic(file, buf); } catch (e) { console.error("Tile cache write failed:", e.message); } }
        return buf;
      }).finally(() => inflightTiles.delete(key));
      inflightTiles.set(key, job);
    }
    const buf = await job;
    sendTile(res, buf, useCache ? (stale ? "REFRESHED" : "MISS") : "BYPASS");
  } catch (e) {
    if (stale) return sendTile(res, stale, "STALE"); // upstream down: serve the old tile
    if (!res.headersSent) res.sendStatus(502);
  }
});