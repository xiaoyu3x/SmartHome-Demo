var device = require( "iotivity-node" )( "server" ),
    fanResource,
    sensorPin,
    sensorState = false,
    resourceTypeName = "oic.r.fan",
    resourceInterfaceName = "/a/fan";

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
        name: "9"
    } ).then( function( pin ) {
        sensorPin = pin;
        sensorPin.write( false );
    } );
}

// This function parce the incoming Resource properties
// and change the sensor state.
function updateProperties( properties, callback ) {
    var state = properties.value;

    console.log( "\nFan: Update received. value: " + state );

    if ( gpio ) {
        sensorPin.write( state ).then( function() {
            console.log( "Fan state changed" );
            sensorState = state;
            callback();
        } ).catch( function( error ) {
            console.log( "Failed to write on GPIO device: ", error );
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
        id: "boxFan",
        value: sensorState
    };

    console.log( "Fan: Send the response. value: " + sensorState );
    return properties;
}

// Set up the notification loop
function notifyObservers( request ) {
    fanResource.properties = getProperties();

    device.notify( fanResource ).then(
        function() {
            console.log( "Fan: Successfully notified observers." );
        },
        function( error ) {
            console.log( "Fan: Notify failed with " + error + " and result " +
                error.result );
        } );
}

// Event handlers for the registered resource.
function observeHandler( request ) {
    request.sendResponse( fanResource ).catch( handleError );
    setTimeout( notifyObservers, 200 );
}

function retrieveHandler( request ) {
    fanResource.properties = getProperties();
    request.sendResponse( fanResource ).catch( handleError );
}

function updateHandler( request ) {
    updateProperties( request.res, function() {
        fanResource.properties = getProperties();
        request.sendResponse( fanResource ).catch( handleError );
        setTimeout( notifyObservers, 200 );
    } );
}

device.device = Object.assign( device.device, {
    name: "Smart Home Fan"
} );

function handleError( error ) {
    console.log( "Fan: Failed to send response with error " + error +
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
        console.log( "Fan: device.enablePresence() successful" );

        // Setup Fan sensor pin.
        setupHardware();

        console.log( "\nCreate Fan resource." );

        // Register Fan resource
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
                console.log( "Fan: register() resource successful" );
                fanResource = resource;

                // Add event handlers for each supported request type
                device.addEventListener( "observerequest", observeHandler );
                device.addEventListener( "retrieverequest", retrieveHandler );
                device.addEventListener( "updaterequest", updateHandler );
            },
            function( error ) {
                console.log( "Fan: register() resource failed with: " + error );
            } );
    },
    function( error ) {
        console.log( "Fan: device.enablePresence() failed with: " + error );
    } );

// Cleanup on SIGINT
process.on( "SIGINT", function() {
    console.log( "Delete Fan Resource." );

    // Remove event listeners
    device.removeEventListener( "observerequest", observeHandler );
    device.removeEventListener( "retrieverequest", retrieveHandler );
    device.removeEventListener( "updaterequest", updateHandler );

    // Unregister resource.
    device.unregister( fanResource ).then(
        function() {
            console.log( "Fan: unregister() resource successful" );
        },
        function( error ) {
            console.log( "Fan: unregister() resource failed with: " + error +
                " and result " + error.result );
        } );

    device.disablePresence().then(
        function() {
            console.log( "Fan: device.disablePresence() successful" );
        },
        function( error ) {
            console.log( "Fan: device.disablePresence() failed with: " + error );
        } );

    // Stop fan before we tear down the resource.
    if ( gpio ) {
        sensorPin.write( false );
        sensorPin.close();
    }

    // Exit
    process.exit( 0 );
} );
