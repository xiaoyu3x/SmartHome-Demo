var device = require('iotivity-node')(),
    gasResource,
    sensorPin,
    gasDensity = 0,
    resourceTypeName = 'oic.r.sensor.carbondioxide',
    resourceInterfaceName = '/a/gas',
    notifyObserversTimeoutId,
    hasUpdate = false,
    noObservers = false,
    gasDetected = false;

// Require the MRAA library
var mraa = '';
try {
    mraa = require('mraa');
}
catch (e) {
    console.log('No mraa module: ' + e.message);
}

// Setup Gas sensor pin.
function setupHardware() {
    if (mraa) {
       sensorPin = new mraa.Aio(0);
       sensorPin.setBit(10);
    }
}

// This function construct the payload and returns when
// the GET request received from the client.
function getProperties() {
    if (mraa) {
        val = sensorPin.read();
        density = val * 500 / 1024;

        console.log('\ngasSensor: density: ' + density + ' threshold: 70 ');
        if (density != gasDensity) {
            if (density > 70 && gasDensity < 70) {
                gasDensity = density;
                gasDetected = true;
                hasUpdate = true;
            } else if (gasDensity > 70 && density < 70) {
                gasDensity = density;
                gasDetected = false;
                hasUpdate = true;
            }
        }
    } else {
        // Simulate real sensor behavior. This is useful
        // for testing on desktop without mraa.
        gasDetected = !gasDetected;
        hasUpdate = true;
    }

    // Format the properties.
    var properties = {
        rt: resourceTypeName,
        id: 'gasSensor',
        value: gasDetected
    };

    return properties;
}

// Set up the notification loop
function notifyObservers() {
    var properties = getProperties();
    if (hasUpdate) {
        gasResource.properties = properties;
        hasUpdate = false;

        console.log('gasSensor: Send the response: ' + gasDetected);
        device.notify(gasResource).catch(
            function(error) {
                console.log('gasSensor: Failed to notify observers.');
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
        gasResource.properties = getProperties();
    } else if (request.type === 'observe') {
        noObservers = false;
        hasUpdate = true;
    }

    request.sendResponse(gasResource).then(
        function() {
            console.log('gasSensor: Successfully responded to request');
        },
        function(error) {
            console.log('gasSensor: Failed to send response with error ' +
                error + ' and result ' + error.result);
        });

    if (!noObservers && !notifyObserversTimeoutId)
        setTimeout(notifyObservers, 200);
}

// Create Gas resource
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
        console.log('gasSensor: device.configure() successful');

        // Enable presence
        device.enablePresence().then(
            function() {
                console.log('gasSensor: device.enablePresence() successful');
            },
            function(error) {
                console.log('gasSensor: device.enablePresence() failed with: ' + error);
            });

        // Setup Gas sensor pin.
        setupHardware();

        console.log('\nCreate Gas resource.');

        // Register Gas resource
        device.registerResource({
            id: { path: resourceInterfaceName },
            resourceTypes: [ resourceTypeName ],
            interfaces: [ 'oic.if.baseline' ],
            discoverable: true,
            observable: true,
            properties: getProperties()
        }).then(
            function(resource) {
                console.log('gasSensor: registerResource() successful');
                gasResource = resource;
                device.addEventListener('request', entityHandler);
            },
            function(error) {
                console.log('gasSensor: registerResource() failed with: ' +
                    error);
            });
    },
    function(error) {
        console.log('gasSensor: device.configure() failed with: ' + error);
    });

// Cleanup on SIGINT
process.on('SIGINT', function() {
    console.log('Delete Gas Resource.');

    // Unregister resource.
    device.unregisterResource(gasResource).then(
        function() {
            console.log('gasSensor: unregisterResource() successful');
        },
        function(error) {
            console.log('gasSensor: unregisterResource() failed with: ' +
                error + ' and result ' + error.result);
        });

    // Disable presence
    device.disablePresence().then(
        function() {
            console.log('gasSensor: device.disablePresence() successful');
        },
        function(error) {
            console.log('gasSensor: device.disablePresence() failed with: ' + error);
        });

    // Exit
    process.exit(0);
});
