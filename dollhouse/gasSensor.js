function addGasSensor(sensor){
	console.log("Test adding: " + JSON.stringify(sensor));

	//print the attributes
	if (debug) {
		for (var att in sensor.att){
    		if (typeof sensor.att[att] !== 'function') {
         		console.log("Key is " + att + ", value is " + sensor.att[att]);
    		}
		}

	}


	//TODO: gas sensor animation
	//spinningBoxFan = sensor['W_att']['on_off'];
} 
function updateGasSensor(sensor){
	console.log("Updating Gas Sensor: "+ JSON.stringify(sensor));
} 

function dropGasSensor (){
	console.log("Dropping Gas Sensor");
}

listOBJ['gasSensor'] = {};
listOBJ['gasSensor']['add'] = addGasSensor;
listOBJ['gasSensor']['update'] = updateGasSensor;
listOBJ['gasSensor']['drop'] = dropGasSensor;