var device = require('iotivity-node')('server'),
    _ = require('lodash'),
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

// Default: MinnowBoard MAX/Turbot, raw mode
var dev = "/dev/ttyUSB0";
// e.g., node power-uart.js /dev/ttyS0
var args = process.argv.slice(2);
args.forEach(function(entry) {
    dev = entry;
});

// Setup UART
function setupHardware() {
    if (mraa) {
        uart = new mraa.Uart(dev);
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

    var json = "", last = "", count = 0;

    while (uart.dataAvailable(0)) {
        var ch = uart.readStr(1);
        count++
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
        /* In some cases the reading wont stop, make it stop. */
        if (count >= 4096) {
          console.log("UART read error.");
          break;
        }
    }
    console.log("read: " + count + " bytes");
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

// Event handlers for the registered resource.
function observeHandler(request) {
    powerResource.properties = getProperties();
    request.sendResponse(powerResource).catch(handleError);

    noObservers = false;
    hasUpdate = true;

    if (!notifyObserversTimeoutId)
        setTimeout(notifyObservers, 200);
}

function retrieveHandler(request) {
    powerResource.properties = getProperties();
    request.sendResponse(powerResource).catch(handleError);
}

device.device = _.extend(device.device, {
    name: 'Smart Home Energy Consumption'
});

function handleError(error) {
    console.log('power: Failed to send response with error ' + error +
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

                // Add event handlers for each supported request type
                device.addEventListener('observerequest', observeHandler);
                device.addEventListener('retrieverequest', retrieveHandler);
            },
            function(error) {
                console.log('power: registerResource() failed with: ' +
                    error);
            });
    },
    function(error) {
        console.log('power: device.enablePresence() failed with: ' + error);
    });

// Cleanup on SIGINT
process.on('SIGINT', function() {
    console.log('Delete Power Resource.');

    // Remove event listeners
    device.removeEventListener('observerequest', observeHandler);
    device.removeEventListener('retrieverequest', retrieveHandler);

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
