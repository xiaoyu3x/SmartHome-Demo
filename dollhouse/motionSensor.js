function addMotionSensor(sensor){
	console.log("Test adding: "+ JSON.stringify(sensor));

	//print the attributes
	//print the attributes
	if (debug) {
		for (var att in sensor.att){
    		if (typeof sensor.att[att] !== 'function') {
         		console.log("Key is " + att + ", value is " + sensor.att[att]);
    		}
		}

	}
	
	//TODO: animate flashMotionSensor akin to
	//spinningBoxFan = sensor['W_att']['on_off'];
} 
function updateMotionSensor(sensor){
	console.log("Updating motion sensor: "+ JSON.stringify(sensor));
} 

function dropMotionSensor (){
	console.log("Dropping motion sensor");
}

listOBJ['motionSensor'] = {};
listOBJ['motionSensor']['add'] = addMotionSensor;
listOBJ['motionSensor']['update'] = updateMotionSensor;
listOBJ['motionSensor']['drop'] = dropMotionSensor;