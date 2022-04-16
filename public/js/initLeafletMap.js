const myApp = Object.create(null);
// ======================= MAP =========================
var map='';
var mapUrl='http://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png';
// 
const lat = 1.352083;
const lng = 103.819836;
const minZoom=11;
const maxZoom=19;
const defaultZoom=14;
const ne=[1.56073, 104.6202];
const sw=[1.16, 103.188];

var command = L.control({
  position: 'topright'
});

function drawRectInCenter(x, y, width, height) {
  return [x - width / 2, y - height / 2, width, height];  
}
async function initmap() {
  let position = L.tileLayer(mapUrl, {
    detectRetina: true,
    maxZoom: maxZoom,
    minZoom: minZoom,
    attribution: ''
  });
  let scale = L.control.scale({
    maxWidth: 100,
    metric: true,
    imperial: true,
    position: 'bottomleft'
  });
  map = L.map('map', {
    zoomControl: false,
    maxZoom: maxZoom,
    minZoom: minZoom,
    renderer: L.svg()
  });
  
  if(map !== '') {
    map.setMaxBounds([ne, sw]);
    map.setView([lat, lng], defaultZoom);

    position.addTo(map);
    L.control.zoom({ position: 'topleft' }).addTo(map);

    await position.addTo(map);
    await scale.addTo(map);
    await command.addTo(map);

    command.getContainer().addEventListener('mouseover', function () {
        map.dragging.disable();
        map.doubleClickZoom.disable(); 
        map.scrollWheelZoom.disable();
        map.touchZoom.disable();
    });
    command.getContainer().addEventListener('mouseout', function () {
        map.dragging.enable();
        map.doubleClickZoom.enable(); 
        map.scrollWheelZoom.enable();
        map.touchZoom.enable();
    });
    return map;
  }
}

L.Canvas.FPCanvas = L.Canvas.extend({
  options: { width: 1, height: 1 },
  initialize: function (name, options) {
    this.name = name;
    L.setOptions(this, options);
    L.Canvas.prototype.initialize.call(this, { padding: 0.5 });
  },
  _draw: function () {
    let layer,bounds = this._redrawBounds;
    this._ctx.save();
    if (bounds) {
      let size = bounds.getSize();
      this._ctx.beginPath();
      this._ctx.rect(bounds.min.x, bounds.min.y, size.x, size.y);
      this._ctx.clip();
    }
    this._drawing = true;
    for (let order = this._drawFirst; order; order = order.next) {
      if (window.CP.shouldStopExecution(0)) break;
      layer = order.layer;
      if (!bounds || layer._pxBounds && layer._pxBounds.intersects(bounds)) {
        layer._updatePath();
      }
    }
    window.CP.exitedLoop(0);
    this._drawing = false;
    this._ctx.restore();
  } 
});
L.canvas.fpCanvas = function (id, options) {
  return new L.Canvas.FPCanvas(id, options);
};
// ==================== ON LOAD ======================
function loaded() {
  let myRenderer = L.canvas({ padding: 0.5 });
  myApp.map = initmap();
  let fpRender = L.canvas.fpCanvas({ padding: 0.5 });
};

if (document.readyState === 'complete' || document.readyState !== 'loading' && !document.documentElement.doScroll) {
  callback();
} else {
  document.addEventListener('DOMContentLoaded', loaded);
}