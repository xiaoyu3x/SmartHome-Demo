function addGasSensor(sensor){
	console.log("Test adding: " + JSON.stringify(sensor));

	//print attributes
	if (debug) {
		for (var att in sensor.att){
    		if (typeof sensor.att[att] !== 'function') {
         		console.log("Key: " + att + ", value: " + sensor.att[att]);
    		}
		}
	}
} 

//TODO: gas sensor animation

function updateGasSensor(sensor){
	console.log("Updating Gas Sensor: "+ JSON.stringify(sensor));

	var test_payload = {
        Event:'add',
        Type:'gasSensor',
        att:{on_off: gasSmokeAlarmOn, value: 33}
    };
    socket.send(JSON.stringify(test_payload));
} 

//make object invisible in webGL
function dropGasSensor () {
	console.log("Dropping Gas Sensor");
	makeVisible('_445CTmine', false)
}

listOBJ['gasSensor'] = {};
listOBJ['gasSensor']['add'] = addGasSensor;
listOBJ['gasSensor']['update'] = updateGasSensor;
listOBJ['gasSensor']['drop'] = dropGasSensor;