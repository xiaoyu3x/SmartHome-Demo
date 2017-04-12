/**
 * Common util methods
 */
var week = moment.weekdaysShort();
var month = ['4th', '8th', '12th', '16th', '20th', '24th', '28th'];
var month_str= moment.monthsShort();
var year = moment.monthsShort();

function isArray(obj){
    return !!obj && Array === obj.constructor;
}

//string format function
String.format = function() {
  var s = arguments[0];
  for (var i = 0; i < arguments.length - 1; i++) {
    var reg = new RegExp("\\{" + i + "\\}", "gm");
    s = s.replace(reg, arguments[i + 1]);
  }

  return s;
};

// Determine whether an array contains a value
if (![].includes) {
  Array.prototype.includes = function(searchElement /*, fromIndex*/ ) {
    'use strict';
    var O = Object(this);
    var len = parseInt(O.length) || 0;
    if (len === 0) {
      return false;
    }
    var n = parseInt(arguments[1]) || 0;
    var k;
    if (n >= 0) {
      k = n;
    } else {
      k = len + n;
      if (k < 0) {k = 0;}
    }
    var currentElement;
    while (k < len) {
      currentElement = O[k];
      if (searchElement === currentElement ||
         (searchElement !== searchElement && currentElement !== currentElement)) {
        return true;
      }
      k++;
    }
    return false;
  };
}

//dismiss remove mdl-card from page
dismiss = function(obj) {
	$(obj).closest('.mdl-cell').remove();
};

//get local time by the client's timezone
getLocalDate = function(dt, offset) {
    var utc = moment.utc(dt).clone();
    var local = utc.utcOffset(parseInt(offset) * 60);
    return local;
}


getTime = function(dt, offset, timezone) {
    var date = getLocalDate(dt, offset);
    if(timezone.indexOf("America") >= 0)
        return date.format('hh:mm:ss a');
    else
        return date.format('HH:mm:ss');
}

getHourMinute = function(dt, offset, timezone) {
    var date = getLocalDate(dt,offset);

    if(timezone.indexOf("America") >= 0)
        return date.format('hh:mm a');
    else
        return date.format('HH:mm');
}

getFormattedDateString = function(dt, offset){
    var date = getLocalDate(dt,offset);
    var weekday = date.format('dddd').toUpperCase();
    var month = date.format('MMMM').toUpperCase();
    var day = date.format('D');
    var year = date.format('YYYY');

    return weekday + " " + month + " " + day + ", " + year;
}

getHour = function(dt, offset) {
    var date = getLocalDate(dt,offset);
    return date.hour();
}

function showDialog(options) {
    options = $.extend({
        id: 'orrsDiag',
        title: null,
        text: null,
        content: null,
        negative: false,
        positive: false,
        cancelable: true,
        contentStyle: null,
        onLoaded: false,
        hideOther: true,
    }, options);

    if (options.hideOther) {
        // remove existing dialogs
        $('.dialog-container').remove();
        $(document).unbind("keyup.dialog");
    }

    // remove existing dialogs
    $('.dialog-container').remove();
    $(document).unbind("keyup.dialog");

    $('<div id="' + options.id + '" class="dialog-container"><div class="mdl-card mdl-shadow--4dp"></div></div>').appendTo("body");
    var dialog = $('#orrsDiag');
    var content = dialog.find('.mdl-card');
    if (options.contentStyle != null) content.css(options.contentStyle);
    if (options.title != null) {
        $('<div class="mdl-card__title" style="margin-left: 5%"><h5>' + options.title + '</h5></div>').appendTo(content);
    }
    if (options.text != null) {
        $('<p>' + options.text + '</p>').appendTo(content);
    }
    if (options.content != null) {
        $('<div class="mdl-card__supporting-text">' + options.content + '</div>').appendTo(content);
    }
    if (options.negative || options.positive) {
        var buttonBar = $('<div class="mdl-card__actions dialog-button-bar"></div>');
        if (options.negative) {
            options.negative = $.extend({
                id: 'negative',
                title: 'Cancel',
                onClick: function () {
                    return false;
                }
            }, options.negative);
            var negButton = $('<button class="mdl-button mdl-js-button mdl-js-ripple-effect" id="' + options.negative.id + '">' + options.negative.title + '</button>');
            negButton.click(function (e) {
                e.preventDefault();
                if (!options.negative.onClick(e))
                    hideDialog(dialog)
            });
            negButton.appendTo(buttonBar);
        }
        if (options.positive) {
            options.positive = $.extend({
                id: 'positive',
                title: 'OK',
                onClick: function () {
                    return false;
                }
            }, options.positive);
            var posButton = $('<button class="mdl-button mdl-button--colored mdl-js-button mdl-js-ripple-effect" id="' + options.positive.id + '">' + options.positive.title + '</button>');
            posButton.click(function (e) {
                e.preventDefault();
                if (!options.positive.onClick(e)) {
                    hideDialog(dialog);
                }
            });
            posButton.appendTo(buttonBar);
        }
        buttonBar.appendTo(content);
    }
    componentHandler.upgradeDom();
    if (options.cancelable) {
        dialog.click(function () {
            hideDialog(dialog);
        });
        $(document).bind("keyup.dialog", function (e) {
            if (e.which == 27)
                hideDialog(dialog);
        });
        content.click(function (e) {
            e.stopPropagation();
        });
    }
    setTimeout(function () {
        dialog.css({opacity: 1});
        if (options.onLoaded)
            options.onLoaded();
    }, 1);
}

function hideDialog(dialog) {
    $(document).unbind("keyup.dialog");
    dialog.css({opacity: 0});
    setTimeout(function () {
        dialog.remove();
    }, 400);
}

createSnackbar = (function() {
  // Any snackbar that is already shown
  var previous = null;

  return function(message, actionText, action) {
    if (previous) {
      previous.dismiss();
    }
    var snackbar = document.createElement('div');
    snackbar.className = 'paper-snackbar';
    snackbar.dismiss = function() {
      this.style.opacity = 0;
    };
    var text = document.createTextNode(message);
    snackbar.appendChild(text);
    if (actionText) {
      if (!action) {
        action = snackbar.dismiss.bind(snackbar);
      }
      var actionButton = document.createElement('button');
      actionButton.className = 'action';
      actionButton.innerHTML = actionText;
      actionButton.addEventListener('click', action);
      snackbar.appendChild(actionButton);
    }
    setTimeout(function() {
      if (previous === this) {
        previous.dismiss();
      }
    }.bind(snackbar), 5000);

    snackbar.addEventListener('transitionend', function(event, elapsed) {
      if (event.propertyName === 'opacity' && this.style.opacity == 0) {
        this.parentElement.removeChild(this);
        if (previous === this) {
          previous = null;
        }
      }
    }.bind(snackbar));

    previous = snackbar;
    document.body.appendChild(snackbar);
    // In order for the animations to trigger, I have to force the original style to be computed, and then change it.
    getComputedStyle(snackbar).bottom;
    snackbar.style.bottom = '0px';
    snackbar.style.opacity = 1;
    snackbar.style.zIndex = 999;
  };
})();

update_sensor_status = function(resource_id, value, target, onSuccess){
    if(target) target.data('lock', "1");
    $.ajax({
        type: "PUT",
        url: "/update_sensor",
        contentType: 'application/json',
        data: JSON.stringify({
            "resource_id": resource_id,
            "data": value
        }),
        success: function(data){
            if(target) target.data('lock', "0");
            onSuccess(data);
        }
        }).fail(function(jqXHR, textStatus, errorThrown){
            if(target) target.data('lock', "0");
            console.error("Failed to update status " + errorThrown);
            createSnackbar("Server error: " + errorThrown, 'Dismiss');
    });
};

toggle_status = function(resource_id, obj, title) {
    console.log("checked: " + obj.checked);
    var status = obj.checked;
    var status_str = status?'on':'off';
    // var uuid = obj.id;
    console.log('The ' + title + ' ' + resource_id + ' will be turned ' + status_str + '.');

    $.ajax({
        type: "PUT",
        url: "/update_sensor",
        contentType: 'application/json',
        data: JSON.stringify({
            "resource_id": resource_id,
            "data": {
                "value": status
            }
        }),
        success: function(data) {
            console.log(data);
            var ret = data.status;
            if(ret) {
                console.log(title + " status is updated.");
                createSnackbar(title + ' status is updated.', 'Dismiss');
            }
            else {
                console.error('failed');
                createSnackbar("Server is unavailable for the moment. Try again later.", 'Dismiss');
            }
        }
        }).done(function() {
            //console.log( "second success" );
        }).fail(function(jqXHR, textStatus, errorThrown){
            console.error("Failed to update status " + errorThrown);
            createSnackbar("Server error: " + errorThrown, 'Dismiss');
    });
    return false;
}

function convertToC(fTemp, frag_digit) {
	var fTempVal = parseFloat(fTemp);
	return ((fTempVal - 32) * (5 / 9)).toFixed(frag_digit);
};

function convertToF(cTemp, frag_digit) {
	var cTempVal = parseFloat(cTemp);
	var fTempVal = (cTempVal * (9 / 5)) + 32;
	//console.log(fTempVal);
	return fTempVal.toFixed(frag_digit);
}

function getDay(){
      //var year = ['January','February','March','April','May','June','July','August','September','October','November','December'];
      var today = new Date();
      var month =year[today.getMonth()];
      var date = today.getDate()+ " "+ month;
      return date;
}

function getWeek(){
      //var year = ['January','February','March','April','May','June','July','August','September','October','November','December'];
      var dd = new Date();
      dd.setDate(dd.getDate()-7);
      var m = dd.getMonth();
      var d = dd.getDate();
      return d+" "+year[m]+"-"+getDay();
}

function get_date_axis(today){
    // return the date range axis 3 days before and after today
    var list = new Array();
    for(var i=-3; i<4; i++){
      list.push(moment(today).add(i, 'd').format("MM/DD/YYYY"));
    }
    return list;
}

function getMonth(){
    //var year = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    var dd = new Date();
    dd.setMonth(dd.getMonth()-1);
    return year[dd.getMonth()]+" "+dd.getFullYear();
}

function getYear(){
    var dd = new Date();
    return (dd.getFullYear()-1);
}

function drawcontainer(div, xray, yray, description) {
    drawcontainerchart(div, xray, yray, description, '', 'Energy', 'KWH');
}

function drawcontainer2(div, xray, yray1,yray2, description) {
    drawcontainerchart2(div, xray, yray1,yray2, description, '', 'Actual Temperature','Temperature Forecast', 'F◦','#f60404');
}

function drawcontainer3(div, xray, yray1,yray2,yray3, description) {
    drawcontainerchart3(div, xray, yray1,yray2,yray3 ,description, '', 'Actual Usage','Historcal Predicted Usage','Predicted Usage', 'KWH','#fa08ec');
}

function drawcontainerchart(div,xray,yray,title,xtext,name,unit) {
    if(unit === undefined) { unit = ''; }
    var myChart = echarts.init(document.getElementById(div));
    var option = {
        title: {
            text: title,
            textStyle: {
                fontWeight: 'normal',
            },
            right: '25%',
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                lineStyle: {
                    color: '#fff',
                    opacity: 0,
                }
            },
            backgroundColor: '#fff',
            borderColor: '#20e7fe',
            borderWidth: 1,
            padding: 5,
            textStyle: {
                color: 'black',
                fontSize: 12,
            },
            formatter: "{b} <br/>{a} :  <b>{c} " + unit + "</b>",
        },
        xAxis: {
            scale: true,
            type: 'category',
            boundaryGap: false,
            data :xray,
            axisLine: {
                show: false,
            },
            axisTick: {
                show: false,
            }
        },
        yAxis: {
            scale: true,
            type: 'value',
            axisLine: {
                show: false,
            },
            axisLabel: {
                show: false,
            },
            axisTick: {
                show: false,
            },
            splitLine: {
                show: false
            }
        },
        series: [{
            name: name,
            type: 'line',
            data: yray,
            symbol: 'circle',
            symbolSize: 8,
            itemStyle: {
               normal:{
                   color: '#20e7fe',
               }
            },
            lineStyle: {
                normal: {
                    color: '#20e7fe',
                    width: 2
                }
            }
        }]
    };
    if(xtext)
    {
        option.xAxis.name = xtext;
        option.xAxis.nameLocation = 'middle';
        option.xAxis.nameGap = 35;
    }
    myChart.setOption(option);
    window.addEventListener('resize', function () {
        myChart.resize();
    });
}

function drawcontainerchart2(div,xray,yray1,yray2,title,xtext,name1,name2,unit,color_str) {
    if(unit === undefined) { unit = ''; }
    var myChart = echarts.init(document.getElementById(div));
    var option = {
        title: {
            text: '',
            textStyle: {
                fontWeight: 'normal',
            },
            left: '10%',
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                lineStyle: {
                    color: '#fff',
                    opacity: 0,
                }
            },
        },
		legend: {
		    //left:center,
			//orient: 'vertical',
            //x: 'right',
            data:[name1,name2]
         },
        xAxis: {
            scale: true,
            type: 'category',
            boundaryGap: false,
            data :xray,
            axisLine: {
                show: false,
            },
            axisTick: {
                show: false,
            }
        },
        yAxis: {
            scale: true,
            type: 'value',
            axisLine: {
                show: false,
            },
            axisLabel: {
                show: false,
            },
            axisTick: {
                show: false,
            },
            splitLine: {
                show: false
            }
        },
        series: [{
            name: name1,
            type: 'line',
            data: yray1,
            symbol: 'circle',
            symbolSize: 8,
            itemStyle: {
               normal:{
                   color: '#20e7fe',
               }
            },
            lineStyle: {
                normal: {
                    color: '#20e7fe',
                    width: 2
                }
            }
        },{
            name: name2,
            type: 'line',
            data: yray2,
            symbol: 'circle',
            symbolSize: 8,
            itemStyle: {
               normal:{
                   color: color_str,
               }
            },
            lineStyle: {
                normal: {
                    color: color_str,
                    width: 2
                }
            }
        }]
    };
    if(xtext)
    {
        option.xAxis.name = xtext;
        option.xAxis.nameLocation = 'middle';
        option.xAxis.nameGap = 35;
    }
    myChart.setOption(option);
    window.addEventListener('resize', function () {
        myChart.resize();
    });
}

function drawcontainerchart3(div,xray,yray1,yray2,yray3,title,xtext,name1,name2,name3,unit,color_str) {
    if(unit === undefined) { unit = ''; }
    var myChart = echarts.init(document.getElementById(div));
    var option = {
        title: {
            text: '',
            textStyle: {
                fontWeight: 'normal',
            },
            left: '10%',
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                lineStyle: {
                    color: '#fff',
                    opacity: 0,
                }
            },
        },
		legend: {
		    //right: 30,
			//orient: 'vertical',
            //x: 'right',
           data:[name1,name2,name3]
         },
        xAxis: {
            scale: true,
            type: 'category',
            boundaryGap: false,
            data :xray,
            axisLine: {
                show: false,
            },
            axisTick: {
                show: false,
            }
        },
        yAxis: {
            scale: true,
            type: 'value',
            axisLine: {
                show: false,
            },
            axisLabel: {
                show: false,
            },
            axisTick: {
                show: false,
            },
            splitLine: {
                show: false
            }
        },
        series: [{
            name: name1,
            type: 'line',
            data: yray1,
            symbol: 'circle',
            symbolSize: 8,
            itemStyle: {
               normal:{
                   color: '#20e7fe',
               }
            },
            lineStyle: {
                normal: {
                    color: '#20e7fe',
                    width: 2
                }
            }
        },{
            name: name2,
            type: 'line',
            data: yray2,
            symbol: 'circle',
            symbolSize: 8,
            itemStyle: {
               normal:{
                   color: '#EE2C2C',
               }
            },
            lineStyle: {
                normal: {
                    color: '#EE2C2C',
                    width: 2
                }
            }
        },{
            name: name3,
            type: 'line',
            data: yray3,
            symbol: 'circle',
            symbolSize: 8,
            itemStyle: {
               normal:{
                   color: '#EE30A7',
               }
			   
            },
            lineStyle: {
                normal: {
                    color: '#EE30A7',
                    width: 2,
					type:'dashed'
                }
            }
        }
		]
    };
    if(xtext)
    {
        option.xAxis.name = xtext;
        option.xAxis.nameLocation = 'middle';
        option.xAxis.nameGap = 35;
    }
    myChart.setOption(option);
    window.addEventListener('resize', function () {
        myChart.resize();
    });
}

draw_billing_pie_chart = function(container, title, data) {
    var myChart = echarts.init(document.getElementById(container));
    var option = {
        title: {
            text: title,
            textStyle: {
                fontWeight: 'normal',
                fontSize: 16,
            },
            x: 'center',
            y: 'top',
        },
        tooltip: {
            trigger: 'item',
            backgroundColor: '#3f4445',
            borderWidth: 0,
            padding: 10,
            textStyle: {
                fontSize: 12,
            },
            extraCssText: 'text-align: left;',
            formatter: "{b}<br/> {c} KWH, {d}%"
        },
        color: ['#20e7fe', '#20e886', '#feb557'],
        series: [{
            name: 'Usages',
            data: data,
            type:'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            animation: false,
            itemStyle: {
                emphasis: {
                    shadowBlur: 10,
                    shadowOffsetX: 10,
                    shadowColor: 'rgba(0, 0, 0, 0.5)',
                    hoverRadius: 50,
                }
            },
            label: {
                normal: {
                    show: false,
                    position: 'center'
                },
            },
            labelLine: {
                normal: {
                    show: false
                }
            },
            dataLabels: {
                enabled: false
            }
        }]
    };
    myChart.setOption(option);

    window.addEventListener('resize', function () {
        myChart.resize();
    });
}

var createCookie = function(name, value, days) {
    var expires;
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toGMTString();
    }
    else {
        expires = "";
    }
    document.cookie = name + "=" + value + expires + "; path=/";
}

function getCookie(c_name) {
    if (document.cookie.length > 0) {
        c_start = document.cookie.indexOf(c_name + "=");
        if (c_start != -1) {
            c_start = c_start + c_name.length + 1;
            c_end = document.cookie.indexOf(";", c_start);
            if (c_end == -1) {
                c_end = document.cookie.length;
            }
            return unescape(document.cookie.substring(c_start, c_end));
        }
    }
    return "";
}

var delete_cookie = function(name) {
    document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:01 GMT;';
};

updateWelcomeCardsDateTime  = function(utc_offset, timezone)
    {
        var utc_time = moment.utc();
        //console.log(utc_time.format());
        var datestr = getFormattedDateString(utc_time, utc_offset);
        var timestr = getHourMinute(utc_time, utc_offset,timezone);
        //console.log(datestr);

        $("div.demo-card-date").each(function(index){
            //console.log("Updating date area of welcome card");
            $(this).html("<h6>"+datestr+"</h6>");
        });
        $("div.demo-card-time").each(function(index){
            //console.log("Updating date area of welcome card");
            $(this).html("<h5>"+timestr+"</h5>");
        });
    };

// Returns a random integer between min (included) and max (excluded)
// Using Math.round() will give you a non-uniform distribution!
function getRandomPecentbyIndex(min, max, index, length) {
  return (((index + 1) / length * (max - min)) + min) * 0.01;
}

function convertToRgb(input) {
    // input: [255,255,255]
    // output: rgb(255, 255, 255)
    var color = JSON.parse(input);
    var output = "";
    if(color.constructor === Array && color.length == 3 ){
        output = "rgb(" + input.replace(/^\[+|]+$/g, '') + ")";
    }
    return output;
}

function convertToStr(input) {
    // output: [255,255,255] array
    // input: tinycolor object
    var output = new Array();
    if(input){
        output.push(Math.round(input._r));
        output.push(Math.round(input._g));
        output.push(Math.round(input._b));
    }
    return output;
}


function range(start, count) {
    // return an array with supplied bounds
    return Array.apply(0, Array(count))
    .map(function (element, index) {
      return index + start;
    });
}

function isJSON(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}


