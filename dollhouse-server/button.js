var device = require('iotivity-node')(),
    buttonResource,
    sensorPin,
    notifyObserversTimeoutId,
    resourceTypeName = 'oic.r.button',
    resourceInterfaceName = '/a/button',
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

// Setup Button pin.
function setupHardware() {
    if (!mraa)
        return;

    sensorPin = new mraa.Gpio(4);
    sensorPin.dir(mraa.DIR_IN);
}

// This function construct the payload and returns when
// the GET request received from the client.
function getProperties() {
    var buttonState = false;

    if (mraa) {
        if (sensorPin.read() == 1)
            buttonState = true;
        else
            buttonState = false;
    } else {
        // Simulate real sensor behavior. This is
        // useful for testing on desktop without mraa.
        buttonState = !sensorState;
    }

    if (sensorState != buttonState) {
        hasUpdate = true;
        sensorState = buttonState;
    }

    // Format the payload.
    var properties = {
        rt: resourceTypeName,
        id: 'button',
        value: sensorState
    };

    return properties;
}

// Set up the notification loop
function notifyObservers() {
    properties = getProperties();

    if (hasUpdate) {
        buttonResource.properties = properties;
        hasUpdate = false;

        console.log('\nbutton: Send the response: ' + sensorState);
        device.notify(buttonResource).catch(
            function(error) {
                console.log('button: Failed to notify observers.');
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
        buttonResource.properties = getProperties();
    } else if (request.type === 'observe') {
        noObservers = false;
        hasUpdate = true;
    }

    request.sendResponse(buttonResource).then(
        function() {
            console.log('button: Successfully responded to request');
        },
        function(error) {
            console.log('button: Failed to send response with error ' +
                error + ' and result ' + error.result);
        });

    if (!noObservers && !notifyObserversTimeoutId)
        setTimeout(notifyObservers, 200);
}

// Create Button resource
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
        console.log('button: device.configure() successful');

        // Enable presence
        device.enablePresence().then(
            function() {
                console.log('button: device.enablePresence() successful');
            },
            function(error) {
                console.log('button: device.enablePresence() failed with: ' + error);
            });

        // Setup Button pin.
        setupHardware();

        console.log('\nCreate button resource.');
        // Register Button resource
        device.registerResource({
            id: { path: resourceInterfaceName },
            resourceTypes: [ resourceTypeName ],
            interfaces: [ 'oic.if.baseline' ],
            discoverable: true,
            observable: true,
            properties: getProperties()
        }).then(
            function(resource) {
                console.log('button: registerResource() successful');
                buttonResource = resource;
                device.addEventListener('request', entityHandler);
            },
            function(error) {
                console.log('button: registerResource() failed with: ' +
                    error);
            });
    },
    function(error) {
        console.log('button: device.configure() failed with: ' + error);
    });

// Cleanup on SIGINT
process.on('SIGINT', function() {
    console.log('Delete Button Resource.');

    // Unregister resource.
    device.unregisterResource(buttonResource).then(
        function() {
            console.log('button: unregisterResource() successful');
        },
        function(error) {
            console.log('button: unregisterResource() failed with: ' +
                error + ' and result ' + error.result);
        });

    // Disable presence
    device.disablePresence().then(
        function() {
            console.log('button: device.disablePresence() successful');
        },
        function(error) {
            console.log('button: device.disablePresence() failed with: ' + error);
        });

    // Exit
    process.exit(0);
});

