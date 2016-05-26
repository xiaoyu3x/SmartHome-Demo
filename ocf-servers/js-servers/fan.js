var device = require('iotivity-node')('server'),
    _ = require('lodash'),
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

// Event handlers for the registered resource.
function observeHandler(request) {
    request.sendResponse(fanResource).catch(handleError);
    setTimeout(notifyObservers, 200);
}

function retrieveHandler(request) {
    fanResource.properties = getProperties();
    request.sendResponse(fanResource).catch(handleError);
}

function updateHandler(request) {
    updateProperties(request.res);

    fanResource.properties = getProperties();
    request.sendResponse(fanResource).catch(handleError);
    setTimeout(notifyObservers, 200);
}

device.device = _.extend(device.device, {
    name: 'Smart Home Fan'
});

function handleError(error) {
    console.log('Fan: Failed to send response with error ' + error +
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
        console.log('Fan: device.enablePresence() successful');

        // Setup Fan sensor pin.
        setupHardware();

        console.log('\nCreate Fan resource.');

        // Register Fan resource
        device.register({
            id: { path: resourceInterfaceName },
            resourceTypes: [ resourceTypeName ],
            interfaces: [ 'oic.if.baseline' ],
            discoverable: true,
            observable: true,
            properties: getProperties()
        }).then(
            function(resource) {
                console.log('Fan: register() esource() successful');
                fanResource = resource;

                // Add event handlers for each supported request type
                device.addEventListener('observerequest', observeHandler);
                device.addEventListener('retrieverequest', retrieveHandler);
                device.addEventListener('updaterequest', updateHandler);
            },
            function(error) {
                console.log('Fan: register() resource() failed with: ' + error);
            });
    },
    function(error) {
        console.log('Fan: device.enablePresence() failed with: ' + error);
    });

// Cleanup on SIGINT
process.on('SIGINT', function() {
    console.log('Delete Fan Resource.');

    // Stop fan before we tear down the resource.
    if (mraa)
        sensorPin.write(0);

    // Remove event listeners
    device.removeEventListener('observerequest', observeHandler);
    device.removeEventListener('retrieverequest', retrieveHandler);
    device.removeEventListener('updaterequest', updateHandler);

    // Unregister resource.
    device.unregister(fanResource).then(
        function() {
            console.log('Fan: unregister() resource successful');
        },
        function(error) {
            console.log('Fan: unregister() resource() failed with: ' + error +
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
