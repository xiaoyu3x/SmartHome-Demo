/**
 * events binding for info updates
 */
$(function() {
    $("input[name=title]").on("invalid", function () {
        this.setCustomValidity("Title: allows alphabets, digits and dashes only. Start with alphabets. 30 characters at maximal.");
    });

    $("input[name=title]").on("input", function () {
        this.setCustomValidity("");
    });

    function onSuccess(result){
        $("#dataset_list").empty()
        for(var i=0;i<result.length;i++)
        {
            var str_html = "<div class='package_container ml_10 mt_10'>"
            str_html += "<div class='package_title package_dataset_title'><p>"+result[i]["title"]+"</p></div>"
            str_html += "<div class='package_content'><p>"+result[i]["dataformat"]+"</p></div>"
            str_html += "<div class='package_bottom'><p>"+result[i]["uploadtime"]+"</p></div>"
            str_html += "<div class='package_delete'>x</div>"
            str_html += "</div>"
            $("#dataset_list").append(str_html)
        } 
    }
    
    function onFailure(jqXHR, textStatus, errorThrown) {
        createSnackbar("Failure: " + errorThrown, "Dismiss");
    }

    var data={}
    data['file_name']='shanghai_2013.csv';
	data['title'] ='shanghai_2013';
    getRequest('/dataset','GET', data, onSuccess, onFailure);
    
	//-------------delete-----------------------
	$('#dataset_list').on("click", ".package_delete", function(){
		delete_data={}
	    delete_data['title'] = $(this).siblings('.package_title').children('p').text();
        console.log(delete_data['title']);
        getRequest('/dataset/delete','POST', delete_data, onSuccess, onFailure);
    });
});
