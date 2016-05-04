var device = require('iotivity-node')('server'),
    _ = require('lodash'),
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

    device.notify(solarResource).catch(
        function(error) {
            console.log('Solar: Failed to notify observers.');
            noObservers = error.noObservers;
            if (noObservers) {
                resetLCDScreen();
            }
        });
}

// Event handlers for the registered resource.
function observeHandler(request) {
    processObserve();
    request.sendResponse(solarResource).catch(handleError);
    setTimeout(notifyObservers, 200);
}

function retrieveHandler(request) {
    solarResource.properties = getProperties();
    request.sendResponse(solarResource).catch(handleError);
}

function updateHandler(request) {
    updateProperties(request.res);

    solarResource.properties = getProperties();
    request.sendResponse(solarResource).catch(handleError);
    setTimeout(notifyObservers, 200);
}

device.device = _.extend(device.device, {
    name: 'Smart Home Solar'
});

function handleError(error) {
    console.log('Solar: Failed to send response with error ' + error +
    ' and result ' + error.result);
}

device.platform = _.extend(device.platform, {
    manufacturerName: 'Intel',
    manufactureDate: new Date('Fri Oct 30 10:04:17 EEST 2015'),
    platformVersion: '1.1.0',
    firmwareVersion: '0.0.1',
});

// Enable presence
device.enablePresence().then(
    function() {
        // Setup Solar sensor.
        setupHardware();

        console.log('\nCreate Solar resource.');

        // Register Solar resource
        device.registerResource({
            id: { path: resourceInterfaceName },
            resourceTypes: [ resourceTypeName ],
            interfaces: [ 'oic.if.baseline' ],
            discoverable: true,
            observable: true,
            properties: getProperties()
        }).then(
            function(resource) {
                console.log('Solar: registerResource() successful');
                solarResource = resource;

                // Add event handlers for each supported request type
                device.addEventListener('observerequest', observeHandler);
                device.addEventListener('retrieverequest', retrieveHandler);
                device.addEventListener('updaterequest', updateHandler);
            },
            function(error) {
                console.log('Solar: registerResource() failed with: ' + error);
            });
    },
    function(error) {
        console.log('Solar: device.enablePresence() failed with: ' + error);
    });

// Cleanup on SIGINT
process.on('SIGINT', function() {
    console.log('Delete Solar Resource.');

    // Reset LCD screen.
    resetLCDScreen();

    // Remove event listeners
    device.removeEventListener('observerequest', observeHandler);
    device.removeEventListener('retrieverequest', retrieveHandler);
    device.removeEventListener('updaterequest', updateHandler);

    // Unregister resource.
    device.unregisterResource(solarResource).then(
        function() {
            console.log('Solar: unregisterResource() successful');
        },
        function(error) {
            console.log('Solar: unregisterResource() failed with: ' + error +
                ' and result ' + error.result);
        });

    // Disable presence
    device.disablePresence().then(
        function() {
            console.log('Solar: device.disablePresence() successful');
        },
        function(error) {
            console.log('Solar: device.disablePresence() failed with: ' + error);
        });


    // Exit
    process.exit(0);
});
