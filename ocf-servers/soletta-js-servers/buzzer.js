var device = require( "iotivity-node" )( "server" ),
    _ = require( "lodash" ),
    buzzerResource,
    playNote = false,
    timerId = 0,
    sensorPin,
    sensorState = false,
    resourceTypeName = "oic.r.buzzer",
    resourceInterfaceName = "/a/buzzer";

// Require the Soletta GPIO library
var gpio = "";
try {
    gpio = require( "soletta/gpio" );
} catch ( e ) {
    console.log( "No GPIO module: " + e.message );
}

// Setup Buzzer sensor pin.
function setupHardware() {
    if ( !gpio ) {
        return;
    }

    gpio.open( {
        name: "6"
    } ).then( function( pin ) {
        sensorPin = pin;
        sensorPin.write( false );
    } );
}

// Buzzer will beep as an alarm pausing
// for one second between.
function playTone() {
    playNote = !playNote;
    sensorPin.write( playNote );
}

// This function parce the incoming Resource properties
// and change the sensor state.
function updateProperties( properties, callback ) {
    sensorState = properties.value;

    console.log( "\nBuzzer: Update received. value: " + sensorState );

    if ( !gpio ) {
        return;
    }

    if ( sensorState ) {
        timerId = setInterval( playTone, 1000 );
    } else {
        if ( timerId ) {
            clearInterval( timerId );
        }

        sensorPin.write( false );
    }
}

// This function construct the payload and returns when
// the GET request received from the client.
function getProperties() {

    // Format the payload.
    var properties = {
        rt: resourceTypeName,
        id: "buzzer",
        value: sensorState
    };

    console.log( "Buzzer: Send the response. value: " + sensorState );
    return properties;
}

// Set up the notification loop
function notifyObservers( request ) {
    buzzerResource.properties = getProperties();

    device.notify( buzzerResource ).then(
        function() {
            console.log( "Buzzer: Successfully notified observers." );
        },
        function( error ) {
            console.log( "Buzzer: Notify failed with " + error + " and result " +
                error.result );
        } );
}

// Event handlers for the registered resource.
function observeHandler( request ) {
    request.sendResponse( buzzerResource ).catch( handleError );
    setTimeout( notifyObservers, 200 );
}

function retrieveHandler( request ) {
    buzzerResource.properties = getProperties();
    request.sendResponse( buzzerResource ).catch( handleError );
}

function updateHandler( request ) {
    updateProperties( request.res, function() {
        buzzerResource.properties = getProperties();
        request.sendResponse( buzzerResource ).catch( handleError );
        setTimeout( notifyObservers, 200 );
    } );

}

device.device = _.extend( device.device, {
    name: "Smart Home Buzzer"
} );

function handleError( error ) {
    console.log( "Buzzer: Failed to send response with error " + error +
        " and result " + error.result );
}

device.platform = _.extend( device.platform, {
    manufacturerName: "Intel",
    manufactureDate: new Date( "Fri Oct 30 10:04:17 EEST 2015" ),
    platformVersion: "1.1.0",
    firmwareVersion: "0.0.1"
} );

// Enable presence
device.enablePresence().then(
    function() {

        // Setup Buzzer sensor pin.
        setupHardware();

        console.log( "\nCreate Buzzer resource." );

        // Register Buzzer resource
        device.registerResource( {
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
                console.log( "Buzzer: registerResource() successful" );
                buzzerResource = resource;

                // Add event handlers for each supported request type
                device.addEventListener( "observerequest", observeHandler );
                device.addEventListener( "retrieverequest", retrieveHandler );
                device.addEventListener( "updaterequest", updateHandler );
            },
            function( error ) {
                console.log( "Buzzer: registerResource() failed with: " + error );
            } );
    },
    function( error ) {
        console.log( "Buzzer: device.enablePresence() failed with: " + error );
    } );

// Cleanup on SIGINT
process.on( "SIGINT", function() {
    console.log( "Delete Buzzer Resource." );

    // Stop buzzer before we tear down the resource.
    if ( timerId ) {
        clearInterval( timerId );
    }

    // Remove event listeners
    device.removeEventListener( "observerequest", observeHandler );
    device.removeEventListener( "retrieverequest", retrieveHandler );
    device.removeEventListener( "updaterequest", updateHandler );

    // Unregister resource.
    device.unregisterResource( buzzerResource ).then(
        function() {
            console.log( "Buzzer: unregisterResource() successful" );
        },
        function( error ) {
            console.log( "Buzzer: unregisterResource() failed with: " + error +
                " and result " + error.result );
        } );

    // Disable presence
    device.disablePresence().then(
        function() {
            console.log( "Buzzer: device.disablePresence() successful" );
        },
        function( error ) {
            console.log( "Buzzer: device.disablePresence() failed with: " + error );
        } );

    if ( gpio ) {
        sensorPin.write( false );
        sensorPin.close();
    }

    // Exit
    process.exit( 0 );
} );
