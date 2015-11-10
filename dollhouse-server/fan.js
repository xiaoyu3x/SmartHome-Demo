// Require the MRAA library
var mraa = require("mraa"),
    device = require( "iotivity-node" )(),
    fanResource,
    sensorPin,
    sensorState = false,
    resourceTypeName = "core.fan",
    resourceInterfaceName = "/a/fan";

// Setup Fan sensor pin.
function setupHardware() {
    sensorPin = new mraa.Gpio(9);
    sensorPin.dir(mraa.DIR_OUT);
    sensorPin.write(0);
}

// This function parce the incoming Resource properties
// and change the sensor state.
function updateProperties(properties) {
    sensorState = properties.on_off;

    if (sensorState)
      sensorPin.write(1);
    else
      sensorPin.write(0);
}

// This function construct the payload and returns when
// the GET request received from the client.
function getProperties() {
    // Format the payload.
    var properties = {
        Type: 'boxFan',
        ATT: {'on_off': sensorState}
    };

    console.log("Server: Fan sensor properties:\n" + JSON.stringify(properties, null, 4));
    return properties;
}

// Set up the notification loop
function notifyObservers(request) {
    fanResource.properties = getProperties();

    device.server.notify( fanResource.id /*, "update", fanResource.properties*/ ).then(
        function() {
            console.log( "Server: Successfully notified observers." );
        },
        function( error ) {
            console.log( "Server: notify() failed with " + error + " and result " + error.result );
        } );
}

// This is the entity handler for the registered resource.
function entityHandler(request) {
    console.log( "Server: Received event type: " + request.type );

    if ( request.type === "update" ) {
        updateProperties(request.res);
    } else if ( request.type === "retrieve" ) {
        fanResource.properties = getProperties();
    }

    request.sendResponse( request.source ).then(
        function() {
            console.log( "Server: Successfully responded to retrieve request" );
        },
        function( error ) {
            console.log( "Server: Failed to send response with error " + error + " and result " +
                error.result );
        } );

    setTimeout(notifyObservers, 200);
}

// Create Fan resource
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
        console.log( "Server: device.configure() successful" );

        // Setup Fan sensor pin.
        setupHardware();

        console.log("\nCreate Fan resource.");

        // Register Fan resource
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
                console.log( "Server: device.server.registerResource() successful" );
                fanResource = resource;
                device.server.addEventListener( "request", entityHandler );
            },
            function( error ) {
                console.log( "Server: device.server.registerResource() failed with: " + error );
            } );
    },
    function( error ) {
        console.log( "Server: device.configure() failed with: " + error );
    } );

// Cleanup on SIGINT
process.on( "SIGINT", function() {
    console.log("Delete Fan Resource.");

    // Stop fan before we tear down the resource.
    sensorPin.write(0);

    // Unregister resource.
    device.server.unregisterResource( fanResource.id ).then(
        function() {
            console.log( "Server: device.server.unregisterResource() successful" );
        },
        function( error ) {
            console.log( "Server: device.server.unregisterResource() failed with: " + error +
                " and result " + error.result );
        } );

    // Exit
    process.exit( 0 );
} )
