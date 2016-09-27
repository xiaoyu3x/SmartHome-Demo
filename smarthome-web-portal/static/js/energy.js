/**
 * scripts for Energy page
 */
$(function() {
	// add up the fake array energy
	function sumEnergy(array) {
		var index = -1;
		var sumArray = new Array();
		array.forEach(function(arrayItem) {
			var sumData = 0;
			arrayItem.forEach(function(itemData) {
				sumData += itemData;
			});
			sumArray[++index] = sumData.toFixed(2);
		});
		return sumArray;
	}
	// fake data array or get billing array
	function getData(sumGrid, times) {
		var index = -1;
		var newArray = new Array();
		sumGrid.forEach(function(sumGridItem) {
			newArray[++index] = (sumGridItem * times).toFixed(2);
		});
		return newArray;
	}

	// Billing: today
	var todayGrid = new Array(
		5.11,
		5.19,
		5.09
	);
	var todayBilling = getData(todayGrid, 0.15);
	// fake: monthSumGrid item data multiply by 0.8
	var todaySumGrid = new Array(
		125.26,
		136.99,
		113.94
	);
	var todaySumBilling = getData(todaySumGrid, 0.15);
	// fake: todayGrid item data multiply by 0.4
	var todayHeaterGrid = getData(todayGrid, 0.4);

	// Billing: past week
	var weekSolar = new Array(
		[1.66, 1.68, 1.67, 1.69, 1.70, 1.67, 1.64],
		[1.69, 1.68, 1.68, 1.69, 1.70, 1.71, 1.69],
		[1.56, 1.58, 1.57, 1.59, 1.60, 1.67, 1.64]
	);
	var weekSumSolor = sumEnergy(weekSolar);
	var weekGrid = new Array(
		[4.47, 4.82, 5.17, 5.10, 5.21, 5.07, 5.12],
		[4.57, 4.82, 5.07, 5.10, 5.21, 5.17, 5.12],
		[4.37, 4.72, 5.17, 5.00, 5.11, 5.07, 5.12]
	);
	var weekSumGrid = sumEnergy(weekGrid);
	var weekBilling = getData(weekSumGrid, 0.15);

	// Billing: past month
	var monthSolar = new Array(
		[1.67, 1.66, 1.67, 1.65, 1.63, 1.62, 1.62],
		[1.68, 1.66, 1.67, 1.65, 1.63, 1.62, 1.61],
		[1.66, 1.65, 1.67, 1.64, 1.62, 1.60, 1.61]
	);
	var monthSumSolor = new Array(
		51.49,
		56.92,
		47.53
	);
	// monthGrid: only 7 samples data, each stands for almost 4 days average value
	var monthGrid = new Array(
		[4.80, 4.88, 4.82, 4.87, 4.92, 5.02, 4.97],
		[4.90, 4.88, 4.92, 4.87, 4.92, 4.95, 4.96],
		[4.70, 4.78, 4.82, 4.77, 4.82, 5.02, 4.97]
	);
	var monthSumGrid = new Array(
		156.58,
		171.24,
		142.43
	);
	var monthBilling = getData(monthSumGrid, 0.15);

	// Billing: past year
	var yearSolar = new Array(
		[50.96, 59.55, 83.12, 100.68, 117.62, 126.35, 126.64, 120.79, 106.03, 85.59, 62.14, 51.49],
		[51.96, 59.55, 84.12, 100.68, 118.62, 127.35, 126.64, 121.79, 106.03, 85.59, 63.14, 51.49],
		[49.96, 58.55, 83.12, 99.68, 117.62, 126.35, 125.64, 120.79, 105.03, 84.59, 62.14, 50.49]
	);
	var yearSumSolar = sumEnergy(yearSolar);
	var yearGrid = new Array(
		[183.31, 203.80, 129.27, 95.66, 71.80, 42.18, 67.60, 94.03, 68.33, 48.08, 102.22, 156.58],
		[193.31, 203.80, 139.27, 95.66, 71.80, 43.18, 68.60, 94.03, 68.33, 49.08, 112.22, 156.58],
		[173.31, 193.80, 129.27, 94.66, 70.80, 42.18, 67.60, 93.03, 67.33, 48.08, 102.22, 146.58]
	);
	var yearSumGrid = sumEnergy(yearGrid);
	var yearBilling = getData(yearSumGrid, 0.15);

	var timezone = null;
    var utc_offset = null;

	function getTimezone() {
        var tz = getCookie('timezone');
		console.log("The current timezone " + tz);
        var zones = moment.tz.names();
        if(zones.indexOf(tz) > 0) {
            console.log('get timezone in cookie: ' + tz);
            timezone = tz;
            utc_offset = moment.tz(timezone).utcOffset() / 60;
            return true;
        }
        else return false;
    };

	function multiplyArray(rand_percent, x) {
		    return parseFloat((x * rand_percent).toFixed(2));
	}

    $.energy = {};
	$.energy.house = {
		register_actions: function(){
			console.log('energy house: register_actions');
			// hide all the inactive tabs
			$("div.mdl-tabs__panel").not(".is-active").hide();

			// switch between the tabs
			$("a.mdl-tabs__tab").on("click", function(){
				var tid = $(this).attr( "href" );
                $(this).parent().siblings("div.mdl-tabs__panel").hide();
                $("div" + tid).show();
                $("div" + tid).find("div[id*='container']").each(function () {
                    if(tid.indexOf('#tab') == 0)
                        $.energy.house.update_billing(tid);
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
                    draw_billing_pie_chart(tab + '_today_container', 'Today\'s usage', [{name: "Grid Power",value: 90
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
		init: function(arrayIndex, len) {
			$.energy.house.register_actions();

            var rand_percent = 1;
			if(arrayIndex != 0)
				rand_percent = getRandomPecentbyIndex(80, 160, arrayIndex, len);

			arrayIndex = arrayIndex % 3;

            //console.log("length: " + len);
            //console.log("random percent: " + rand_percent);
			// update Billing card
			$('#todayChargeBilling_today > h1').html('$' + (todayBilling[arrayIndex] * rand_percent).toFixed(2));
			$('#todayChargeBilling_current > h1').html('$' + (todaySumBilling[arrayIndex]* rand_percent).toFixed(2));
			$('#weekChargeBilling_week > h1').html('$' + (weekBilling[arrayIndex] * rand_percent).toFixed(2));
			$('#monthChargeBilling_week > h1').html('$' + (monthBilling[arrayIndex] * rand_percent).toFixed(2));
			$('#weekChargeBilling_month > h1').html('$' + (weekBilling[arrayIndex] * rand_percent).toFixed(2));
			$('#monthChargeBilling_month > h1').html('$' + (monthBilling[arrayIndex] * rand_percent).toFixed(2));
			$('#weekChargeBilling_year > h1').html('$' + (weekBilling[arrayIndex] * rand_percent).toFixed(2));
			$('#monthChargeBilling_year > h1').html('$' + (monthBilling[arrayIndex] * rand_percent).toFixed(2));
			$('#yearChargeBilling_year > h1').html('$' + (yearBilling[arrayIndex] * rand_percent).toFixed(2));

			$('#todayEnergyBilling_today > h6').html((todayGrid[arrayIndex] * rand_percent).toFixed(2) + 'KWH');
			$('#todayEnergyBilling_current > h6').html((todaySumGrid[arrayIndex] * rand_percent).toFixed(2) + 'KWH');
			$('#todayEnergyBilling_heater > h6').html((todayHeaterGrid[arrayIndex] * rand_percent).toFixed(2) + 'KWH');
			$('#weekEnergyBilling_week > h6').html((weekSumGrid[arrayIndex] * rand_percent).toFixed(2) + 'KWH');
			$('#monthEnergyBilling_week > h6').html((monthSumGrid[arrayIndex] * rand_percent).toFixed(2) + 'KWH');
			$('#yearEnergyBilling_week > h6').html((weekSumGrid[arrayIndex] * rand_percent * 0.4).toFixed(2) + 'KWH');
			$('#weekEnergyBilling_month > h6').html((weekSumGrid[arrayIndex] * rand_percent).toFixed(2) + 'KWH');
			$('#monthEnergyBilling_month > h6').html((monthSumGrid[arrayIndex] * rand_percent).toFixed(2) + 'KWH');
			$('#yearEnergyBilling_month > h6').html((monthSumGrid[arrayIndex] * rand_percent * 0.4).toFixed(2) + 'KWH');
			$('#weekEnergyBilling_year > h6').html((weekSumGrid[arrayIndex] * rand_percent).toFixed(2) + 'KWH');
			$('#monthEnergyBilling_year > h6').html((monthSumGrid[arrayIndex] * rand_percent).toFixed(2) + 'KWH');
			$('#yearEnergyBilling_year > h6').html((yearSumGrid[arrayIndex] * rand_percent).toFixed(2) + 'KWH');

		  // update Solar card
		  drawcontainer('container', week, weekSolar[arrayIndex].map(multiplyArray.bind(null, rand_percent)), getWeek());
		  $('#weekSumSolar > h1').html((weekSumSolor[arrayIndex] * rand_percent).toFixed(2));
		  drawcontainer('container_a', month, monthSolar[arrayIndex].map(multiplyArray.bind(null, rand_percent)), getMonth());
		  $('#monthSumSolar > h1').html((monthSumSolor[arrayIndex] * rand_percent).toFixed(2));
		  drawcontainer('container_b', year, yearSolar[arrayIndex].map(multiplyArray.bind(null, rand_percent)), getYear());
		  $('#yearSumSolar > h1').html((yearSumSolar[arrayIndex] * rand_percent).toFixed(2));

		  // update Grid card
          drawcontainer('container1', week, weekGrid[arrayIndex].map(multiplyArray.bind(null, rand_percent)), getWeek());
		  $('#weekSumGrid > h1').html((weekSumGrid[arrayIndex] * rand_percent).toFixed(2));
		  drawcontainer('container1_a', month, monthGrid[arrayIndex].map(multiplyArray.bind(null, rand_percent)), getMonth());
		  $('#monthSumGrid > h1').html((monthSumGrid[arrayIndex] * rand_percent).toFixed(2));
		  drawcontainer('container1_b', year, yearGrid[arrayIndex].map(multiplyArray.bind(null, rand_percent)), getYear());
		  $('#yearSumGrid > h1').html((yearSumGrid[arrayIndex] * rand_percent).toFixed(2));
            $.energy.house.update_billing("#tab1");
		}
	}

	if(getTimezone()) {
		setInterval(function () {
            console.log("Updating datetime for welcome cards");
			updateWelcomeCardsDateTime(utc_offset);
		}, 60 * 1000);
		updateWelcomeCardsDateTime(utc_offset, timezone);
	}
	$.energy.house.init(0, 0);

});
