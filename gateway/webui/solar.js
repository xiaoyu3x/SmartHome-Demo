function addSolarPanel(sensor){
    console.log("Test adding: "+ JSON.stringify(sensor));

    // adding the solarPanel into WebGL
    solarPanelVisible(true);

    // print attributes in debug mode
    if (debug) {
        for (var att in sensor.att){
            if (typeof sensor.att[att] !== 'function') {
                console.log("Key: " + att + ", value: " + sensor.att[att]);
            }
        }
    }
    recieveUpdate(sensor);
}

// solarPanel has physically changed status --> change model animation
function recieveUpdate(sensor){
    // animate if sensor is on
    if ('simulationMode' in sensor['att']) {
        solarPanelOn = sensor['att']['simulationMode'];
        if (solarPanelOpen == solarPanelOn) {
            solarPanelOpen = !solarPanelOn;
            if (solarPanelStart == 0)
                solarPanelStart = Date.now();
            else
               solarPanelStart = Date.now() - (1000 - (Date.now() - solarPanelStart));
        }
    }
}

// sending a message to change solarPanel repr -> server
function sendUpdateSolarPanel(){
    console.log("Sending solar panel update");

    var test_payload = {
        Event:'update',
        Type:'solar',
        att:{simulationMode: !solarPanelOn}
    };

    controlLine('Solar Panel is ' + (solarPanelOn ? 'Off' : 'On'));
    socket.send(JSON.stringify(test_payload));
}

function solarPanelVisible(bool) {
    findObjectsById('icarus').forEach(function(item) {
        item.traverse(function (object) {
            object.visible = bool;
        });
    });
}

listOBJ['solar'] = {};
listOBJ['solar']['add'] = addSolarPanel;
listOBJ['solar']['update'] = recieveUpdate;
listOBJ['solar']['sendUpdate'] = sendUpdateSolarPanel;
listOBJ['solar']['drop'] = solarPanelVisible;
