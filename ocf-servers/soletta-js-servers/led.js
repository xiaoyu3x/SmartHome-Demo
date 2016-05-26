var device = require( "iotivity-node" )( "server" ),
    _ = require( "lodash" ),
    ledResource,
    sensorPin,
    sensorState = false,
    resourceTypeName = "oic.r.led",
    resourceInterfaceName = "/a/led";

// Require the Soletta GPIO library
var gpio = "";
try {
    gpio = require( "soletta/gpio" );
} catch ( e ) {
    console.log( "No GPIO module: " + e.message );
}

// Setup Fan sensor pin.
function setupHardware() {
    if ( !gpio ) {
        return;
    }

    gpio.open( {
        name: "2"
    } ).then( function( pin ) {
        sensorPin = pin;
        sensorPin.write( false );
    } );
}

// This function parce the incoming Resource properties
// and change the sensor state.
function updateProperties( properties, callback ) {
    var state = properties.value;

    console.log( "\nLed: Update received. value: " + state );

    if ( gpio ) {
        sensorPin.write( state ).then( function() {
            console.log( "LED: State changed" );
            sensorState = state;
            callback();
        } ).catch( function( error ) {
            console.log( "LED: Failed to change the state: ", error );
            callback();
        } );
    } else {
        sensorState = state;
        callback();
    }
}

// This function construct the payload and returns when
// the GET request received from the client.
function getProperties() {

    // Format the payload.
    var properties = {
        rt: resourceTypeName,
        id: "led",
        value: sensorState
    };

    console.log( "Led: Send the response. value: " + sensorState );
    return properties;
}

// Set up the notification loop
function notifyObservers( request ) {
    ledResource.properties = getProperties();

    device.notify( ledResource ).then(
        function() {
            console.log( "Led: Successfully notified observers." );
        },
        function( error ) {
            console.log( "Led: Notify failed with " + error + " and result " +
                error.result );
        } );
}

// Event handlers for the registered resource.
function observeHandler( request ) {
    request.sendResponse( ledResource ).catch( handleError );
    setTimeout( notifyObservers, 200 );
}

function retrieveHandler( request ) {
    ledResource.properties = getProperties();
    request.sendResponse( ledResource ).catch( handleError );
}

function updateHandler( request ) {
    updateProperties( request.res, function() {
        ledResource.properties = getProperties();
        request.sendResponse( ledResource ).catch( handleError );
        setTimeout( notifyObservers, 200 );
    } );
}

device.device = _.extend( device.device, {
    name: "Smart Home LED"
} );

function handleError( error ) {
    console.log( "LED: Failed to send response with error " + error +
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

        // Setup LED pin.
        setupHardware();

        console.log( "\nCreate LED resource." );

        // Register LED resource
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
                console.log( "Led: register() resource successful" );
                ledResource = resource;

                // Add event handlers for each supported request type
                device.addEventListener( "observerequest", observeHandler );
                device.addEventListener( "retrieverequest", retrieveHandler );
                device.addEventListener( "updaterequest", updateHandler );
            },
            function( error ) {
                console.log( "Led: register() resource failed with: " + error );
            } );
    },
    function( error ) {
        console.log( "Led: device.enablePresence() failed with: " + error );
    } );

// Cleanup on SIGINT
process.on( "SIGINT", function() {
    console.log( "Delete LED Resource." );

    // Remove event listeners
    device.removeEventListener( "observerequest", observeHandler );
    device.removeEventListener( "retrieverequest", retrieveHandler );
    device.removeEventListener( "updaterequest", updateHandler );

    // Unregister resource.
    device.unregister( ledResource ).then(
        function() {
            console.log( "Led: unregister() resource successful" );
        },
        function( error ) {
            console.log( "Led: unregister() resource failed with: " + error +
                " and result " + error.result );
        } );

    // Disable presence
    device.disablePresence().then(
        function() {
            console.log( "Led: device.disablePresence() successful" );
        },
        function( error ) {
            console.log( "Led: device.disablePresence() failed with: " + error );
        } );

    // Turn off LED before we tear down the resource.
    if ( gpio ) {
        sensorPin.write( 0 );
        sensorPin.close();
    }

    // Exit
    process.exit( 0 );
} );
