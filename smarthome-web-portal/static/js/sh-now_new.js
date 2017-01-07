/**
 * Scripts for the Now
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
    alert_card_number = 0;

	var now_timer;
	var time_timer;
    var weather_timer;

    timezone = null;
    utc_offset = null;

    // the token dict to store the last alert time for motion, gas, buzz and button sensors
    var alert_token = {};
	
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
		update_car_alert: function(data, show_uuid) {
            var uuid_txt = "";
            var time = "";
            if(data.value.length == 0 ) return;
            time = getTime(data.value, utc_offset, timezone);
            if(show_uuid)
                uuid_txt = 'UUID: ' + data.uuid;

			if($("#" + data.uuid).length > 0){
				//find the car card and update time
                if(time) {
                    var txt = $("#" + data.uuid + " > .mdl-card__supporting-text > .section__circle-container > h4:contains('Charge')");
                    txt.text("Charge car in time for tomorrow " + time);
                }
                var uid = $("#" + data.uuid + " > .mdl-card__subtitle-text");
                uid.text(uuid_txt);
			}
			else {
					$("#alert-container").append(String.format('<div id="{0}" class="demo-card-event mdl-card mdl-cell mdl-cell--3-col mdl-shadow--2dp">\
				  <div class="mdl-card__title mdl-card--expand">\
					<h6>ELECTRIC CAR</h6>\
				  </div>\
				  <span class="mdl-card__subtitle-text" style="font-size: 70%">{1}</span>\
				  <div class="mdl-card__supporting-text mdl-grid mdl-grid--no-spacing">\
					<div class="section__circle-container mdl-cell mdl-cell--8-col">\
						<h4>Charge car in time for tomorrow {2}</h4>\
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
				</div>', data.uuid, uuid_txt, time));
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
		update_motion_alert: function(data, show_uuid){
            var uuid_txt = "";
            var time = "";
            if(data.value.length == 0 ) return;
            time = getTime(data.value, utc_offset, timezone);
            if(show_uuid)
                uuid_txt = 'UUID: ' + data.uuid;

			if($("#" + data.uuid).length > 0){
				//find the motion card and update time
                if(time) {
                    var txt = $("#" + data.uuid + " > .mdl-card__supporting-text > .section__circle-container > h4:contains('Someone')");
                    txt.text("Someone is at the front door " + time);
                }
                var uid = $("#" + data.uuid + " > .mdl-card__subtitle-text");
                uid.text(uuid_txt);
			}
			else {
					$("#alert-container").append(String.format('<div id ="{0}" class="demo-card-event mdl-card mdl-cell mdl-cell--3-col mdl-shadow--2dp">\
				  <div class="mdl-card__title mdl-card--expand">\
					<h6>MOTION SENSOR</h6>\
				  </div>\
				  <span class="mdl-card__subtitle-text" style="font-size: 70%">{1}</span>\
				  <div class="mdl-card__supporting-text mdl-grid mdl-grid--no-spacing">\
					<div class="section__circle-container mdl-cell mdl-cell--8-col">\
						<h4>Someone is at the front door {2}</h4>\
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
				</div>', data.uuid, uuid_txt, time));
                alert_card_number++;
			}
		},
		update_gas_alert: function(data, show_uuid){
		    var uuid_txt = "";
            var time = "";

            if(data.value.length == 0 ) return;
            time = getTime(data.value, utc_offset, timezone);
            if(show_uuid)
                uuid_txt = 'UUID: ' + data.uuid;

			if($("#" + data.uuid).length > 0){
				//find the gas card and update time
                if(time) {
                    var txt = $("#" + data.uuid + " > .mdl-card__supporting-text > .section__circle-container > h4:contains('Gas')");
                    txt.text("Gas detected in kitchen area " + time);
                }
                var uid = $("#" + data.uuid + " > .mdl-card__subtitle-text");
                uid.text(uuid_txt);
			}
			else {
				$("#alert-container").append(String.format('<div id="{0}" class="demo-card-event mdl-card mdl-cell mdl-cell--3-col mdl-shadow--2dp" style="background: #ed0042;">\
				  <div class="mdl-card__title mdl-card--expand">\
					<h6 style="color: #fff;">CO2 SENSOR</h6>\
				  </div>\
				  <span class="mdl-card__subtitle-text" style="font-size: 70%; color: #fff;">{1}</span>\
				  <div class="mdl-card__supporting-text mdl-grid mdl-grid--no-spacing">\
					<div class="section__circle-container mdl-cell mdl-cell--8-col">\
						<h4 style="color: #fff;">Gas detected in kitchen area {2}</h4>\
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
				</div>', data.uuid, uuid_txt, time));
                alert_card_number++;
			}
		},
		update_buzzer_alert: function(data, show_uuid) {
		    var uuid_txt = "";
            var time = "";

            if(data.value.length == 0 ) return;
            time = getTime(data.value, utc_offset, timezone);

            if(show_uuid)
                uuid_txt = 'UUID: ' + data.uuid;

			if($("#" + data.uuid).length > 0) {
                //find the buzzer card and update time
                if(time) {
                    var txt = $("#" + data.uuid + " > .mdl-card__supporting-text > .section__circle-container > h1");
                    txt.text(time);
                }
                var uid = $("#" + data.uuid + " > .mdl-card__subtitle-text");
                uid.text(uuid_txt);
            }
			else {
				$("#alert-container").append(String.format('<div id="{0}" class="demo-card-event mdl-card mdl-cell mdl-cell--3-col mdl-shadow--2dp">\
				  <div class="mdl-card__title mdl-card--expand">\
					<h6>BUZZER</h6>\
				  </div>\
				  <span class="mdl-card__subtitle-text" style="font-size: 70%">{1}</span>\
				  <div class="mdl-card__supporting-text mdl-grid mdl-grid--no-spacing">\
					<div class="section__circle-container mdl-cell mdl-cell--8-col">\
						<h1>{2}</h1>\
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
				</div>', data.uuid, uuid_txt, time));
                alert_card_number++;
			}
		},
		update_status: function(type, data, show_uuid) {
			var color = "gray";
            var uuid_cell = "";
			if (data.value)
				color = "green";

            if(show_uuid)
                uuid_cell = '<div class="mdl-cell mdl-cell--10-col" style="font-size: 0.6vw; color: grey;" >UUID: ' + data.uuid + '</div>';

			$("#status-container").append(String.format('<div class="status-card mdl-card mdl-cell mdl-shadow--2dp mdl-cell--12-col">\
				  <div class="mdl-card__supporting-text mdl-grid mdl-grid--no-spacing">\
						<div class="mdl-cell mdl-cell--2-col" style="text-align: left">\
							<h6>{0}</h6>\
						</div>\
						{1}\
					  <div class="mdl-card__menu">\
						  <i class="material-icons {2}">done</i>\
					  </div>\
				  </div>\
				</div>', type, uuid_cell, color))
		},
		update_fan_status: function(data, show_uuid) {
			var is_checked = "";
            var uuid_cell = "";
			if(data.value)
				is_checked = "checked";

            if(show_uuid)
                uuid_cell = '<div class="mdl-cell mdl-cell--10-col" style="font-size: 0.6vw; color: grey;" >UUID: ' + data.uuid + '</div>';

			$("#status-container").append(String.format('<div class="status-card mdl-card mdl-cell mdl-shadow--2dp mdl-cell--12-col">\
				  <div class="mdl-card__supporting-text mdl-grid mdl-grid--no-spacing">\
						<div class="mdl-cell mdl-cell--2-col" style="text-align: left">\
							<h6>FAN</h6>\
						</div>\
						{0}\
					  <div class="mdl-card__menu">\
						  <label title="switch on/off" class="mdl-switch mdl-js-switch mdl-js-ripple-effect" for="{2}">\
      						<input type="checkbox" id="{2}" class="mdl-switch__input" {1} onclick="return toggle_status(\'fan\', this);">\
      						<span class="mdl-switch__label"></span>\
    					  </label>\
					  </div>\
				  </div>\
				</div>', uuid_cell, is_checked, data.uuid));
            // Expand all new MDL elements
            componentHandler.upgradeDom();
		},
		update_rgb_status: function(data, show_uuid) {
			var bgcolor = "bg-blue";
            var uuid_cell = "";
			if(data.value)
				bgcolor = "bg-red";

            if(show_uuid)
                uuid_cell = '<div class="mdl-cell mdl-cell--9-col" style="font-size: 0.6vw; color: grey;" >UUID: ' + data.uuid + '</div>';

			$("#status-container").append(String.format('<div class="status-card mdl-card mdl-cell mdl-shadow--2dp mdl-cell--12-col">\
			  <div class="mdl-card__supporting-text mdl-grid mdl-grid--no-spacing">\
					<div class="mdl-cell mdl-cell--3-col" style="text-align: left">\
						<h6>RGB LED</h6>\
					</div>\
					{1}\
				  <div class="mdl-card__menu">\
					  <i class="material-icons {0}">lightbulb_outline</i>\
				  </div>\
			  </div>\
			</div>', bgcolor, uuid_cell))

		},
        update_sensor_data_without_unit: function(title, value) {
		    this.update_data(title, value, '');
        },
        update_multiply_sensors_without_unit: function(title, value, uuid) {
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
                        <div class="mdl-cell" style="text-align:left; width: auto;">\
                            <h1 style="font-size: 3.8vw;">{2}</h1>\
                        </div>\
                        <div class="mdl-cell" style="display: flex; align-items: center;">\
								<h6 style="font-size: 0.8vw;">{3}</h6>\
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
                    "token": JSON.stringify(alert_token),
                },
                success: function(data){
                    console.log(data);
                    var sensors = data.data;
                    $.sh.now.clear_data();
                    $.each(sensors['alert'], function (key, value_list) {
                        switch (key) {
                            case 'buzzer':
                                value_list.forEach(function(data) {
                                    var show_uuid = false;
                                    if(value_list.length > 1)
                                        show_uuid = true;
                                    $.sh.now.update_buzzer_alert(data, show_uuid);
                                    alert_token[data.uuid] = data.value;
                                });
                                break;
                            case 'motion':
                                value_list.forEach(function(data) {
                                    var show_uuid = false;
                                    if(value_list.length > 1)
                                        show_uuid = true;
                                    $.sh.now.update_motion_alert(data, show_uuid);
                                    alert_token[data.uuid] = data.value;
                                });
                                break;
                            case 'gas':
                                value_list.forEach(function(data) {
                                    var show_uuid = false;
                                    if(value_list.length > 1)
                                        show_uuid = true;
                                    $.sh.now.update_gas_alert(data, show_uuid);
                                    alert_token[data.uuid] = data.value;
                                });
                                break;
							case 'button':
                                value_list.forEach(function(data) {
                                    var show_uuid = false;
                                    if(value_list.length > 1)
                                        show_uuid = true;
                                    $.sh.now.update_car_alert(data, show_uuid);
                                    alert_token[data.uuid] = data.value;
                                });
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
                    $.each(sensors['status'], function (key, value_list) {
                        switch (key) {
                            case 'fan':
                                value_list.forEach(function(data) {
                                    var show_uuid = false;
                                    if(value_list.length > 1)
                                        show_uuid = true;
                                    $.sh.now.update_fan_status(data, show_uuid);
                                });
                                break;
                            case 'led':
                                value_list.forEach(function(data) {
                                    var show_uuid = false;
                                    if(value_list.length > 1)
                                        show_uuid = true;
                                    $.sh.now.update_status('LED', data, show_uuid);
                                });
                                break;
                            case 'rgbled':
                                value_list.forEach(function(data) {
                                    var show_uuid = false;
                                    if(value_list.length > 1)
                                        show_uuid = true;
                                    $.sh.now.update_rgb_status(data, show_uuid);
                                });
                                break;
                            default:
                                console.error("Unknown status sensor type: " + key);
                        }
                    });
                    $.each(sensors['data'], function (key, value_list) {
                        switch (key) {
                            case 'temperature':
                                value_list.forEach(function(data){
                                    var house_temp = $.sh.now.get_temperature_in_timezone(data.value);
                                    if(value_list.length > 1)
								        $.sh.now.update_multiply_sensors_without_unit('TEMPERATURE', house_temp, data.uuid);
                                    else
                                        $.sh.now.update_sensor_data_without_unit('TEMPERATURE', house_temp);
                                });
                                break;
                            case 'solar':
                                value_list.forEach(function(data){
                                    if(value_list.length > 1)
								        $.sh.now.update_data('SOLAR PANEL TILT', data.value, '%', data.uuid);
                                    else
                                        $.sh.now.update_sensor_data('SOLAR PANEL TILT', data.value, '%');
                                });
                                break;
                            case 'illuminance':
                                value_list.forEach(function(data){
                                    if (value_list.length > 1)
                                        $.sh.now.update_data('AMBIENT LIGHT', data.value, 'lm', data.uuid);
                                    else
                                        $.sh.now.update_sensor_data('AMBIENT LIGHT', data.value, 'lm');
                                });
                                break;
                            case 'power':
                                value_list.forEach(function(data){
                                    if (value_list.length > 1)
                                        $.sh.now.update_data('CURRENT ENERGY CONSUMPTION', data.value/1000, 'Watt', data.uuid);
                                    else
                                        $.sh.now.update_sensor_data('CURRENT ENERGY CONSUMPTION', data.value/1000, 'Watt');
                                });
                                break;
                            case 'humidity':
                                value_list.forEach(function(data){
                                    if (value_list.length > 1)
                                        $.sh.now.update_multiply_sensors_without_unit('HUMIDITY', data.value, '%', data.uuid);
                                    else
                                        $.sh.now.update_sensor_data_without_unit('HUMIDITY', data.value + '%');
                                });
                                break;
                            case 'pressure':
                                value_list.forEach(function(data){
                                    if (value_list.length > 1)
                                        $.sh.now.update_data('PRESSURE', data.value, 'hPa', data.uuid);
                                    else
                                        $.sh.now.update_sensor_data('PRESSURE', data.value, 'hPa');
                                });
                                break;
                            case 'uv_index':
                                value_list.forEach(function(data){
                                    if (value_list.length > 1)
                                        $.sh.now.update_multiply_sensors_without_unit('UV INDEX', data.value, data.uuid);
                                    else
                                        $.sh.now.update_sensor_data_without_unit('UV INDEX', data.value);
                                });
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
			$('#sh-future').hide();
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
	
	$("a:contains('NOW')").on('click', function() {
		clearInterval(time_timer);
        clearInterval(now_timer);
        clearInterval(weather_timer);
		//clearInterval(chart_timer);
		$.sh.now.init();
	});
	
	setInterval(function(){
        updateWelcomeCardsDateTime(utc_offset, timezone);
    }, 60 * 1000);
	
	 $.sh.init();
    $.sh.now.init();
    updateWelcomeCardsDateTime(utc_offset, timezone);
});
	
	