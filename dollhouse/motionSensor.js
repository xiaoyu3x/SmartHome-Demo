function addMotionSensor(sensor){
	console.log("Test adding: "+ JSON.stringify(sensor));

	//print the attributes
	//print the attributes
	if (debug) {
		for (var att in sensor.att){
    		if (typeof sensor.att[att] !== 'function') {
         		console.log("Key: " + att + ", value: " + sensor.att[att]);
    		}
		}

	}
	
	//TODO: animate flashMotionSensor akin to
	//spinningBoxFan = sensor['W_att']['on_off'];
} 
function updateMotionSensor(sensor){
	console.log("Updating motion sensor: "+ JSON.stringify(sensor));

	    var test_payload = {
        Event:'update',
        Type:'motionSensor',
        att:{on_off: motionSensorOn, value: 42}
    };
    socket.send(JSON.stringify(test_payload));
} 

function dropMotionSensor (){
	console.log("Dropping motion sensor");
}

listOBJ['motionSensor'] = {};
listOBJ['motionSensor']['add'] = addMotionSensor;
listOBJ['motionSensor']['update'] = updateMotionSensor;
listOBJ['motionSensor']['drop'] = dropMotionSensor;