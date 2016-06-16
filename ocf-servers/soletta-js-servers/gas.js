var device = require( "iotivity-node" )( "server" ),
    gasResource,
    sensorPin,
    gasDensity = 0,
    resourceTypeName = "oic.r.sensor.carbondioxide",
    resourceInterfaceName = "/a/gas",
    notifyObserversTimeoutId,
    hasUpdate = false,
    noObservers = false,
    gasDetected = false,
    rawValue = 0,
    threshold = 70;

// Require the Soletta AIO library
var aio = "";
try {
    aio = require( "soletta/aio" );
} catch ( e ) {
    console.log( "No AIO module: " + e.message );
}

function readSensorData( callback ) {
    if ( aio ) {
        sensorPin.read().then( function( data ) {
            rawValue = data;
            if ( callback ) {
                gasResource.properties = getProperties();
                callback();
            }
        } );
    } else if ( callback ) {
        gasResource.properties = getProperties();
        callback();
    }
}

// Setup Gas sensor pin.
function setupHardware() {
    if ( !aio ) {
        return;
    }

    aio.open( {
        name: "A0"
    } ).then( function( pin ) {
        sensorPin = pin;
        readSensorData();
    } );
}

// This function construct the payload and returns when
// the GET request received from the client.
function getProperties() {
    if ( aio ) {
        density = rawValue * 500 / 1024;

        console.log( "\ngasSensor: density: " + density + " threshold: 70 " );
        if ( density != gasDensity ) {
            if ( density > threshold && gasDensity < threshold ) {
                gasDensity = density;
                gasDetected = true;
                hasUpdate = true;
            } else if ( gasDensity > threshold && density < threshold ) {
                gasDensity = density;
                gasDetected = false;
                hasUpdate = true;
            }
        }
    } else {

        // Simulate real sensor behavior. This is useful
        // for testing on desktop without a sensor.
        gasDetected = !gasDetected;
        hasUpdate = true;
    }

    // Format the properties.
    var properties = {
        rt: resourceTypeName,
        id: "gasSensor",
        value: gasDetected
    };

    return properties;
}

// Set up the notification loop
function notifyObservers() {
    readSensorData( function() {
        if ( hasUpdate ) {
            hasUpdate = false;
            console.log( "gasSensor: Send the response: " + gasDetected );
            device.notify( gasResource ).catch(
                function( error ) {
                    console.log( "gasSensor: Failed to notify observers." );
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
            notifyObserversTimeoutId = setTimeout( notifyObservers, 2000 );
        }
    } );
}

// Event handlers for the registered resource.
function observeHandler( request ) {
    noObservers = false;
    hasUpdate = true;
    readSensorData( function() {
        request.sendResponse( gasResource ).catch( handleError );

        if ( !notifyObserversTimeoutId ) {
            setTimeout( notifyObservers, 200 );
        }
    } );
}

function retrieveHandler( request ) {
    readSensorData( function() {
        request.sendResponse( gasResource ).catch( handleError );
    } );
}

device.device = Object.assign( device.device, {
    name: "Smart Home Gas Sensor"
} );

function handleError( error ) {
    console.log( "gasSensor: Failed to send response with error " + error +
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

        // Setup Gas sensor pin.
        setupHardware();

        console.log( "\nCreate Gas resource." );

        // Register Gas resource
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
                console.log( "gasSensor: register() resource successful" );
                gasResource = resource;

                // Add event handlers for each supported request type
                device.addEventListener( "observerequest", observeHandler );
                device.addEventListener( "retrieverequest", retrieveHandler );
            },
            function( error ) {
                console.log( "gasSensor: register() resource failed with: " +
                    error );
            } );
    },
    function( error ) {
        console.log( "gasSensor: device.enablePresence() failed with: " + error );
    } );

// Cleanup on SIGINT
process.on( "SIGINT", function() {
    console.log( "Delete Gas Resource." );

    // Remove event listeners
    device.removeEventListener( "observerequest", observeHandler );
    device.removeEventListener( "retrieverequest", retrieveHandler );

    // Unregister resource.
    device.unregister( gasResource ).then(
        function() {
            console.log( "gasSensor: unregister() resource successful" );
        },
        function( error ) {
            console.log( "gasSensor: unregister() resource failed with: " +
                error + " and result " + error.result );
        } );

    // Disable presence
    device.disablePresence().then(
        function() {
            console.log( "gasSensor: device.disablePresence() successful" );
        },
        function( error ) {
            console.log( "gasSensor: device.disablePresence() failed with: " + error );
        } );

    if ( aio ) {
        sensorPin.close();
    }

    // Exit
    process.exit( 0 );
} );
