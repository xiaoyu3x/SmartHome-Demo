function addGasSensor(sensor){
	console.log("Test adding: " + JSON.stringify(sensor));

	//print the attributes
	if (debug) {
		for (var att in sensor.att){
    		if (typeof sensor.att[att] !== 'function') {
         		console.log("Key: " + att + ", value: " + sensor.att[att]);
    		}
		}

	}


	//TODO: gas sensor animation
	//gas_indicator = sensor['att']['on_off'];
} 
function updateGasSensor(sensor){
	console.log("Updating Gas Sensor: "+ JSON.stringify(sensor));

	var test_payload = {
        Event:'add',
        Type:'gasSensor',
        att:{on_off: gasSmokeAlarmOn}
    };
    socket.send(JSON.stringify(test_payload));
} 

function dropGasSensor (){
	console.log("Dropping Gas Sensor");
}

listOBJ['gasSensor'] = {};
listOBJ['gasSensor']['add'] = addGasSensor;
listOBJ['gasSensor']['update'] = updateGasSensor;
listOBJ['gasSensor']['drop'] = dropGasSensor;