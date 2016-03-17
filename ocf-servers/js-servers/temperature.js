var device = require('iotivity-node')(),
    temperatureResource,
    sensorPin,
    beta = 3975, // Value of the thermistor
    resourceTypeName = 'oic.r.temperature',
    resourceInterfaceName = '/a/temperature',
    notifyObserversTimeoutId,
    hasUpdate = false,
    noObservers = false,
    temperature = 0,
    desiredTemperature = 0;

// Units for the temperature.
var units = {
    C: "C",
    F: "F",
    K: "K",
};

// Require the MRAA library.
var mraa = '';
try {
    mraa = require('mraa');
}
catch (e) {
    console.log('No mraa module: ' + e.message);
}

// Setup Temperature sensor pin.
function setupHardware() {
    if (mraa) {
       sensorPin = new mraa.Aio(1);
    }
}

// Get the range property value for temperature
// based on the unit attribute.
function getRange(tempUnit) {
    var range;

    switch (tempUnit) {
        case units.F:
            range = "-40,257";
            break;
        case units.K:
            range = "233.15,398.15";
            break;
        case units.C:
        default:
            range = "-40,125"
            break;
    }

    return range;
}

// This function construct the payload and returns when
// the GET request received from the client.
function getProperties(tempUnit) {
    if (mraa) {
        var raw_value = sensorPin.read();
        var temp = 0.0;

        // Get the resistance of the sensor
        var resistance = (1023 - raw_value) * 10000 / raw_value;
        var Ktemperature = 1 / (Math.log(resistance / 10000) / beta + 1 / 298.15);

        switch (tempUnit) {
            case units.F:
                temperature = Math.round(((Ktemperature - 273.15) * 9.0 / 5.0 + 32.0) * 100) / 100;
                console.log("Temperature: " + temperature + "° Fahrenheit");
                break;
            case units.K:
                temperature = Math.round(Ktemperature * 100) / 100;
                console.log("Temperature: " + temperature + "K Kelvin");
                break;
            case units.C:
            default:
                temperature = Math.round((Ktemperature - 273.15) * 100) / 100;
                console.log("Temperature: " + temperature + "° Celsius");
                break;
        }

        if (temperature >= desiredTemperature)
            hasUpdate = true;
    } else {
        // Simulate real sensor behavior. This is useful
        // for testing on desktop without mraa.
        temperature = temperature + 0.1;
        console.log("Temperature: " + temperature);
        hasUpdate = true;
    }

    // Format the properties.
    var properties = {
        rt: resourceTypeName,
        id: 'temperature',
        temperature: temperature,
        units: tempUnit,
        range: getRange(tempUnit)
    };

    return properties;
}

function updateProperties(properties) {
    var range_temp = getRange(units.C).split(',');
    var min = parseInt(range_temp[0]);
    var max = parseInt(range_temp[1]);

    if (properties.temperature < min || properties.temperature > max)
        return false;

    desiredTemperature = properties.temperature;
    console.log('\nTemperature: Desired value: ' + desiredTemperature);

    return true;
}

// Set up the notification loop
function notifyObservers() {
    var properties = getProperties(units.C);
    if (hasUpdate) {
        temperatureResource.properties = properties;
        hasUpdate = false;

        console.log('Temperature: Send the response: ' + temperature);
        device.notify(temperatureResource).catch(
            function(error) {
                console.log('Temperature: Failed to notify observers.');
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
    var ret = true;
    var error = {};
    if (request.type === 'retrieve') {
        // TODO: Enable this when we have queryParameter enabled in JS bindings.
        /*if (request.res.queryParameter.units && !(request.res.queryParameter.units in units)) {
            ret = false;

            // Format the error properties.
            error = {
                id: 'temperature',
                units: units.C
            };
        } else {
            temperatureResource.properties = getProperties(request.res.queryParameter.units);
        }*/

        temperatureResource.properties = getProperties(units.C);
    } else if (request.type === 'observe') {
        noObservers = false;
        hasUpdate = true;
    } else if (request.type === 'update') {
        ret = updateProperties(request.res);

        // Format the error properties.
        error = {
            id: 'temperature',
            range: getRange(units.C)
        };
    }

    if (!ret) {
        request.sendError(error);
        return;
    }

    request.sendResponse(temperatureResource).then(
        function() {
            console.log('Temperature: Successfully responded to request');
        },
        function(error) {
            console.log('Temperature: Failed to send response with error ' +
                error + ' and result ' + error.result);
        });

    if (!noObservers && !notifyObserversTimeoutId)
        setTimeout(notifyObservers, 200);
}

// Create Temperature resource
device.configure({
    role: 'server',
    info: {
        uuid: "SmartHouse.dollhouse",
        name: "SmartHouse",
        manufacturerName: "Intel",
        manufacturerDate: "Fri Oct 30 10:04:17 EEST 2015",
        platformVersion: "1.0.1",
        firmwareVersion: "0.0.1",
    }
}).then(
    function() {
        console.log('Temperature: device.configure() successful');

        // Enable presence
        device.enablePresence().then(
            function() {
                console.log('Temperature: device.enablePresence() successful');
            },
            function(error) {
                console.log('Temperature: device.enablePresence() failed with: ' + error);
            });

        // Setup Temperature sensor pin.
        setupHardware();

        console.log('\nCreate Temperature resource.');

        // Register Temperature resource
        device.registerResource({
            id: { path: resourceInterfaceName },
            resourceTypes: [ resourceTypeName ],
            interfaces: [ 'oic.if.baseline' ],
            discoverable: true,
            observable: true,
            properties: getProperties(units.C)
        }).then(
            function(resource) {
                console.log('Temperature: registerResource() successful');
                temperatureResource = resource;
                device.addEventListener('request', entityHandler);
            },
            function(error) {
                console.log('Temperature: registerResource() failed with: ' +
                    error);
            });
    },
    function(error) {
        console.log('Temperature: device.configure() failed with: ' + error);
    });

// Cleanup on SIGINT
process.on('SIGINT', function() {
    console.log('Delete temperature Resource.');

    // Unregister resource.
    device.unregisterResource(temperatureResource).then(
        function() {
            console.log('Temperature: unregisterResource() successful');
        },
        function(error) {
            console.log('Temperature: unregisterResource() failed with: ' +
                error + ' and result ' + error.result);
        });

    // Disable presence
    device.disablePresence().then(
        function() {
            console.log('Temperature: device.disablePresence() successful');
        },
        function(error) {
            console.log('Temperature: device.disablePresence() failed with: ' + error);
        });

    // Exit
    process.exit(0);
});
