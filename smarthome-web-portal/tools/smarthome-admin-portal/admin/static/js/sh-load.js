/**
 * events binding for info updates
 */
$(function(){
    //init
    function onFailure(jqXHR, textStatus, errorThrown) {
        if(jqXHR.status == 405) {
            createSnackbar("Session timeout, plz refresh the page and login again", "Dismiss");
            location.reload();
        }
        else
            createSnackbar(errorThrown + " : " + jqXHR.responseText, "Dismiss");
    }

    function onLoadFailure(jqXHR, textStatus, errorThrown) {
	    onFailure(jqXHR, textStatus, errorThrown);
	    $("#load_button").val("Load");
        $("#load_button").prop('disabled', false);
    }
    
    function onSuccess() {
        location.reload();
    }

    function onLoadSuccess() {
        $("#load_button").val("Load");
        $("#load_button").prop('disabled', false);
        createSnackbar("Weather Data is successfully loaded.", "Dismiss");
    }
    
    //----------bind click-------------------------
    $("button.bind").on("click", function(){
        var gw_id = $(this).parent().siblings(":first").text();
        var model_id = $(this).parent().siblings().eq(2).children('select').val();
        if(model_id === "0" ){
            createSnackbar("Error: plz choose a model name", "Dismiss");
            return;
        }
        var data = {
            "gateway_id": parseInt(gw_id),
            "model_id": parseInt(model_id)
        };
        getRequest('/gateway_model','POST', data, onSuccess, onFailure);
    });
    
    //----------unbind click-------------------------
    $("button.unbind").on("click", function(){
        var gw_id = $(this).parent().siblings(":first").text();
        var model_id = $(this).parent().siblings().eq(2).children('select').val();
        if(model_id === "0" ){
            createSnackbar("Error: the gateway is already unbound.", "Dismiss");
            return;
        }
        var data = {
            "gateway_id": parseInt(gw_id),
            "model_id": parseInt(model_id)
        };
        getRequest('/gateway_model','PUT', data, onSuccess, onFailure);
    });

    //----------load click-------------------------
    $("#load_button").on('click', function(){
        // var name = $("#model_name").val();
        var gw = $("#gateway").val();
        var errMsg = "";

        $(".error").text(errMsg);
        if (gw == "0") {
            errMsg = "Gateway name is required."
        }
        // else if(name.length == 0) {
        //     errMsg = "Model name is required.";
        // }

        if(errMsg){
            $(".error").text(errMsg);
            return false;
        }
	    var data={};
        // data['model_name']=name;
        data['gw_id']=parseInt(gw);
        data['geo']=$("#gateway").children("option:selected").data('geo').split(",");
        getRequest('/load','PUT', data, onLoadSuccess, onLoadFailure);
        $(this).val("Wait");
        $(this).prop('disabled', true);
	});//
});
