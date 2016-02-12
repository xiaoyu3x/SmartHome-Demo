var device = require('iotivity-node')(),
    switchResource,
    sensorPin,
    notifyObserversTimeoutId,
    resourceTypeName = 'oic.r.switch.binary',
    resourceInterfaceName = '/a/binarySwitch',
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

// Setup binary switch pin.
function setupHardware() {
    if (!mraa)
        return;

    sensorPin = new mraa.Gpio(4);
    sensorPin.dir(mraa.DIR_IN);
}

// This function construct the payload and returns when
// the GET request received from the client.
function getProperties() {
    var switchState = false;

    if (mraa) {
        if (sensorPin.read() >= 1)
            switchState = true;
        else
            switchState = false;
    } else {
        // Simulate real sensor behavior. This is
        // useful for testing on desktop without mraa.
        switchState = !sensorState;
    }

    if (sensorState != switchState) {
        hasUpdate = true;
        sensorState = switchState;
    }

    // Format the payload.
    var properties = {
        rt: resourceTypeName,
        id: 'binarySwitch',
        value: sensorState
    };

    return properties;
}

// Set up the notification loop
function notifyObservers() {
    properties = getProperties();

    if (hasUpdate) {
        switchResource.properties = properties;
        hasUpdate = false;

        console.log('\nbinarySwitch: Send the response: ' + sensorState);
        device.notify(switchResource).catch(
            function(error) {
                console.log('binarySwitch: Failed to notify observers.');
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
        notifyObserversTimeoutId = setTimeout(notifyObservers, 1000);
    }
}

// This is the entity handler for the registered resource.
function entityHandler(request) {
    if (request.type === 'retrieve') {
        switchResource.properties = getProperties();
    } else if (request.type === 'observe') {
        noObservers = false;
        hasUpdate = true;
    }

    request.sendResponse(switchResource).then(
        function() {
            console.log('binarySwitch: Successfully responded to request');
        },
        function(error) {
            console.log('binarySwitch: Failed to send response with error ' +
                error + ' and result ' + error.result);
        });

    if (!noObservers && !notifyObserversTimeoutId)
        setTimeout(notifyObservers, 200);
}

// Create binary switch resource
device.configure({
    role: 'server',
    info: {
        uuid: "SmartHouse.dollhouse",
        name: "SmartHouse",
        manufacturerName: "Intel",
        manufacturerDate: "Fri Jan 20 10:04:17 EEST 2016",
        platformVersion: "1.0.0",
        firmwareVersion: "0.0.1",
    }
}).then(
    function() {
        console.log('binarySwitch: device.configure() successful');

        // Enable presence
        device.enablePresence().then(
            function() {
                console.log('binarySwitch: device.enablePresence() successful');
            },
            function(error) {
                console.log('binarySwitch: device.enablePresence() failed with: ' + error);
            });

        // Setup binary switch pin.
        setupHardware();

        console.log('\nCreate button resource.');
        // Register binary switch resource
        device.registerResource({
            id: { path: resourceInterfaceName },
            resourceTypes: [ resourceTypeName ],
            interfaces: [ 'oic.if.baseline' ],
            discoverable: true,
            observable: true,
            properties: getProperties()
        }).then(
            function(resource) {
                console.log('binarySwitch: registerResource() successful');
                switchResource = resource;
                device.addEventListener('request', entityHandler);
            },
            function(error) {
                console.log('binarySwitch: registerResource() failed with: ' +
                    error);
            });
    },
    function(error) {
        console.log('binarySwitch: device.configure() failed with: ' + error);
    });

// Cleanup on SIGINT
process.on('SIGINT', function() {
    console.log('Delete Switch Resource.');

    // Unregister resource.
    device.unregisterResource(switchResource).then(
        function() {
            console.log('binarySwitch: unregisterResource() successful');
        },
        function(error) {
            console.log('binarySwitch: unregisterResource() failed with: ' +
                error + ' and result ' + error.result);
        });

    // Disable presence
    device.disablePresence().then(
        function() {
            console.log('binarySwitch: device.disablePresence() successful');
        },
        function(error) {
            console.log('binarySwitch: device.disablePresence() failed with: ' + error);
        });

    // Exit
    process.exit(0);
});

