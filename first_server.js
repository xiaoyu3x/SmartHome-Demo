var WebSocketServer = require('websocket').server;
var http = require('http')
    , express = require('express')
    , app = express();

app.use(express.static(__dirname + '/dollhouse'));

var fs = require('fs');
var vm = require('vm');
var includeInThisContext = function(path) {
    var code = fs.readFileSync(path);
    vm.runInThisContext(code, path);
}.bind(this);

var rules = require('./dollhouse/rules_engine');

var fs = require('fs');
console.log(__dirname + "/data.json");

var server = http.createServer(app);
var jsonRulesConfig = fs.readFileSync(__dirname + "/data.json", "utf8");
console.log(jsonRulesConfig);
rulesEngine = rules.createRulesEngine(jsonRulesConfig);

//var server = http.createServer(function(request, response) {
//    console.log((new Date()) + ' Received request for ' + request.url);
//    response.writeHead(404);
//    response.end();
//});

server.listen(8080, function() {
    console.log((new Date()) + ' Server is listening on port 8080');
});

wsServer = new WebSocketServer({
    httpServer: server,
    // You should not use autoAcceptConnections for production
    // applications, as it defeats all standard cross-origin protection
    // facilities built into the protocol and the browser.  You should
    // *always* verify the connection's origin and decide whether or not
    // to accept it.
    autoAcceptConnections: false
});

var connectionList = {};

function originIsAllowed(origin) {
    // put logic here to detect whether the specified origin is allowed.
    return true;
}

function parceInComingRequest(message, connection) {
     if (message.Event == "update") {
         update(message.Type, message.att);
     }
}

function updateWebClients(msg, eventType) {
    outmesg_list = [];
    outmesg = {};
    outmesg["Type"] = msg.id;
    outmesg["Event"] = eventType;
    outmesg["att"] = msg;

    outmesg_list.push(outmesg);

    console.log(JSON.stringify(outmesg_list));
    //var newEvents = rulesEngine.processEvents(JSON.stringify(outmesg_list));
    //console.log(newEvents);

    for (var key in connectionList) {
        console.log(key);
        var connection = connectionList[key];
        connection.sendUTF(JSON.stringify(outmesg_list));
        //connection.sendUTF();
    }
}

wsServer.on('request', function(request) {
    if (!originIsAllowed(request.origin)) {
      // Make sure we only accept requests from an allowed origin
      request.reject();
      console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }

    var connection = request.accept('echo-protocol', request.origin);

    console.log((new Date()) + ' Connection accepted.');

    if (!(connection.remoteAddress in connectionList)) {
      connectionList[connection.remoteAddress] = connection;

      connection.on('message', function(message) {
          if (message.type === 'utf8') {
              console.log('Received Message: ' + message.utf8Data);

              parceInComingRequest(JSON.parse(message.utf8Data), connection);
          }
      });
      connection.on('close', function(reasonCode, description) {
          console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
          delete connectionList[connection.remoteAddress];
      });

    }
});

//------------------------------------------------------------------------------------------------IOT-------------------------------------------------------
var resourcesList = {},
    devicesList = {},
    TAG = "NodeServer";

function update(Type, values)
{
    if (Type in WebCompoints) {
        URi = WebCompoints[Type];
        resource = resourcesList[URi];

        console.log('----------------------------------------------');
        console.log('Sendng Update to ' + Type + ' uri:' + URi);

        resource.properties = values;
        device.client.updateResource(resource.id, resource);
    } else {
        console.log('No ' + Type + ' online');
    }
}

var WebCompoints = {};
//when a server seends data to gatway

function obsReqCB(payload, Uri) {
    var eventType;
    if ("id" in payload) {
        if (!(payload.id in WebCompoints)) {
            eventType = 'add';
            WebCompoints[payload.id] = Uri;
         } else {
            eventType = 'update';
         }
    }

    updateWebClients(payload, eventType);
}


//---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

// Start iotivity and set up the processing loop
var notifyObserversTimeoutId,
    resourcehanlde,
    device = require('iotivity-node')();

device.configure({
    role: 'client',
    connectionMode: 'acked'
}).then(
    function() {
        console.log('Client: device.configure() successful');
        discoverDevices();
    },
    function(error) {
        console.log('Client: device.configure() failed with ' + error);
    });

function SensorObserving(response) {
    console.log('Resource changed:' + JSON.stringify(response.properties, null, 4));

    if ('properties' in response) {
        obsReqCB(response.properties, response.uri);
    }
}

device.client.on('resourcechange', function(event) {
    SensorObserving(event.resource);
});

// Add a listener that will receive the results of the discovery
device.client.addEventListener('resourcefound', function(event) {
    if (!(event.resource.url in resourcesList) ||
           (event.resource.deviceId != resourcesList[event.resource.url].deviceId)) {
        console.log('Resource found:' + JSON.stringify(event.resource, null, 4));

        resourcesList[event.resource.uri] = event.resource;
        device.client.startObserving(event.resource.id).then(
            function(observedResource) {
                console.log('Client: startObserving() successful');
            },
            function(error) {
                console.log('Client: startObserving() failed with ' + error + ' and result ' +
                    error.result);
            });
     }
});

function discoverResources() {
    console.log('Discover resources.');
    device.client.findResources().then(
        function() {
            console.log('Client: findResources() successful');
        },
        function(error) {
            console.log('Client: findResources() failed with ' + error +
                ' and result ' + error.result);
        });
}

device.client.addEventListener('devicefound', function(event) {
    if (!(event.device.uuid in devicesList)) {
        console.log('New device: ' + event.device.uuid + ' found.');
        devicesList[event.device.uuid] = event.device;
        discoverResources();
    }
});

function discoverDevices() {
    device.client.findDevices().then(
        function() {
            console.log('Client: findDevices() successful');
        },
        function(error) {
            console.log('Client: findDevices() failed with ' + error +
                ' and result ' + error.result);
        });
    notifyObserversTimeoutId = setTimeout(discoverDevices, 5000);
}

// Exit gracefully when interrupted
process.on('SIGINT', function() {
  console.log('SIGINT: Quitting...');

  // Tear down the processing loop
  if (notifyObserversTimeoutId) {
    clearTimeout(notifyObserversTimeoutId);
    notifyObserversTimeoutId = null;
  }

  // Cancel observing
  for (var index in resourcesList) {
     device.client.cancelObserving(resourcesList[index].id);
  }

  // Exit
  process.exit(0);
});
