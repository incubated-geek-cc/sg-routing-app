function syntaxHighlight(json) {
  json = json.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
      var cls = "number";
      if (/^"/.test(match)) {
          if (/:$/.test(match)) {
              cls = "key";
          } else {
              cls = "string";
          }
      } else if (/true|false/.test(match)) {
          cls = "boolean";
      } else if (/null/.test(match)) {
          cls = "null";
      }
      return "<span class='" + cls + "'>" + match + "</span>";
  });
}
function generateRandomColor() {
    var lum = -0.25;
    var hex = String('#' + Math.random().toString(16).slice(2, 8).toUpperCase()).replace(/[^0-9a-f]/gi, '');
    if (hex.length < 6) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    var rgb = '#', c, i;
    for (i = 0; i < 3; i++) {
        c = parseInt(hex.substr(i * 2, 2), 16);
        c = Math.round(Math.min(Math.max(0, c + (c * lum)), 255)).toString(16);
        rgb += ('00' + c).substr(c.length);
    }
    return rgb;
}

const reverseLatLng = (inputLatLng) => {
  let outputArr=[];
  for(let latlngarr of inputLatLng) {
    outputArr.push( [latlngarr[1], latlngarr[0]] );
  }
  return outputArr;
};

function getCurrentDatetimeStamp() {
  const d = new Date();
  var datestamp=d.getFullYear()+''+(d.getMonth()+1)+''+d.getDate();
  var timestamp=d.getHours()+''+d.getMinutes()+''+d.getSeconds();

  var datetimeStr=datestamp+'_'+timestamp;
  return datetimeStr;
}