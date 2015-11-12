// Require the MRAA library
var mraa = require("mraa"),
    device = require( "iotivity-node" )(),
    motionResource,
    sensorPin,
    ledPin,
    notifyObserversTimeoutId,
    resourceTypeName = "core.pir",
    resourceInterfaceName = "/a/pir",
    hasUpdate = false,
    noObservers = false,
    sensorState = false;

// Setup Motion sensor pin.
function setupHardware() {
    sensorPin = new mraa.Gpio(5);
    sensorPin.dir(mraa.DIR_IN);

    // Setup LED sensor pin.
    /*ledPin = new mraa.Gpio(4);
    ledPin.dir(mraa.DIR_OUT);
    ledPin.write(0);*/
}

// This function construct the payload and returns when
// the GET request received from the client.
function getProperties() {
    var motion = false;

    if ( sensorPin.read() > 0 )
        motion = true;
    else
        motion = false;

    if ( sensorState != motion ) {
        hasUpdate = true;
        sensorState = motion;

        /*if ( sensorState )
            ledPin.write(1);
        else
            ledPin.write(0);*/
    }

    // Format the payload.
    var properties = {
        Type: 'motionSensor',
        ATT: {'on_off': sensorState}
    };

    return properties;
}

// Set up the notification loop
function notifyObservers() {
    properties = getProperties();

    if ( hasUpdate ) {
        motionResource.properties = properties;
        hasUpdate = false;

        console.log("\nmotionSensor: Send the response. on_off: " + sensorState);
        device.server.notify( motionResource.id /*, "update", gasResource.properties*/ ).catch(
            function( error ) {
                console.log( "motionSensor: Failed to notify observers." );
                noObservers = error.noObservers;
                if ( noObservers ) {
                    if ( notifyObserversTimeoutId ) {
                        clearTimeout(notifyObserversTimeoutId);
                        notifyObserversTimeoutId = null;
                    }
                }
            } );
    }

    // After all our clients are complete, we don't care about any
    // more requests to notify.
    if ( !noObservers ) {
        notifyObserversTimeoutId = setTimeout(notifyObservers, 2000 );
    }
}

// This is the entity handler for the registered resource.
function entityHandler(request) {
    if ( request.type === "retrieve" ) {
        motionResource.properties = getProperties();
    } else if ( request.type === "observe" ) {
        noObservers = false;
        hasUpdate = true;
    }

    request.sendResponse( request.source ).then(
        function() {
            console.log( "motionSensor: Successfully responded to request" );
        },
        function( error ) {
            console.log( "motionSensor: Failed to send response with error " + error + " and result " +
                error.result );
        } );

    if ( !noObservers && !notifyObserversTimeoutId )
        setTimeout(notifyObservers, 200);
}

// Create Motion resource
device.configure( {
    role: "server",
    connectionMode: "acked",
    info: {
        uuid: "SmartHouse.dollhouse",
        name: "SmartHouse",
        manufacturerName: "Intel",
        maanufactureDate: "Fri Oct 30 10:04:17 EEST 2015",
        platformVersion: "1.0.0",
        firmwareVersion: "0.0.1",
    }
} ).then(
    function() {
        console.log( "motionSensor: device.configure() successful" );

        // Setup Motion sensor pin.
        setupHardware();

        console.log("\nCreate motion resource.");

        // Register Motion resource
        device.server.registerResource( {
            url: resourceInterfaceName,
            deviceId: device.settings.info.uuid,
            connectionMode: device.settings.connectionMode,
            resourceTypes: resourceTypeName,
            interfaces: "oic.if.baseline",
            discoverable: true,
            observable: true,
            properties: getProperties()
        } ).then(
            function( resource ) {
                console.log( "motionSensor: device.server.registerResource() successful" );
                motionResource = resource;
                device.server.addEventListener( "request", entityHandler );
            },
            function( error ) {
                console.log( "motionSensor: device.server.registerResource() failed with: " + error );
            } );
    },
    function( error ) {
        console.log( "motionSensor: device.configure() failed with: " + error );
    } );

// Cleanup on SIGINT
process.on( "SIGINT", function() {
    console.log("Delete Motion Resource.");

    // Turn off led before we tear down the resource.
    // ledPin.write(0);

    // Unregister resource.
    device.server.unregisterResource( motionResource.id ).then(
        function() {
            console.log( "motionSensor: device.server.unregisterResource() successful" );
        },
        function( error ) {
            console.log( "motionSensor: device.server.unregisterResource() failed with: " + error +
                " and result " + error.result );
        } );

    // Exit
    process.exit( 0 );
} );

