/**
 * Scripts for the Now and Before page
 */
$(function() {
	//Set the object socket global.
	window.socket;
	window.socket = null;

	//The variable panel represents the current panel displayed by the browser.
	//0: Initial. No panel is specified.
	//1: the Now panel.
	//2: the Before panel
	window.panel;
	window.panel=0;

    //Number of alert cards displayed on NOW page
    var alert_card_number = 0;

	var now_timer;
	var time_timer;
    var weather_timer;

    var timezone = null;
    var utc_offset = null;

    var tb; //token for buzzer
    var tg; //token for gas
    var tc; //token for car
    var tm; //token for motion

    $.sh = {
        init: function() {
            //set initial timezone to Cookie
            console.log("load timezone...");
            if (!getTimezone()) {
                setTimezone(moment.tz.guess());
                console.log('set timezone in cookie: ' + getCookie('timezone'));
            }
            makeTimezoneSelect();

            $("#inst").on('click mouseover', function() {
                $.getJSON('/cf_instance', function(data) {
                        if (data.error != null) {
                            console.error('Cannot get the cf instance info.');
                        } else {
                            var inst = data.cf_instance;
                            if($.isEmptyObject(inst))
                                $("#instance_info").html('n/a');
                            else
                            {
                                var info = String.format('<div>Name <span>{0}</span></div><div style="word-break:break-all;">URL <a>{1}</a></div> \
                                    <table><tbody> \
                                    <tr><td>Instance ID</td><td style="word-break:break-all; width: 145px">{2}</td></tr> \
                                    <tr><td>Version</td><td>{3}</td></tr> \
                                    <tr><td>Index</td><td>{4}</td></tr> \
                                    <tr><td>Instance running</td><td>{5}</td></tr> \
                                    </tbody></table>', inst.name, inst.uris[0], inst.instance_id, inst.version, inst.Instance, inst.Total);
                                $("#instance_info").html(info);
                            }
                            $("#instance_info").show();

                            // to fix the wrong margin offset for the first time issue
                            var left_offset = $("#instance_info").css('margin-left');
                            if(left_offset == "0px") {
                                var tip = $("#instance_info");
                                $("#instance_info").css('margin-left', -1 * tip.width() + 'px');
                            }
                        }
                });
            });
        }
    };

    function getTimezone() {
        var tz = getCookie('timezone');
        var zones = moment.tz.names();
        if(zones.indexOf(tz) > 0) {
            console.log('get timezone in cookie: ' + tz);
            timezone = tz;
            utc_offset = moment.tz(timezone).utcOffset() / 60;
            return true;
        }
        else return false;
    };

    function setTimezone(tz) {
        timezone = tz;
        createCookie('timezone', timezone, 5);
        utc_offset = moment.tz(timezone).utcOffset()/60;
        console.log('current offset: ' + utc_offset);
    };

    function makeTimezoneSelect() {
        // reduce the timezone list size to 220.
        var cities = Object.keys(moment.tz._zones)
            .map(function(k) { if(typeof moment.tz._zones[k] === 'string') return moment.tz._zones[k].split('|')[0]; else return moment.tz._zones[k].name;})
            .filter(function(z) { return z.indexOf('/') >= 0; });

        var ordered_cities = [];
        var i = 0 ;
        for(var key in cities) {
            ordered_cities.push({
              id: i.toString(),
              text: '(GMT ' + moment.tz(cities[key]).format('Z') + ') ' + cities[key],
              offset: moment.tz(cities[key]).format('Z')
            });
            i++;
        }
        ordered_cities.sort(function(a, b){
            return parseInt(a.offset.replace(":", ""), 10) - parseInt(b.offset.replace(":", ""), 10);
        });

        $('#timezone').select2({
            data: ordered_cities,
            tags: "true",
            width: "300px",
            placeholder: '(GMT ' + moment.tz(timezone).format('Z') + ') ' + timezone,
        });

        $('#timezone').change(function() {
            var theSelection = $('#timezone option:selected').text();
            console.log('selected: ' + theSelection.split(') ')[1]);
            setTimezone(theSelection.split(') ')[1]);
            window.location.reload();
        });
    }

	window.onbeforeunload = function() {
		console.log("Leaving the page...");
		if(window.socket !=null)window.socket.close();
    };

	window.onload = function() {
    };

	$.sh.now = {
		register_actions: function(){
			console.log('sh-now: register_actions');
			$("a:contains('DISMISS')").on("click", function(){
				//find parent div
				dismiss(this);
			});

			$("label.mdl-icon-toggle").on('click', function(e) {
				e.preventDefault();
				e.stopImmediatePropagation();
				var unit = $(this).children("span:first").html();
				var temp = $(this).parent().prev().find("h1").html();
                if(temp.length == 0) return;
				if (unit == "C") {
					unit = "F";
					temp = convertToF(temp, 0);
				}
				else if (unit == "F") {
					unit = "C";
					temp = convertToC(temp, 0);
				}
				console.log('unit: ' + unit + ' temp: '+ temp);
				$(this).children("span:first").html(unit);
				$(this).parent().prev().find("h1").html(temp + '°');
			});

		},
		clear_data: function() {
			$("#status-container").html('');
			$("#data-container").html('');
		},
		update_car_alert: function(time) {
			if($(".mdl-card__title h6:contains('ELECTRIC CAR')").length > 0){
				//find car card and update time
				var txt = $(".section__circle-container > h4:contains('Charge')");
				txt.text("Charge car in time for tomorrow " + time);
			}
			else {
					$("#alert-container").append(String.format('<div class="demo-card-event mdl-card mdl-cell mdl-cell--3-col mdl-shadow--2dp">\
				  <div class="mdl-card__title mdl-card--expand">\
					<h6>ELECTRIC CAR</h6>\
				  </div>\
				  <div class="mdl-card__supporting-text mdl-grid mdl-grid--no-spacing">\
					<div class="section__circle-container mdl-cell mdl-cell--8-col">\
						<h4>Charge car in time for tomorrow {0}</h4>\
					</div>\
					<div class="section__text mdl-cell mdl-cell--4-col" style="text-align:center;">\
						<img src="image/car-icon.png" style="width: 75%; height:75%;">\
					</div>\
				  </div>\
				  <div class="mdl-card__actions mdl-card--border">\
					<a class="mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect" style="color: #000" onclick="$.sh.now.dismiss_alert_card(this);">\
					  DISMISS\
					</a>\
					<a class="mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect" style="color: #000">SET TIMER</a>\
				  </div>\
				</div>', time));
                alert_card_number++;
			}
		},
        dismiss_alert_card: function(obj){
            dismiss(obj);
            alert_card_number--;
            console.log("number of alert cards " + alert_card_number);
            if(alert_card_number <= 0)
            {
                $("#alert-status-title-quiet").show();
                $("#alert-status-title-alerts").hide();
            }
        },
		update_motion_alert: function(time){
			if($(".mdl-card__title h6:contains('MOTION SENSOR')").length > 0){
				//find motion card and update time
				var txt = $(".section__circle-container > h4:contains('Someone')");
				txt.text("Someone is at the front door " + time);
			}
			else {
					$("#alert-container").append(String.format('<div class="demo-card-event mdl-card mdl-cell mdl-cell--3-col mdl-shadow--2dp">\
				  <div class="mdl-card__title mdl-card--expand">\
					<h6>MOTION SENSOR</h6>\
				  </div>\
				  <div class="mdl-card__supporting-text mdl-grid mdl-grid--no-spacing">\
					<div class="section__circle-container mdl-cell mdl-cell--8-col">\
						<h4>Someone is at the front door {0}</h4>\
					</div>\
					<div class="section__text mdl-cell mdl-cell--4-col" style="text-align:center;">\
						<img src="image/motion-icon.png">\
					</div>\
				  </div>\
				  <div class="mdl-card__actions mdl-card--border">\
					<a class="mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect" onclick="$.sh.now.dismiss_alert_card(this);">\
					  DISMISS\
					</a>\
				  </div>\
				</div>', time));
                alert_card_number++;
			}
		},
		update_gas_alert: function(time){
			if($(".mdl-card__title h6:contains('CO2 SENSOR')").length > 0)
			{
				//find gas card and update time
				var txt = $(".section__circle-container > h4:contains('Gas')");
				if(!txt) console.log("not find gas card" + txt.length);
				txt.text("Gas detected in kitchen area " + time);
			}
			else {
				$("#alert-container").append(String.format('<div class="demo-card-event mdl-card mdl-cell mdl-cell--3-col mdl-shadow--2dp" style="background: #ed0042;">\
				  <div class="mdl-card__title mdl-card--expand">\
					<h6 style="color: #fff;">CO2 SENSOR</h6>\
				  </div>\
				  <div class="mdl-card__supporting-text mdl-grid mdl-grid--no-spacing">\
					<div class="section__circle-container mdl-cell mdl-cell--8-col">\
						<h4 style="color: #fff;">Gas detected in kitchen area {0}</h4>\
					</div>\
					<div class="section__text mdl-cell mdl-cell--4-col" style="text-align:center;">\
						<img src="image/gas-icon.png">\
					</div>\
				  </div>\
				  <div class="mdl-card__actions mdl-card--border">\
					<a class="mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect" onclick="$.sh.now.dismiss_alert_card(this);"  style="color: #fff;">\
					  DISMISS\
					</a>\
					<a class="mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect"  style="color: #fff;">EMERGENCY</a>\
				  </div>\
				</div>', time));
                alert_card_number++;
			}
		},
		update_buzzer_alert: function(time) {
			if($(".mdl-card__title h6:contains('BUZZER')").length > 0)
			{
				//find gas card and update time
				var txt = $(".section__circle-container > h1");
				txt.text(time);
			}
			else {
				$("#alert-container").append(String.format('<div class="demo-card-event mdl-card mdl-cell mdl-cell--3-col mdl-shadow--2dp">\
				  <div class="mdl-card__title mdl-card--expand">\
					<h6>BUZZER</h6>\
				  </div>\
				  <div class="mdl-card__supporting-text mdl-grid mdl-grid--no-spacing">\
					<div class="section__circle-container mdl-cell mdl-cell--8-col">\
						<h1>{0}</h1>\
					</div>\
					<div class="section__text mdl-cell mdl-cell--4-col" style="text-align:center;">\
						<img src="image/buzzer-icon.png">\
					</div>\
				  </div>\
				  <div class="mdl-card__actions mdl-card--border">\
					<a class="mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect" onclick="$.sh.now.dismiss_alert_card(this);">\
					  DISMISS\
					</a>\
				  </div>\
				</div>', time));
                alert_card_number++;
			}
		},
		update_status: function(type, status) {
			var color = "gray"
			if (status)
				color = "green";

			$("#status-container").append(String.format('<div class="status-card mdl-card mdl-cell mdl-shadow--2dp mdl-cell--12-col">\
				  <div class="mdl-card__supporting-text mdl-grid mdl-grid--no-spacing">\
						<div class="mdl-cell mdl-cell--12-col" style="text-align: left">\
							<h6>{0}</h6>\
						</div>\
					  <div class="mdl-card__menu">\
						  <i class="material-icons {1}">done</i>\
					  </div>\
				  </div>\
				</div>', type, color))
		},
		update_fan_status: function(status) {
			var is_checked = "";
			if(status)
				is_checked = "checked";

			$("#status-container").append(String.format('<div class="status-card mdl-card mdl-cell mdl-shadow--2dp mdl-cell--12-col">\
				  <div class="mdl-card__supporting-text mdl-grid mdl-grid--no-spacing">\
						<div class="mdl-cell mdl-cell--12-col" style="text-align: left">\
							<h6>FAN</h6>\
						</div>\
					  <div class="mdl-card__menu">\
						  <label title="switch on/off" class="mdl-switch mdl-js-switch mdl-js-ripple-effect" for="switch-2">\
      						<input type="checkbox" id="switch-2" class="mdl-switch__input" {0} onclick="return toggle_status(\'fan\', this);">\
      						<span class="mdl-switch__label"></span>\
    					  </label>\
					  </div>\
				  </div>\
				</div>', is_checked));
            // Expand all new MDL elements
            componentHandler.upgradeDom();
		},
		update_rgb_status: function(status) {
			var bgcolor = "bg-blue";
			if(status)
				bgcolor = "bg-red";

			$("#status-container").append(String.format('<div class="status-card mdl-card mdl-cell mdl-shadow--2dp mdl-cell--12-col">\
			  <div class="mdl-card__supporting-text mdl-grid mdl-grid--no-spacing">\
					<div class="mdl-cell mdl-cell--12-col" style="text-align: left">\
						<h6>RGB LED</h6>\
					</div>\
				  <div class="mdl-card__menu">\
					  <i class="material-icons {0}">lightbulb_outline</i>\
				  </div>\
			  </div>\
			</div>', bgcolor))

		},
        update_sensor_data_without_unit: function(title, value) {
		    this.update_data(title, value, '');
        },
        update_temperature_data: function(title, value, uuid) {
            this.update_data(title, value, '', uuid);
        },
        update_sensor_data: function(title, value, unit) {
            this.update_data(title, value, unit, '');
        },
		update_data: function(title, value, unit, uuid) {
			var show_uuid = '';
            if(uuid)
                show_uuid = '<span class="mdl-card__subtitle-text" style="font-size: 70%">UUID: ' + uuid + '</span>';
			var	html = String.format('<div class="sensor-card mdl-card mdl-cell mdl-shadow--2dp mdl-cell--3-col">\
                    <div class="mdl-card__title" style="display: block">\
			  	        <h6>{0}</h6>\
			  	        {1}\
                    </div>\
                    <div class="mdl-card__supporting-text mdl-grid mdl-grid--no-spacing">\
                        <div class="mdl-cell" style="text-align:left;width: auto;">\
                            <h1>{2}</h1>\
                        </div>\
                        <div class="mdl-cell" style="display: flex; align-items: flex-end;">\
								<h6 style="padding: 5px;">{3}</h6>\
                        </div>\
                    </div>\
                </div>',title, show_uuid, value, unit);

			$("#data-container").append(html);
		},
        get_temperature_in_timezone: function(value) {
		    var house_temp = null;
            var temp_unit = "°";
            //console.log('index: ' + timezone.indexOf("America") + " tz: " + timezone);
            if(timezone.indexOf('America') == 0 || timezone.indexOf('US') == 0) {
                house_temp = convertToF(parseFloat(value), 1);
                temp_unit += "F";
            }
            else {
                house_temp = parseFloat(value).toFixed(1);
                temp_unit += "C";
            }
            return house_temp.toString() + temp_unit;
        },
		update_portal: function() {
			if(window.panel != 1) return;
            $.ajax({
                type: "GET",
                url: "/get_sensor",
                dataType: 'json',
                headers: {
                    'buzzer-token': tb,
                    'motion-token': tm,
                    'button-token':tc,
                    'gas-token': tg,
                },
                success: function(data){
                    console.log(data);
                    var sensors = data.data;
                    $.sh.now.clear_data();
                    $.each(sensors['alert'], function (key, value) {
                        switch (key) {
                            case 'buzzer':
                                $.sh.now.update_buzzer_alert(getTime(value, utc_offset, timezone));
                                tb = value;
                                break;
                            case 'motion':
                                $.sh.now.update_motion_alert(getTime(value, utc_offset, timezone));
                                tm = value;
                                break;
                            case 'gas':
                                $.sh.now.update_gas_alert(getTime(value, utc_offset, timezone));
                                tg = value;
                                break;
							case 'button':
                                $.sh.now.update_car_alert(getTime(value, utc_offset, timezone));
                                tc = value;
                                break;
                            default:
                                console.error("Unknown alert sensor type: " + key);
                        }
                        // console.log("number of alert cards " + alert_card_number);
                        if(alert_card_number == 1)
                        {
                            $("#alert-status-title-quiet").hide();
                            $("#alert-status-title-alerts").show();
                        }
                    });
                    $.each(sensors['status'], function (key, value) {
                        switch (key) {
                            case 'fan':
                                $.sh.now.update_fan_status(value);
                                break;
                            case 'led':
                                $.sh.now.update_status('LED', value);
                                break;
                            case 'rgbled':
                                $.sh.now.update_rgb_status(value);
                                break;
                            default:
                                console.error("Unknown status sensor type: " + key);
                        }
                    });
                    $.each(sensors['data'], function (key, value) {
                        switch (key) {
                            case 'temperature':
                                //$.sh.now.update_sensor_data('HOUSE TEMPERATURE', convertToF(parseFloat(value)).toFixed(1).toString() + '°F');
                                var values = JSON.parse(value);
                                var house_temp = $.sh.now.get_temperature_in_timezone(values.temperature);
								$.sh.now.update_temperature_data('HOUSE TEMPERATURE', house_temp, values.uuid);
                                break;
                            case 'solar':
                                $.sh.now.update_sensor_data('SOLAR PANEL TILT', value, '%');
                                break;
                            case 'illuminance':
                                $.sh.now.update_sensor_data('AMBIENT LIGHT', value, 'lm');
                                break;
                            case 'power':
                                $.sh.now.update_sensor_data('CURRENT ENERGY CONSUMPTION', value/1000, 'Watt');
                                break;
                            case 'environment':
                                var values = JSON.parse(value);
                                $.sh.now.update_temperature_data('HOUSE TEMPERATURE', $.sh.now.get_temperature_in_timezone(values.temperature), values.uuid);
                                $.sh.now.update_sensor_data_without_unit('HOUSE HUMIDITY', values.humidity + '%');
                                $.sh.now.update_sensor_data('PRESSURE', values.pressure,'hPa');
                                $.sh.now.update_sensor_data_without_unit('UV INDEX', values.uv_index);
                                break;
                            default:
                                console.error("Unknown sensor data type: " + key);
                        }
                    });
                }
            }).done(function() {
			   //console.log( "second success" );
			}).fail(function() {
			  console.log( "getJson data error" );
			}).always(function() {
				//console.log("complete");
			})
		},
        update_billing: function() {
            draw_billing_pie_chart('today_container', 'Today\'s usage', [{ name: "Grid Power", value:90},{ name:"Solar Power", value: 210}]);
            draw_billing_pie_chart('current_container', 'Current bill', [{ name: "Grid Power", value:90},{ name:"Solar Power", value: 110}]);
            draw_billing_pie_chart('items_container', 'Items', [{ name: "Heater", value:90},{ name:"Oven", value: 110}, { name:"Refrigerator", value: 110}]);
        },

		init: function() {
			console.log("init now page.");
			window.panel = 1;
            $('#sh-before').hide();
            $('#sh-now').show();
            $('#alert-status-card').show();
            $("#demo-welcome-message").html("This demo tells you what is <b>happening in your home right now.</b>");
			$.sh.now.update_portal();
			$.sh.now.register_actions();
            $.sh.now.update_billing();
            $(window).trigger('resize');
			// Expand all new MDL elements
      		//componentHandler.upgradeDom();
			now_timer = setInterval($.sh.now.update_portal, 3000);
            // update weather every 1 hour
            weather_timer = setInterval(updateWeather(), 3600*1000);
		}
	};

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


            // switch between the other tabs
            //$("a.mdl-tabs__tab").on("click", function(){
				//var tid = $(this).attr( "href" );
            //    //$(this).parent().siblings("div.mdl-tabs__panel").hide();
            //    //$("div" + tid).show();
            //    $("div" + tid).find("div[id*='container']").each(function () {
            //        if(tid.indexOf('#static') == 0)
            //            $(this).highcharts().reflow();
            //    });
            //});
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
    	loading: function () {
			var newmsg="<div style = 'text-align:center;'><img src='image/loading.gif' width='24px' height ='24px'/></div>";
			$("#container2").html(newmsg);
			$("#container3").html(newmsg);
			$("#container4").html(newmsg);
			$("#container5").html(newmsg);
    	},
    	sendrequest: function () {
			if(window.panel != 2) return;
            //var converted = moment.tz(moment(), timezone).format("YYYY-MM-DD");
            //console.log("timezone today: " + moment.tz(moment(), timezone).format());
			var full_format = "YYYY-MM-DD HH:mm:ss";
            // for the current day
            var utc_start_time = moment.tz(timezone).startOf('day').utc().format(full_format);;
            var utc_end_time = moment.tz(timezone).endOf('day').utc().format(full_format);;

            console.log("utc start and end: " + utc_start_time + " " + utc_end_time);
			window.socket.emit('my data', {data: "temperature", date: [utc_start_time, utc_end_time]});
			window.socket.emit('my data', {data: "gas", date: [utc_start_time, utc_end_time]});
			window.socket.emit('my data', {data: "illuminance", date: [utc_start_time, utc_end_time]});
			window.socket.emit('my data', {data: "buzzer", date: [utc_start_time, utc_end_time]});
    	},
    	socketinit: function () {
            var now = moment.utc();
            var hour = getHour(now, utc_offset);
            //var hour = moment(time).format();
            console.log('utc offset: ' + utc_offset + ' hour:' + hour);
			namespace = '/index'; // change to an empty string to use the global namespace
			var day = ['0', '1',
						'2', '3', '4',
						'5', '6','7',
						'8','9','10','11','12',
						'13','14',
						'15','16','17','18',
						'19','20','21','22','23'];
			// the socket.io documentation recommends sending an explicit package upon connection
			// this is specially important when using the global namespace
			if(window.socket != null)
			{
				$.sh.before.sendrequest();
				return;
			}

			window.socket = io.connect('http://' + document.domain + ':' + location.port + namespace);

			setInterval($.sh.before.sendrequest,3600000);

			// event handler for server sent data
			// the data is displayed in the "Received" section of the page
			socket.on('my response', function (msg) {
				//alert(msg.data);
			});
			// event handler for new connections
			socket.on('connect', function () {
				console.log("i'm connected!");
			});
			socket.on( 'my temperature', function (msg ) {
				console.log( "temperature");
				var temp_data = msg.data;
                console.log(temp_data);
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
                    console.log('index: ' + timezone.indexOf("US") + " tz: " + timezone);
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
                        console.log("is: " + is_Celsius + " c: " + parseFloat(temp_data[i][0].toFixed(2)) + " f:" + convertToF(parseFloat(temp_data[i][0]), 2));
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
				console.log("gas");
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
				console.log("buzzer");
				var num = msg.data;
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
				console.log("illuminance");
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

			$.sh.before.sendrequest();
    	},
		init: function() {
			console.log("init before page.");
            $("#demo-welcome-message").html("This demo tells you about your <b>home sensor history.</b>");
			window.panel = 2;
            $('#sh-before').show();
		    $('#sh-now').hide();
            $('#alert-status-card').hide();
			//window.trigger("resize");
			$.sh.before.register_actions();
			$.sh.before.loading();
            $.sh.before.update_billing("#tab1");
			$.sh.before.socketinit();
            $.sh.before.update_static_data();
		}
	};

	$("a:contains('NOW')").on('click', function() {
		clearInterval(time_timer);
        clearInterval(now_timer);
        clearInterval(weather_timer);
		//clearInterval(chart_timer);
		$.sh.now.init();
	});
	$("a:contains('BEFORE')").on('click', function() {
     	clearInterval(time_timer);
		clearInterval(now_timer);
        clearInterval(weather_timer);
		$.sh.before.init();
	});

    setInterval(function(){
        updateWelcomeCardsDateTime(utc_offset, timezone);
    }, 60 * 1000);


    $.sh.init();
    $.sh.now.init();
    updateWelcomeCardsDateTime(utc_offset, timezone);
});
