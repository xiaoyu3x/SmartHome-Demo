var device = require('iotivity-node')(),
    ledResource,
    sensorPin,
    sensorState = false,
    resourceTypeName = 'oic.r.led',
    resourceInterfaceName = '/a/led';

// Require the MRAA library
var mraa = '';
try {
    mraa = require('mraa');
}
catch (e) {
    console.log('No mraa module: ' + e.message);
}

// Setup LED sensor pin.
function setupHardware() {
    if (mraa) {
        sensorPin = new mraa.Gpio(2);
        sensorPin.dir(mraa.DIR_OUT);
        sensorPin.write(0);
    }
}

// This function parce the incoming Resource properties
// and change the sensor state.
function updateProperties(properties) {
    sensorState = properties.value;

    console.log('\nLed: Update received. value: ' + sensorState);

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
        id: 'led',
        value: sensorState
    };

    console.log('Led: Send the response. value: ' + sensorState);
    return properties;
}

// Set up the notification loop
function notifyObservers(request) {
    ledResource.properties = getProperties();

    device.notify(ledResource).then(
        function() {
            console.log('Led: Successfully notified observers.');
        },
        function(error) {
            console.log('Led: Notify failed with ' + error + ' and result ' +
                error.result);
        });
}

// This is the entity handler for the registered resource.
function entityHandler(request) {
    if (request.type === 'update') {
        updateProperties(request.res);
    } else if (request.type === 'retrieve') {
        ledResource.properties = getProperties();
    }

    request.sendResponse(ledResource).then(
        function() {
            console.log('Led: Successfully responded to request');
        },
        function(error) {
            console.log('Led: Failed to send response with error ' + error +
                ' and result ' + error.result);
        });

    setTimeout(notifyObservers, 200);
}

// Create LED resource
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
        console.log('Led: device.configure() successful');

        // Setup LED pin.
        setupHardware();

        console.log('\nCreate LED resource.');

        // Register LED resource
        device.registerResource({
            id: { path: resourceInterfaceName },
            resourceTypes: [ resourceTypeName ],
            interfaces: [ 'oic.if.baseline' ],
            discoverable: true,
            observable: true,
            properties: getProperties()
        }).then(
            function(resource) {
                console.log('Led: registerResource() successful');
                ledResource = resource;
                device.addEventListener('request', entityHandler);
            },
            function(error) {
                console.log('Led: registerResource() failed with: ' + error);
            });
    },
    function(error) {
        console.log('Led: device.configure() failed with: ' + error);
    });

// Cleanup on SIGINT
process.on('SIGINT', function() {
    console.log('Delete LED Resource.');

    // Turn off LED before we tear down the resource.
    if (mraa)
        sensorPin.write(0);

    // Unregister resource.
    device.unregisterResource(ledResource).then(
        function() {
            console.log('Led: unregisterResource() successful');
        },
        function(error) {
            console.log('Led: unregisterResource() failed with: ' + error +
                ' and result ' + error.result);
        });

    // Exit
    process.exit(0);
});
