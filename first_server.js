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

//includeInThisContext(__dirname+"/dollhouse/rules_engine.js");


var fs = require("fs");
console.log(__dirname+"/data.json");


var server = http.createServer(app);
//var jsonRulesConfig = fs.readFileSync(__dirname+"/data.json", "utf8");
//console.log(jsonRulesConfig);
//rule_manger = Rules(jsonRulesConfig);

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

//
function parceInComingRequest(message,connection){
   if (message.Event == "update") {
       update(message.Type,message.att);
   }
}

function updateWebClients(msg){
  outmesg_list = []
  outmesg = {}
  outmesg["Type"] = msg.Type;
  outmesg["Event"] = msg.Event;
  outmesg["att"] = msg.ATT.values;


  outmesg_list.push(outmesg);

  console.log(JSON.stringify(outmesg_list));


  for (var key in connectionList){
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

    if(!(connection.remoteAddress in connectionList)){
      connectionList[connection.remoteAddress] = connection;

      connection.on('message', function(message) {
          if (message.type === 'utf8') {
              console.log('Received Message: ' + message.utf8Data);

              parceInComingRequest(JSON.parse(message.utf8Data),connection);
          }
      });
      connection.on('close', function(reasonCode, description) {
          console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
          delete connectionList[connection.remoteAddress];
      });

    }
});

//------------------------------------------------------------------------------------------------IOT-------------------------------------------------------
  var intervalId,
  handle = {},
  iotivity = require( "iotivity" ),
  resourcesList ={},
  TAG = "NodeServer";


function InvokeOCDoResource(absoluteUrl, Method, QOS, obsReqCB, destination, payload){
  getHandle = {};
  iotivity.OCDoResource(
      getHandle,
      Method,
      absoluteUrl,
      destination,
      payload,
      iotivity.OCConnectivityType.CT_DEFAULT,
      QOS,
      function( handle, response ) {
        console.log( "Received response to GET request:" );
        //console.log( JSON.stringify( response, null, 4 ) );
        return iotivity.OCStackApplicationResult.OC_STACK_DELETE_TRANSACTION;
      },
      null );
}

function update(Type,values)
{
    if(Type in WebCompoints){
      URi = WebCompoints[Type];

      destination = resourcesList[URi];

      console.log( "----------------------------------------------" );
      console.log( "Sendng Update to "+ Type + " uri:"+URi);
      payload = {
            type: iotivity.OCPayloadType.PAYLOAD_TYPE_REPRESENTATION,
            values: {
            }
          };
      payload.values = values;

      InvokeOCDoResource(URi, iotivity.OCMethod.OC_REST_PUT, iotivity.OCQualityOfService.OC_HIGH_QOS, obsReqCB, destination, payload)
    }else{
      console.log( "No "+Type+" online");
    }
}

var WebCompoints = {};
//when a server seends data to gatway

function obsReqCB( payload,Uri){
 
  if ("Type" in payload){
    if(!(payload.Type in WebCompoints)){
        payload.Event = 'add';
        WebCompoints[payload.Type] = Uri;
      }else{
         payload.Event = 'update';
      }
  }
  
  updateWebClients(payload);
}


//---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

// Start iotivity and set up the processing loop
iotivity.OCInit( null, 0, iotivity.OCMode.OC_SERVER );

intervalId = setInterval( function() {
  iotivity.OCProcess();
}, 1000 );

iotivity.OCSetDeviceInfo( { deviceName: "SmartHouse" } );
iotivity.OCSetPlatformInfo( {
  platformID: "SmartHouse.dollhouse",
  manufacturerName: "iotivity-node"
} );


function SensorObserving ( handle, response ) {
  console.log( "Received response to OBSERVE request:" );
  if('payload' in response){
    if('values' in response.payload){
      obsReqCB(response.payload.values,response.payload.uri);
    }
  }
  return iotivity.OCStackApplicationResult.OC_STACK_KEEP_TRANSACTION;
}



function bin2String(array) {
  var result = "";
  for (var i = 0; i < array.length; i++) {
    result += String.fromCharCode(array[i]);
  }
  return result;
}


function OCEntityHandlerCb( flag, request ) {
  

  if(request){
    console.log( "Entity handler called with flag = " + flag + " and the following request:" );
    //console.log( JSON.stringify( request, null, 4 ) );

    if(request.devAddr && request.payload){
      query = "coap://"+bin2String(request.devAddr.addr)+"/oic/res";
      console.log(query);
      StarteObserve(query);
    }
  }
    return iotivity.OCEntityHandlerResult.OC_EH_OK;
}


function StarteObserve(query){


  iotivity.OCDoResource(

  // The bindings fill in this object
  handle,

  iotivity.OCMethod.OC_REST_DISCOVER,

  // Standard path for discovering resources
  iotivity.OC_RSRVD_WELL_KNOWN_URI,

  // There is no destination
  null,

  // There is no payload
  null,
  iotivity.OCConnectivityType.CT_DEFAULT,
  iotivity.OCQualityOfService.OC_HIGH_QOS,
  SensorCallBack,

  // There are no header options
  null );
}


function SensorCallBack( handle, response ) {
  console.log( "Received response to DISCOVER request:" );
  //console.log( JSON.stringify( response, null, 4 ) );
  var index,
    destination = response.addr,
    getHandle = {},
    resources = response && response.payload && response.payload.resources,
    resourceCount = resources.length ? resources.length : 0;

    // If the sample URI is among the resources, issue the OBSERVE request to it
    for ( index = 0 ; index < resourceCount ; index++ ) {

      if (!(resources[ index ].uri in resourcesList)){
        resourcesList[resources[ index ].uri] = destination;

         console.log( "Observing " + resources[ index ].uri );

         iotivity.OCDoResource(
          getHandle,
          iotivity.OCMethod.OC_REST_OBSERVE,
          resources[ index ].uri,
          destination,
          null,
          iotivity.OCConnectivityType.CT_DEFAULT,
          iotivity.OCQualityOfService.OC_HIGH_QOS,
          SensorObserving,
          null );

      }else{
        console.log( "Erro Observing " + resources[ index ].uri );
        iotivity.OCDoResource(
          getHandle,
          iotivity.OCMethod.OC_REST_OBSERVE,
          resources[ index ].uri,
          destination,
          null,
          iotivity.OCConnectivityType.CT_DEFAULT,
          iotivity.OCQualityOfService.OC_HIGH_QOS,
          SensorObserving,
          null );
      }
    }

  return iotivity.OCStackApplicationResult.OC_STACK_KEEP_TRANSACTION;
}



// Create a new resource
iotivity.OCCreateResource(

  // The bindings fill in this object
  handle,

  "core.hgw",
  iotivity.OC_RSRVD_INTERFACE_DEFAULT,
  "/a/hgw",
  OCEntityHandlerCb
  ,
  iotivity.OCResourceProperty.OC_DISCOVERABLE );


// Exit gracefully when interrupted
process.on( "SIGINT", function() {
  console.log( "SIGINT: Quitting..." );

  // Tear down the processing loop and stop iotivity
  clearInterval( intervalId );
  iotivity.OCDeleteResource( handle.handle );
  iotivity.OCStop();

  // Exit
  process.exit( 0 );
} );



