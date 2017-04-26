/**
 * events binding for info updates
 */
$(function(){
    //init
	function onFailure(jqXHR, textStatus, errorThrown) {
        createSnackbar("Failure: " + errorThrown, "Dismiss");
    }

    function onSuccess(result){
        $("#dialog-predict-list").empty()
        for(var i=0;i<result.length;i++)
        {
            var str_html = "<div class='package_container ml_10 mt_10'>"
            str_html += "<div class='package_title package_model_title'><p class='title_p'>"+result[i]["name"]+"</p></div>"
            str_html += "<div class='package_content'><p>"+result[i]["algorithm_type"]+"</p></div>"
            str_html += "<div class='package_bottom'><p>"+result[i]["created_at"]+"</p></div>"
            str_html += "<div style='display: none;' class='dataset' data-title='" + result[i]["dataset"]["title"] + "' data-format='" + result[i]["dataset"]["dataformat"] + "' data-time='" + result[i]["dataset"]["uploadtime"] + "'></div>"
            str_html += "</div>"
            $("#dialog-predict-list").append(str_html)
        }
    }

    function onPredictSuccess(result) {
        $("#p_predict_value").html(result);    
    }
    
	//----------select model-------------------------
	$("#choose, #model_name").on('click', function(){
	     $("#predict_dialog").show();
		  var data={};
          data['file_name']='shanghai_2013.csv';
	      data['title'] ='shanghai_2013';
        getRequest('/training','GET', data, onSuccess, onFailure);        
	});

	//---------------------------------------------
	
	$('#dialog-predict-list').delegate(".package_container","click",function(){
		 var model_name = $(this).children('.package_title').children('p').html()
		 $("#model_name_predict_dialog").val(model_name);
        $("#mdl-predict_lift").html("");
        $("#mdl-predict_right").html("");
        $("<img />", {
            src: "../images/model/" + model_name + ".png",
        }).appendTo("#mdl-predict_right");
        var dataset = $(this).children(".dataset");
        if(dataset.length == 1){
            var data = '<div class="package_container ml_10 mt_10">'
            data += '<div class="package_title package_dataset_title"><p>' + dataset.data('title') +'</p></div>'
            data += '<div class="package_content"><p>' + dataset.data('format') + '</p></div>'
            data += '<div class="package_bottom"><p>' + dataset.data('time') + '</p></div>'
            data += '</div>';
            $("#mdl-predict_lift").append(data);
        }
        $(this).clone().appendTo("#mdl-predict_lift");
    });
	
	$('#OK_predict_dialog').on("click",function(){
         var model_name = $("#model_name_predict_dialog").val()
		 $("#model_name").val(model_name)
        if(!model_name){
            $("#mdl-predict_lift").html("");
            $("#mdl-predict_right").html("");
        }
		 $("#predict_dialog").hide()
    });
	
    //----------create click-------------------------
    $("#predict_exec").on('click', function(){
        var name = $("#model_name").val();
        var temp = $("#input_value").val();
        var errMsg = "";

        $(".error").text(errMsg);
        if(name.length == 0) {
            errMsg = "Model name is required.";
        }
        else if (temp.length == 0) {
            errMsg = "Temperature is required."
        }
        else if($("#input_value").is(":invalid")){
            errMsg = "Invalid temperature value.";
        }
        else{
            var val = parseFloat(temp);
            if(val > 140 || val < -60)
                errMsg = "The temperature range should be between (-60, 140). ";
        }

        if(errMsg){
            $(".error").text(errMsg);
            return false;
        }
	    var data_predict={}
		 data_predict['model_name']=$("#model_name").val()
         data_predict['input_value']=parseFloat(temp);
        getRequest('/predict','PUT', data_predict, onPredictSuccess, onFailure);
	});//
});
