var device = require('iotivity-node')('client'),
    debuglog = require('util').debuglog('first_server'),
    express = require('express'),
    fs = require('fs'),
    http = require('http'),
    rules = require('./rules-engine/rules_engine'),
    webSocketServer = require('websocket').server,
    connectionList = {},
    notifyObserversTimeoutId,
    resourcesList = {},
    webComponents = {},
    serverPort = 8080;

var app = express();
app.use(express.static(__dirname + '/gateway-webui'));

debuglog(__dirname + "/rules-engine/rules.json");
var jsonRulesConfig = fs.readFileSync(__dirname + "/rules-engine/rules.json", "utf8");
debuglog(jsonRulesConfig);
rulesEngine = rules.createRulesEngine(jsonRulesConfig);

var server = http.createServer(app);
// systemd socket activation support
if (process.env.LISTEN_FDS) {
    // The first passed file descriptor is fd 3
    var fdStart = 3;
    serverPort = {fd: fdStart};
}

server.listen(serverPort);

wsServer = new webSocketServer({
    httpServer: server,
    // You should not use autoAcceptConnections for production
    // applications, as it defeats all standard cross-origin protection
    // facilities built into the protocol and the browser.  You should
    // *always* verify the connection's origin and decide whether or not
    // to accept it.
    autoAcceptConnections: false
});

function originIsAllowed(origin) {
    // put logic here to detect whether the specified origin is allowed.
    return true;
}

function parseInComingRequest(message, connection) {
     if (message.Event == "update") {
         updateProperties(message.Type, message.att);
     }
}

function updateWebClients(msg, eventType) {
    outmesg_list = [];
    outmesg = {};
    outmesg["Type"] = msg.id;
    outmesg["Event"] = eventType;
    outmesg["att"] = msg;

    outmesg_list.push(outmesg);

    debuglog(JSON.stringify(outmesg_list));
    var newEvents = rulesEngine.processEvents(JSON.stringify(outmesg_list));
    if (newEvents) {
        var actions = JSON.parse(newEvents);
        for (var action in actions) {
            parceInComingRequest(actions[action]);
        }
    }

    for (var key in connectionList) {
        debuglog(key);
        var connection = connectionList[key];
        connection.sendUTF(JSON.stringify(outmesg_list));
    }
}

wsServer.on('request', function(request) {
    if (!originIsAllowed(request.origin)) {
      // Make sure we only accept requests from an allowed origin
      request.reject();
      debuglog((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
      return;
    }

    var connection = request.accept('echo-protocol', request.origin);

    debuglog((new Date()) + ' Connection accepted.');

    if (!(connection.remoteAddress in connectionList)) {
      connectionList[connection.remoteAddress] = connection;

      connection.on('message', function(message) {
          if (message.type === 'utf8') {
              debuglog('Received Message: ' + message.utf8Data);

              parseInComingRequest(JSON.parse(message.utf8Data), connection);
          }
      });
      connection.on('close', function(reasonCode, description) {
          debuglog((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
          delete connectionList[connection.remoteAddress];
      });

    }
});

//------------------------------------------------------------------------------------------------IOT-------------------------------------------------------

function updateProperties(Type, values)
{
    if (Type in webComponents) {
        resourceId = webComponents[Type];
        resource = resourcesList[resourceId];
        if (!resource)
            return;

        debuglog('----------------------------------------------');
        debuglog('Sending Update to ' + Type + ' resourceId:' + resourceId);

        resource.properties = values;
        device.update(resource);
    } else {
        debuglog('No ' + Type + ' online');
    }
}

//when a server seends data to gatway
function obsReqCB(payload, resourceId) {
    var eventType;
    if ("id" in payload) {
        if (!(payload.id in webComponents)) {
            eventType = 'add';
            webComponents[payload.id] = resourceId;
         } else {
            eventType = 'update';
         }
    }

    updateWebClients(payload, eventType);
}


//---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

function observeResource(event) {
    debuglog('Resource changed:' + JSON.stringify(event.resource.properties, null, 4));

    if ('properties' in event.resource) {
        var resourceId = event.resource.id.deviceId + ":" + event.resource.id.path;
        obsReqCB(event.resource.properties, resourceId);
    }
}

function deleteResource(event) {
    var id = this.id.deviceId + ":" + this.id.path;
    debuglog('Client: deleteResource: ' + id);

    var resource = resourcesList[id];
    if (resource) {
        resource.removeEventListener("change", observeResource);
        delete resourcesList[id];
    }
}

// Add a listener that will receive the results of the discovery
device.addEventListener('resourcefound', function(event) {
    // If the resource has identified by deviceId and path,
    // then we don't start observe.
    var resourceId = resourcesList[event.resource.id.deviceId + ":" + event.resource.id.path];

    if (!resourceId) {
        debuglog('Resource found:' + JSON.stringify(event.resource, null, 4));
        resourcesList[event.resource.id.deviceId + ":" + event.resource.id.path] = event.resource;

        // Start observing the resource.
        event.resource.addEventListener("change", observeResource);

        // Start observing the resource deletion.
        event.resource.addEventListener("delete", deleteResource);
     }
});

function discoverResources() {
    debuglog('Discover resources.');
    device.findResources().then(
        function() {
            debuglog('Client: findResources() successful');
        },
        function(error) {
            debuglog('Client: findResources() failed with ' + error +
                ' and result ' + error.result);
        });
    notifyObserversTimeoutId = setTimeout(discoverResources, 5000);
}

// Start iotivity and set up the processing loop
device.subscribe().then(
    function() {
       discoverResources();
    },
    function(error) {
        debuglog('device.subscribe() failed with: ' + error);
    });

// Exit gracefully when interrupted
process.on('SIGINT', function() {
  debuglog('SIGINT: Quitting...');

  // Tear down the processing loop
  if (notifyObserversTimeoutId) {
      clearTimeout(notifyObserversTimeoutId);
      notifyObserversTimeoutId = null;
  }

  // Stop observing
  for (var index in resourcesList) {
     var resource = resourcesList[index];
     if (resource) {
         resource.removeEventListener("change", observeResource);
         resource.removeEventListener("delete", deleteResource);
     }
  }

  // Exit
  process.exit(0);
});
