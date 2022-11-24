const allColors=["#003366","#336699","#3366CC","#003399","#000099","#0000CC","#000066","#0000FF","#3333FF","#333399","#0066FF","#3366FF","#3333CC","#666699","#6666FF","#6600FF","#6600CC","#9966FF","#9933FF","#9900FF","#CC00FF","#9900CC","#FFCCFF","#FF99FF","#FF66FF","#FF00FF","#CC00CC","#660066","#CC0099","#993399","#FF3399","#CC3399","#990099","#FF6666","#FF0066","#CC6699","#993366","#FF9933","#FF6600","#FF5050","#CC0066","#660033","#996633","#CC9900","#FF9900","#CC6600","#FF3300","#FF0000","#CC0000","#990033","#663300","#996600","#CC3300","#993300","#990000","#800000","#993333"];

function generateRandomColor() {
    let colorIndex=Math.floor(Math.random() * allColors.length);
    return allColors[colorIndex];
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