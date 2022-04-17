# sg-routing-app

<img src='https://github.com/incubated-geek-cc/sg-routing-app/raw/main/public/img/logo.png' alt='sg-routing-app' width='25' height='25' />
sɢᴿᵒᵘᵗᵉʳ


[sg-routing-app](https://sg-routing-app.glitch.me/) is a web application which integrates multiple routing APIs for custom selection and visualisation.

Web application was built with HTML5 and NodeJS. Rationale of development was for self-exploration. From a macro-perspective this serves as a proof-of-concept for showcasing the optimal routes suggested by different map service providers.

## 🧰 Implementation

### ❶ Routing APIs

All 3 Routing APIs implemented are open-sourced and for public use. (Please note that this web application pertains to Singapore's roads and traffic. For international usage, feel free to fork this repo and tweak the code accordingly.)

* <a href="https://www.onemap.gov.sg/docs/#onemap-rest-apis" target="_blank">OneMap Rest APIs</a>, by <a href="http://SLA.gov.sg" target="_blank"><abbr title="Singapore Land Authority">SLA</abbr></a>
* <a href="https://graphhopper.com/maps/" target="_blank">The Graphhopper Directions API</a>
* <a href="https://www.here.com/platform/routing" target="_blank">HERE Routing API</a>

### ❷ Geocoding APIs

2 Geocoding APIs were used. 

* <a href="https://opencagedata.com/credits" target="_blank">OpenCage Geocoding API</a>
* <a href="https://www.onemap.gov.sg/docs/#onemap-rest-apis" target="_blank">OneMap Rest APIs</a>, by <a href="http://SLA.gov.sg" target="_blank"><abbr title="Singapore Land Authority">SLA</abbr></a> (auto-complete of addresses for Origin & Destination fields were read from static data crawled from this API.)

### ❸ JavaScript Map Plugin

The choice of JavaScript map plugin in this Geospatial web application is <a href="https://leafletjs.com/SlavaUkraini/reference.html" target="_blank"> Leaflet</a>. Other noteworthy JavaScript plugins used include:

* <a href="https://thednp.github.io/bootstrap.native/" target="_blank">Native Bootstrap v4</a> (for layout and components)
* <a href="https://github.com/acoti/articulate.js" target="_blank">ArticulateJS</a>✶ (for 🗣 Text-to-Speech synthesis)

✶ The version used in [sg-routing-app](https://sg-routing-app.glitch.me/) has been tweaked slightly. Original developer and credits for plugin is for GitHub User [acoti](https://github.com/acoti).

### ❹ Basemap

🗺 Choice of basemap implemented is Voyager. Credits to <a href="https://carto.com/attributions" target="_blank"> CARTO</a>, by <a href="http://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>

---

## Project Status

* Currently still WIP. Would eventually finetune its layout for mobile responsiveness.
* In-depth development process shall be published in an article ✍ via [Medium](https://geek-cc.medium.com/). Feel free to follow me on [Medium](https://geek-cc.medium.com/) if you are interested in Data Analytics (including Tableau Dashboarding), 🌐 Geospatial Intelligence & GIS or other web-related content.