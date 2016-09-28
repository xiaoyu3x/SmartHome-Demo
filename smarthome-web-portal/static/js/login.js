/**
 * Script for Login page
 */
$(function() {
        $("button").on("click", function() {
                var form = $(this).closest('form');
                if(form[0].checkValidity()) {
                    form.find('input').each(function(i) {
                        if($(this).val().length == 0 ) {
                            //$('#warn').html('Plz provide username nad password.');
                            return false;
                        }
                    });
                }
                return true;
        });

        $('form[action="/authenticate"] input').blur(function () {
            if ($(this).is(":empty")) {
                $(this).attr('required', true);
            }
        });
});
