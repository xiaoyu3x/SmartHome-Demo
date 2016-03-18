var device = require('iotivity-node')(),
    powerResource,
    uart,
    resourceTypeName = 'oic.r.energy.consumption',
    resourceInterfaceName = '/a/power',
    notifyObserversTimeoutId,
    hasUpdate = false,
    noObservers = true,
    power1 = 100,  // For simulation only
    power2 = 1000; // Ditto

// Require the MRAA library
var mraa = '';
try {
    mraa = require('mraa');
}
catch (e) {
    console.log('No mraa module: ' + e.message);
}

// Setup UART
function setupHardware() {
    if (mraa) {
        uart = new mraa.Uart(0);
        uart.setBaudRate(115200);
        uart.setMode(8, 0, 1);
        uart.setFlowcontrol(false, false);
    }
}

// Read simple json records from the uart.
// The format of the incoming UART data is:
//   {"ch-1": 0, "ch-2": 0}
// Since the UART is constanty sending data we need to:
//   - sync to the start of the record
//   - read all the records but use only the last one
// TODO: we might want to add simple protocol to UART, like sending a read cmd.
function readJsonFromUart() {

    var start = false; end = false;

    var json = "", last = "";

    while (uart.dataAvailable(0)) {
        var ch = uart.readStr(1);

        if (ch == '{')
            start = true;
        else if (ch == '}' && start == true)
            end = true;

        if (start == true)
            json += ch;

        if (start == true && end == true) {
            last = json;
            start = end = false;
            json = "";
        }
    }
    return last;
}

// This function construct the payload and returns when
// the GET request received from the client.
function getProperties() {
    var data = null;
    var obj = {"ch-1": 0, "ch-2": 0};

    if (mraa) {
        data = readJsonFromUart();
    } else {
        data = "{\"ch-1\": " + power1++ + ", \"ch-2\": " + power2++ + "}";
    }
    if (data != null && data != "") {
        console.log(data);
        hasUpdate = true;
    }

    try {
        obj = JSON.parse(data);
    }
    catch(e) {
        console.log("Invalid data: " + e.message);
    }

    // Format the properties.
    var properties =
    {
        rt: resourceTypeName,
        id: 'power',
        power1: obj["ch-1"],
        power2: obj["ch-2"]
    };

    return properties;
}

// Set up the notification loop
function notifyObservers() {
    var properties = getProperties();
    if (hasUpdate) {
        powerResource.properties = properties;
        hasUpdate = false;

        console.log('powerSensor: Send observe response.');
        device.notify(powerResource).catch(
            function(error) {
                console.log('powerSensor: Failed to notify observers.');
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
        powerResource.properties = getProperties();
    } else if (request.type === 'observe') {
        noObservers = false;
        hasUpdate = true;
    }

    request.sendResponse(powerResource).then(
        function() {
            console.log('powerSensor: Successfully responded to request: ' + request.type);
        },
        function(error) {
            console.log('powerSensor: Failed to send response with error ' +
                error + ' and result ' + error.result);
        });

    if (!noObservers && !notifyObserversTimeoutId)
        setTimeout(notifyObservers, 200);
}

// Create Power resource
device.configure({
    role: 'server',
    info: {
        uuid: "SmartHouse.dollhouse",
        name: "SmartHouse",
        manufacturerName: "Intel",
        manufacturerDate: "Mon Mar 14 10:04:17 EET 2016",
        platformVersion: "1.0.1",
        firmwareVersion: "0.0.7",
    }
}).then(
    function() {
        console.log('power: device.configure() successful');

        // Enable presence
        device.enablePresence().then(
            function() {
                console.log('power: device.enablePresence() successful');
            },
            function(error) {
                console.log('power: device.enablePresence() failed with: ' + error);
            });

        // Setup uart
        setupHardware();

        console.log('\nCreate Power resource.');

        // Register Power resource
        device.registerResource({
            id: { path: resourceInterfaceName },
            resourceTypes: [ resourceTypeName ],
            interfaces: [ 'oic.if.baseline' ],
            discoverable: true,
            observable: true,
            properties: getProperties()
        }).then(
            function(resource) {
                console.log('power: registerResource() successful');
                powerResource = resource;
                device.addEventListener('request', entityHandler);
            },
            function(error) {
                console.log('power: registerResource() failed with: ' +
                    error);
            });
    },
    function(error) {
        console.log('power: device.configure() failed with: ' + error);
    });

// Cleanup on SIGINT
process.on('SIGINT', function() {
    console.log('Delete Power Resource.');

    // Unregister resource.
    device.unregisterResource(powerResource).then(
        function() {
            console.log('power: unregisterResource() successful');
        },
        function(error) {
            console.log('power: unregisterResource() failed with: ' +
                error + ' and result ' + error.result);
        });

    // Disable presence
    device.disablePresence().then(
        function() {
            console.log('power: device.disablePresence() successful');
        },
        function(error) {
            console.log('power: device.disablePresence() failed with: ' + error);
        });

    // Exit
    process.exit(0);
});
