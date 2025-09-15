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

const LOCATION_IQ_API_TOKEN=process.env.LOCATION_IQ_API_TOKEN;

const path = require("path");
const request = require("request");
const favicon = require("serve-favicon");
const engine = require("consolidate");
const compression = require('compression');

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
request(authOptions, (err, res, body) => {
  // console.log(body.access_token);
  ONEMAP_API_TOKEN = body.access_token;
});

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




// Geocoding
// https://us1.locationiq.com/v1/reverse?key=Your_API_Access_Token&lat=51.50344025&lon=-0.12770820958562096&format=json
router.get("/locationiq/geocode/json/v4/:lat/:lon", (req, res) => {
  let baseUrl="https://us1.locationiq.com/v1/reverse?";
  let params=req.params;
  params["format"]="json";
  params["key"]=LOCATION_IQ_API_TOKEN;
  let fullUrl=concatParams(baseUrl,params);
  request({ 
    "url": fullUrl,
    "method": "GET",
    "json": true,
    "headers": {
      "Accept": "application/json",
      "Accept-Language": "en"
      // "X-Application-Id": TRAVEL_TIME_APP_ID,
      // "X-Api-Key": TRAVEL_TIME_API_KEY
    }
  }, (err, response, body) => {
    if (err || response.statusCode !== 200) {
      return res.status(500).json({
        type: "error", 
        message: (err !== null && typeof err.message !== "undefined") ? err.message : "Error. Unabled to retrieve data from LocationIQ's Geocoding API."
      });
    }
    res.json(body)
  })
});


// Onemap Routing API
router.get("/onemap/directions/json/:routeType/:start/:end", (req, res) => {   
  let baseUrl="https://www.onemap.gov.sg/api/public/routingsvc/route?"; // call onemap routing api via a proxy
  // https://www.onemap.gov.sg/api/public/routingsvc/route?start=1.319728%2C103.8421&end=1.319728905%2C103.8421581&routeType=walk
  // https://developers.onemap.sg/privateapi/routingsvc/route
  let params=req.params;
  let fullUrl=concatParams(baseUrl,params);

  request({ 
    url: fullUrl,
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      "Authorization": `Bearer ${ONEMAP_API_TOKEN}`
    }
  }, (err, response, body) => {
    // console.log(body);
    let immediateResponse=JSON.parse(body);
    if(typeof immediateResponse["error"] !== "undefined") {
      return res.status(500).json({ // renew token here
        type: "error",
        message: immediateResponse["error"]
      });
    } else if (err || response.statusCode !== 200) {
      return res.status(500).json({ 
        type: "error", 
        message: (err !== null && typeof err.message !== "undefined") ? err.message : "Error. Unabled to retrieve data from OneMap's Routing API."
      });
    }
    res.json(JSON.parse(body))
  })
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


// https://router.hereapi.com/v8/routes?transportMode=car&origin=52.5308,13.3847&destination=52.5264,13.3686&return=summary&apikey={YOUR_API_KEY}
// traveltimeapp routing
// https://us1.locationiq.com/v1/directions/driving/-0.12070277,51.514156;-0.12360937,51.507996?key=Your_API_Access_Token&steps=true&alternatives=true&geometries=polyline&overview=full
https://us1.locationiq.com/v1/directions/driving/{coordinates}?key=<YOUR_ACCESS_TOKEN>&alternatives=false&steps=true&geometries=polyline&overview=full&annotations=true
// https://us1.locationiq.com/v1/directions/driving/103.831003321455,1.30607515954354;103.805704361472,1.3249477928719?key=pk.60f485bbb02039527d886d1c4dbea7bf&alternatives=true&steps=true&geometries=polyline&overview=full&annotations=true
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

  // console.log(fullUrl);
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
    // console.log(JSON.stringify(body));
    if (err || response.statusCode !== 200) {
      return res.status(500).json({
        type: "error", 
        message: (err !== null && typeof err.message !== "undefined") ? err.message : "Error. Unabled to retrieve data from LocationIQ's Routing API."
      });
    }
    res.json(body);
  })
});