// Require the MRAA library
var mraa = require("mraa"),
    lcd = require('jsupm_i2clcd'),
    device = require( "iotivity-node" )(),
    solarResource,
    lcdPin,
    pwmPin,
    resourceTypeName = "core.solar",
    resourceInterfaceName = "/a/solar",
    tiltPercentage = 0,
    lcd1 = "Solar Connected!!",
    lcd2 = "IOT Tracker";

function resetLCDScreen() {
    lcdPin.clear();
    lcdPin.setColor(255, 0, 0);
    lcdPin.setCursor(0, 0);
    lcdPin.write("Solar");
    lcdPin.setCursor(1, 0);
    lcdPin.write("IOT Tracker");
}

// Setup solar panel.
function setupHardware() {
    lcdPin = new lcd.Jhd1313m1(6, 0x3E, 0x62);
    resetLCDScreen();

    pwmPin = new mraa.Pwm(3);
    pwmPin.period_ms(20);
    pwmPin.enable(true);

    pwmPin.write(0.05);
}

function map(x, in_min, in_max, out_min, out_max) {
    return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

// This function parce the incoming Resource properties
// and change the sensor state.
function updateProperties(properties) {
    console.log("Server: recieved properties:\n" + JSON.stringify(properties, null, 4));
    tiltPercentage = properties.tiltPercentage;

    var val = map(tiltPercentage, 0, 100, .05, .10);
    pwmPin.write(val);

    if ( properties.lcd1 ) {
        lcd1 = properties.lcd1;
        lcdPin.setCursor(0, 0);
        lcdPin.write(lcd1);
    }

    if ( properties.lcd2 ) {
        lcd2 = properties.lcd2;
        lcdPin.setCursor(1, 0);
        lcdPin.write(properties.lcd2);
    }
}

// This function construct the payload and returns when
// the GET request received from the client.
function getProperties() {
    // Format the payload.
    var properties = {
        Type: 'solar',
        ATT: {
            'tiltPercentage': tiltPercentage,
            'lcd1': lcd1,
            'lcd2': lcd2
        }
    };

    console.log("Server: Send the response:\n" + JSON.stringify(properties, null, 4));
    return properties;
}

function processObserve() {
    lcdPin.setColor(0,255,0);

    lcdPin.setCursor(0, 0);
    lcdPin.write(lcd1);
    lcdPin.setCursor(1, 0);
    lcdPin.write(lcd2);
}

// Set up the notification loop
function notifyObservers(request) {
    solarResource.properties = getProperties();

    device.server.notify( solarResource.id /*, "update", solarResource.properties*/ ).catch(
        function( error ) {
            console.log( "Server: Failed to notify observers." );
            noObservers = error.noObservers;
            if ( noObservers ) {
                resetLCDScreen();
            }
        } );
}

// This is the entity handler for the registered resource.
function entityHandler(request) {
    console.log( "Server: Received event type: " + request.type );

    if ( request.type === "update" ) {
        updateProperties(request.res);
    } else if ( request.type === "retrieve" ) {
        solarResource.properties = getProperties();
    } else if ( request.type === "observe" ) {
        processObserve();
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

// Create Solar resource
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

        // Setup Solar sensor.
        setupHardware();

        console.log("\nCreate Solar resource.");

        // Register Solar resource
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
                solarResource = resource;
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
    console.log("Delete Solar Resource.");

    // Reset LCD screen.
    resetLCDScreen();

    // Unregister resource.
    device.server.unregisterResource( solarResource.id ).then(
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
