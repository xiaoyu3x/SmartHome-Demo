
  var listOBJ = {};

// Initialize everything when the window finishes loading
window.addEventListener("load", function(event) {
  var status = document.getElementById("status");
  var url = document.getElementById("url");
  var open = document.getElementById("open");
  var close = document.getElementById("close");
  var send = document.getElementById("send");
  var text = document.getElementById("text");
  var message = document.getElementById("message");
  var socket;

  status.textContent = "Not Connected";
  url.value = "ws://localhost:8080";
  close.disabled = true;
  send.disabled = true;

  function onResourceAdd(jsonString) {
   
  }
  
  function onUpdate(jsonString) {
    if (jsonString.Event == 'add') {

      message.textContent = "Adding " + jsonString.Type;
      if ('att' in jsonString) {
        listOBJ[jsonString.Type].add(jsonString);
      } else {
        message.textContent += "Error" ;
      }

    } else if (jsonString.Event == 'update') {
      message.textContent = "Updating " + jsonString.Type
      if ('att' in jsonString) {
        listOBJ[jsonString.Type].update(jsonString);
      }else {
        message.textContent += "Error" ;
      }

    } else if (jsonString.Event == 'drop') {
      message.textContent = "Dropping " + jsonString.Type
      listOBJ[jsonString.Type].drop();
    }
  }

  // Create a new connection when the Connect button is clicked
  open.addEventListener("click", function(event) {
    open.disabled = true;
    socket = new WebSocket(url.value, "echo-protocol");
    console.log(url.value);
    socket.addEventListener("open", function(event) {
      close.disabled = false;
      send.disabled = false;
      status.textContent = "Connected";
    });

    // Display messages received from the server
    socket.addEventListener("message", function(event) {
      onUpdate(JSON.parse(event.data));
      //this data will be the json payload. parset the json out of event.data
      //
    });

    // Display any errors that occur
    socket.addEventListener("error", function(event) {
      message.textContent = "Error: " + event;
    });

    socket.addEventListener("close", function(event) {
      open.disabled = false;
      status.textContent = "Not Connected";
    });
  });

  // Close the connection when the Disconnect button is clicked
  close.addEventListener("click", function(event) {
    close.disabled = true;
    send.disabled = true;
    message.textContent = "";
    socket.close();
  });

  // Send text to the server when the Send button is clicked
  send.addEventListener("click", function(event) {
    var test_payload = {
        Event:'add',
        Type:"fan",
        att:['on_off','speed'],
        W_att:{on_off:true, speed:100}
    };
    socket.send(JSON.stringify(test_payload));
    //when you click the send button, create a json object that will send 
  });
}); 
