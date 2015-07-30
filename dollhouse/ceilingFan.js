function addCeilingFan(sensor){
	console.log("Test adding: "+ JSON.stringify(sensor));

	//print the attributes
	if (debug) {
		for (var att in sensor.att){
    		if (typeof sensor.att[att] !== 'function') {
         		console.log("Key: " + att + ", value: " + sensor.att[att]);
    		}
		}

	}
	//TODO: animation
	//spinningCeilingFan = sensor['W_att']['on_off'];
} 
function updateCeilingFan(sensor){
	console.log("Updating ceiling fan: "+ JSON.stringify(sensor));
} 

function dropCeilingFan (){
	console.log("Dropping ceiling fan");
	//TODO: makeVisible("name", false)
}

listOBJ['ceilingFan'] = {};
listOBJ['ceilingFan']['add'] = addCeilingFan;
listOBJ['ceilingFan']['update'] = updateCeilingFan;
listOBJ['ceilingFan']['drop'] = dropCeilingFan;