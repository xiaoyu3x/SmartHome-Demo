/**
 * Scripts for the future page
 */
 
 $(function() {
    var temp_actual={}
	var temp_future ={}
	var power_predict_his ={}
    var power_actual={}
	var power_future={}
	
    $.sh.future = {
	     init: function() {
			console.log("init future page.");
			window.panel = 3;
            $('#sh-now').hide();
			$('#sh-before').hide();
            $('#sh-future').show();
            $('#alert-status-card').hide();
            $("#demo-welcome-message").html("This demo tells you the <b>prediction of home energy consumption.</b>");
            $.sh.future.update_billing();
			
			$.sh.future.update_static_data();
			$.sh.future.update_model_picture();
            if(timezone.indexOf('America') == 0 || timezone.indexOf('US') == 0) {
                $("#temperature_convert").html('F');
            }
            else { $("#temperature_convert").html('C'); }
		},
		update_billing:function(){
		    //--------------------------------------------------------------------------
			//var full_format = "YYYY-MM-DD HH:mm:ss";
            // for the current day
            //var utc_start_time = moment.tz(timezone).startOf('day').utc().format(full_format);;
            //var utc_end_time = moment.tz(timezone).endOf('day').utc().format(full_format); 
			//alert(utc_start_time)
			 
			 console.log("time zone is:" + timezone);
			 console.log("offset hour is:" + utc_offset);
			 
			 /*var local_date = new Date();
			 console.log("local_date:" + local_date.toLocaleDateString());
			 
			 var loca_date_from_utc_offset = getLocalDate(local_date,utc_offset)
			 console.log("local_date from utc offset:" + loca_date_from_utc_offset);
			 
			 var utc_time = moment.utc();
             console.log("moment.utc:"+utc_time.format());
			 
			 var utc_date = getUTCDate();
             console.log("moment.utc format:" + utc_date.toLocaleDateString());
			 
             var datestr = getFormattedDateString(utc_time, utc_offset);
			 console.log("moment.utc:"+datestr);
*/

			var now = moment.utc();
            var today = now.utcOffset(utc_offset * 60);
            var today1 = moment(today).add(1, 'd');
            var today2 = moment(today).add(2, 'd');
			//console.log(now);
            //console.log('utc offset: ' + utc_offset + ' hour:' + hour);
			//--------------------------------------------------------------------------
			
		    //date_today = addDayfromUTC(0);
			//var data_today_str = date_today.toLocaleDateString();
			
			//var date_1day = addDayfromUTC(1);
			//var data_1day_str = date_1day.toLocaleDateString();
			//var date_2day = addDayfromUTC(2);
			//var data_2day_str = date_2day.toLocaleDateString();
		    
            $("#billing_date_1").html(today.format("YYYY-MM-DD"));
            $("#billing_date_2").html(today1.format("YYYY-MM-DD"));
			$("#billing_date_3").html(today2.format("YYYY-MM-DD"));
		},
		update_static_data: function() {
		
		    date_today = addDayfromUTC(0);
			var data_today_str = date_today.toLocaleDateString();
			
			var utc_date = getUTCDate()
			utc_date_str = utc_date.toLocaleDateString()
            console.log("utc date format:" + utc_date_str);
			
			
		    var data_get_temp ={}
            //data_get_temp['region']='shanghai';
	        //data_get_temp['timeOrder'] ='week';
			//data_get_temp['today_date'] =data_today_str;//----------
			
	
		    getRequest('/temp_actual?region='+timezone+'&today_date='+utc_date_str+'','GET', data_get_temp, on_temp_actual, onFailure);
			getRequest('/temp_future?region='+timezone+'&today_date='+utc_date_str+'','GET', data_get_temp, on_temp_future, onFailure);
			getRequest('/power_actual?region='+timezone+'&today_date='+utc_date_str+'','GET', data_get_temp, on_power_actual, onFailure);
			getRequest('/power_predict_his?region='+timezone+'&today_date='+utc_date_str+'','GET', data_get_temp, on_power_predict_his, onFailure);
			getRequest('/power_future?region='+timezone+'&today_date='+utc_date_str+'','GET', data_get_temp, on_power_future, onFailure);
		    getRequest('/power_future?region='+timezone+'&today_date='+utc_date_str+'','GET', data_get_temp, onTempatureSuccess, onFailure);
			getRequest('/temp_today?region='+timezone+'&today_date='+utc_date_str+'','GET', data_get_temp, onTodayTempature, onFailure);
			
			drawcontainer2('container_temperature', getDate_future(utc_offset), temp_actual,temp_future, '');
		    drawcontainer3('container_power', getDate_future(utc_offset), power_actual,power_predict_his,power_future, '');
			
		},update_model_picture:function(){
		    //var model_name = "T1"
			//$("#img_gs").attr('src',"http://10.239.76.66:4000/images/model/shanghai_model.png"); 
			$("#img_gs").attr('src',"../image/model/linear_shanghai.png"); 
		}
	};
	
	function on_temp_actual(result){
	   temp_actual = get_temp_actual(result);
    }
	
	function on_temp_future(result){
		temp_future = get_temp_future(result);
    }
	
	function on_power_actual(result){
		power_actual = get_power_actual(result);
    }
	
	function on_power_predict_his(result){
		power_predict_his = get_power_predict_his(result);
    }
	
	function on_power_future(result){
		power_future = get_power_future(result);
    }
	
	function onTodayTempature(result){
	    $('#a_temp_today').html(result[0]['temperature']);
	}
	
	
	function get_temp_actual(result){
	    var list = new Array();
	    if(result.length > 0) {
            // console.log(result[0]['temperature']);
            for (var i = 0; i < 4; i++) {
            	if(typeof result[i] !== 'undefined')
                	list.push(result[i]["temperature"]);
            	else
            		list.push(null);
            }
            list[4] = null;
            list[5] = null;
            list[6] = null;
        }
		return list;
	}
	
	function get_temp_future(result){
	    var list = new Array();
	    if(result.length > 0) {
            console.log(result[0]['temperature'])
            list.push(null, null, null);
            for (var i = 0; i < 4; i++) {
            	if( typeof result[i] !== 'undefined')
                	list.push(result[i]['temperature']);
            	else
            		list.push(null);
            }
        }
		return list;
	}
	
	function get_power_actual(result){

	    var list = new Array();
	    if(result.length > 0) {
            console.log(result[0]['power']);
            for (var i = 0; i < 4; i++) {
                if(typeof result[i] !== 'undefined')
                    list.push(result[i]['power']);
                else
                    list.push(null);
            }
            list[4] = null;
            list[5] = null;
            list[6] = null;
        }
		return list;
	}
	
	function get_power_predict_his(result){
	    var list = new Array();
		if(result.length > 0) {
            console.log(result[0]['power']);
            for (var i = 0; i < 4; i++) {
                if(typeof result[i] !== 'undefined')
					list.push(result[i]['power']);
				else
					list.push(null);
            }
        }
		list[4]=null;
		list[5]=null;
		list[6]=null;
		return list;
	}
	
	function get_power_future(result){
	    var list = new Array();
	    if(result.length > 0) {
			console.log(result[0]['power']);
			list.push(null);
			list.push(null);
			list.push(null);
			for(var i=0;i<4;i++){
				if(typeof result[i] !== 'undefined')
					list.push(result[i]['power']);
				else
					list.push(null);
			}
	    }
		return list;
	}
	
	$("#img_gs").mousemove(function(){
	     $("#div_gs").attr("display", "block");
		 $("#div_gs").show();
	})
	$("#div_gs").mousemove(function(){
	     $("#div_gs").attr("display", "block");
		 $("#div_gs").show();
	})
	$("#div_gs").mouseout(function(){
	    $("#div_gs").attr("display", "none");
		$("#div_gs").hide();
	})
	$("#img_gs").mouseover(function(){
	     $("#div_gs").attr("display", "block");
		 $("#div_gs").show();
	})
	$("#img_gs").mouseout(function(){
	    $("#div_gs").attr("display", "none");
		$("#div_gs").hide();
	})
	
	$("a:contains('FUTURE')").on('click', function() {
     	clearInterval(window.time_timer);
		clearInterval(window.now_timer);
        clearInterval(window.weather_timer);
		
		$.sh.future.init();
	});
	
	
	$("#unit_price").blur(function(){
       //$(this).css("background-color","#FFFFCC");
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
	

	//------------------F to C--------------------------------
	$("#temperature_convert").on('click', function() {
	    var temp_unit = $("#temperature_convert").html();
	    if(temp_unit == "F")
		{
	
		    var tTemp = $('#a_temp_today').html()
		    var temp_convert = convertToC(parseInt(tTemp), 0)
			//alert(temp_convert)
		    $('#a_temp_today').html(temp_convert)
		    $("#temperature_convert").html("C")
			//---------------------------------
			//var temp_actual = [72, 71, 70, 61, null, null, null]
		
	
			date_today = addDayfromUTC(0);
			var data_today_str = date_today.toLocaleDateString();
		
			var utc_date = getUTCDate()
			utc_date_str = utc_date.toLocaleDateString()
            console.log("utc date format:" + utc_date_str);
			
			
		    var data_get_temp ={}
            //data_get_temp['region']='shanghai';
	        //data_get_temp['timeOrder'] ='week';
			//data_get_temp['today_date'] =utc_date_str;//----------
			
			getRequest('/temp_actual?region='+timezone+'&today_date='+utc_date_str+'','GET', data_get_temp, on_temp_actual, onFailure);
			getRequest('/temp_future?region='+timezone+'&today_date='+utc_date_str+'','GET', data_get_temp, on_temp_future, onFailure);
				
			var c_temp_actual = new Array();
			for(var i=0;i<temp_actual.length;i++){
              c_temp_actual.push(convertToC(parseInt(temp_actual[i]), 1))
            }
			console.log(c_temp_actual)
			console.log(temp_actual)
		
			var c_temp_future = new Array();	
            //var temp_future = [null, null, null, 61, 50, 46, 46]
			for(var i=0;i<temp_future.length;i++){
              c_temp_future.push(convertToC(parseInt(temp_future[i]), 1))
            }
			console.log(c_temp_future)
			console.log(temp_future)

			drawcontainer2('container_temperature', getDate_future(utc_offset), c_temp_actual,c_temp_future, '')
		}
		if(temp_unit == "C"){
		    
            var cTemp = $('#a_temp_today').html()
		    var temp_convert = convertToF(parseInt(cTemp), 0)
		    $('#a_temp_today').html(temp_convert)
		    $("#temperature_convert").html("F")     
			
			//-------------------------------------------
		
			//var temp_actual_a = [72, 71, 70, 61, null, null, null]
            //var temp_future_a = [null, null, null, 61, 50, 46, 46]
			drawcontainer2('container_temperature', getDate_future(utc_offset), f_temp_actual,f_temp_future, '')
			
        }
	})
	
	//--------------------------------------------------
	function onFailure(jqXHR, textStatus, errorThrown) {
        createSnackbar("Failure: " + errorThrown, "Dismiss");
    }
	
	function onTempatureSuccess(result){
		if(result.length > 0) {
            $("#daily_power_1").html(result[0]['power']);
            $("#daily_power_2").html(result[1]['power']);
            $("#daily_power_3").html(result[2]['power']);
        }
    }
	
	function addDay2(dayNumber, date) {
        date = date ? date : new Date();
        var ms = dayNumber * (1000 * 60 * 60 * 24)
        var newDate = new Date(date.getTime() + ms);
        return newDate;
    }
	
 });
