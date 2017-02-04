/**
 * Scripts for the Before page
 */
$(function() {

	$.sh.before = {
		register_actions: function(){
			console.log('sh-before: register_actions');
			$("a:contains('DISMISS')").on("click", function(){
				//find parent div
				dismiss(this);
			});

            // switch between the billing tabs
            $("a.mdl-tabs__tab").on("click", function(){
				var tid = $(this).attr( "href" );
				$("div"+tid).find("div[id*='container']").each(function () {
                    if(tid.indexOf('#tab') == 0)
                        $.sh.before.update_billing(tid);
                    else {
                        var id = $(this).attr('_echarts_instance_');
                        window.echarts.getInstanceById(id).resize();
                    }
				});
            });
		},
        update_billing: function(tab) {
            //set up tab bar
            tab = tab.substring(1);
            switch(tab) {
                case 'tab1':
                    draw_billing_pie_chart(tab + '_today_container', 'Today\'s usage', [{name: "Grid Power", value: 90
                    }, {name: "Solar Power", value: 210}]);
                    draw_billing_pie_chart(tab + '_current_container', 'Current bill', [{name: "Grid Power",value: 90
                    }, {name: "Solar Power", value: 110}]);
                    draw_billing_pie_chart(tab + '_items_container', 'Items', [{name: "Heater", value: 90
                    }, {name: "Oven", value: 110}, {name: "Refrigerator", value: 110}]);
                    break;
                case 'tab2':
                case 'tab3':
                    draw_billing_pie_chart(tab + '_today_container', 'Past week', [{name: "Grid Power",value: 90
                    }, {name: "Solar Power", value: 210}]);
                    draw_billing_pie_chart(tab + '_current_container', 'Past month', [{name: "Grid Power",value: 90
                    }, {name: "Solar Power", value: 110}]);
                    draw_billing_pie_chart(tab + '_items_container', 'Items', [{name: "Heater", value: 90
                    }, {name: "Oven", value: 110}, {name: "Refrigerator", value: 110}]);
                    break;
                case 'tab4':
                    draw_billing_pie_chart(tab + '_today_container', 'Past week', [{name: "Grid Power",value: 90
                    }, {name: "Solar Power", value: 210}]);
                    draw_billing_pie_chart(tab + '_current_container', 'Past month', [{name: "Grid Power", value: 90
                    }, {name: "Solar Power", value: 110}]);
                    draw_billing_pie_chart(tab + '_items_container', 'Past year', [{name: "Grid Power", value: 90
                    }, {name: "Solar Power", value: 110}]);
                    break;
            }
        },
        update_static_data: function() {
            var monthSolar = [1.67, 1.66, 1.67, 1.65, 1.61, 1.59, 1.58];
            var yearSolar = [50.96, 59.55, 83.12, 100.68, 117.62, 126.35, 126.64, 120.79, 106.03, 85.59, 62.14, 51.49];
            var weekGrid = [4.47, 4.82, 5.17, 5.10, 5.21, 5.07, 4.62];
            var monthGrid = [4.80, 4.88, 4.82, 4.87, 4.92, 5.02, 4.97];
            var yearGrid = [183.31, 203.80, 129.27, 95.66, 71.80, 42.18, 67.60, 94.03, 68.33, 48.08, 102.22, 156.58];
            var weekTemp = [70.448, 70.556, 70.268, 70.43, 70.646, 70.88, 70.826];
            var monthTemp = [70.826, 70.772, 70.664, 70.808, 71.096, 71.33, 71.42];
            var yearTemp = [70.844, 70.898, 70.97, 71.066, 71.114, 71.042, 71.096, 71.15, 71.276, 71.186, 70.916, 70.844];
            var weekSolar = [1.64, 1.68, 1.67, 1.69, 1.70, 1.67, 1.64];
            var weekbuzzer = [123,145,264,153,120,120,110];
            var monthbuzzer = [110,172,227,158,144,100,106];
            var yearbuzzer = [3000,3400,4300,2900,2400,3500,3200,2900,4000,4200,3800,3500];
            var weekgas = [120,110,123,153,120,145,264];
            var monthgas = [172,110,227,158,144,230,106];
            var yeargas = [3400,3000,4300,2900,4000,4200,2400,2900,3800,3200, 3500, 2800];
            var weeklight = [12.28,13.04,15.08,11.54,15.92,12.19,10.32];
            var monthlight = [12.43,13.04,12.08,11.26,15.92,15.92,12.32];
            var yearlight = [16.02,11.04,15.08,13.75,13.92,12.19,14.32, 15.03, 15.56, 14.34, 12.80, 12.79];

            drawcontainer('container', week, weekSolar, getWeek());
            drawcontainer('container_a', month, monthSolar, getMonth());
            drawcontainer('container_b', year, yearSolar, getYear());
            drawcontainer('container1', week, weekGrid, getWeek());
            drawcontainer('container1_a', month, monthGrid, getMonth());
            drawcontainer('container1_b', year, yearGrid, getYear());
            drawcontainerchart('container2_a',week,weekTemp,getWeek(),'Week(Day)', 'average temperature');
            drawcontainerchart('container2_b',month,monthTemp,getMonth(),'Month(Day)', 'average temperature');
            drawcontainerchart('container2_c',year,yearTemp,getYear(),'Year(Month)', 'average temperature');
            drawcontainerchart('container3_a',week,weekbuzzer,getWeek(),'Week(Day)','total times', 'times');
            drawcontainerchart('container3_b',month,monthbuzzer,getMonth(),'Month(Day)', 'total times', 'times');
            drawcontainerchart('container3_c',year,yearbuzzer,getYear(),'Year(Month)', 'total times', 'times');
            drawcontainerchart('container4_a',week,weekgas,getWeek(),'Week(Day)' ,'total times', 'times');
            drawcontainerchart('container4_b',month,monthgas,getMonth(),'Month(Day)', 'total times', 'times');
            drawcontainerchart('container4_c',year,yeargas,getYear(),'Year(Month)', 'total times', 'times');
            drawcontainerchart('container5_a',week,weeklight, getWeek(),'Week(Day)', 'average illuminance', 'lm');
            drawcontainerchart('container5_b',month,monthlight, getMonth(),'Month(Day)', 'average illuminance', 'lm');
            drawcontainerchart('container5_c',year,yearlight, getYear(),'Year(Month)', 'average illuminance', 'lm');
        },
        change_label: function(newmsg) {
		    $("#container2").html(newmsg);
			$("#container3").html(newmsg);
			$("#container4").html(newmsg);
			$("#container5").html(newmsg);
        },
    	loading: function () {
			var newmsg="<div style='text-align:center;'><img src='image/loading.gif' width='24px' height='24px'/></div>";
			$.sh.before.change_label(newmsg);
			// var errMsg = "<div style='text-align:center'><label>Failed to fetch data.</label></div>";
			// var alertMsg = "Server offline or session expired. Plz check your network and sign in again.";
			// setTimeout(function(){
			//     $.sh.before.change_label(errMsg);
			//     createSnackbar(alertMsg, "Dismiss");
			// }, 30000);
    	},
    	send_request: function () {
			if(window.panel != 2) return;

			var full_format = "YYYY-MM-DD HH:mm:ss";
            // for the current day
            var utc_start_time = moment.tz(timezone).startOf('day').utc().format(full_format);
            var utc_end_time = moment.tz(timezone).endOf('day').utc().format(full_format);
            var gateway_id = getCookie("gateway_id");

            if(!gateway_id){
                // redirect to login page if there is no gateway in cookie
                if (!window.location.origin) {
                    window.location.origin = window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port: '');
                }
                $(window).attr("location", window.location.origin + "/login");
                return;
            }

            console.log("utc start and end: " + utc_start_time + " " + utc_end_time);
            var sensor_list = ['temperature', 'gas', 'buzzer', 'illuminance'];
            $.each(sensor_list, function(indx, val){
                window.socket.emit('my data', {sensor: val, date_range: [utc_start_time, utc_end_time]});
            });
    	},
    	socket_init: function () {
            var now = moment.utc();
            var hour = getHour(now, utc_offset);
            //var hour = moment(time).format();
            console.log('utc offset: ' + utc_offset + ' hour:' + hour);

			// get hours of the day like ['0', '1', ... '21','22','23'];
            var day = range(0, 24);

            $.sh.make_socket_connection($.sh.before.send_request);

            //update data every 1 hour
			setInterval($.sh.before.sendrequest,3600000);

			// event handler for server sent data
			// the data is displayed in the "Received" section of the page
			socket.on('my response', function (msg) {
				console.log(msg.data);
			});
			// event handler for new connections
			socket.on('connect', function () {
				console.log("Connected to server!");
			});
			socket.on('connect_error', function() {
                console.log("Connection error !");
                var errMsg = "<div style='text-align:center'><label>Failed to fetch data.</label></div>";
                var alertMsg = "Server offline or session expired. Plz check your network and sign in again.";
                $.sh.before.change_label(errMsg);
                createSnackbar(alertMsg, "Dismiss");
            });
			socket.on('my temperature', function (msg ) {
				console.log( "On temperature");
				var temp_data = msg.data;
                // console.log(temp_data);
				if(temp_data.length==0)
				{
					var content = "<div style='text-align:center'><label>There is no data today.</label></div>";
					$("#container2").html(content);
				}
				else
				{
					var chart_data = Array.apply(null, Array(hour+1)).map(Number.prototype.valueOf,0);
                    var average_temp = 0;
                    var local_hour;
                    var is_Celsius = true;
                    var temp_unit = "°";
                    // console.log('index: ' + timezone.indexOf("US") + " tz: " + timezone);
                    if(timezone.indexOf('America') == 0 || timezone.indexOf('US') == 0) {
                        is_Celsius = false;
                        temp_unit += "F";
                    }
                    else temp_unit += "C";

					for (var i =0;i<temp_data.length;i++)
					{
                        local_hour = utc_offset+temp_data[i][1];
                        if(local_hour < 0)
                            local_hour += 24;
                        else if (local_hour > 24)
                            local_hour -= 24;
                        //console.log('local hour: ' + local_hour);
                        // console.log("is: " + is_Celsius + " c: " + parseFloat(temp_data[i][0].toFixed(2)) + " f:" + convertToF(parseFloat(temp_data[i][0]), 2));
                        var temp = is_Celsius? parseFloat(temp_data[i][0].toFixed(2)): parseFloat(convertToF(parseFloat(temp_data[i][0]), 2));
                        chart_data[local_hour] = temp;
						average_temp += temp;
					}
                    console.log('avg total: ' + average_temp);
					average_temp = (average_temp/temp_data.length).toFixed(2);
                    console.log('avg: ' + average_temp);
					$("#averagetemp").text(average_temp.toString()+ temp_unit);
					drawcontainerchart('container2',day,chart_data,getDay(),'Time(hour)', 'average temperature', temp_unit);
				}
			});
			socket.on('my gas', function (msg) {
				console.log("On gas");
				var num = msg.data;
                //console.log(num);
				if(num.length==0)
				{
					var content = "<div style='text-align:center'><label>There is no data today.</label></div>";
					$("#container4").html(content);
				}
				else
				{
                    var chart_data = Array.apply(null, Array(hour+1)).map(Number.prototype.valueOf,0);
                    var local_hour;
                    for (var i =0;i<num.length;i++) {
                        local_hour = utc_offset + num[i][1];
                        if (local_hour < 0)
                            local_hour += 24;
                        else if (local_hour > 24)
                            local_hour -= 24;
                        chart_data[local_hour] = parseFloat(num[i][0].toFixed(2));
                    }
					drawcontainerchart('container4',day,chart_data, getDay(),'Time(hour)', 'total times', 'times');
					if(num[num.length-1]>0)
						$("#safestate").text("Unsafe");
					else
					    $("#safestate").text("Safe");
				}

			});
			socket.on('my buzzer', function (msg) {
				console.log("On buzzer");
				var num = msg.data;
				// console.log(num);
				if(num.length==0)
				{
					var content = "<div style='text-align:center'><label>There is no data today.</label></div>";
					$("#container3").html(content);
				}
				else {
                    var chart_data = Array.apply(null, Array(hour+1)).map(Number.prototype.valueOf, 0);
                    var local_hour;
                    for (var i = 0; i < num.length; i++) {
                        local_hour = utc_offset + num[i][1];
                        if (local_hour < 0)
                            local_hour += 24;
                        else if (local_hour > 24)
                            local_hour -= 24;
                        chart_data[local_hour] = parseFloat(num[i][0].toFixed(2));
                    }
                    drawcontainerchart('container3', day, chart_data, getDay(), 'Time(hour)', 'total times', 'times');
                }
			});
			socket.on('my illuminance', function (msg) {
				console.log("On illuminance");
				var light_data = msg.data;
				if(light_data.length==0)
				{
					var content = "<div style='text-align:center'><label>There is no data today.</label></div>";
					$("#container5").html(content);
				}
				else
				{
                    var chart_data = Array.apply(null, Array(hour+1)).map(Number.prototype.valueOf,0);
                    var local_hour;
					for (var i =0;i<light_data.length;i++)
					{
                        local_hour = utc_offset+light_data[i][1];
                        if(local_hour < 0)
                            local_hour += 24;
                        else if (local_hour > 24)
                            local_hour -= 24;
                        chart_data[local_hour] = parseFloat(light_data[i][0].toFixed(2));
					}
					drawcontainerchart('container5',day,chart_data, getDay(),'Time(hour)', 'average illuminance', 'lm');
				}
			});

			// $.sh.before.send_request();
    	},	
		init: function() {
			console.log("init before page.");
            $("#demo-welcome-message").html("This demo tells you about your <b>home sensor history.</b>");
			window.panel = 2;
            $('#sh-before').show();
		    $('#sh-now').hide();
			$('#sh-future').hide();
            $('#alert-status-card').hide();
			//window.trigger("resize");
			$.sh.before.register_actions();
			$.sh.before.loading();
            $.sh.before.update_billing("#tab1");
			$.sh.before.socket_init();
            $.sh.before.update_static_data();
		}
	};

    $("a:contains('BEFORE')").on('click', function() {
     	clearInterval(window.time_timer);
		clearInterval(window.now_timer);
        clearInterval(window.weather_timer);
		$.sh.before.init();
	});
})