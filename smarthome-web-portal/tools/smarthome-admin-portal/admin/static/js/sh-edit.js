/**
 * events binding for info updates
 */
$(function() {
    $.sh ={
        init: function() {
            $('a.mdl-button').on('click', function() {
                var isEmpty = false;
                var form = $(this).closest('form');
                if(form[0].checkValidity()) {
                    if($(this).text() == 'ADD'){
                        $("form :input").each(function(){
                            var input = $(this); // This is the jquery object of the input, do what you will
                            if(input.val().length == 0 ) {
                                isEmpty = true;
                                return false;
                            }
                        });
                    }
                    if(!isEmpty)
                        form.submit();
                }
                return false;
            });

            $('form[action="/create"] input').blur(function () {
              if ($(this).is(":empty")) {
                $(this).attr('required', true);
              }
            });

            $("#g_address").on('blur', function(){
                var address = $("#g_address").val();
                var geocoder = new google.maps.Geocoder();

                geocoder.geocode( { 'address': address}, function(results, status) {
                    //console.log(status);
                    if(status == 'OK') {
                        var location = results[0].geometry.location;
                        console.log(location.lat() + ', ' + location.lng());
                        $('#g_lat').val(location.lat());
                        $('#g_lon').val(location.lng());
                    }
                });
            });
        },
    }
    $.sh.init();
});