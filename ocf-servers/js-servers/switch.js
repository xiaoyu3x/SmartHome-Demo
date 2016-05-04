var device = require('iotivity-node')('server'),
    _ = require('lodash'),
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

// Event handlers for the registered resource.
function observeHandler(request) {
    switchResource.properties = getProperties();
    request.sendResponse(switchResource).catch(handleError);

    noObservers = false;
    hasUpdate = true;

    if (!notifyObserversTimeoutId)
        setTimeout(notifyObservers, 200);
}

function retrieveHandler(request) {
    switchResource.properties = getProperties();
    request.sendResponse(switchResource).catch(handleError);
}

device.device = _.extend(device.device, {
    name: 'Smart Home Binary Switch'
});

function handleError(error) {
    console.log('binarySwitch: Failed to send response with error ' + error +
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

                // Add event handlers for each supported request type
                device.addEventListener('observerequest', observeHandler);
                device.addEventListener('retrieverequest', retrieveHandler);
            },
            function(error) {
                console.log('binarySwitch: registerResource() failed with: ' +
                    error);
            });
    },
    function(error) {
        console.log('binarySwitch: device.enablePresence() failed with: ' + error);
    });

// Cleanup on SIGINT
process.on('SIGINT', function() {
    console.log('Delete Switch Resource.');

    // Remove event listeners
    device.removeEventListener('observerequest', observeHandler);
    device.removeEventListener('retrieverequest', retrieveHandler);

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

