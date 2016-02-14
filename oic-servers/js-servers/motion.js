var device = require('iotivity-node')(),
    motionResource,
    sensorPin,
    notifyObserversTimeoutId,
    resourceTypeName = 'oic.r.sensor.motion',
    resourceInterfaceName = '/a/pir',
    hasUpdate = false,
    noObservers = false,
    sensorState = false;

// Require the MRAA library
var mraa = '';
try {
    mraa = require('mraa');
}
catch (e) {
    console.log('No mraa module: ' + e.message);
}

// Setup Motion sensor pin.
function setupHardware() {
    if (!mraa)
        return;

    sensorPin = new mraa.Gpio(5);
    sensorPin.dir(mraa.DIR_IN);
}

// This function construct the payload and returns when
// the GET request received from the client.
function getProperties() {
    var motion = false;

    if (mraa) {
        if (sensorPin.read() > 0)
            motion = true;
        else
            motion = false;
    } else {
        // Simulate real sensor behavior. This is
        // useful for testing on desktop without mraa.
        motion = !sensorState;
    }

    if (sensorState != motion) {
        hasUpdate = true;
        sensorState = motion;
    }

    // Format the payload.
    var properties = {
        rt: resourceTypeName,
        id: 'motionSensor',
        value: sensorState
    };

    return properties;
}

// Set up the notification loop
function notifyObservers() {
    properties = getProperties();

    if (hasUpdate) {
        motionResource.properties = properties;
        hasUpdate = false;

        console.log('\nmotionSensor: Send the response: ' + sensorState);
        device.notify(motionResource).catch(
            function(error) {
                console.log('motionSensor: Failed to notify observers.');
                noObservers = error.noObservers;
                if (noObservers) {
                    if (notifyObserversTimeoutId) {
                        clearTimeout(notifyObserversTimeoutId);
                        notifyObserversTimeoutId = null;
                    }
                }
            });
    }

    // After all our clients are complete, we don't care about any
    // more requests to notify.
    if (!noObservers) {
        notifyObserversTimeoutId = setTimeout(notifyObservers, 2000);
    }
}

// This is the entity handler for the registered resource.
function entityHandler(request) {
    if (request.type === 'retrieve') {
        motionResource.properties = getProperties();
    } else if (request.type === 'observe') {
        noObservers = false;
        hasUpdate = true;
    }

    request.sendResponse(motionResource).then(
        function() {
            console.log('motionSensor: Successfully responded to request');
        },
        function(error) {
            console.log('motionSensor: Failed to send response with error ' +
                error + ' and result ' + error.result);
        });

    if (!noObservers && !notifyObserversTimeoutId)
        setTimeout(notifyObservers, 200);
}

// Create Motion resource
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
        console.log('motionSensor: device.configure() successful');

        // Enable presence
        device.enablePresence().then(
            function() {
                console.log('motionSensor: device.enablePresence() successful');
            },
            function(error) {
                console.log('motionSensor: device.enablePresence() failed with: ' + error);
            });

        // Setup Motion sensor pin.
        setupHardware();

        console.log('\nCreate motion resource.');
        // Register Motion resource
        device.registerResource({
            id: { path: resourceInterfaceName },
            resourceTypes: [ resourceTypeName ],
            interfaces: [ 'oic.if.baseline' ],
            discoverable: true,
            observable: true,
            properties: getProperties()
        }).then(
            function(resource) {
                console.log('motionSensor: registerResource() successful');
                motionResource = resource;
                device.addEventListener('request', entityHandler);
            },
            function(error) {
                console.log('motionSensor: registerResource() failed with: ' +
                    error);
            });
    },
    function(error) {
        console.log('motionSensor: device.configure() failed with: ' + error);
    });

// Cleanup on SIGINT
process.on('SIGINT', function() {
    console.log('Delete Motion Resource.');

    // Unregister resource.
    device.unregisterResource(motionResource).then(
        function() {
            console.log('motionSensor: unregisterResource() successful');
        },
        function(error) {
            console.log('motionSensor: unregisterResource() failed with: ' +
                error + ' and result ' + error.result);
        });

    // Disable presence
    device.disablePresence().then(
        function() {
            console.log('motionSensor: device.disablePresence() successful');
        },
        function(error) {
            console.log('motionSensor: device.disablePresence() failed with: ' + error);
        });

    // Exit
    process.exit(0);
});

