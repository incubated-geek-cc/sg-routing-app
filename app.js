const express = require("express");
const config = require("dotenv").config();

const PORT = process.env.PORT;

const OPENCAGE_API_KEY=process.env.OPENCAGE_API_KEY;

// routing api keys
const ONEMAP_EMAIL = process.env.ONEMAP_EMAIL;
const ONEMAP_PASSWORD = process.env.ONEMAP_PASSWORD;

const GRAPHHOPPER_API_KEY=process.env.GRAPHHOPPER_API_KEY;
const HERE_API_KEY=process.env.HERE_API_KEY;

const path = require("path");
const request = require("request");
const favicon = require("serve-favicon");
const engine = require("consolidate");
const compression = require('compression');

var ONEMAP_API_TOKEN = ""; // Onemap API Token
request({
    url: "https://www.onemap.gov.sg/api/auth/post/getToken",
    // https://developers.onemap.sg/privateapi/auth/post/getToken
    method: "POST",
    json: true,
    body: {
      email: ONEMAP_EMAIL,
      password: ONEMAP_PASSWORD
    }
}, (err, res, body) => {
  ONEMAP_API_TOKEN = body.access_token;
});

// set up router
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
// eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI5ZTU2ZDg0MDEzODk3MzdjY2U3NjVmMGUzMGIzMTgyMSIsImlzcyI6Imh0dHA6Ly9pbnRlcm5hbC1hbGItb20tcHJkZXppdC1pdC0xMjIzNjk4OTkyLmFwLXNvdXRoZWFzdC0xLmVsYi5hbWF6b25hd3MuY29tL2FwaS92Mi91c2VyL3Bhc3N3b3JkIiwiaWF0IjoxNzAzMDc4MDk0LCJleHAiOjE3MDMzMzcyOTQsIm5iZiI6MTcwMzA3ODA5NCwianRpIjoiTEpvR0hNN1JHaGswQ1hmYSIsInVzZXJfaWQiOjIwMzksImZvcmV2ZXIiOmZhbHNlfQ.hfbw-hPLQXKcsV7Hl-0vqEcw4BfoUv75bpT2ZEP5hoo

// Onemap Routing API
router.get("/onemap/directions/json/:routeType/:start/:end", (req, res) => {   
  let baseUrl="https://www.onemap.gov.sg/api/public/routingsvc/route?"; // call onemap routing api via a proxy
  // https://www.onemap.gov.sg/api/public/routingsvc/route?start=1.319728%2C103.8421&end=1.319728905%2C103.8421581&routeType=walk
  // https://developers.onemap.sg/privateapi/routingsvc/route
  let params=req.params;
  params["token"]=ONEMAP_API_TOKEN;

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


// let options={
//   url: endpoint,
//   headers: {
//     "Accept": "application/json",
//     "Content-Type": "application/json"
//   },
//   body: JSON.stringify(postData)
// };
// request.post(options, (err, res, body) => {
//   let result=res.body;
//   if (err) {
//     return _res.status(500).json({ 
//       type: "error", 
//       message: (err !== null && typeof err.message !== "undefined") ? err.message : "Error."
//     });
//   }
//   _res.json(JSON.parse(result));
// })


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

router.get("/hereapi/v8/route/json/:origin/:destination/:transportMode", (req, res) => {
  let baseUrl="https://router.hereapi.com/v8/routes?";
  let params=req.params;
  params["return"]="polyline,actions,instructions,travelSummary";
  params["apikey"]=HERE_API_KEY;

  let fullUrl=concatParams(baseUrl,params);

  request({ url: fullUrl }, (err, response, body) => {
    if (err || response.statusCode !== 200) {
      return res.status(500).json({ 
        type: "error", 
        message: (err !== null && typeof err.message !== "undefined") ? err.message : "Error. Unabled to retrieve data from HERE's Routing v8 API."
      });
    }
    res.json(JSON.parse(body))
  })
});