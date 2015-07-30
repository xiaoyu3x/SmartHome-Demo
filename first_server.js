var WebSocketServer = require('websocket').server;
var http = require('http')
  , express = require('express')
  , app = express();

app.use(express.static(__dirname + '/dollhouse'));

var server = http.createServer(app);

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

function originIsAllowed(origin) {
  // put logic here to detect whether the specified origin is allowed.
  return true;
}

//connection.sendUTF();
function parceInComingRequest(message,connection){
   if (message.Event == "update") {
    if(message.Type == "boxFan"){
       updateFan(message.att["on_off"]);
    }

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
    connection.on('message', function(message) {
        if (message.type === 'utf8') {
            console.log('Received Message: ' + message.utf8Data);
            parceInComingRequest(JSON.parse(message.utf8Data),connection);
        }
    });
    connection.on('close', function(reasonCode, description) {
        console.log((new Date()) + ' Peer ' + connection.remoteAddress + ' disconnected.');
    });
});

//------------------------------------------------------------------------------------------------IOT-------------------------------------------------------
var intervalId,
  iotivity = require( "iotivity" ),
  handle= {};
var OC_CONNTYPE = iotivity.OCConnectivityType.OC_IPV4;
var gNumObserveNotifies = 0;

// Construct the absolute URL for the resource from the OCDoResource() response
function getAbsoluteUrl( response ) {
  var payload, oic,
    ipv4Bytes = [],
    portHolder = {};

  if ( iotivity.OCStackResult.OC_STACK_OK !==
      iotivity.OCDevAddrToIPv4Addr( response.addr, ipv4Bytes ) ) {
    return;
  }

  if ( iotivity.OCStackResult.OC_STACK_OK !==
      iotivity.OCDevAddrToPort( response.addr, portHolder ) ) {
    return;
  }

  payload = JSON.parse( response.resJSONPayload );
  oic = payload.oic || payload.oc;

  return {href:"coap://" +
    ipv4Bytes[ 0 ] + "." + ipv4Bytes[ 1 ] + "." + ipv4Bytes[ 2 ] + "." + ipv4Bytes[ 3 ] + ":" +
    portHolder.port + oic[ 0 ].href, type:oic[ 0 ].href};
}


function updateFan(Fan)
{
    if('/a/fan' in Resorce_list){
      absoluteUrl = Resorce_list['/a/fan'];
      console.log( "OCDoResource() handler for Update: Entering" );
      console.log( "absolute url discovered: " + absoluteUrl.href );

      var payload = JSON.stringify( 
        {
          "oc": [
            {"rep": {
              "fanstate": (Fan ? "on":"off")
              }
            }
          ]
        }
      );

      InvokeOCDoResource(absoluteUrl, iotivity.OCMethod.OC_REST_PUT, iotivity.OCQualityOfService.OC_HIGH_QOS, obsReqCB, payload)
    }else{
      console.log( "No boxFan online");
    }
}


function obsReqCB( handle, clientResponse ){

   console.log("Callback Context for OBS query recvd successfully:" +handle);
   if(clientResponse)
     {
      console.log("StackResult: %s", clientResponse.result);
        console.log("SEQUENCE NUMBER: %d", clientResponse.sequenceNumber);
        console.log("Callback Context for OBSERVE notification recvd successfully " + gNumObserveNotifies);
        console.log("JSON = %s =============> Obs Response",clientResponse.resJSONPayload);
        gNumObserveNotifies++;
        if (gNumObserveNotifies == 5) //large number to test observing in DELETE case.
        {

          //sendPut(clientResponse);


        }
        if(clientResponse.sequenceNumber == iotivity.OCObserveAction.OC_OBSERVE_REGISTER)
        {
            console.log("This also serves as a registration confirmation");
        }
        else if(clientResponse.sequenceNumber == iotivity.OCObserveAction.OC_OBSERVE_DEREGISTER)
        {
           console.log("This also serves as a deregistration confirmation");
            return iotivity.OCStackApplicationResult.OC_STACK_DELETE_TRANSACTION;
        }
        else if(clientResponse.sequenceNumber == iotivity.OCObserveAction.OC_OBSERVE_NO_OPTION)
        {
           console.log("This also tells you that registration/deregistration failed");
            return iotivity.OCStackApplicationResult.OC_STACK_DELETE_TRANSACTION;
        }

    }
    else
    {
         //console.log("obsReqCB received Null clientResponse");
    }
    return iotivity.OCStackApplicationResult.OC_STACK_KEEP_TRANSACTION;

}


function InvokeOCDoResource(query, method, qos, cb, request)
{
  console.log("\n\nExecuting InitObserveRequest");
    var ret;
    var Resourcehandle= {};

    ret = iotivity.OCDoResource(Resourcehandle, method, query, null, request,
                       (OC_CONNTYPE), qos, cb, null, 0);

    if (ret != iotivity.OCStackResult.OC_STACK_OK)
    {
        console.log("OCDoResource returns error " + ret + " with method "+method);
    }
    else if (method == iotivity.OCMethod.OC_REST_OBSERVE || method == iotivity.OCMethod.OC_REST_OBSERVE_ALL)
    {
        gObserveDoHandle = handle;
    }
    return ret;
}

var Resorce_list =  {};


//Step2`
function discoveryReqCB( handle, clientResponse ) {
  console.log( "OCDoResource() handler for discovery: Entering" );

  if (clientResponse)
    {
      console.log("StackResult:" + clientResponse.result);
      console.log("Discovered on %s", clientResponse.connType);
      absoluteUrl = getAbsoluteUrl( clientResponse );

    if(!(absoluteUrl.type in Resorce_list)){
      
      console.log( "absolute url discovered: " + absoluteUrl.href );
      Resorce_list[absoluteUrl.type] = absoluteUrl.href;
      InvokeOCDoResource(absoluteUrl.href, iotivity.OCMethod.OC_REST_OBSERVE, iotivity.OCQualityOfService.OC_HIGH_QOS, obsReqCB, null)

    }

  }
    else
    {
       console.log("discoveryReqCB received Null clientResponse");
    }

  return iotivity.OCStackApplicationResult.OC_STACK_KEEP_TRANSACTION;
}



function startResorce(){

  iotivity.OCCreateResource(
  handle,
  "gw.sensor",
  "oc.mi.def",
  "/gw/sensor",
  function( flag, request ) {

    var ehResult = iotivity.OCEntityHandlerResult.OC_EH_OK;
    var pResponse = iotivity.OCEntityHandlerResult.OC_EH_OK;
    var deviceInfo = -1;
    var payload = JSON.stringify( {
        "href": {
          "rep": {
            "0": "random",
            "1": "int",
            "2": 42
          }
        }
      } );

    if(request.method == iotivity.OCMethod.OC_REST_GET) {
      console.log(" Sensors Get Request");

    }
    else if(request.method == iotivity.OCMethod.OC_REST_PUT) {
      console.log(" Sensors Put Request");
      if('reqJSONPayload' in request){
      
        var inpayload = JSON.parse(request.reqJSONPayload);
        deviceInfo = inpayload.oc[0].rep;
        
        
      }
    }else {
        console.log(" Sensors unsupported request type "+request.method );
        pResponse = iotivity.OCEntityHandlerResult.OC_EH_ERROR
        ehResult = iotivity.OCEntityHandlerResult.OC_EH_ERROR;
    }

    console.log( "OCCreateResource() handler: Responding with " + payload );

    var resp = iotivity.OCDoResponse( {
      requestHandle: request.requestHandle.handle,
      resourceHandle: request.resource.handle,
      ehResult: pResponse,
      payload: payload,
      payloadSize: payload.length,
      numSendVendorSpecificHeaderOptions: 0,
      sendVendorSpecificHeaderOptions: [],
      resourceUri: 0,
      persistentBufferFlag: 0
    } );

    if(iotivity.OCStackResult.OC_STACK_OK == resp && deviceInfo != -1){

      findResorce(deviceInfo.address);
    }

    

    return ehResult;
    
  },
  iotivity.OCResourceProperty.OC_DISCOVERABLE |
  iotivity.OCResourceProperty.OC_OBSERVABLE
);
}

function findResorce(uri){
  //Step1
  var MULTICAST_RESOURCE_DISCOVERY_QUERY = "/oc/core?rt="+uri;
  console.log("SEARCHING FOR "+MULTICAST_RESOURCE_DISCOVERY_QUERY);
// Initial call by which we discover the resource we wish to observe
  console.log(iotivity.OCDoResource(
    handle,
    iotivity.OCMethod.OC_REST_GET,
    MULTICAST_RESOURCE_DISCOVERY_QUERY,
    null,
    null,
    (iotivity.OCConnectivityType.OC_ALL),
    iotivity.OCQualityOfService.OC_HIGH_QOS,
    discoveryReqCB,
    null,
    0 ));
}


var devicelist = {list:[], data:[]};
var devicelist_count = 0;

iotivity.OCInit( null, 0, iotivity.OCMode.OC_CLIENT_SERVER );

intervalId = setInterval( function() {
  iotivity.OCProcess();
}, 10 );

startResorce();
//findResorce("com.intel.fan");


process.on( "SIGINT", function() {
  console.log( "SIGINT: Quitting..." );
  //clearInterval( checkclientsintervalId );
  clearInterval( intervalId );
  iotivity.OCStop();
  process.exit( 0 );
} );



