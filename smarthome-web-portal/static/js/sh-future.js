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

            $.sh.future.socket_init();
		},
        socket_init: function() {
            $.sh.make_socket_connection($.sh.future.send_request);

            //update data every 1 hour
			//setInterval($.sh.before.sendrequest,3600000);
			socket.on('my response', function (msg) {
				console.log(msg.data);
			});

			$.sh.future.update_weather();
			$.sh.future.update_billing();
			$.sh.future.update_power_data();
			$.sh.future.update_model_picture();
        },
        send_request: function() {
            var today = getLocalDate(moment.utc(), utc_offset);
            today_str = today.format("MM/DD/YYYY");
            socket.emit('my temp', {type: 'forecast', region: timezone, today_date: today_str});
            socket.emit('my temp', {type: 'today', region: timezone, today_date: today_str});
            socket.emit('my power', {region: timezone, today_date: today_str});
        },
        update_weather: function(){
			socket.on('my temp forecast', function(msg){
                if(msg.error) {
                    console.error('Error: ' + msg.error);
                    onFailure(msg.error);
                    return;
                }
                temp_actual = get_actual(msg.data.actual, 'temperature');
                temp_future = get_future(msg.data.future, 'temperature');

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
            });

            socket.on('my temp today', function(msg) {
                if (msg.error) {
                    console.error('Error: ' + msg.error);
                    onFailure(msg.error);
                    return;
                }
                if(msg.data) {
                    var temp_in_Fahrenheit = msg.data[0]['temperature'];
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
                }
            });
        },
		update_billing:function(){
            console.log("time zone is:" + timezone);
            console.log("offset hour is:" + utc_offset);

            // var utc_now = moment.utc();
            var today = getLocalDate(moment.utc(), utc_offset);
            var today1 = moment(today).add(1, 'd');
            var today2 = moment(today).add(2, 'd');

            $("#billing_date_1").html(today.format("YYYY-MM-DD"));
            $("#billing_date_2").html(today1.format("YYYY-MM-DD"));
            $("#billing_date_3").html(today2.format("YYYY-MM-DD"));
		},
		update_power_data: function() {
            socket.on("my power resp", function(msg){
                if(msg.error) {
                    console.error('Error: ' + msg.error);
                    onFailure(msg.error);
                    return;
                }
                power_actual = get_actual(msg.data.actual, 'power');
                power_future = get_future(msg.data.future, 'power');
                power_predict_his = get_actual(msg.data.predict_his, 'power');
                drawcontainer3('container_power', date_axis, power_actual, power_predict_his, power_future, '');
                $.sh.future.update_billing_power(msg.data.future);
            });

		},
        update_model_picture:function(){
			// todo: switch picture by gateway id
			$("#img_gs").attr('src',"../image/model/linear_shanghai.png"); 
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
                var temp_convert = convertToF(parseInt(cTemp), 0)
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
	    if(result.length > 0) {
            console.log(result[0][key]);
            for (var i = 0; i < 4; i++) {
            	if(typeof result[i] !== 'undefined')
                	list.push(result[i][key]);
            	else
            	    list.push(null);
            }
            list.push(null, null, null);
        }
		return list;
	}

	function get_future(result, key){
	    var list = [];
	    if(result.length > 0) {
	        list.push(null, null, null);
            console.log(result[0][key]);
            for (var i = 0; i < 4; i++) {
            	if( typeof result[i] !== 'undefined')
                	list.push(result[i][key]);
            	else
            	    list.push(null);
            }
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
