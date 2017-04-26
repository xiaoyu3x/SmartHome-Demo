/**
 * Events binds for listing data
 */
$(function() {
    $.sh ={
        init: function() {
            $('a[title="delete"]').off('click').on('click', function() {
                if (confirm('Are you sure to delete it ?')) {
                    $(this).closest('form').submit();
                }
                return false;
            });

            $('a:contains("DELETE")').on('click', function() {
                var searchIDs = $('table input:checked').map(function () {
                        return $(this).parents().eq(2).children().eq(1).text();
                });
                if(searchIDs.get().length > 0) {
                    if (confirm('Are you sure to delete the checked ones ?')) {
                            console.log(searchIDs.get().join());
                            //console.log($('#multi-delete').prop('name'));
                            $('#multi-delete').val(searchIDs.get().join());
                            $(this).closest('form').submit();
                    }
                }
            });

            //console.log($('.mdl-data-table').width());
            //console.log($('.mdl-card').width());
            //$('.mdl-card').width($('.mdl-data-table').width());
        },
    }
    $.sh.init();
});