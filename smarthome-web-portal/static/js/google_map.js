/**
 * Scripts to call google map apis
 */
function initMap() {
	var map;
	//var mapID = 0;

	var userName = new Array(
		'Mr Tom Jones',
		'Ms Mary Lakins',
		'Mr John Cumings',
        'Mr Oscar Isaac',
		'Mr Anthony Konechny',
		'Ms Emma Paterson',
        'Mr Dan Lett',
		'Ms Ally Sheedy',
		'Mr Scott Cook',
        'Mr John Ottman',
		'Ms Rose Byrne',
		'Mr Steve Nash'
	);

	var contactInfo = new Array(
		'Ref. 423678',
		'Ref. 436483',
		'Ref. 492372',
        'Ref. 323675',
		'Ref. 336489',
		'Ref. 392372',
        'Ref. 223678',
		'Ref. 236489',
		'Ref. 292371',
        'Ref. 123673',
		'Ref. 136489',
		'Ref. 192372'
	);

    function newMapItem(latitude, longitude, address)
    {
        var mapItem = {};
        mapItem.latitude = latitude;
        mapItem.longitude = longitude;
        mapItem.address  = address;
        return mapItem;
    }

	$.getJSON('/get_gateways', function(data) {
            if (data.error != null) {
                console.error('MAP: Cannot get the map list.');
            } else {
                //var lmap = data.gateways;
        //        lmap.push(newMapItem(31.2293420509,121.4745809111, 'People\'s square'));
                console.log(data);
                createMap(data);
            }
    });

	// fill the infoWindow Content
	function createInfoWindowContent(addr, uName, info) {
		var infoContent = 	'<strong>' + addr + '<br></strong>' +
							'<strong>' + uName + '<br></strong>' +
							'<strong>' + info + '<br></strong>';
		return infoContent;
	}

	// create google map
    function createMap(data) {
        //  Create a new viewpoint bound
        var bounds = new google.maps.LatLngBounds();

        var map_list = data.gateways;
        var keyword = data.keyword;
        var types = data.types;

        //  Go through each...
        for (var i = 0; i < map_list.length; i++) {
            //  And increase the bounds to take this point
            bounds.extend(new google.maps.LatLng(map_list[i].latitude, map_list[i].longitude));
        }

        //  Fit these bounds to the map
        map = new google.maps.Map(document.getElementById('map'), {
            //center: new google.maps.LatLng(map_list[0].latitude, map_list[0].longitude),
            zoom: 15,
            scaleControl: true,
            zoomControl: false,
            mapTypeControl: false,
            mapTypeControlOptions: {
                style: google.maps.MapTypeControlStyle.DEFAULT,
                mapTypeIds: [
                    google.maps.MapTypeId.ROADMAP,
                    google.maps.MapTypeId.TERRAIN,
                    google.maps.MapTypeId.SATELLITE
                ],
                position: google.maps.ControlPosition.LEFT_UP
            },
            streetViewControl: false,
            rotateControl: false
        });

        var service = new google.maps.places.PlacesService(map);
        var orig_locs = map_list.slice(0);

        for (var li = 0; li < orig_locs.length; li++)
        {
            //console.log("Geo:" + map_list[0].latitude + ',' + map_list[0].longitude);
            var request = {
                radius: 5000,
                location: new google.maps.LatLng(orig_locs[li].latitude, orig_locs[li].longitude),
            }

            if(keyword)
                request.keyword = keyword;
            if(types)
                request.types = types;

            service.nearbySearch(request, function (results, status) {
                if (status !== google.maps.places.PlacesServiceStatus.OK) {
                    console.error("response code: " + status);
                    return;
                }
                var new_list = [];
                for (var i = 0; i < results.length; i++)
                {
                    var result = results[i];
                    var loc = result.geometry.location;
                    bounds.extend(loc);
                    var placeName = result.name;
                    var new_item = newMapItem(loc.lat(), loc.lng(), placeName);
                    new_list.push(new_item);
                    map_list.push(new_item);
                    //console.log("geo: " + loc.lat() + ", " + loc.lng());
                    userName.push('Mr Tom Jones');
                    contactInfo.push("Ref. " + Math.floor(Math.random() * 1000000));
                    //console.log("placeName: " + placeName);
                }

                console.log("added " + new_list.length + " locations.");
                addMarkers(map_list);
            });
        }

        map.fitBounds (bounds);

        // create google map SearchBox
        var input = document.getElementById('searchTextField');
        var searchBox = new google.maps.places.SearchBox(input);

        // put the search box on the top left of the map
        map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
        map.addListener('bounds_changed', function () {
            searchBox.setBounds(map.getBounds());
        });

        var markers =[];
        searchBox.addListener('places_changed', function () {
            var places = searchBox.getPlaces();
            if (!places.length ) {
                console.log("Returned place contains no geometry");
                return;
            }

            // clear obsolete markers
            markers.forEach(function (marker) {
                marker.setMap(null);
            });
            markers = [];

            // Create a marker for each place
            var bounds = new google.maps.LatLngBounds();
            places.forEach(function (place) {

                markers.push(new google.maps.Marker({
                    map: map,
                    title: place.name,
                    position: place.geometry.location,
                    icon: {
                        url: place.icon,
                        size: new google.maps.Size(60, 60),
                        anchor: new google.maps.Point(17, 34),
                        scaledSize: new google.maps.Size(20, 20),
                    },
                    draggable: false,
                }));

                if (place.geometry.viewport) {
                    bounds.union(place.geometry.viewport);
                } else {
                    bounds.extend(place.geometry.location);
                }
            });
            map.fitBounds(bounds);
        });

        //addMarkers(orig_locs);
    }

    function addMarkers(map_list)
    {
        var markers = [];
        var infoWindow = new google.maps.InfoWindow();
        for (var index = 0; index < map_list.length; index++) {
            //markers[index] = createMarker(map_list[index]);
            var marker = new google.maps.Marker({
                map: map,
                position: new google.maps.LatLng(map_list[index].latitude, map_list[index].longitude),
                id : index,
                attribution: {
                    source: 'Google Maps JavaScript API',
                    webUrl: 'https://developers.google.com/maps/'
                }
		    });
            markers[index] = marker;
            google.maps.event.addListener(marker, 'click', (function (marker, index, len) {
                return function() {
                    //infowindow.setContent(boxList[this.id]);
                    //infowindow.open(map, marker);
                    var mapID = index;
                    console.log('index: ' + mapID);
                    var contactID = mapID % 12;
                    infoWindow.setContent(createInfoWindowContent(map_list[index].address, userName[contactID], contactInfo[contactID]));
                    infoWindow.open(map, marker);
                    $.energy.house.init(mapID, len);
                    $('#billingTitle > h6').html('Usage for ' + map_list[index].address + ', ' + userName[contactID] + ', ' + contactInfo[contactID]);
                    $('#billingTitle > h6').attr('style', 'font-size: 20px');
                }
            })(marker, index, map_list.length));
        } // end for

        // trigger clicking on the first location
        new google.maps.event.trigger(markers[0], 'click');

    }

}
