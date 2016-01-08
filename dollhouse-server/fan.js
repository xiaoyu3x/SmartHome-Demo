var device = require('iotivity-node')(),
    fanResource,
    sensorPin,
    sensorState = false,
    resourceTypeName = 'oic.r.fan',
    resourceInterfaceName = '/a/fan';

// Require the MRAA library
var mraa = '';
try {
    mraa = require('mraa');
}
catch (e) {
    console.log('No mraa module: ' + e.message);
}

// Setup Fan sensor pin.
function setupHardware() {
    if (mraa) {
        sensorPin = new mraa.Gpio(9);
        sensorPin.dir(mraa.DIR_OUT);
        sensorPin.write(0);
    }
}

// This function parce the incoming Resource properties
// and change the sensor state.
function updateProperties(properties) {
    sensorState = properties.value;

    console.log('\nFan: Update received. value: ' + sensorState);

    if (!mraa)
        return;

    if (sensorState)
      sensorPin.write(1);
    else
      sensorPin.write(0);
}

// This function construct the payload and returns when
// the GET request received from the client.
function getProperties() {
    // Format the payload.
    var properties = {
        rt: resourceTypeName,
        id: 'boxFan',
        value: sensorState
    };

    console.log('Fan: Send the response. value: ' + sensorState);
    return properties;
}

// Set up the notification loop
function notifyObservers(request) {
    fanResource.properties = getProperties();

    device.notify(fanResource).then(
        function() {
            console.log('Fan: Successfully notified observers.');
        },
        function(error) {
            console.log('Fan: Notify failed with ' + error + ' and result ' +
                error.result);
        });
}

// This is the entity handler for the registered resource.
function entityHandler(request) {
    if (request.type === 'update') {
        updateProperties(request.res);
    } else if (request.type === 'retrieve') {
        fanResource.properties = getProperties();
    }

    request.sendResponse(fanResource).then(
        function() {
            console.log('Fan: Successfully responded to request');
        },
        function(error) {
            console.log('Fan: Failed to send response with error ' + error +
                ' and result ' + error.result);
        });

    setTimeout(notifyObservers, 200);
}

// Create Fan resource
device.configure({
    role: 'server',
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
        console.log('Fan: device.configure() successful');

        device.enablePresence().then(
            function() {
                console.log('Fan: device.enablePresence() successful');
            },
            function(error) {
                console.log('Fan: device.enablePresence() failed with: ' + error);
            });

        // Setup Fan sensor pin.
        setupHardware();

        console.log('\nCreate Fan resource.');

        // Register Fan resource
        device.registerResource({
            id: { path: resourceInterfaceName },
            resourceTypes: [ resourceTypeName ],
            interfaces: ['oic.if.baseline'],
            discoverable: true,
            observable: true,
            properties: getProperties()
        }).then(
            function(resource) {
                console.log('Fan: registerResource() successful');
                fanResource = resource;
                device.addEventListener('request', entityHandler);
            },
            function(error) {
                console.log('Fan: registerResource() failed with: ' + error);
            });
    },
    function(error) {
        console.log('Fan: device.configure() failed with: ' + error);
    });

// Cleanup on SIGINT
process.on('SIGINT', function() {
    console.log('Delete Fan Resource.');

    // Stop fan before we tear down the resource.
    if (mraa)
        sensorPin.write(0);

    // Unregister resource.
    device.unregisterResource(fanResource).then(
        function() {
            console.log('Fan: unregisterResource() successful');
        },
        function(error) {
            console.log('Fan: unregisterResource() failed with: ' + error +
                ' and result ' + error.result);
        });

    device.disablePresence().then(
        function() {
            console.log('Fan: device.disablePresence() successful');
        },
        function(error) {
            console.log('Fan: device.disablePresence() failed with: ' + error);
        });

    // Exit
    process.exit(0);
});
