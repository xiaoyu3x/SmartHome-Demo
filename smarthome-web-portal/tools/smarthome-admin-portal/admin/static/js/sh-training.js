/**
 * events binding for info updates
 */
$(function(){

    function onSuccess(result){
        $("#model_list").empty()
		$('#div_img_training').empty()
		//$("#img_training").attr('src',""); 
        for(var i=0;i<result.length;i++)
        {
            var str_html = "<div class='package_container ml_10 mt_10'>"
            str_html += "<div class='package_title package_model_title'><p>"+result[i]["name"]+"</p></div>"
            str_html += "<div class='package_content'><p>"+result[i]["algorithm_type"]+"</p></div>"
            str_html += "<div class='package_bottom'><p>"+result[i]["created_at"]+"</p></div>"
            str_html += "<div class='package_delete'>x</div>"
            str_html += "</div>"
            $("#model_list").append(str_html)
        }
		
		if(result.length > 0){
			$("<img />", {
                src: "../images/model/" + result[0]["name"] + ".png",
            }).appendTo("#div_img_training");
			
		}
    }
	
	
	 function onSuccessCreate(result){
        $("#model_list").empty()
		$('#div_img_training').empty()
        for(var i=0;i<result.length;i++)
        {
            var str_html = "<div class='package_container ml_10 mt_10'>"
            str_html += "<div class='package_title package_model_title'><p>"+result[i]["name"]+"</p></div>"
            str_html += "<div class='package_content'><p>"+result[i]["algorithm_type"]+"</p></div>"
            str_html += "<div class='package_bottom'><p>"+result[i]["created_at"]+"</p></div>"
            str_html += "<div class='package_delete'>x</div>"
            str_html += "</div>"
            $("#model_list").append(str_html)		
        }
		$("<img />", {
            src: "../images/model/" + result[result.length-1]["name"] + ".png",
            }).appendTo("#div_img_training");
        //location.reload();
    }
	

    function onChooseSuccess(result){
        $("#dialog-training-list").empty()
          for(var i=0;i<result.length;i++)
          {
            var str_html = "<div class='package_container ml_10 mt_10'>"
            str_html += "<div class='package_title package_dataset_title'><p class='title_p'>"+result[i]["title"]+"</p></div>"
            str_html += "<div class='package_content'><p>"+result[i]["dataformat"]+"</p></div>"
            str_html += "<div class='package_bottom'><p>"+result[i]["uploadtime"]+"</p></div>"
            str_html += "</div>"
            $("#dialog-training-list").append(str_html)
          }
    }

    function onFailure(jqXHR, textStatus, errorThrown) {
        createSnackbar("Failure: " + errorThrown, "Dismiss");
    }

    var data={}
    data['file_name']='shanghai_2013.csv';
	data['title'] ='shanghai_2013';
    getRequest('/training','GET', data, onSuccess, onFailure);
    
    //----------create click-------------------------
    $("#Training_test").on('click', function(){
        
        var name = $("#model_name").val();
        var title = $("#dataset_title").val();
        var errMsg = "";

        $(".error").text(errMsg);
        if(name.length == 0) {
            errMsg = "Model name is required.";
        }
        else if (title.length == 0) {
            errMsg = "Dataset name is required."
        }
        else if($("#model_name").is(":invalid")){
            errMsg = "Model Name:allows alphabets, digits and dashes only. Start with alphabets.";
        }

        if(errMsg){
            $(".error").text(errMsg);
            return false;
        }
        
	    var data_model={}
         data_model['model_name']=$("#model_name").val()
         data_model['dataset_title']=$("#dataset_title").val()
         getRequest('/training/create','POST', data_model, onSuccessCreate, onFailure);
	
        if($("#div_img_training img").length > 0)	
		    $("##div_img_training img").attr('src',"../images/model/" + name + ".png");
        else{
            $("<img />", {
                src: "../images/model/" + name + ".png",
            }).appendTo("#div_img_training"); 
        }
		
        return true;
    });
	
	//-----------------------------------
	$("#choose_training, #dataset_title").on('click', function(){
	     $("#training_dialog").show()
		  var data={}
          data['file_name']='shanghai_2013.csv';
	      data['title'] ='shanghai_2013';
          getRequest('/dataset','GET', data, onChooseSuccess, onFailure);
      // 
	});// 
	 
	 
	$('#dialog-training-list').delegate(".package_container","click",function(){
		 var dataset_title = $(this).children('.package_title').children('p').html()
		 $("#dataset_title_training_dialog").val(dataset_title);
    });
	
	$('#OK_training_dialog').on("click",function(){
         var dataset_title = $("#dataset_title_training_dialog").val()
		 $("#dataset_title").val(dataset_title)
		 $("#training_dialog").hide()
		 
    });
	 
	 
	//-------------delete-----------------------
	$('#model_list').delegate(".package_delete","click",function(){
		delete_data={}
	    delete_data['model_name'] = $(this).siblings('.package_title').children('p').text();
        console.log(delete_data['model_name']);
        getRequest('/training/delete','PUT', delete_data, onSuccess, onFailure);
    });
	
	//------------ list -----------------------
	
	$('#model_list').delegate(".package_container","click",function(){
	    $('#div_img_training').empty()
        var model_name = $(this).children('.package_title').children('p').html()
		$("<img />", {
            src: "../images/model/" + model_name + ".png",
        }).appendTo("#div_img_training");
		//alert(model_name)
    });
	
});
