function addMotionSensor(sensor){
	console.log("Test adding: "+ JSON.stringify(sensor));

	//sensor apepars in WebGL	
    motionSensorVisible(true);

	//print attributes
	if (debug) {
		for (var att in sensor.att){
    		if (typeof sensor.att[att] !== 'function') {
         		console.log("Key: " + att + ", value: " + sensor.att[att]);
    		}
		}
	}
} 
	
//Motion sensor physically changed status --> change model animation
function recieveUpdate(sensor){
	//animate iff sensor is on
	if ('value' in sensor['att']) {

		if (!sensor['att']['value']) {
			findObjectsById('motion_sensor_red_button').forEach(function(item) {
			        item.traverse(function (object) {
			             object.visible = false;
			    });
			});
		}
		else {
			findObjectsById('motion_sensor_red_button').forEach(function(item) {
			        item.traverse(function (object) {
			             object.visible = true;
			        });
			});
		}
	}
}

//sending a message to change fan repr -> server
function UpdateToServer(){
	console.log("Sending motion sensor update");
} 

//make object invisible in webGL
function motionSensorVisible (bool) {
	//makeVisible('security-system_motion-detector', false)
	console.log("Dropping motion sensor");
    findObjectsById('security-system_motion-detector').forEach(function(item) {
    	item.traverse(function (object) {
        	object.visible = bool;
    	});
	});
}

listOBJ['motionSensor'] = {};
listOBJ['motionSensor']['add'] = addMotionSensor;
listOBJ['motionSensor']['update'] = recieveUpdate;
listOBJ['motionSensor']['sendUpdate'] = UpdateToServer;
listOBJ['motionSensor']['drop'] = motionSensorVisible;
