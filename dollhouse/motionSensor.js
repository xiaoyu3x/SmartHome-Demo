function addMotionSensor(sensor){
	console.log("Test adding: "+ JSON.stringify(sensor));
	//print attributes
	if (debug) {
		for (var att in sensor.att){
    		if (typeof sensor.att[att] !== 'function') {
         		console.log("Key: " + att + ", value: " + sensor.att[att]);
    		}
		}
	}
} 
	
	//TODO: animate flashMotionSensor akin to
	//spinningBoxFan = sensor['W_att']['on_off'];



//Motion sensor physically changed status --> change model animation
function recieveUpdate(sensor){
	//animate iff sensor is on
	if ('on_off' in sensor['att']) {
		motionSensorAnimation = sensor['att']['on_off'];
	}
}

//sending a message to change fan repr -> server
function UpdateToServer(){
	console.log("Sending motion sensor update");
    
    var test_payload = {
        Event:'update',
        Type:'motionSensor',
        att:{on_off: !motionSensorOn}
    };
    onUpdate(test_payload); //commentout
    //socket.send(JSON.stringify(test_payload));

} 


/*function updateMotionSensor(sensor){
	console.log("Updating motion sensor: "+ JSON.stringify(sensor));

	    var test_payload = {
        Event:'update',
        Type:'motionSensor',
        att:{on_off: motionSensorOn, value: 42}
    };
    socket.send(JSON.stringify(test_payload));
} 
*/
//make object invisible in webGL
function dropMotionSensor () {
	//makeVisible('security-system_motion-detector', false)
	console.log("Dropping motion sensor");
    findObjectsById('security-system_motion-detector').forEach(function(item) {
    	item.traverse(function (object) {
        	object.visible = false;
    	});
	});
}

listOBJ['motionSensor'] = {};
listOBJ['motionSensor']['add'] = addMotionSensor;
listOBJ['motionSensor']['update'] = recieveUpdate;
listOBJ['motionSensor']['sendUpdate'] = UpdateToServer;
listOBJ['motionSensor']['drop'] = dropMotionSensor;