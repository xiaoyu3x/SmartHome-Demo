/**
 * update weather every 1 hour
 * using yahoo weather api
 */
var tryTimes = 5;
var checkTimes = 0;
var weatherUpdated = 0;
var iconCode;
var iconText;
var temperature;
var humidity;
var speed;
var lat;
var lon;

/**
 * get the yahoo weather woeid
 * woeid: accurate to town of county
 */
    function updateWeather() {
        console.log("updating weather ...");

        $.getJSON('/get_geo_location', function(data) {
            if (data.error != null) {
                console.error('WEATHER: Cannot get the current geo location.');
            } else {
                lat = data.geo.latitude;
                lon = data.geo.longitude;
                var position = "(" + lat + "," + lon + ")";
                getWeather(position);
            }
        });
	function getWeather(position) {
		//var weatherUrl = "https://query.yahooapis.com/v1/public/yql?q=select * from weather.forecast where woeid=" + placeWoeid;
        //todo: use oauth 1.0
        var weatherUrl = "https://query.yahooapis.com/v1/public/yql?q=select * from weather.forecast " +
            "where woeid in (SELECT woeid FROM geo.places(1) WHERE text='" + position + "')";
        var tz = getCookie('timezone');
        if(tz.indexOf('America') >= 0 ) {
            weatherUrl += " and u='f'";
            $('#temp_unit').html("F");
        }
        else {
            weatherUrl += " and u='c'";
            $('#temp_unit').html("C");
        }
        weatherUrl +=  "&format=json";
        console.log(weatherUrl);
		if (weatherUpdated == 0) {
			$.getJSON(weatherUrl, function(data) {
				var count = data.query.count;
				if(count == 1){
					iconCode = data.query.results.channel.item.condition.code;
					iconText = data.query.results.channel.item.condition.text;
                    if(data.query.results.channel.units.temperature != $('#temp_unit').html())
                        if(data.query.results.channel.units.temperature == 'F')
                            temperature = convertToC(data.query.results.channel.item.condition.temp) + '°';
                        else
                            temperature = convertToF(data.query.results.channel.item.condition.temp) + '°';
                    else
                        temperature = data.query.results.channel.item.condition.temp + '°';
					humidity = data.query.results.channel.atmosphere.humidity + '%';
					speed = (data.query.results.channel.wind.speed) + 'mph';

                    var orig_src = $('#weather-icon').attr('src');
                    var pdir = orig_src.lastIndexOf('/');
                    var new_src = orig_src.substr(0, pdir+1) + iconCode  +  '.png';

					$('#weather-icon').attr('src', new_src);
					$('#weather-icon').attr('title', iconText);
					$('#weather > h1').html(temperature);
					$('#humidity').html(humidity);
					$('#speed').html(speed);
					weatherUpdated = 1;
					console.log('WEATHER: ' + iconText + ' ' + temperature + ' ' + humidity + ' ' + speed);
				}
				checkUpdateWeatherStatus();
			});
		}
    }
}

    function checkUpdateWeatherStatus() {

        if (weatherUpdated == 1) {
            console.log('WEATHER: get yahoo weather forecast successfully.');
            checkTimes = 0;
        } else {
            checkTimes++;
            console.error('WEATHER: ' + checkTimes + ' times failed to get yahoo weather forecast.');
            if (checkTimes < tryTimes) {
                updateWeather();
            }
        }
    }