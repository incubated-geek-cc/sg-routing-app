# sg-routing-app

### sɢᴿᵒᵘᵗᵉʳ 
<img src='https://github.com/incubated-geek-cc/sg-routing-app/raw/main/public/img/logo.png' alt='sg-routing-app' width='55' height='55' />

📍 [sg-routing-app](https://sg-routing-app.glitch.me/) is a web application which integrates multiple routing APIs for custom selection and visualisation.

🧰 Web application was built with <strong>HTML5</strong> and <strong>NodeJS</strong>. Rationale of development was for self-exploration. From a macro-perspective this serves as a proof-of-concept for showcasing the optimal routes suggested by different map service providers.

## ℹ Implementation Overview

### ❶ Routing APIs

All <strong>3</strong> Routing APIs implemented are open-sourced and for public use. (Please note that this web application pertains to Singapore's roads and traffic. To cater to alternative or global use-cases please feel free to fork this repo and tweak the code accordingly.)

* <a href="https://www.onemap.gov.sg/docs/#onemap-rest-apis" target="_blank">OneMap Rest APIs</a>, by <a href="http://SLA.gov.sg" target="_blank"><abbr title="Singapore Land Authority">SLA</abbr></a>
* <a href="https://graphhopper.com/maps/" target="_blank">The Graphhopper Directions API</a>
* <a href="https://www.here.com/platform/routing" target="_blank">HERE Routing API</a>

### ❷ Geocoding APIs

<strong>2</strong> Geocoding APIs were used. 

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

## 📌 Project Status

* Currently still WIP. Would eventually finetune its layout for 📱 mobile responsiveness
* Shall publish an in-depth implementation recount sometime soon on [Medium](https://geek-cc.medium.com/) - End of the April 2022 ✍ 
* Feel free to follow me on 🔗 [Medium](https://geek-cc.medium.com/) if you are interested in this piece of work or are interested in <strong>Data Analytics</strong> (including Tableau Dashboarding), 🌐 <strong>Geospatial Intelligence & GIS</strong> or <strong>other web-related content</strong>