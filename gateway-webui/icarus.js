
function addSolarPanel(sensor){
	console.log("Test adding: "+ JSON.stringify(sensor));

	//adding the solarPanel into WebGL
	solarPanelVisible(true);

	//print attributes in debug mode
	if (debug) {
		for (var att in sensor.att){
    		if (typeof sensor.att[att] !== 'function') {
         		console.log("Key: " + att + ", value: " + sensor.att[att]);
    		}
		}
	}	recieveUpdate(sensor);
} 

//solarPanel has physically changed status --> change model animation
function recieveUpdate(sensor){
	//animate iff sensor is on
	if ('on_off' in sensor['att']) {
		solarPanelOn = sensor['att']['on_off'];
	}
}

//sending a message to change solarPanel repr -> server
function sendUpdateSolarPanel(){
	console.log("Sending solar panel update");
    
    var test_payload = {
        Event:'update',
        Type:'solarPanel',
        att:{on_off: !solarPanelOn, angle: 5}
    };
    onUpdate(test_payload); //commentout
    //socket.send(JSON.stringify(test_payload));
}

function solarPanelVisible (bool) {
    findObjectsById('icarus').forEach(function(item) {
    	item.traverse(function (object) {
        	object.visible = bool;
    	});
 	});
}

listOBJ['solarPanel'] = {};
listOBJ['solarPanel']['add'] = addSolarPanel;
listOBJ['solarPanel']['update'] = recieveUpdate;
listOBJ['solarPanel']['sendUpdate'] = sendUpdateSolarPanel;
listOBJ['solarPanel']['drop'] = solarPanelVisible;