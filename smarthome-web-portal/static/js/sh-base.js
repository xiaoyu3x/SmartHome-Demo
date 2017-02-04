/**
 * Scripts for the SH base page.
 */
$(function() {
    // var timezone = null;
    // var utc_offset = null;

    $.sh = {
        init: function() {
            //set initial timezone to Cookie
            console.log("load timezone...");
            if (!getTimezone()) {
                setTimezone(moment.tz.guess());
                console.log('set timezone in cookie: ' + getCookie('timezone'));
            }
            makeTimezoneSelect();

            $("#inst").on('click mouseover', function() {
                $.getJSON('/cf_instance', function(data) {
                        if (data.error != null) {
                            console.error('Cannot get the cf instance info.');
                        } else {
                            var inst = data.cf_instance;
                            if($.isEmptyObject(inst))
                                $("#instance_info").html('n/a');
                            else
                            {
                                var info = String.format('<div>Name <span>{0}</span></div><div style="word-break:break-all;">URL <a>{1}</a></div> \
                                    <table><tbody> \
                                    <tr><td>Instance ID</td><td style="word-break:break-all; width: 145px">{2}</td></tr> \
                                    <tr><td>Version</td><td>{3}</td></tr> \
                                    <tr><td>Index</td><td>{4}</td></tr> \
                                    <tr><td>Instance running</td><td>{5}</td></tr> \
                                    </tbody></table>', inst.name, inst.uris[0], inst.instance_id, inst.version, inst.Instance, inst.Total);
                                $("#instance_info").html(info);
                            }
                            $("#instance_info").show();

                            // to fix the wrong margin offset for the first time issue
                            var left_offset = $("#instance_info").css('margin-left');
                            if(left_offset == "0px") {
                                var tip = $("#instance_info");
                                $("#instance_info").css('margin-left', -1 * tip.width() + 'px');
                            }
                        }
                });
            });
        },

        make_socket_connection: function(callback) {
            namespace = '/index'; // change to an empty string to use the global namespace

            // the socket.io documentation recommends sending an explicit package upon connection
            // this is specially important when using the global namespace
            if (window.socket != null) {
                if(socket.connected) {
                    callback();
                    return;
                }
                else{
                    // delete socket obj if it is not connected
                    delete window.socket;
                }
            }

            window.socket = io.connect('http://' + document.domain + ':' + location.port + namespace, {
                'reconnection': true,
                'reconnectionDelay': 1000,
                'reconnectionDelayMax': 5000,
                'reconnectionAttempts': 3
            });

            callback();
        }
    };

    function getTimezone() {
        var tz = getCookie('timezone');
        var zones = moment.tz.names();
        if(zones.indexOf(tz) > 0) {
            console.log('get timezone in cookie: ' + tz);
            window.timezone = tz;
            window.utc_offset = moment.tz(window.timezone).utcOffset() / 60;
            return true;
        }
        else return false;
    };

    function setTimezone(tz) {
        window.timezone = tz;
        createCookie('timezone', tz, 5);
        window.utc_offset = moment.tz(tz).utcOffset()/60;
        console.log('current offset: ' + window.utc_offset);
    };

    function makeTimezoneSelect() {
        // reduce the timezone list size to 220.
        var cities = Object.keys(moment.tz._zones)
            .map(function(k) { if(typeof moment.tz._zones[k] === 'string') return moment.tz._zones[k].split('|')[0]; else return moment.tz._zones[k].name;})
            .filter(function(z) { return z.indexOf('/') >= 0; });

        var ordered_cities = [];
        var i = 0 ;
        for(var key in cities) {
            ordered_cities.push({
              id: i.toString(),
              text: '(GMT ' + moment.tz(cities[key]).format('Z') + ') ' + cities[key],
              offset: moment.tz(cities[key]).format('Z')
            });
            i++;
        }
        ordered_cities.sort(function(a, b){
            return parseInt(a.offset.replace(":", ""), 10) - parseInt(b.offset.replace(":", ""), 10);
        });

        $('#timezone').select2({
            data: ordered_cities,
            tags: "true",
            width: "300px",
            placeholder: '(GMT ' + moment.tz(window.timezone).format('Z') + ') ' + window.timezone,
        });

        $('#timezone').change(function() {
            var theSelection = $('#timezone option:selected').text();
            console.log('selected: ' + theSelection.split(') ')[1]);
            setTimezone(theSelection.split(') ')[1]);
            window.location.reload();
        });
    };

	window.onbeforeunload = function() {
		console.log("Leaving the page...");
		if(window.socket !=null) window.socket.close();
    };

	window.onload = function() {
    };
});