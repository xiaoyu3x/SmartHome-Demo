var device = require('iotivity-node')(),
    gasResource,
    sensorPin,
    gasDensity = 0,
    resourceTypeName = 'core.gas',
    resourceInterfaceName = '/a/gas',
    notifyObserversTimeoutId,
    hasUpdate = false,
    noObservers = false;

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

        console.log('\ngasSensor: density: ' + gasDensity + ' threshold: 70 ');
        if (density != gasDensity) {
            if (density > 70 && gasDensity < 70) {
                gasDensity = density;
                hasUpdate = true;
            } else if (gasDensity > 70 && density < 70) {
                gasDensity = density;
                hasUpdate = true;
            }
        }
    } else {
        // Send the default properties. This is useful
        // for testing on desktop without mraa.
        hasUpdate = true;
    }

    // Format the properties.
    var properties = {
        Type: 'gasSensor',
        ATT: {'density': gasDensity}
    };

    return properties;
}

// Set up the notification loop
function notifyObservers() {
    var properties = getProperties();
    if (hasUpdate) {
        gasResource.properties = properties;
        hasUpdate = false;

        console.log('gasSensor: Send the respose. density: ' + gasDensity);
        device.server.notify(gasResource.id).catch(
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

    request.sendResponse(request.source).then(
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
        console.log('gasSensor: device.configure() successful');

        // Setup Gas sensor pin.
        setupHardware();

        console.log('\nCreate Gas resource.');

        // Register Gas resource
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
                console.log('gasSensor: registerResource() successful');
                gasResource = resource;
                device.server.addEventListener('request', entityHandler);
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
    device.server.unregisterResource(gasResource.id).then(
        function() {
            console.log('gasSensor: unregisterResource() successful');
        },
        function(error) {
            console.log('gasSensor: unregisterResource() failed with: ' +
                error + ' and result ' + error.result);
        });

    // Exit
    process.exit(0);
});
