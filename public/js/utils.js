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