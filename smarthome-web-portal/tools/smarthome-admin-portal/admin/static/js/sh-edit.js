/**
 * events binding for info updates
 */
$(function() {
    $.sh ={
        init: function() {
            $('a.mdl-button').on('click', function() {
                var isEmpty = false;
                var isValid = true;
                var form = $(this).closest('form');
                if(form[0].checkValidity()) {
                    $("form :input").each(function(){
                        var input = $(this); // This is the jquery object of the input, do what you will
                        if($(this).text() == 'ADD') {
                            if (input.val().length == 0 && input.attr('name') != "phone") {
                                isEmpty = true;
                                createSnackbar(input.attr('name') + " cannot be empty.", "Dismiss");
                            }
                        }
                        if(input.parent().hasClass('is-invalid')){
                            isValid = false;
                        }
                    });
                }

                if(!isEmpty && isValid)
                    form.submit();
                return false;
            });

            $('input[name="password2"]').blur(function() {
                var pwd =  $('input[name="password"]').val();
                if(pwd.length !=0){
                    var confirmPwd = $(this).val();
                    if(pwd != confirmPwd) {
                        createSnackbar("Password does not match the confirm password.", "Dismiss");
                        $(this).parent().addClass('is-invalid');
                    }
                }
            });

            $('form[action="/create"] input').blur(function () {
              if ($(this).is(":empty")) {
                $(this).attr('required', true);
              }
            });

            $("#g_address").on('blur', function(){
                var address = $("#g_address").val();
                if(address.length > 0) {
                    var geocoder = new google.maps.Geocoder();

                    geocoder.geocode({'address': address}, function (results, status) {
                        //console.log(status);
                        if (status == 'OK') {
                            var location = results[0].geometry.location;
                            console.log(location.lat() + ', ' + location.lng());
                            $('#g_lat').val(location.lat());
                            $('#g_lon').val(location.lng());
                        }
                    });
                }
            });

            // disable copy paste and cut feature for the password field
            $('input[type="password"]').on("copy paste cut", function(e){
                e.preventDefault();
            });

            var lastVal;
            $("#u_name").focus(function () {
                 lastVal = $(this).val();

            });

            // check whether username exists
            $("#u_name").on('blur', function () {
                var name = $.trim($(this).val());
                if(name.length > 0 & lastVal != $(this).val()){
                    $.get("/user/" + name, function(data) {
                        if (!data.result) {
                            createSnackbar("The username " + name + " already exists.", "Dismiss");
                            $("#u_name").parent().addClass('is-invalid');
                        }
                        else{
                            $("#u_name")[0].setCustomValidity("");
                        }

                    });
                }
            });

            // check whether gateway name exists
            $("#g_name").on('blur', function () {
                var name = $.trim($(this).val());
                if(name.length > 0){
                    $.get("/gateway/" + name, function(data) {
                        if (!data.result) {
                            createSnackbar("The gateway name " + name + " already exists.", "Dismiss");
                            $("#g_name").parent().addClass('is-invalid');
                            // $("#g_name")[0].setCustomValidity("The gateway name \"" + name + "\" already exists.");
                        }
                        else{
                            $("#g_name")[0].setCustomValidity("");
                        }

                    });
                }
            });
        },
    }
    $.sh.init();
});