<div align="center">
  <img src='https://github.com/incubated-geek-cc/sg-routing-app/raw/main/public/img/logo.png' width='96' height='96' alt='logo' />
  <div>sɢᴿᵒᵘᵗᵉʳ</div>
  <h1 dir="auto">SG Routing App</h1>

**Rationale of development was for self-exploration. From a macro-perspective, this serves as a proof-of-concept for showcasing the optimal routes suggested by different map service providers. ✍ Article at:**
<div align="left">
	<ol>
		<li><a href='https://towardsdatascience.com/data-visualisation-of-travel-routes-by-multiple-service-providers-on-web-app-built-with-leafletjs-dee2117647e9' target='_blank'>Data Visualisation of Travel Routes by Multiple Service Providers on Web App— Built with LeafletJS + NodeJS</a></li>
	</ol>
</div>
</div>

📌 Project Status
* <del>Currently still WIP. Would eventually finetune its layout for 📱 mobile responsiveness</del> (Implemented ✔️ as of Nov 2022)

🧰  Integrates multiple routing APIs for custom selection and visualisation.

[**Web App :: Link**](https://sg-routing-app.glitch.me/) &nbsp;&nbsp;&nbsp; [**Web App :: Backup Link**](https://sg-routing-app.onrender.com/) 

## Features and Screenshots

<p><strong>📱 Mobile View</strong></p>
<br/><img src="https://github.com/incubated-geek-cc/sg-routing-app/raw/main/public/img/mobile_ui.jpg" width="250px" />

<p><strong>💻 🖥️ On Larger Screens</strong></p>
<br/><img src="https://github.com/incubated-geek-cc/sg-routing-app/raw/main/public/img/non_mobile_ui.jpg" width="800px" />

<p><strong>📱 Mobile View for all Route Services displayed</strong></p>
---
<table>
	<thead>
		<tr>
			<th align='center' colspan='2'>OneMap</th>
			<th align='center' colspan='2'>Graphhopper</th>
			<th align='center' colspan='2'>Here</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td align='center'><img src="https://github.com/incubated-geek-cc/sg-routing-app/raw/main/public/img/OneMapRoute.jpg" width="250px" /></td> 
			<td align='center'><img src="https://github.com/incubated-geek-cc/sg-routing-app/raw/main/public/img/OneMapRouteDetails.jpg" width="250px" /></td> 
			<td align='center'><img src="https://github.com/incubated-geek-cc/sg-routing-app/raw/main/public/img/GraphhopperRoute.jpg" width="250px" /></td> 
			<td align='center'><img src="https://github.com/incubated-geek-cc/sg-routing-app/raw/main/public/img/GraphhopperRouteDetails.jpg" width="250px" /></td> 
			<td align='center'><img src="https://github.com/incubated-geek-cc/sg-routing-app/raw/main/public/img/HereRoute.jpg" width="250px" /></td>
			<td align='center'><img src="https://github.com/incubated-geek-cc/sg-routing-app/raw/main/public/img/HereRouteDetails.jpg" width="250px" /></td>
		</tr>
	</tbody>
</table>
---
<p><strong>📱 Mobile View for Other General Features</strong></p>
<table>
	<thead>
		<tr>
			<th align='center' colspan='2'>Reverse Route Toggle/Display</th>
			<th align='center'>Display Full Route Instructions</th>
			<th align='center'>Export GeoJSON of Routes</th>
			<th align='center'>View Attribution list</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td align='center'><img src="https://github.com/incubated-geek-cc/sg-routing-app/raw/main/public/img/Reverse_Direction_Route.jpg" width="250px" /></td> 
			<td align='center'><img src="https://github.com/incubated-geek-cc/sg-routing-app/raw/main/public/img/Reverse_Route_Details" width="250px" /></td>
			<td align='center'><img src="https://github.com/incubated-geek-cc/sg-routing-app/raw/main/public/img/RouteInstructions.jpg" width="250px" /></td> 
			<td align='center'><img src="https://github.com/incubated-geek-cc/sg-routing-app/raw/main/public/img/ExportGeoJSONData.jpg" width="250px" /></td>
			<td align='center'><img src="https://github.com/incubated-geek-cc/sg-routing-app/raw/main/public/img/AttributionList.jpg" width="250px" /></td>
		</tr>
	</tbody>
</table>

## 📜 License & Credits

<ol>
	<li>© <a href="https://www.onemap.sg/legal/termsofuse.html" target="_blank">OneMap, by <a href="http://SLA.gov.sg" target="_blank"><abbr title="Singapore Land Authority">SLA</abbr></a></a>
	<li>© Graphhopper | <a rel="license" href="http://creativecommons.org/licenses/by-sa/2.0/"><img alt="Creative Commons License" style="border-width:0" src="https://i.creativecommons.org/l/by-sa/2.0/88x31.png" /></a><br />This work is licensed under a <a rel="license" href="http://creativecommons.org/licenses/by-sa/2.0/">Creative Commons Attribution-ShareAlike 2.0 Generic License</a></li>
	<li>© <a href="https://legal.here.com/en-gb/terms/acceptable-use-policy" target="_blank">HERE</a></li>
	<li>© Credits to <a href="https://carto.com/attributions" target="_blank"> CARTO</a>, by <a href="http://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a></li>
</ol>

## ℹ Miscellaneous

All <strong>3</strong> Routing APIs implemented are open-sourced and for public use. (Please note that this web application pertains to Singapore's roads and traffic. To cater to alternative or global use-cases please feel free to fork this repo and tweak the code accordingly.)