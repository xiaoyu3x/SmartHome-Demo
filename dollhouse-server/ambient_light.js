var device = require('iotivity-node')(),
    ambientLightResource,
    sensorPin,
    notifyObserversTimeoutId,
    resourceTypeName = 'oic.r.sensor.illuminance',
    resourceInterfaceName = '/a/illuminance',
    hasUpdate = false,
    noObservers = false,
    lux = 0.0;

// Require the MRAA library
var mraa = '';
try {
    mraa = require('mraa');
}
catch (e) {
    console.log('No mraa module: ' + e.message);
}

// Setup ambient light sensor pin.
function setupHardware() {
    if (!mraa)
        return;

    sensorPin = new mraa.Aio(3);
}

// This function construct the payload and returns when
// the GET request received from the client.
function getProperties() {
    var temp = 0;
    if (mraa) {
        var raw_value = sensorPin.read();

        // Conversion to lux
        temp = 10000.0 / Math.pow(((1023.0 - raw_value) * 10.0 / raw_value) * 15.0,4.0 / 3.0);
    } else {
        // Simulate real sensor behavior. This is
        // useful for testing on desktop without mraa.
        temp = lux + 0.1;
    }

    var illuminance = Math.round(temp * 100) / 100;
    if (lux != illuminance) {
        lux = illuminance;
        hasUpdate = true;
    }

    // Format the payload.
    var properties = {
        rt: resourceTypeName,
        id: 'illuminance',
        illuminance: lux
    };

    return properties;
}

// Set up the notification loop
function notifyObservers() {
    properties = getProperties();

    if (hasUpdate) {
        ambientLightResource.properties = properties;
        hasUpdate = false;

        console.log('\nambientLight: Send the response - illuminance: ' + lux);
        device.server.notify(ambientLightResource.id).catch(
            function(error) {
                console.log('ambientLight: Failed to notify observers.');
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
        ambientLightResource.properties = getProperties();
    } else if (request.type === 'observe') {
        noObservers = false;
        hasUpdate = true;
    }

    request.sendResponse(request.source).then(
        function() {
            console.log('ambientLight: Successfully responded to request');
        },
        function(error) {
            console.log('ambientLight: Failed to send response with error ' +
                error + ' and result ' + error.result);
        });

    if (!noObservers && !notifyObserversTimeoutId)
        setTimeout(notifyObservers, 200);
}

// Create ambient light resource
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
        console.log('ambientLight: device.configure() successful');

        // Setup ambient light sensor pin.
        setupHardware();

        console.log('\nCreate Ambient Light resource.');

        // Register ambient light resource
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
                console.log('ambientLight: registerResource() successful');
                ambientLightResource = resource;
                device.server.addEventListener('request', entityHandler);
            },
            function(error) {
                console.log('ambientLight: registerResource() failed with: ' +
                    error);
            });
    },
    function(error) {
        console.log('ambientLight: device.configure() failed with: ' + error);
    });

// Cleanup on SIGINT
process.on('SIGINT', function() {
    console.log('Delete Ambient Light Resource.');

    // Unregister resource.
    device.server.unregisterResource(ambientLightResource.id).then(
        function() {
            console.log('ambientLight: unregisterResource() successful');
        },
        function(error) {
            console.log('ambientLight: unregisterResource() failed with: ' +
                error + ' and result ' + error.result);
        });

    // Exit
    process.exit(0);
});

