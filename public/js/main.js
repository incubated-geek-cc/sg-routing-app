if (document.readyState === 'complete' || document.readyState !== 'loading' && !document.documentElement.doScroll) {
  callback();
} else {
  document.addEventListener('DOMContentLoaded', async() => {
    console.log('DOMContentLoaded');
    // ======================= MAP =========================
    const minZoomVal=9;
    const maxZoomVal=18;
    const defaultZoom=11;
    const ne=[1.56073, 104.1147];
    const sw=[1.16, 103.502];

    const lat = ( ne[0]+sw[0] )/2; // 1.3603649999999998
    const lng = ( ne[1]+sw[1] )/2; // 103.80834999999999

    var map = L.map("map", {
        zoomControl: false,
        renderer: L.svg()
    });

    const toCamelCase = (str) => ( (str.toLowerCase()).replace(/\w+/g, ((str) => ( str.charAt(0).toUpperCase()+str.substr(1) ).replace(/\r/g, "")) ) );
    const basemapUrl='http://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png';
    const attributionStr= "";

    let basemapLayer = L.tileLayer(basemapUrl, {
      detectRetina: true,
      attribution: attributionStr,
      minZoom: minZoomVal,
      maxZoom: maxZoomVal,
      errorTileUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAgAAAAIAAQMAAADOtka5AAAAA1BMVEX28eS888QlAAAANklEQVR4nO3BAQEAAACCIP+vbkhAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB8G4IAAAHSeInwAAAAAElFTkSuQmCC"
    }).addTo(map);

    let scale = L.control.scale({
      maxWidth: 100,
      metric: true,
      imperial: false,
      position: 'topright'
    }).addTo(map);


    // L.control.zoom({ position: 'topleft' }).addTo(map);
    const switch_origin_destination=document.getElementById('switch_origin_destination');
    const exportBtn=document.getElementById('exportBtn');
    const speakBtn=document.getElementById('speakBtn');

    const route_options=document.getElementById('route_options');
    const route_info=document.getElementById('route_info');
    const route_instructions_btn=document.getElementById('route_instructions_btn');
    const route_instructions_hidden=document.getElementById('route_instructions_hidden');
    const routeIntructionsCarousel=document.getElementById('routeIntructionsCarousel');

    const geocoder_o=document.getElementById('geocoder_o');
    const geocoder_d=document.getElementById('geocoder_d');
    
    const loaderSignalCSS='block';
    const loaderSignal=document.getElementById('loaderSignal');
    loaderSignal['style']['display']='none';

    await new Promise((resolve, reject) => setTimeout(resolve, 150));
    
    map.fitBounds([ne, sw]);
    map.setView([lat, lng], defaultZoom);

    // ================================= MAP INIT DONE ========================================
    var initStartPoint='1.30607515954354,103.831003321455';
    var initEndPoint='1.3249477928719,103.805704361472';

    var initStartAddr='CLAYMORE HILL';
    var initEndAddr='DUCHESS ROAD';

    var startPoint=initStartPoint;
    var endPoint=initEndPoint;

    geocoder_o.value=toCamelCase(initStartAddr);
    geocoder_d.value=toCamelCase(initEndAddr);

    var routes=[];

    const iconSize=[25, 25];

    var originMarker=null; 
    var destinationMarker=null; 
    var originName=null;
    var destinationName=null;

    var geojsonOutputStr='';
    var serviceProvider='OneMap';
    var url = '';
    var apiCall = '';
    var params = {};

    function setRouteInstructions(routeInstructions) {
      let route_instructionsDIV=document.createElement('div');
      route_instructionsDIV.route_instructions='geojson';
      route_instructionsDIV.classList.add('small');
      route_instructionsDIV.classList.add('user-select-none');
      route_instructionsDIV.id='route_instructions';
      route_instructionsDIV.innerHTML=routeInstructions;
      route_instructions_btn.setAttribute('data-content', route_instructionsDIV.outerHTML);
      route_instructions_hidden.innerHTML=routeInstructions;

      let instructionsRows=document.getElementById('route_instructions_hidden').getElementsByTagName('tr');

      let carouselIndicatorsHTMLStr='<ol class="carousel-indicators">';
      let carouselItemsHTMLStr='';

      let rowIndex=0;
      for(let instructionsRow of instructionsRows) {
          let instructionText=instructionsRow.innerText;
          let instructionIndex=(parseInt(rowIndex)+1);

          instructionText=instructionText.replace( (instructionIndex+''), '' );
          carouselIndicatorsHTMLStr+='<li data-target="#routeIntructionsCarousel" data-slide-to="'+rowIndex+'" '+ (rowIndex==0 ? 'class="active"' : '') +'></li>';

          carouselItemsHTMLStr+='<div class="carousel-item'+ (rowIndex==0 ? ' active' : '') +'">';
          carouselItemsHTMLStr+='<h1 class="text-right text-muted pr-2 pl-2">🧭</h1>';
          carouselItemsHTMLStr+='<div class="carousel-caption text-left">';
          carouselItemsHTMLStr+='<kbd class="rounded-0"><small>'+toCamelCase(instructionIndex+'. '+instructionText)+'</small></kbd>';
          carouselItemsHTMLStr+='</div>';
          carouselItemsHTMLStr+='</div>';
          
          rowIndex++;
      }
      carouselIndicatorsHTMLStr+='</ol>';

      let carouselHTMLStr=carouselIndicatorsHTMLStr+'<div class="carousel-inner">'+carouselItemsHTMLStr+'</div>'+'<a class="carousel-control-prev" href="#routeIntructionsCarousel" role="button" data-slide="prev">❮</a>'+'<a class="carousel-control-next" href="#routeIntructionsCarousel" role="button" data-slide="next">❯</a>';
      document.getElementById('routeIntructionsCarousel').innerHTML=carouselHTMLStr;

      let routeInstructionsInit = new BSN.Carousel('#routeIntructionsCarousel', {
        interval: false,
        pause: false,
        keyboard: false
      });
    }

    var routeType=0;
    const routeTypes=[
      { 'OneMap': 'drive', 'Graphhopper': 'car', 'HERE': 'car'},
      { 'OneMap': 'walk', 'Graphhopper': 'foot', 'HERE': 'pedestrian' },
      { 'OneMap': 'cycle', 'Graphhopper': 'bike', 'HERE': 'bicycle'}
    ];
    const routeIcon=["<svg class='selection-side-icon icon icon-driving'><use xlink:href='symbol-defs.svg#icon-driving'></use></svg>","<svg class='selection-side-icon icon icon-walking'><use xlink:href='symbol-defs.svg#icon-walking'></use></svg>","<svg class='selection-side-icon icon icon-cycling'><use xlink:href='symbol-defs.svg#icon-cycling'></use></svg>"];

    const searchbarElement=document.getElementById('searchbar');
    const toggleInfoPanel=document.getElementById('toggleInfoPanel');

    toggleInfoPanel.addEventListener('click', (evt)=> {
      if(searchbarElement.classList.contains('expand')) {
        searchbarElement.classList.remove('expand');
        toggleInfoPanel.innerHTML='◭';
      } else {
        searchbarElement.classList.add('expand');
        toggleInfoPanel.innerHTML='⧩';
      }
    });
    
    function resizeComponents() {
      if (document.body.clientWidth <= 767) {
        if(searchbarElement.classList.contains('expand')) {
          toggleInfoPanel.click();
          map.invalidateSize();
        }
      } else if(!searchbarElement.classList.contains('expand')) {
        toggleInfoPanel.click();
        map.invalidateSize();
      }
    }

    window.addEventListener('resize', async(evt) => {
      resizeComponents();
      await new Promise((resolve, reject) => setTimeout(resolve, 150));
      map.invalidateSize();
    });
    resizeComponents();

    exportBtn.addEventListener('click', () => {
      if (!window.Blob) {;
        alert('Your browser does not support HTML5 "Blob" function required to save a file.');
      } else {
        let textblob = new Blob([geojsonOutputStr], {
            type: 'application/json'
        });
        let dwnlnk = document.createElement('a');
        dwnlnk.download = 'georoutes_'+getCurrentDatetimeStamp()+'.geojson';
        if (window.webkitURL != null) {
            dwnlnk.href = window.webkitURL.createObjectURL(textblob);
        }
        dwnlnk.click();
      }
    });

    const playSymbol='🔊';
    const pauseSymbol='🔇';

    speakBtn.addEventListener('click', (evt) => {
      let isPaused=$().articulate('isPaused');
      let isSpeaking=$().articulate('isSpeaking');

      if(!isPaused && !isSpeaking) {
        $('#route_instructions_hidden td').articulate('speak');
        evt.currentTarget.innerHTML=pauseSymbol;
      } else if(!isPaused) {
        $().articulate('pause');
        evt.currentTarget.innerHTML=playSymbol;
      } else if(isPaused) {
        $().articulate('resume');
        evt.currentTarget.innerHTML=pauseSymbol;
      }
    });

    window.addEventListener('utteranceHasEnded', (e) => {
      speakBtn.innerHTML=playSymbol;
      $().articulate('stop');
    });

    const popoverTargets = document.querySelectorAll('[data-content]');
    Array.from(popoverTargets).map(
      popTarget => new BSN.Popover(popTarget, {
        placement: 'right',
        animation: 'show',
        delay: 100,
        dismissible: true,
        trigger: 'click'
      })
    );

    switch_origin_destination.addEventListener('click', async(e) => {
      let tempPoint=endPoint;
      endPoint=startPoint;
      startPoint=tempPoint;

      initParams(startPoint, endPoint);
      execAjax();
    });

    const resetMapBtn=document.getElementById('resetMapBtn');
    const serviceProviderOptions=document.getElementsByClassName('serviceProvider');

    function deselectAllServiceProviders() {
      for(let serviceProviderOption of serviceProviderOptions) {
        if(serviceProviderOption.classList.contains('active')) {
            serviceProviderOption.classList.remove('active');
        }
      }
    }
    for(let serviceProviderOption of serviceProviderOptions) {
      serviceProviderOption.addEventListener('click', async(e) => {
        deselectAllServiceProviders();
        await new Promise((resolve, reject) => setTimeout(resolve, 50));
        serviceProviderOption.classList.add('active');
        serviceProvider=serviceProviderOption.value;
        initParams(startPoint, endPoint);
        execAjax();
      });
    }

    function removeAllRoutes() {
      if(routes.length>0) { 
        for(let r in routes) {
          let path=routes[r]["path"];
          map.removeLayer(path);
        }
      }
    }

    function removeAllMarkers() {
      if(originMarker!==null) {
        map.removeLayer(originMarker);
      }
      if(destinationMarker!==null) {
        map.removeLayer(destinationMarker);
      }
    }
    
    function resetMap() {
      removeAllRoutes();
      routes=[];
      removeAllMarkers();

      route_options.innerHTML='';
      route_info.innerHTML='';
      route_instructions_hidden.innerHTML='';

      route_instructions_btn.setAttribute('data-content','<div id="route_instructions" class="small user-select-none"></div>');
      geojsonOutputStr='';
    }

    resetMapBtn.addEventListener('click', (evt) => {
      resetMap();
      loaderSignal['style']['display']='none';

      startPoint=initStartPoint;
      endPoint=initEndPoint;

      geocoder_o.value=toCamelCase(initStartAddr);
      geocoder_d.value=toCamelCase(initEndAddr);

      serviceProvider='OneMap';
      for(let serviceProviderOption of serviceProviderOptions) {
        if(serviceProviderOption.value==serviceProvider) {
          serviceProviderOption.click();
          break;
        }
      }
      initParams(startPoint, endPoint);
      execAjax();
    });

    function initParams(start, end) {
      resetMap();
      switch(serviceProvider) {
        case 'OneMap':
          url='/api/onemap/directions/json/';
          params = {
            'routeType':routeTypes[routeType][serviceProvider],
            'start': start,
            'end':end
          };
          break;
        case 'Graphhopper':
          url='api/graphhopper/route/json/';
          start=start.split(',');
          start=parseFloat(start[0]).toFixed(4) + '%2C' + parseFloat(start[1]).toFixed(4);

          end=end.split(',');
          end=parseFloat(end[0]).toFixed(4) + '%2C' + parseFloat(end[1]).toFixed(4);
          params = {
            'locale':'en',
            'point_o':start,
            'point_d':end,
            'elevation': (routeType==0) ? 'false' : 'true',
            'profile':routeTypes[routeType][serviceProvider]
          };
          break;
        case 'HERE':
          url='api/hereapi/v8/route/json/';
          params = {
            'origin': start,
            'destination':end,
            'routeType':routeTypes[routeType][serviceProvider]
          };
          break;
      }
      apiCall = '';
      apiCall+=url;
      for(let p in params) {
        apiCall+=params[p]+'/';
      }
    }

    const maxSuggestion=15; // minus one
    const o_geocoder=new autoComplete({
      selector:'#geocoder_o',
      minChars:2,
      source: async function(term, suggest){
        term = term.toLowerCase();
        let choices = Object.keys(geocoders);
        let suggestions = [];
        for (let i=0;i<choices.length;i++) {
            if (~choices[i].toLowerCase().indexOf(term)) {
              suggestions.push(choices[i]);
            }
        }
        await new Promise((resolve, reject) => setTimeout(resolve, 50));
        suggestions=suggestions.slice(0,maxSuggestion);
        await new Promise((resolve, reject) => setTimeout(resolve, 50));

        if(!searchbarElement.classList.contains('expand')) {
          toggleInfoPanel.click();
          map.invalidateSize();
        }
        await new Promise((resolve, reject) => setTimeout(resolve, 50));
        
        suggest(suggestions);
      },
      onSelect: function(e, term, item) {
        let coordinatesStr=geocoders[term];
        startPoint=coordinatesStr;
        initParams(startPoint, endPoint);
        execAjax();
      }
    });

    const d_geocoder=new autoComplete({
      selector:'#geocoder_d',
      minChars:2,
      source: async function(term, suggest){
        term = term.toLowerCase();
        let choices = Object.keys(geocoders);
        let suggestions = [];
        for (let i=0;i<choices.length;i++) {
            if (~choices[i].toLowerCase().indexOf(term)) {
              suggestions.push(choices[i]);
            }
        }
        await new Promise((resolve, reject) => setTimeout(resolve, 50));
        suggestions=suggestions.slice(0,maxSuggestion);
        await new Promise((resolve, reject) => setTimeout(resolve, 50));

        if(!searchbarElement.classList.contains('expand')) {
          toggleInfoPanel.click();
          map.invalidateSize();
        }
        await new Promise((resolve, reject) => setTimeout(resolve, 50));

        suggest(suggestions);
      },
      onSelect: function(e, term, item) {
        let coordinatesStr=geocoders[term];
        endPoint=coordinatesStr;
        initParams(startPoint, endPoint);
        execAjax();
      }
    });
    
    const antpathSettings={
      'delay': 600,
      'dashArray': [10, 20],
      'weight': 5,
      'color': '#000066',
      'pulseColor': '#FFFFFF',
      'paused': false,
      'reverse': false,
      'hardwareAccelerated': true
    };

    function renderHERERoutesOnMap(responseObj) {
      let sections=responseObj['routes'][0]['sections'][0];
      let polyline=sections['polyline'];
      let latlngs_1 = decodeFlexiPolyline(polyline).polyline;

      map.flyToBounds(L.latLngBounds(latlngs_1));
      originMarker=L.marker(latlngs_1[0], {
        icon: L.icon({      
          iconUrl: 'img/origin.png',
          iconSize: iconSize
        })
      });
      map.addLayer(originMarker);

      destinationMarker=L.marker(latlngs_1[latlngs_1.length - 1], {
        icon: L.icon({ 
            iconUrl: 'img/destination.png',
            iconSize: iconSize
        })
      });
      map.addLayer(destinationMarker);
      let path_1 = L.polyline.antPath(latlngs_1, antpathSettings);
      map.addLayer(path_1);

      let route_1 = {
        path: path_1
      };
      routes.push(route_1);
    }

    function renderOneMapRoutesOnMap(responseObj) {
      let latlngs_1 = polyline.decode(responseObj['route_geometry']);
      map.flyToBounds(L.latLngBounds(latlngs_1));
      originMarker=L.marker(latlngs_1[0], {
          icon: L.icon({      
              iconUrl: 'img/origin.png',
              iconSize: iconSize
          })
      });
      map.addLayer(originMarker);

      destinationMarker=L.marker(latlngs_1[latlngs_1.length - 1], {
          icon: L.icon({ 
              iconUrl: 'img/destination.png',
              iconSize: iconSize
          })
      });
      map.addLayer(destinationMarker);
      let path_1 = L.polyline.antPath(latlngs_1, antpathSettings);
      map.addLayer(path_1);

      let route_1 = {
          path: path_1
      };
      routes.push(route_1);
      
      let phyroute=responseObj['phyroute'];
      if(typeof phyroute !== 'undefined') {
        let latlngs_2 = polyline.decode(phyroute['route_geometry']);
        let path_2 = L.polyline.antPath(latlngs_2, antpathSettings);

        let route_2 = { path: path_2 };
        routes.push(route_2);
      }

      let alternativeroute=responseObj['alternativeroute'];
      if(typeof alternativeroute !== 'undefined') {
        alternativeroute=alternativeroute[0];
        let latlngs_3 = polyline.decode(alternativeroute['route_geometry']);
        let path_3 = L.polyline.antPath(latlngs_3, antpathSettings);

        let route_3 = {
          path: path_3
        };
        routes.push(route_3);
      }
    }

    function renderGraphhopperRoutesOnMap(responseObj) {
      let points=responseObj['paths'][0]['points'];

      let paths=responseObj["paths"][0];
      let latlngs_1 = polyline.decode(points);
      
      map.flyToBounds(L.latLngBounds(latlngs_1));
      originMarker=L.marker(latlngs_1[0], {
          icon: L.icon({      
              iconUrl: 'img/origin.png',
              iconSize: iconSize
          })
      });
      map.addLayer(originMarker);

      destinationMarker=L.marker(latlngs_1[latlngs_1.length - 1], {
          icon: L.icon({ 
              iconUrl: 'img/destination.png',
              iconSize: iconSize
          })
      });
      map.addLayer(destinationMarker);
      let path_1 = L.polyline.antPath(latlngs_1, antpathSettings);
      map.addLayer(path_1);

      let route_1 = {
         path: path_1
      };
      routes.push(route_1);
    }

    async function geocodeLatlng(lat,lng) {
      loaderSignal['style']['display']=loaderSignalCSS;
      let response=await fetch(`api/opencage/geocode/json/v1/en/${lat}+${lng}`);
      let responseObj=await response.json();
      loaderSignal['style']['display']='none';

      return Promise.resolve(responseObj);
    }

    async function execAjax() {
      loaderSignal['style']['display']=loaderSignalCSS;
      let response=await fetch(apiCall);
      let result=await response.text();
      let responseObj=JSON.parse(result);
      loaderSignal['style']['display']='none';

      switch(serviceProvider) {
        case 'OneMap':
          renderOneMapRoutesOnMap(responseObj);
          renderOneMapGeojson(responseObj);
          renderOneMapRouteInstructions(responseObj);
          break;
        case 'Graphhopper':
          renderGraphhopperRoutesOnMap(responseObj);
          renderGraphhoperGeojson(responseObj);
          renderGraphhoperRouteInstructions(responseObj);
          break;
        case 'HERE':
          renderHERERoutesOnMap(responseObj);
          renderHEREGeojson(responseObj);
          renderHERERouteInstructions(responseObj);
          break;
      }
    }

    function handleCommand() {
      removeAllRoutes();

      let routeIndex = parseInt(this.value);
      let routeObj = routes[routeIndex];

      let name=routeObj["name"];
      let start_point=routeObj["start_point"];
      let end_point=routeObj["end_point"];
      let description=routeObj["description"];
      let time_seconds=routeObj["time_seconds"];
      let distance_metres=routeObj["distance_metres"];
      let route_instructions=routeObj["route_instructions"];
      let path=routeObj["path"];

      map.addLayer(path);

      originName=toCamelCase(start_point);
      destinationName=toCamelCase(end_point);

      geocoder_o.value=toCamelCase(start_point);
      geocoder_d.value=toCamelCase(end_point);

      let routeInfo = "";

      routeInfo+='<div class="w-100 text-center mt-1 mb-1 pt-1 pb-1"><img src="img/origin.png" class="selection-side-icon" /> <span class="text-dark midCaption">' + toCamelCase(start_point) + '</span><span class="symbol ml-1 mr-1">⇢'+routeIcon[routeType]+'⇢</span><span class="text-dark midCaption">' +toCamelCase(end_point) + '</span> <img src="img/destination.png" class="selection-side-icon" /></div>';

      routeInfo+='<div class="row no-gutters w-100"><div class="col-6 text-dark mt-1 mb-1"><span class="symbol">[</span><svg class="selection-side-icon icon icon-route"><use xlink:href="symbol-defs.svg#icon-route"></use></svg> '+parseFloat(distance_metres/1000).toFixed(2)+' km<span class="symbol">]</span></div><div class="col-6 text-dark mt-1 mb-1"><span class="symbol">[</span><svg class="selection-side-icon icon icon-time-check"><use xlink:href="symbol-defs.svg#icon-time-check"></use></svg> ' + parseInt(time_seconds/60) + ' min ' + parseInt((time_seconds%60)) + ' s<span class="symbol">]</span></div></div>';

      route_info.innerHTML=routeInfo;
      setRouteInstructions(route_instructions);
    }

    async function renderOneMapGeojson(responseObj) {
      let routeCounter=0;
      let geojsonOutput={
        "type": "FeatureCollection",
        "features": []
      };
      let geometry=polyline.toGeoJSON(responseObj["route_geometry"]);

      let name = responseObj["route_name"][0] + " via " + responseObj["viaRoute"] + " through " + responseObj["route_name"][1];
      let description = responseObj["subtitle"];
      let start_point = responseObj["route_summary"]["start_point"];
      let end_point = responseObj["route_summary"]["end_point"];
      let time_seconds = responseObj["route_summary"]["total_time"];
      let distance_metres = responseObj["route_summary"]["total_distance"];

      let route_instructions=responseObj['route_instructions'];

      let startLatLng=route_instructions[0][3];
      if(start_point.length===0) {
        let start_point_arr=startLatLng.split(',');
        let obj=await geocodeLatlng(start_point_arr[0],start_point_arr[1]);
        start_point=obj['results'][0]['formatted'];
      }

      let endLatLng=route_instructions[route_instructions.length-1][3];
      if(end_point.length===0) {
        let end_point_arr=endLatLng.split(',');
        let obj=await geocodeLatlng(end_point_arr[0],end_point_arr[1]);
        end_point=obj['results'][0]['formatted'];
      }

      if(routeType==2) { // cycle
        name="Cycling Path";
        description="Cycling Path";
      } else if(routeType==1) { // walking
        name="Walking Path";
        description="Walking Path";
      } // end of walking path

      let feature={
        "type": "Feature",
        "geometry": geometry,
        "properties": {
            "name": name,
            "description": description,
            "start_point": start_point,
            "end_point": end_point,
            "time_seconds": time_seconds,
            "distance_metres": distance_metres,
            "route_type": routeTypes[routeType][serviceProvider]
        }
      };
      geojsonOutput["features"].push(feature);

      let controlHtmlStr = '';
      controlHtmlStr += '<div>';
      controlHtmlStr += '<input id="' + name + '" type="radio" class="leaflet-control-layers-selector" name="routes" checked="checked" value="'+routeCounter+'" />';
      controlHtmlStr += '<span class="midCaption"> ' + description + '</span>';
      controlHtmlStr += '</div>';
      
      // console.log(routeCounter);
      routes[routeCounter]["name"]=name;
      routes[routeCounter]["description"]=description;
      routes[routeCounter]["start_point"]=start_point;
      routes[routeCounter]["end_point"]=end_point;
      routes[routeCounter]["time_seconds"]=time_seconds;
      routes[routeCounter]["distance_metres"]=distance_metres;
      routeCounter++;

      originName=toCamelCase(start_point);
      destinationName=toCamelCase(end_point);

      geocoder_o.value=toCamelCase(start_point);
      geocoder_d.value=toCamelCase(end_point);

      let routeInfo = '';

      routeInfo+='<div class="w-100 text-center mt-1 mb-1 pt-1 pb-1"><img src="img/origin.png" class="selection-side-icon" /> <span class="text-dark midCaption">' + toCamelCase(start_point) + '</span><span class="symbol ml-1 mr-1">⇢'+routeIcon[routeType]+'⇢</span><span class="text-dark midCaption">' +toCamelCase(end_point) + '</span> <img src="img/destination.png" class="selection-side-icon" /></div>';
       
      routeInfo+='<div class="row no-gutters w-100"><div class="col-6 text-dark mt-1 mb-1"><span class="symbol">[</span><svg class="selection-side-icon icon icon-route"><use xlink:href="symbol-defs.svg#icon-route"></use></svg> '+parseFloat(distance_metres/1000).toFixed(2)+' km<span class="symbol">]</span></div><div class="col-6 text-dark mt-1 mb-1"><span class="symbol">[</span><svg class="selection-side-icon icon icon-time-check"><use xlink:href="symbol-defs.svg#icon-time-check"></use></svg> ' + parseInt(time_seconds/60) + ' min ' + parseInt((time_seconds%60)) + ' s<span class="symbol">]</span></div></div>';

      route_info.innerHTML=routeInfo;
      
      let phyroute=responseObj["phyroute"];
      if(typeof phyroute !== "undefined") {
        geometry = polyline.toGeoJSON(phyroute["route_geometry"]);   

        name = phyroute["route_name"][0] + " via " + phyroute["viaRoute"] + " through " + phyroute["route_name"][1];
        description = phyroute["subtitle"];
        start_point = phyroute["route_summary"]["start_point"];
        end_point = phyroute["route_summary"]["end_point"];
        time_seconds = phyroute["route_summary"]["total_time"];
        distance_metres = phyroute["route_summary"]["total_distance"];

        feature={
          "type": "Feature",
          "geometry": geometry,
          "properties": {
              "name": name,
              "description": description,
              "start_point": start_point,
              "end_point": end_point,
              "time_seconds": time_seconds,
              "distance_metres": distance_metres,
              "route_type": routeTypes[routeType][serviceProvider]
          }
        };
        geojsonOutput["features"].push(feature);
        
        controlHtmlStr += "<div>";
        controlHtmlStr += "<input id='" + name + "' type='radio' class='leaflet-control-layers-selector' name='routes' value='"+(routeCounter)+"' />";
        controlHtmlStr += "<span class='midCaption'> " + toCamelCase(description) + "</span>";
        controlHtmlStr += "</div>";

        // console.log(routeCounter);
        routes[routeCounter]["name"]=name;
        routes[routeCounter]["description"]=description;
        routes[routeCounter]["start_point"]=start_point;
        routes[routeCounter]["end_point"]=end_point;
        routes[routeCounter]["time_seconds"]=time_seconds;
        routes[routeCounter]["distance_metres"]=distance_metres;
        routeCounter++;
      }

      let alternativeroute=responseObj["alternativeroute"];

      if(typeof alternativeroute !== "undefined") {
        alternativeroute=alternativeroute[0];
        geometry = polyline.toGeoJSON(alternativeroute["route_geometry"]);   

        name = alternativeroute["route_name"][0] + " via " + alternativeroute["viaRoute"] + " through " + alternativeroute["route_name"][1];
        description = alternativeroute["subtitle"];
        start_point = alternativeroute["route_summary"]["start_point"];
        end_point = alternativeroute["route_summary"]["end_point"];
        time_seconds = alternativeroute["route_summary"]["total_time"];
        distance_metres = alternativeroute["route_summary"]["total_distance"];

        feature={
          "type": "Feature",
          "geometry": geometry,
          "properties": {
              "name": name,
              "description": description,
              "start_point": start_point,
              "end_point": end_point,
              "time_seconds": time_seconds,
              "distance_metres": distance_metres,
              "route_type": routeTypes[routeType][serviceProvider]
          }
        };
        geojsonOutput["features"].push(feature);

        controlHtmlStr += "<div>";
        controlHtmlStr += "<input id='" + name + "' type='radio' class='leaflet-control-layers-selector' name='routes' value='"+(routeCounter)+"' />";
        controlHtmlStr += "<span class='midCaption'> " + toCamelCase(description) + "</span>";
        controlHtmlStr += "</div>";

        // console.log(routeCounter);
        routes[routeCounter]["name"]=name;
        routes[routeCounter]["description"]=description;
        routes[routeCounter]["start_point"]=start_point;
        routes[routeCounter]["end_point"]=end_point;
        routes[routeCounter]["time_seconds"]=time_seconds;
        routes[routeCounter]["distance_metres"]=distance_metres;
        routeCounter++;
      }
      route_options.innerHTML=controlHtmlStr;
      
      geojsonOutputStr=JSON.stringify(geojsonOutput);

      let commands = document.getElementsByClassName("leaflet-control-layers-selector");
      for(let c in commands) {
        let cmd = commands[c];
        if(cmd.type == "radio") {
          cmd.addEventListener("change", handleCommand, false);
        }
      }
    } // renderOneMapGeojson

    async function renderGraphhoperGeojson(responseObj) {
      let paths=responseObj["paths"][0];
      let latlngs = polyline.decode(paths['points']);

      let routeCounter=0;
      let geojsonOutput={
        "type": "FeatureCollection",
        "features": []
      };
      let geometry=polyline.toGeoJSON(paths["points"]);

      let start_point = '';
      let end_point = '';
      let time_seconds = (paths["time"]/1000);
      let distance_metres = paths["distance"];

      let startLatLng=latlngs[0];
      if(start_point.length===0) {
        let start_point_arr=startLatLng;
        let obj=await geocodeLatlng(start_point_arr[0],start_point_arr[1]);
        start_point=obj['results'][0]['components']['road'];
      }

      let endLatLng=latlngs[latlngs.length-1];
      if(end_point.length===0) {
        let end_point_arr=endLatLng;
        let obj=await geocodeLatlng(end_point_arr[0],end_point_arr[1]);
        end_point=obj['results'][0]['components']['road'];
      }

      let name = start_point + " through " + end_point;
      let description = start_point + " through " + end_point;;

      if(routeType==2) { // cycle
        name="Cycling Path";
        description="Cycling Path";
      } else if(routeType==1) { // walking
        name="Walking Path";
        description="Walking Path";
      } // end of walking path

      let feature={
        "type": "Feature",
        "geometry": {
          "type":"LineString",
          "coordinates": latlngs
        },
        "properties": {
            "name": name,
            "description": description,
            "start_point": start_point,
            "end_point": end_point,
            "time_seconds": time_seconds,
            "distance_metres": distance_metres,
            "route_type": routeTypes[routeType][serviceProvider]
        }
      };
      geojsonOutput["features"].push(feature);

      let controlHtmlStr = '';
      controlHtmlStr += '<div>';
      controlHtmlStr += '<input id="' + name + '" type="radio" class="leaflet-control-layers-selector" name="routes" checked="checked" value="'+routeCounter+'" />';
      controlHtmlStr += '<span class="midCaption"> ' + toCamelCase(description) + '</span>';
      controlHtmlStr += '</div>';
      
      routes[routeCounter]["name"]=name;
      routes[routeCounter]["description"]=description;
      routes[routeCounter]["start_point"]=start_point;
      routes[routeCounter]["end_point"]=end_point;
      routes[routeCounter]["time_seconds"]=time_seconds;
      routes[routeCounter]["distance_metres"]=distance_metres;
      routeCounter++;

      originName=toCamelCase(start_point);
      destinationName=toCamelCase(end_point);

      geocoder_o.value=toCamelCase(start_point);
      geocoder_d.value=toCamelCase(end_point);

      let routeInfo = '';
      routeInfo+='<div class="w-100 text-center mt-1 mb-1 pt-1 pb-1"><img src="img/origin.png" class="selection-side-icon" /> <span class="text-dark midCaption">' + toCamelCase(start_point) + '</span><span class="symbol ml-1 mr-1">⇢'+routeIcon[routeType]+'⇢</span><span class="text-dark midCaption">' +toCamelCase(end_point) + '</span> <img src="img/destination.png" class="selection-side-icon" /></div>';
       
      routeInfo+='<div class="row no-gutters w-100"><div class="col-6 text-dark mt-1 mb-1"><span class="symbol">[</span><svg class="selection-side-icon icon icon-route"><use xlink:href="symbol-defs.svg#icon-route"></use></svg> '+parseFloat(distance_metres/1000).toFixed(2)+' km<span class="symbol">]</span></div><div class="col-6 text-dark mt-1 mb-1"><span class="symbol">[</span><svg class="selection-side-icon icon icon-time-check"><use xlink:href="symbol-defs.svg#icon-time-check"></use></svg> ' + parseInt(time_seconds/60) + ' min ' + parseInt((time_seconds%60)) + ' s<span class="symbol">]</span></div></div>';


      route_info.innerHTML=routeInfo;

      route_options.innerHTML=controlHtmlStr;
      geojsonOutputStr=JSON.stringify(geojsonOutput);

      let commands = document.getElementsByClassName("leaflet-control-layers-selector");
      for(let c in commands) {
        let cmd = commands[c];
        if(cmd.type == "radio") {
          cmd.addEventListener("change", handleCommand, false);
        }
      }
    } // renderGraphhoperGeojson

    async function renderHEREGeojson(responseObj) {
      let sections=responseObj['routes'][0]['sections'][0];

      // let arrival = ['arrival']['place']['location'];
      // let arrivalLatLng = [arrival['lat'],arrival['lng']];

      // let departure = ['departure']['place']['location'];
      // let departureLatLng = [departure['lat'],departure['lng']];

      let polyline=sections['polyline'];
      let latlngs = decodeFlexiPolyline(polyline).polyline;
      // console.log(latlngs);

      let routeCounter=0;
      let geojsonOutput={
        "type": "FeatureCollection",
        "features": []
      };
      let start_point = '';
      let end_point = '';
      let time_seconds = (sections["travelSummary"]["duration"]);
      let distance_metres = (sections["travelSummary"]["length"]);

      let startLatLng=latlngs[0];
      if(start_point.length===0) {
        let start_point_arr=startLatLng;
        let obj=await geocodeLatlng(start_point_arr[0],start_point_arr[1]);
        start_point=obj['results'][0]['components']['road'];
      }

      let endLatLng=latlngs[latlngs.length-1];
      if(end_point.length===0) {
        let end_point_arr=endLatLng;
        let obj=await geocodeLatlng(end_point_arr[0],end_point_arr[1]);
        end_point=obj['results'][0]['components']['road'];
      }

      let name = start_point + " through " + end_point;
      let description = start_point + " through " + end_point;;

      if(routeType==2) { // cycle
        name="Cycling Path";
        description="Cycling Path";
      } else if(routeType==1) { // walking
        name="Walking Path";
        description="Walking Path";
      } // end of walking path

      let feature={
        "type": "Feature",
        "geometry": {
          "type": "LineString",
          "coordinates": reverseLatLng(latlngs)
        },
        "properties": {
            "name": name,
            "description": description,
            "start_point": start_point,
            "end_point": end_point,
            "time_seconds": time_seconds,
            "distance_metres": distance_metres,
            "route_type": routeTypes[routeType][serviceProvider]
        }
      };
      geojsonOutput["features"].push(feature);

      let controlHtmlStr = '';
      controlHtmlStr += '<div>';
      controlHtmlStr += '<input id="' + name + '" type="radio" class="leaflet-control-layers-selector" name="routes" checked="checked" value="'+routeCounter+'" />';
      controlHtmlStr += '<span class="midCaption"> ' + toCamelCase(description) + '</span>';
      controlHtmlStr += '</div>';
      
      routes[routeCounter]["name"]=name;
      routes[routeCounter]["description"]=description;
      routes[routeCounter]["start_point"]=start_point;
      routes[routeCounter]["end_point"]=end_point;
      routes[routeCounter]["time_seconds"]=time_seconds;
      routes[routeCounter]["distance_metres"]=distance_metres;
      routeCounter++;

      originName=toCamelCase(start_point);
      destinationName=toCamelCase(end_point);

      geocoder_o.value=toCamelCase(start_point);
      geocoder_d.value=toCamelCase(end_point);

      let routeInfo = '';

      routeInfo+='<div class="w-100 text-center mt-1 mb-1 pt-1 pb-1"><img src="img/origin.png" class="selection-side-icon" /> <span class="text-dark midCaption">' + toCamelCase(start_point) + '</span><span class="symbol ml-1 mr-1">⇢'+routeIcon[routeType]+'⇢</span><span class="text-dark midCaption">' +toCamelCase(end_point) + '</span> <img src="img/destination.png" class="selection-side-icon" /></div>';
       
      routeInfo+='<div class="row no-gutters w-100"><div class="col-6 text-dark mt-1 mb-1"><span class="symbol">[</span><svg class="selection-side-icon icon icon-route"><use xlink:href="symbol-defs.svg#icon-route"></use></svg> '+parseFloat(distance_metres/1000).toFixed(2)+' km<span class="symbol">]</span></div><div class="col-6 text-dark mt-1 mb-1"><span class="symbol">[</span><svg class="selection-side-icon icon icon-time-check"><use xlink:href="symbol-defs.svg#icon-time-check"></use></svg> ' + parseInt(time_seconds/60) + ' min ' + parseInt((time_seconds%60)) + ' s<span class="symbol">]</span></div></div>';

      route_info.innerHTML=routeInfo;
      route_options.innerHTML=controlHtmlStr;
      geojsonOutputStr=JSON.stringify(geojsonOutput);

      let commands = document.getElementsByClassName("leaflet-control-layers-selector");
      for(let c in commands) {
        let cmd = commands[c];
        if(cmd.type == "radio") {
          cmd.addEventListener("change", handleCommand, false);
        }
      }
    } // renderHEREGeojson


    var routeTypeOptions=document.getElementsByClassName('routeType');
    function deselectAllRouteTypes() {
      for(let routeTypeOption of routeTypeOptions) {
        if(routeTypeOption.classList.contains('active')) {
            routeTypeOption.classList.remove('active');
        }
      }
    }
    for(let routeTypeOption of routeTypeOptions) {
      routeTypeOption.addEventListener('click', async(e) => {
        routeType=parseInt(routeTypeOption.value);
        deselectAllRouteTypes();
        await new Promise((resolve, reject) => setTimeout(resolve, 50));
        routeTypeOption.classList.add('active');
        
        initParams(startPoint, endPoint);
        execAjax();
      });
    }


    function renderGraphhoperRouteInstructions(responseObj) {
      let routeCounter=0;
      let routeInstructions = '';
      routeInstructions += '<table>';
      let route_instructions=responseObj['paths'][0]['instructions'];

      for(let r in route_instructions) {
        let route = route_instructions[r];
        let routeSeconds=parseInt(route['time']/1000);
        let distance_metres=parseInt(route['distance']);

        routeInstructions+= '<tr>';
        routeInstructions+= '<th valign="top" class="pr-2">' + parseInt(parseInt(r)+1) + '</th>';
        routeInstructions+= '<td>';
        routeInstructions+= toCamelCase(`${route['text']}, at ${distance_metres} metres, for ${routeSeconds} seconds.`);
        routeInstructions+= '</td>';
        routeInstructions+= '</tr>';
      }
      routeInstructions+= '</table>';

      routes[routeCounter]['route_instructions']=routeInstructions;
      routeCounter++;

      setRouteInstructions(routeInstructions);
    }

    function renderOneMapRouteInstructions(responseObj) {
      let routeCounter=0;
      let routeInstructions = '';
      routeInstructions += '<table>';

      let route_instructions=responseObj['route_instructions'];
      for(let r in route_instructions) {
        let route = route_instructions[r];

        routeInstructions+= '<tr>';
        routeInstructions+= '<th valign="top" class="pr-2">' + parseInt(parseInt(r)+1) + '</th>';
        routeInstructions+= '<td>';
        routeInstructions+= toCamelCase(`${route[9]}, at ${route[2]} metres, for ${( (parseInt(route[4]/60)>0) ? parseInt(route[4]/60)+' minutes' : (route[4]+' seconds') )}.`);
        routeInstructions+= '</td>';
        routeInstructions+= '</tr>';
      }
      routeInstructions+= '</table>';

      // console.log(routeCounter);
      routes[routeCounter]['route_instructions']=routeInstructions;
      routeCounter++;

      setRouteInstructions(routeInstructions);
        
      routeInstructions = '';
      routeInstructions += '<table>';
      let phyroute=responseObj['phyroute'];
      if(typeof phyroute !== 'undefined') {
        route_instructions=phyroute['route_instructions'];
      
        for(let r in route_instructions) {
          let route = route_instructions[r];

          routeInstructions+= '<tr>';
          routeInstructions+= '<th valign="top" class="pr-2">' + parseInt(parseInt(r)+1) + '</th>';
          routeInstructions+= '<td>';
          routeInstructions+= `${route[9]}, at ${route[2]} metres, for ${( (parseInt(route[4]/60)>0) ? parseInt(route[4]/60)+' minutes' : (route[4]+' seconds') )}.`;
          routeInstructions+= '</td>';
          routeInstructions+= '</tr>';
        }
        routeInstructions+= '</table>';

        routes[routeCounter]['route_instructions']=routeInstructions;
        routeCounter++;
      }

      routeInstructions = "";
      routeInstructions += "<table>";
      let alternativeroute=responseObj["alternativeroute"];
      if(typeof alternativeroute !== "undefined") {
        alternativeroute=alternativeroute[0];
        route_instructions=alternativeroute["route_instructions"];
      
        for(let r in route_instructions) {
          let route = route_instructions[r];

          routeInstructions+= "<tr>";
          routeInstructions+= "<th valign='top' class='pr-2'>" + parseInt(parseInt(r)+1) + "</th>";
          routeInstructions+= "<td>";

          routeInstructions+= `${route[9]}, at ${route[2]} metres, for ${( (parseInt(route[4]/60)>0) ? parseInt(route[4]/60)+' minutes' : (route[4]+' seconds') )}.`;

          routeInstructions+= "</td>";
          routeInstructions+= "</tr>";
        }
        routeInstructions+= "</table>";
        // console.log(routeCounter);
        routes[routeCounter]["route_instructions"]=routeInstructions;
        routeCounter++;
      }
    }

    const addressPatterns={" Ably ":" Assembly "," Admin ":" Administration "," Apt ":" Apartment "," Apts ":" Apartments "," Ave ":" Avenue "," Aye ":" Ayer Rajah Expressway "," Bke ":" Bukit Timah Expressway "," Bldg ":" Building "," Blk ":" Block "," Blks ":" Blocks "," Blvd ":" Boulevard "," Bo ":" Branch Office "," Br ":" Branch "," Bt ":" Bukit "," Budd ":" Buddhist "," Cath ":" Cathedral "," Cbd ":" Central Business District "," Cc ":" Community Centre/Club "," Ch ":" Church "," Chbrs ":" Chambers "," Cine ":" Cinema "," Cines ":" Cinemas "," Cl ":" Close "," Clubhse ":" Clubhouse "," Condo ":" Condominium "," Cp ":" Carpark "," Cplx ":" Complex "," Cres ":" Crescent "," Ct ":" Court "," Cte ":" Central Expressway "," Ctr ":" Centre "," Ctr/Apts ":" Centre/Apartments "," Ctrl ":" Central "," C'Wealth ":" Commonwealth "," Dept ":" Department "," Devt ":" Development "," Div ":" Division "," Dr ":" Drive "," Ecp ":" East Coast Expressway "," Edn ":" Education "," Engrg ":" Engineering "," Env ":" Environment "," Erp ":" Electronic Road Pricing "," Est ":" Estate "," E'Way ":" Expressway "," Fb ":" Food Bridge "," Fc ":" Food Centre "," Fty ":" Factory "," Gdn ":" Garden "," Gdns ":" Gardens "," Govt ":" Government "," Gr ":" Grove "," Hosp ":" Hospital "," Hqr ":" Headquarter "," Hqrs ":" Headquarters "," Hs ":" Historic Site "," Hse ":" House "," Hts ":" Heights "," Ind ":" Industrial "," Inst ":" Institute "," Instn ":" Institution "," Intl ":" International "," Jc ":" Junior Colleges "," Jln ":" Jalan "," Jnr ":" Junior "," Kg ":" Kampong "," Kje ":" Kranji Expressway "," Km ":" Kilometre "," Kpe ":" Kallang Paya Lebar Expressway "," Lib ":" Library "," Lk ":" Link "," Lor ":" Lorong "," Mai ":" Maisonette "," Mais ":" Maisonettes "," Man ":" Mansion "," Mans ":" Mansions "," Mce ":" Marina Coastal Expressway "," Met ":" Metropolitan "," Meth ":" Methodist "," Min ":" Ministy "," Mjd ":" Masjid "," Mkt ":" Market "," Mt ":" Mount "," Natl ":" National "," Npc ":" Neighbourhood Police Centres "," Npp ":" Neighbourhood Police Posts "," Nth ":" North "," O/S ":" Open Space "," P ":" Pulau "," P/G ":" Playground "," Pie ":" Pan Island Expressway "," Pk ":" Park "," Pl ":" Place "," Poly ":" Polyclinic "," Presby ":" Presbyterian "," Pri ":" Primary "," Pt ":" Point "," Rd ":" Road "," Redevt ":" Redevelopment "," S ":" Sungei "," Sch ":" School "," Sec ":" Secondary "," Sle ":" Seletar Expressway "," S'Pore ":" Singapore "," Sq ":" Square "," St ":" Street "," St. ":" Saint "," Sth ":" South "," Stn ":" Station "," Tc ":" Town Council "," Tech ":" Technical "," Ter ":" Terrace "," Tg ":" Tanjong "," Townhse ":" Townhouse "," Tpe ":" Tampines Expressway "," U/C ":" Under Construction "," Upp ":" Upper "," Voc ":" Vocational "," Warehse ":" Warehouse "," Hl ":" Hill "," Expy ":" Expressway "," Brg ":" Bridge "," Pk":" Park "," Terr ":" Terrace "," Twr ":" Tower "," Int ":" Interchange "," Ln ":" Lane "," Hwy ":" Highway "," S'Goon ":" Serangoon "," Amk ":" Ang Mo Kio "," Opp ":" Opposite "," Bef ":" Before "," Fac ":" Faculty "," Aft ":" After "," Pr ":" Primary "," Coll ":" College "," Temp ":" Temporary "," Road N ":" Road North "," Road E ":" Road East "," Road S ":" Road South "," Road W ":" Road West "," Rd ":" Road "};

    function transformAbbrToOrig(origText) {
        let intrText=' '+origText.toLowerCase()+' ';
        for(let toReplace in addressPatterns) {
          let replaceWith=addressPatterns[toReplace];
          intrText=intrText.replaceAll(toReplace, replaceWith);

          intrText=intrText.replaceAll(`/${toReplace.trim()}`, `/${replaceWith.trim()}`);
          intrText=intrText.replaceAll(`${toReplace.trim()}/`, `${replaceWith.trim()}/`);

          intrText=intrText.replaceAll(`${toReplace.trim()}.`, `${replaceWith.trim()}.`);
          intrText=intrText.replaceAll(`${toReplace.trim()},`, `${replaceWith.trim()},`);
        }
        origText=intrText;
        return origText;
    }

    function renderHERERouteInstructions(responseObj) {
      let sections=responseObj['routes'][0]['sections'][0];

      let routeCounter=0;
      let routeInstructions = '';
      routeInstructions += '<table>';
      let route_instructions=sections['actions'];

      for(let r in route_instructions) {
        let route = route_instructions[r];
        let routeSeconds=parseInt(route['duration']);
        let distance_metres=parseInt(route['length']);

        let intrText=route['instruction'];

        let pattern = new RegExp(`. Go for ${distance_metres} m.`, 'g');
        intrText=intrText.replace(pattern, '');
        pattern = new RegExp(`. Go for ${(distance_metres/1000).toFixed(1)} km.`, 'g');
        intrText=intrText.replace(pattern, '');
        intrText=`${intrText},`;

        intrText=transformAbbrToOrig(intrText);
        intrText=intrText.replaceAll(".,", ",");

        routeInstructions+= '<tr>';
        routeInstructions+= '<th valign="top" class="pr-2">' + parseInt(parseInt(r)+1) + '</th>';
        routeInstructions+= '<td>';
        routeInstructions+= toCamelCase(`${intrText} at ${distance_metres} metres, for ${routeSeconds} seconds.`);
        routeInstructions+= '</td>';
        routeInstructions+= '</tr>';
      }
      routeInstructions+= '</table>';

      routes[routeCounter]['route_instructions']=routeInstructions;
      routeCounter++;
      setRouteInstructions(routeInstructions);
    }

    initParams(startPoint, endPoint);
    execAjax();
  });
}

  