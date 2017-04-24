/**
 * Scripts for the future page
 */
 
$(function() {
    var temp_actual={};
	var temp_future ={};
	var today_str = null;
	var date_axis = null;
	var power_predict_his ={};
    var power_actual={};
	var power_future={};
	
    $.sh.future = {
        register_actions: function() {
            console.log('sh-future: register_actions');

            // switch temperature
            $("#temperature_convert").on('click', function(){
                $.sh.future.convert_temperature();
            });

            $("#unit_price").blur(function(){
               var unit_price = $("#unit_price").val();

               var power_1 = $("#daily_power_1").html();
               var power_2 = $("#daily_power_2").html();
               var power_3 = $("#daily_power_3").html();

               var price_1 = power_1 * unit_price;
               var price_2 = power_2 * unit_price;
               var price_3 = power_3 * unit_price;

               $("#daily_price_1").html(price_1.toFixed(2));
               $("#daily_price_2").html(price_2.toFixed(2));
               $("#daily_price_3").html(price_3.toFixed(2));
            });

            $("#img_gs").mousemove(function(e){
                var img_src = $(this).attr('src');
                if(img_src){
                    var parentOffset = $(this).parent().offset();
                    var relX = e.pageX - parentOffset.left;
                    var relY = e.pageY - parentOffset.top;
                    $("#div_gs").css({top:(relY + 0) + 'px', left: (relX + 0) + 'px'});
                }
            });

        },
	     init: function() {
			console.log("init future page.");
			window.panel = 3;
            $('#sh-now').hide();
			$('#sh-before').hide();
            $('#sh-future').show();
            $('#alert-status-card').hide();
            $("#demo-welcome-message").html("This demo tells you the <b>prediction of home energy consumption.</b>");
            $.sh.future.register_actions();
            var load ="<div style='text-align:center;'><img src='image/loading.gif' width='24px' height='24px' " +
                "style='position: absolute; left: 50%; top: 50%; margin-left: -24px; margin-top: -24px;'/></div>";
            $.sh.future.clear_container(load);
            $.sh.future.socket_init();
		},
        clear_container: function(html){
            $("#container_power").html(html);
            $("#container_temperature").html(html);
        },
        socket_init: function() {
            $.sh.make_socket_connection($.sh.future.send_request);

            //update data every 1 hour
			//setInterval($.sh.before.sendrequest,3600000);
			socket.on('my response', function (msg) {
				console.log(msg.data);
			});

			$.sh.future.update_weather();
			// $.sh.future.update_billing();
			$.sh.future.update_power_data();
			$.sh.future.update_model_picture();
        },
        callbacks: function(current_date) {
            today_str = moment(current_date, "YYYY-MM-DD HH-mm").format("MM/DD/YYYY");
            console.log("today is : " + current_date);
            if(!getCookie("today")){
                // set gateway's date in cookie and refresh each hour
                createCookie('today', current_date, 1/24);
            }
            socket.emit('my temp', {today_date: today_str});
            // socket.emit('my temp', {type: 'today', today_date: today_str});
            socket.emit('my power', {today_date: today_str});
            $.sh.future.update_billing(current_date);
        },
        send_request: function() {
            var today = getCookie('today');
            if(today){
                $.sh.future.callbacks(today);
            }
            else {
                $.getJSON('/get_geo_location', function (data) {
                    if (data.error != null) {
                        console.error('Future: failed to get gateway geo location.');
                        $.sh.future.clear_container("");
                    } else {
                        getDateByGeolocation(data.geo.latitude, data.geo.longitude, $.sh.future.callbacks);
                    }
                });
            }
            socket.emit('my model');
        },
        set_default_weather: function() {
            $('#a_temp_today').html(0);
            if(timezone.indexOf('America') == 0 || timezone.indexOf('US') == 0) {
                $("#temperature_convert").html('F');
            }
            else {
                $("#temperature_convert").html('C');
            }
        },
        update_weather: function(){
			socket.on('my temp resp', function(msg){
                if(msg.error) {
                    $("#container_temperature").html("");
                    console.error('Error: ' + msg.error);
                    onFailure(msg.error);
                    $.sh.future.set_default_weather();
                    return;
                }
                temp_actual = get_actual(msg.data.actual, 'temperature');
                temp_future = get_future(msg.data.future, 'temperature');
                if(temp_actual.length == 0 || temp_future.length == 0) {
                    createSnackbar("Error: incomplete weather data. Plz load weather in admin portal.", "Dismiss");
                    $.sh.future.set_default_weather();
                    return;
                }

                var c_temp_actual = [];
                for(var i=0;i<temp_actual.length;i++){
                    c_temp_actual.push(convertToC(parseInt(temp_actual[i]), 1));
                }

                var c_temp_future = [];
                for(i=0;i<temp_future.length;i++){
                    c_temp_future.push(convertToC(parseInt(temp_future[i]), 1));
                }
                var today = getLocalDate(moment.utc(), utc_offset);
                date_axis = get_date_axis(today);

                drawcontainer2('container_temperature', date_axis, c_temp_actual, c_temp_future, '');

                // update today's temperature and its unit
                var index = parseInt(temp_actual.length/2);
                var temp_in_Fahrenheit = temp_actual[index];
                $('#a_temp_today').html();
                if(timezone.indexOf('America') == 0 || timezone.indexOf('US') == 0) {
                    $("#temperature_convert").html('F');
                    $('#a_temp_today').html(temp_in_Fahrenheit);
                }
                else {
                    $("#temperature_convert").html('C');
                    var temp_convert = convertToC(parseInt(temp_in_Fahrenheit), 0);
                    $('#a_temp_today').html(temp_convert);
                }
            });
        },
		update_billing:function(today){
            var today = moment(today);
            var today1 = moment(today).add(1, 'd');
            var today2 = moment(today).add(2, 'd');

            $("#billing_date_1").html(today.format("YYYY-MM-DD"));
            $("#billing_date_2").html(today1.format("YYYY-MM-DD"));
            $("#billing_date_3").html(today2.format("YYYY-MM-DD"));
		},
		update_power_data: function() {
            socket.on("my power resp", function(msg){
                if(msg.error) {
                    $("#container_power").html("");
                    console.error('Error: ' + msg.error);
                    onFailure(msg.error);
                    return;
                }
                power_actual = get_actual(msg.data.actual, 'power');
                power_future = get_future(msg.data.future, 'power');
                power_predict_his = get_actual(msg.data.predict_his, 'power');
                if(power_future.length == 0 || power_actual.length == 0 || power_predict_his.length == 0) {
                    createSnackbar("Error: incomplete power data. Plz load weather in admin portal.", "Dismiss");
                    return;
                }
                drawcontainer3('container_power', date_axis, power_actual, power_predict_his, power_future, '');
                $.sh.future.update_billing_power(msg.data.future);
            });
		},
        update_model_picture:function(){
			// switch model images by gateway id
            socket.on("my model resp", function(msg) {
                if (msg) {
                    $("#img_gs").attr('src', msg);
                }
                else {
                    onFailure("The gateway is not bound with any data model.");
                }
                return;
            });

		},
        convert_temperature: function(){
            var temp_unit = $("#temperature_convert").html();
            console.log("temp_unit:" + temp_unit);
            if(temp_unit == "F")
            {
                var tTemp = $('#a_temp_today').html();
                var temp_convert = convertToC(parseInt(tTemp), 0);
                //alert(temp_convert)
                $('#a_temp_today').html(temp_convert);
                $("#temperature_convert").html("C");

                var c_temp_actual = [];
                for(var i=0;i<temp_actual.length;i++){
                    c_temp_actual.push(convertToC(parseInt(temp_actual[i]), 1));
                }

                var c_temp_future = [];
                for(i=0;i<temp_future.length;i++){
                    c_temp_future.push(convertToC(parseInt(temp_future[i]), 1));
                }
                console.log(c_temp_future);
                console.log(temp_future);

                drawcontainer2('container_temperature', date_axis, c_temp_actual,c_temp_future, '');
            }
            else if(temp_unit == "C"){

                var cTemp = $('#a_temp_today').html();
                var temp_convert = convertToF(parseInt(cTemp), 0);
                $('#a_temp_today').html(temp_convert);
                $("#temperature_convert").html("F");
                console.log("cTemp:" + cTemp);
                console.log("temp_convert:" + temp_convert);

                drawcontainer2('container_temperature', date_axis, temp_actual, temp_future, '');
            }
	    },
        update_billing_power: function(result){
            if(result.length > 0) {
                $("#daily_power_1").html(result[0]['power']);
                $("#daily_power_2").html(result[1]['power']);
                $("#daily_power_3").html(result[2]['power']);

                var unit_price = $("#unit_price").val();

                var price_1 = result[0]['power'] * unit_price;
                var price_2 = result[1]['power'] * unit_price;
                var price_3 = result[2]['power'] * unit_price;

                $("#daily_price_1").html(price_1.toFixed(2));
                $("#daily_price_2").html(price_2.toFixed(2));
                $("#daily_price_3").html(price_3.toFixed(2));
            }
        }
	};
	
	function get_actual(result, key){
	    var list = [];
	    if(result.length != 4) {
            return list;
        }
        console.log(result[0][key]);
        for (var i = 0; i < 4; i++) {
            if(typeof result[i] !== 'undefined')
                list.push(result[i][key]);
            else
                list.push(null);
        }
        list.push(null, null, null);
		return list;
	}

	function get_future(result, key){
	    var list = [];
	    if(result.length != 4) {
            return list;
        }
        list.push(null, null, null);
        console.log(result[0][key]);
        for (var i = 0; i < 4; i++) {
            if( typeof result[i] !== 'undefined')
                list.push(result[i][key]);
            else
                list.push(null);
        }
		return list;
	}

	function onFailure(error_msg) {
        createSnackbar("Failure: " + error_msg, "Dismiss");
    }
	
	$("a:contains('FUTURE')").on('click', function() {
     	clearInterval(window.time_timer);
		clearInterval(window.now_timer);
        clearInterval(window.weather_timer);
		
		$.sh.future.init();
	});
 });
