var device = require('iotivity-node')(),
    solarResource,
    lcdPin,
    pwmPin,
    resourceTypeName = 'oic.r.solar',
    resourceInterfaceName = '/a/solar',
    tiltPercentage = 0,
    lcd1 = "Solar Connected!!",
    lcd2 = "IOT Tracker";

// Require the MRAA library
var mraa = '';
try {
    mraa = require('mraa');
}
catch (e) {
    console.log('No mraa module: ' + e.message);
}

var lcd = '';
try {
    lcd = require('jsupm_i2clcd');
}
catch (e) {
    console.log('No lcd module: ' + e.message);
}

function resetLCDScreen() {
    if (!lcd)
        return;

    lcdPin.clear();
    lcdPin.setColor(255, 0, 0);
    lcdPin.setCursor(0, 0);
    lcdPin.write('Solar');
    lcdPin.setCursor(1, 0);
    lcdPin.write('IOT Tracker');
}

// Setup solar panel.
function setupHardware() {
    if (!mraa)
        return;

    if (lcd) {
        lcdPin = new lcd.Jhd1313m1(6, 0x3E, 0x62);
        resetLCDScreen();
    }

    pwmPin = new mraa.Pwm(3);
    pwmPin.period_ms(20);
    pwmPin.enable(true);

    pwmPin.write(0.05);
    console.log('Solar panel initialization completed.');
}

function map(x, in_min, in_max, out_min, out_max) {
    return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

// This function parce the incoming Resource properties
// and change the sensor state.
function updateProperties(properties) {
    tiltPercentage = properties.tiltPercentage;
    if (!mraa)
        return;

    var val = map(tiltPercentage, 0, 100, .05, .10);
    console.log('\nSolar: Update received. tiltPercentage: ' +
            tiltPercentage + ' : ' + val);
    pwmPin.write(val);

    if (!lcd)
        return;

    if (properties.lcd1) {
        lcd1 = properties.lcd1;
        lcdPin.setCursor(0, 0);
        lcdPin.write(lcd1);
    }

    if (properties.lcd2) {
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
        rt: resourceTypeName,
        id: 'solar',
        tiltPercentage: tiltPercentage,
        lcd1: lcd1,
        lcd2: lcd2
    };

    console.log('Solar: Send the response. tiltPercentage: ' + tiltPercentage);
    return properties;
}

function processObserve() {
    if (!lcd)
        return;

    lcdPin.setColor(0, 255, 0);

    lcdPin.setCursor(0, 0);
    lcdPin.write(lcd1);
    lcdPin.setCursor(1, 0);
    lcdPin.write(lcd2);
}

// Set up the notification loop
function notifyObservers(request) {
    solarResource.properties = getProperties();

    device.server.notify(solarResource.id).catch(
        function(error) {
            console.log('Solar: Failed to notify observers.');
            noObservers = error.noObservers;
            if (noObservers) {
                resetLCDScreen();
            }
        });
}

// This is the entity handler for the registered resource.
function entityHandler(request) {
    if (request.type === 'update') {
        updateProperties(request.res);
    } else if (request.type === 'retrieve') {
        solarResource.properties = getProperties();
    } else if (request.type === 'observe') {
        processObserve();
    }

    request.sendResponse(request.source).then(
        function() {
            console.log('Solar: Successfully responded to request');
        },
        function(error) {
            console.log('Solar: Failed to send response with error ' +
                error + ' and result ' + error.result);
        });

    setTimeout(notifyObservers, 200);
}

// Create Solar resource
device.configure({
    role: 'server',
    connectionMode: 'acked',
    info: {
        uuid: "SmartHouse.dollhouse",
        name: "SmartHouse",
        manufacturerName: "Intel",
        maanufactureDate: "Fri Oct 30 10:04:17 EEST 2015",
        platformVersion: "1.0.0",
        firmwareVersion: "0.0.1",
    }
}).then(
    function() {
        console.log('Solar: device.configure() successful');

        // Setup Solar sensor.
        setupHardware();

        console.log('\nCreate Solar resource.');

        // Register Solar resource
        device.server.registerResource({
            url: resourceInterfaceName,
            deviceId: device.settings.info.uuid,
            connectionMode: device.settings.connectionMode,
            resourceTypes: resourceTypeName,
            interfaces: 'oic.if.baseline',
            discoverable: true,
            observable: true,
            properties: getProperties()
        }).then(
            function(resource) {
                console.log('Solar: registerResource() successful');
                solarResource = resource;
                device.server.addEventListener('request', entityHandler);
            },
            function(error) {
                console.log('Solar: registerResource() failed with: ' + error);
            });
    },
    function(error) {
        console.log('Solar: device.configure() failed with: ' + error);
    });

// Cleanup on SIGINT
process.on('SIGINT', function() {
    console.log('Delete Solar Resource.');

    // Reset LCD screen.
    resetLCDScreen();

    // Unregister resource.
    device.server.unregisterResource(solarResource.id).then(
        function() {
            console.log('Solar: unregisterResource() successful');
        },
        function(error) {
            console.log('Solar: unregisterResource() failed with: ' + error +
                ' and result ' + error.result);
        });

    // Exit
    process.exit(0);
});
