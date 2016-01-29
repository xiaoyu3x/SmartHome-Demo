var device = require('iotivity-node')(),
    buzzerResource,
    playNote = false,
    timerId = 0,
    sensorPin,
    sensorState = false,
    resourceTypeName = 'oic.r.buzzer',
    resourceInterfaceName = '/a/buzzer';

// Require the MRAA library
var mraa = '';
try {
    mraa = require('mraa');
}
catch (e) {
    console.log('No mraa module: ' + e.message);
}

// Setup Buzzer sensor pin.
function setupHardware() {
    if (mraa) {
        sensorPin = new mraa.Gpio(6);
        sensorPin.dir(mraa.DIR_OUT);
        sensorPin.write(0);
    }
}

// Buzzer will beep as an alarm pausing
// for 0.8 seconds between.
function playTone() {
    if (playNote)
       sensorPin.write(1);
    else
       sensorPin.write(0);

    playNote = !playNote;
}

// This function parce the incoming Resource properties
// and change the sensor state.
function updateProperties(properties) {
    sensorState = properties.value;

    console.log('\nBuzzer: Update received. value: ' + sensorState);

    if (!mraa)
        return;

    if (sensorState) {
        timerId = setInterval(playTone, 800);
    } else {
        if (timerId)
            clearInterval(timerId);

        sensorPin.write(0);
    }
}

// This function construct the payload and returns when
// the GET request received from the client.
function getProperties() {
    // Format the payload.
    var properties = {
        rt: resourceTypeName,
        id: 'buzzer',
        value: sensorState
    };

    console.log('Buzzer: Send the response. value: ' + sensorState);
    return properties;
}

// Set up the notification loop
function notifyObservers(request) {
    buzzerResource.properties = getProperties();

    device.notify(buzzerResource).then(
        function() {
            console.log('Buzzer: Successfully notified observers.');
        },
        function(error) {
            console.log('Buzzer: Notify failed with ' + error + ' and result ' +
                error.result);
        });
}

// This is the entity handler for the registered resource.
function entityHandler(request) {
    if (request.type === 'update') {
        updateProperties(request.res);
    } else if (request.type === 'retrieve') {
        buzzerResource.properties = getProperties();
    }

    request.sendResponse(buzzerResource).then(
        function() {
            console.log('Buzzer: Successfully responded to request');
        },
        function(error) {
            console.log('Buzzer: Failed to send response with error ' + error +
                ' and result ' + error.result);
        });

    setTimeout(notifyObservers, 200);
}

// Create Buzzer resource
device.configure({
    role: 'server',
    info: {
        uuid: "SmartHouse.dollhouse",
        name: "SmartHouse",
        manufacturerName: "Intel",
        manufacturerDate: "Fri Oct 30 10:04:17 EEST 2015",
        platformVersion: "1.0.0",
        firmwareVersion: "0.0.1",
    }
}).then(
    function() {
        console.log('Buzzer: device.configure() successful');

        // Enable presence
        device.enablePresence().then(
            function() {
                console.log('Buzzer: device.enablePresence() successful');
            },
            function(error) {
                console.log('Buzzer: device.enablePresence() failed with: ' + error);
            });

        // Setup Buzzer sensor pin.
        setupHardware();

        console.log('\nCreate Buzzer resource.');

        // Register Buzzer resource
        device.registerResource({
            id: { path: resourceInterfaceName },
            resourceTypes: [ resourceTypeName ],
            interfaces: [ 'oic.if.baseline' ],
            discoverable: true,
            observable: true,
            properties: getProperties()
        }).then(
            function(resource) {
                console.log('Buzzer: registerResource() successful');
                buzzerResource = resource;
                device.addEventListener('request', entityHandler);
            },
            function(error) {
                console.log('Buzzer: registerResource() failed with: ' + error);
            });
    },
    function(error) {
        console.log('Buzzer: device.configure() failed with: ' + error);
    });

// Cleanup on SIGINT
process.on('SIGINT', function() {
    console.log('Delete Buzzer Resource.');

    // Stop buzzer before we tear down the resource.
    if (timerId)
        clearInterval(timerId);

    if (mraa)
        sensorPin.write(0);

    // Unregister resource.
    device.unregisterResource(buzzerResource).then(
        function() {
            console.log('Buzzer: unregisterResource() successful');
        },
        function(error) {
            console.log('Buzzer: unregisterResource() failed with: ' + error +
                ' and result ' + error.result);
        });

    // Disable presence
    device.disablePresence().then(
        function() {
            console.log('Buzzer: device.disablePresence() successful');
        },
        function(error) {
            console.log('Buzzer: device.disablePresence() failed with: ' + error);
        });

    // Exit
    process.exit(0);
});

