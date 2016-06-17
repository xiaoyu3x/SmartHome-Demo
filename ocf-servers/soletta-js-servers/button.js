var device = require( "iotivity-node" )( "server" ),
    buttonResource,
    sensorPin,
    notifyObserversTimeoutId,
    resourceTypeName = "oic.r.button",
    resourceInterfaceName = "/a/button",
    hasUpdate = false,
    noObservers = false,
    sensorState = false;

// Require the Soletta GPIO library
var gpio = "";
try {
    gpio = require( "soletta/gpio" );
} catch ( e ) {
    console.log( "No GPIO module: " + e.message );
}

// Setup button pin.
function setupHardware() {
    if ( !gpio ) {
        return;
    }

    gpio.open( {
        name: "4",
        direction: "in"
    } ).then( function( pin ) {
        sensorPin = pin;
        pin.onchange = function( event ) {
            var buttonState = event.value;
            if ( sensorState != buttonState ) {
                hasUpdate = true;
                sensorState = buttonState;
            }
        };
    } );
}

// This function construct the payload and returns when
// the GET request received from the client.
function getProperties() {
    if ( !gpio ) {

        // Simulate real sensor behavior. This is
        // useful for testing on desktop without sensor.
        hasUpdate = true;
        sensorState = !sensorState;
    }

    // Format the payload.
    var properties = {
        rt: resourceTypeName,
        id: "button",
        value: sensorState
    };

    return properties;
}

// Set up the notification loop
function notifyObservers() {
    properties = getProperties();

    if ( hasUpdate ) {
        buttonResource.properties = properties;
        hasUpdate = false;

        console.log( "\nbutton: Send the response: " + sensorState );
        device.notify( buttonResource ).catch(
            function( error ) {
                console.log( "button: Failed to notify observers." );
                noObservers = error.noObservers;
                if ( noObservers ) {
                    if ( notifyObserversTimeoutId ) {
                        clearTimeout( notifyObserversTimeoutId );
                        notifyObserversTimeoutId = null;
                    }
                }
            } );
    }

    // After all our clients are complete, we don't care about any
    // more requests to notify.
    if ( !noObservers ) {
        notifyObserversTimeoutId = setTimeout( notifyObservers, 1000 );
    }
}

// Event handlers for the registered resource.
function observeHandler( request ) {
    buttonResource.properties = getProperties();
    request.sendResponse( buttonResource ).catch( handleError );

    noObservers = false;
    hasUpdate = true;

    if ( !notifyObserversTimeoutId ) {
        setTimeout( notifyObservers, 200 );
    }
}

function retrieveHandler( request ) {
    buttonResource.properties = getProperties();
    request.sendResponse( buttonResource ).catch( handleError );
}

device.device = Object.assign( device.device, {
    name: "Smart Home Button Sensor"
} );

function handleError( error ) {
    console.log( "button: Failed to send response with error " + error +
        " and result " + error.result );
}

device.platform = Object.assign( device.platform, {
    manufacturerName: "Intel",
    manufactureDate: new Date( "Fri Oct 30 10:04:17 (EET) 2015" ),
    platformVersion: "1.1.0",
    firmwareVersion: "0.0.1"
} );

// Enable presence
device.enablePresence().then(
    function() {

        // Setup Button pin.
        setupHardware();

        console.log( "\nCreate button resource." );

        // Register Button resource
        device.register( {
            id: {
                path: resourceInterfaceName
            },
            resourceTypes: [ resourceTypeName ],
            interfaces: [ "oic.if.baseline" ],
            discoverable: true,
            observable: true,
            properties: getProperties()
        } ).then(
            function( resource ) {
                console.log( "button: register() resource successful" );
                buttonResource = resource;

                // Add event handlers for each supported request type
                device.addEventListener( "observerequest", observeHandler );
                device.addEventListener( "retrieverequest", retrieveHandler );
            },
            function( error ) {
                console.log( "button: register() resource failed with: " +
                    error );
            } );
    },
    function( error ) {
        console.log( "button: device.enablePresence() failed with: " + error );
    } );

// Cleanup on SIGINT
process.on( "SIGINT", function() {
    console.log( "Delete Button Resource." );

    // Remove event listeners
    device.removeEventListener( "observerequest", observeHandler );
    device.removeEventListener( "retrieverequest", retrieveHandler );

    // Unregister resource.
    device.unregister( buttonResource ).then(
        function() {
            console.log( "button: unregister() resource successful" );
        },
        function( error ) {
            console.log( "button: unregister() resource failed with: " +
                error + " and result " + error.result );
        } );

    // Disable presence
    device.disablePresence().then(
        function() {
            console.log( "button: device.disablePresence() successful" );
        },
        function( error ) {
            console.log( "button: device.disablePresence() failed with: " + error );
        } );

    if ( gpio ) {
        sensorPin.close();
    }

    // Exit
    process.exit( 0 );
} );
