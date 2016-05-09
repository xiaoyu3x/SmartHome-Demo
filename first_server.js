var WebSocketServer = require('websocket').server;
var http = require('http')
    , express = require('express')
    , app = express()
    , systemd = require('systemd');

app.use(express.static(__dirname + '/gateway-webui'));

var fs = require('fs');
var vm = require('vm');
var includeInThisContext = function(path) {
    var code = fs.readFileSync(path);
    vm.runInThisContext(code, path);
}.bind(this);

var rules = require('./gateway-webui/rules_engine');

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

var serverPort = process.env.LISTEN_PID > 0 ? 'systemd' : 8080;
server.listen(serverPort);

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
        resourceId = WebCompoints[Type];
        resource = resourcesList[resourceId];
        if (!resource)
            return;

        console.log('----------------------------------------------');
        console.log('Sending Update to ' + Type + ' resourceId:' + resourceId);

        resource.properties = values;
        device.update(resource);
    } else {
        console.log('No ' + Type + ' online');
    }
}

var WebCompoints = {};
//when a server seends data to gatway

function obsReqCB(payload, resourceId) {
    var eventType;
    if ("id" in payload) {
        if (!(payload.id in WebCompoints)) {
            eventType = 'add';
            WebCompoints[payload.id] = resourceId;
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
    device = require('iotivity-node')("client");

function SensorObserving(event) {
    console.log('Resource changed:' + JSON.stringify(event.resource.properties, null, 4));

    if ('properties' in event.resource) {
        var resourceId = event.resource.id.deviceId + ":" + event.resource.id.path;
        obsReqCB(event.resource.properties, resourceId);
    }
}

function deleteResource(event) {
    var id = this.id.deviceId + ":" + this.id.path;
    console.log('Client: deleteResource: ' + id);

    var resource = resourcesList[id];
    if (resource) {
        resource.removeEventListener("change", SensorObserving);
        delete resourcesList[id];
    }
}

// Add a listener that will receive the results of the discovery
device.addEventListener('resourcefound', function(event) {
    // If the resource has identified by deviceId and path,
    // then we don't start observe.
    var resourceId = resourcesList[event.resource.id.deviceId + ":" + event.resource.id.path];

    if (!resourceId) {
        console.log('Resource found:' + JSON.stringify(event.resource, null, 4));
        resourcesList[event.resource.id.deviceId + ":" + event.resource.id.path] = event.resource;

        // Start observing the resource.
        event.resource.addEventListener("change", SensorObserving);

        // Start observing the resource deletion.
        event.resource.addEventListener("delete", deleteResource);
     }
});

function discoverResources() {
    console.log('Discover resources.');
    device.findResources().then(
        function() {
            console.log('Client: findResources() successful');
        },
        function(error) {
            console.log('Client: findResources() failed with ' + error +
                ' and result ' + error.result);
        });
    notifyObserversTimeoutId = setTimeout(discoverResources, 5000);
}

discoverResources();

// Exit gracefully when interrupted
process.on('SIGINT', function() {
  console.log('SIGINT: Quitting...');

  // Tear down the processing loop
  if (notifyObserversTimeoutId) {
      clearTimeout(notifyObserversTimeoutId);
      notifyObserversTimeoutId = null;
  }

  // Stop observing
  for (var index in resourcesList) {
     var resource = resourcesList[index];
     if (resource) {
         resource.removeEventListener("change", SensorObserving);
         resource.removeEventListener("delete", deleteResource);
     }
  }

  // Exit
  process.exit(0);
});
