var device = require( "iotivity-node" )( "server" ),
    temperatureResource,
    sensorPin,
    beta = 3975, // Value of the thermistor
    resourceTypeName = "oic.r.temperature",
    resourceInterfaceName = "/a/temperature",
    notifyObserversTimeoutId,
    hasUpdate = false,
    noObservers = false,
    temperature = 0,
    desiredTemperature = 0,
    rawValue = 0;

// Units for the temperature.
var units = {
    C: "C",
    F: "F",
    K: "K"
};

// Require the Soletta AIO library
var aio = "";
try {
    aio = require( "soletta/aio" );
} catch ( e ) {
    console.log( "No AIO module: " + e.message );
}

function readSensorData( tempUnit, callback ) {
    if ( aio ) {
        sensorPin.read().then( function( data ) {
            rawValue = data;
            if ( callback ) {
                temperatureResource.properties = getProperties( tempUnit );
                callback();
            }
        } );
    } else if ( callback ) {
        temperatureResource.properties = getProperties( tempUnit );
        callback();
    }
}

// Setup Temperature sensor pin.
function setupHardware() {
    if ( !aio ) {
        return;
    }

    aio.open( {
        name: "A1"
    } ).then( function( pin ) {
        sensorPin = pin;
        readSensorData( units.C );
    } );
}

// Get the range property value for temperature
// based on the unit attribute.
function getRange( tempUnit ) {
    var range;

    switch ( tempUnit ) {
        case units.F:
            range = "-40,257";
            break;
        case units.K:
            range = "233.15,398.15";
            break;
        case units.C:
        default:
            range = "-40,125";
            break;
    }

    return range;
}

// This function construct the payload and returns when
// the GET request received from the client.
function getProperties( tempUnit ) {
    if ( aio ) {
        var temp = 0.0;

        // Get the resistance of the sensor
        var inputRange = 1 << 12;

        var resistance = ( inputRange - rawValue ) * 10000 / rawValue;
        var Ktemperature = 1 / ( Math.log( resistance / 10000 ) / beta + 1 / 298.15 );

        switch ( tempUnit ) {
            case units.F:
                temperature = Math.round( ( ( Ktemperature - 273.15 ) * 9.0 / 5.0 + 32.0 ) * 100 ) / 100;
                console.log( "Temperature: " + temperature + "° Fahrenheit" );
                break;
            case units.K:
                temperature = Math.round( Ktemperature * 100 ) / 100;
                console.log( "Temperature: " + temperature + "K Kelvin" );
                break;
            case units.C:
            default:
                temperature = Math.round( ( Ktemperature - 273.15 ) * 100 ) / 100;
                console.log( "Temperature: " + temperature + "° Celsius" );
                break;
        }

        if ( temperature >= desiredTemperature ) {
            hasUpdate = true;
        }
    } else {

        // Simulate real sensor behavior. This is useful
        // for testing on desktop without sensor.
        temperature = temperature + 0.1;
        console.log( "Temperature: " + temperature );
        hasUpdate = true;
    }

    // Format the properties.
    var properties = {
        rt: resourceTypeName,
        id: "temperature",
        temperature: temperature,
        units: tempUnit,
        range: getRange( tempUnit )
    };

    return properties;
}

function updateProperties( properties ) {
    var rangeTemp = getRange( units.C ).split( "," );
    var min = parseInt( rangeTemp[ 0 ] );
    var max = parseInt( rangeTemp[ 1 ] );

    if ( properties.temperature < min || properties.temperature > max ) {
        return false;
    }

    desiredTemperature = properties.temperature;
    console.log( "\nTemperature: Desired value: " + desiredTemperature );

    return true;
}

// Set up the notification loop
function notifyObservers() {
    readSensorData( units.C, function() {
        if ( hasUpdate ) {
            hasUpdate = false;
            console.log( "Temperature: Send the response: " + temperature );
            device.notify( temperatureResource ).catch(
                function( error ) {
                    console.log( "Temperature: Failed to notify observers." );
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
    readSensorData( units.C, function() {
        request.sendResponse( temperatureResource ).catch( handleError );

        if ( !notifyObserversTimeoutId ) {
            setTimeout( notifyObservers, 200 );
        }
    } );
}

function retrieveHandler( request ) {
    readSensorData( units.C, function() {
        request.sendResponse( temperatureResource ).catch( handleError );
    } );
}

function updateHandler( request ) {
    var ret = true;
    ret = updateProperties( request.res );

    if ( !ret ) {

        // Format the error properties.
        var error = {
            id: "temperature",
            range: getRange( units.C )
        };

        request.sendError( error );
        return;
    }

    readSensorData( units.C, function() {
        request.sendResponse( temperatureResource ).catch( handleError );
        setTimeout( notifyObservers, 200 );
    } );
}

device.device = Object.assign( device.device, {
    name: "Smart Home Temperature Sensor"
} );

function handleError( error ) {
    console.log( "Temperature: Failed to send response with error " +
        error + " and result " + error.result );
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

        // Setup Temperature sensor pin.
        setupHardware();

        console.log( "\nCreate Temperature resource." );

        // Register Temperature resource
        device.register( {
            id: {
                path: resourceInterfaceName
            },
            resourceTypes: [ resourceTypeName ],
            interfaces: [ "oic.if.baseline" ],
            discoverable: true,
            observable: true,
            properties: getProperties( units.C )
        } ).then(
            function( resource ) {
                console.log( "Temperature: register() resource successful" );
                temperatureResource = resource;

                // Add event handlers for each supported request type
                device.addEventListener( "observerequest", observeHandler );
                device.addEventListener( "retrieverequest", retrieveHandler );
                device.addEventListener( "updaterequest", updateHandler );
            },
            function( error ) {
                console.log( "Temperature: register() resource failed with: " +
                    error );
            } );
    },
    function( error ) {
        console.log( "Temperature: device.enablePresence() failed with: " + error );
    } );

// Cleanup on SIGINT
process.on( "SIGINT", function() {
    console.log( "Delete temperature Resource." );

    // Remove event listeners
    device.removeEventListener( "observerequest", observeHandler );
    device.removeEventListener( "retrieverequest", retrieveHandler );
    device.removeEventListener( "updaterequest", updateHandler );

    // Unregister resource.
    device.unregister( temperatureResource ).then(
        function() {
            console.log( "Temperature: unregister() resource successful" );
        },
        function( error ) {
            console.log( "Temperature: unregister() resource failed with: " +
                error + " and result " + error.result );
        } );

    // Disable presence
    device.disablePresence().then(
        function() {
            console.log( "Temperature: device.disablePresence() successful" );
        },
        function( error ) {
            console.log( "Temperature: device.disablePresence() failed with: " + error );
        } );

    if ( aio ) {
        sensorPin.close();
    }

    // Exit
    process.exit( 0 );
} );
