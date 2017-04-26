/**
 * Scripts to call google geo names api to convert geo location to timezone
 */
const GeoName = "http://api.geonames.org/timezoneJSON";
const Username = "iot2cloud";

function getDateByGeolocation(lat, lon, callback){
    var params = { lat:lat,
                    lng:lon,
                    username: Username
                  };
    var url = GeoName + "?" + $.param(params);
    console.log(url);
    $.getJSON(url).done(function(data) {
        if(data)
            callback(data.time);
    }).fail(function(){
        console.error("Failed to get gateway's current datetime.");
    });
}