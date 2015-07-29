function addMotionSensor(sensor){
	console.log("Test adding: "+ JSON.stringify(sensor));

	//print the attributes
	sensor.att.forEach(function(att) {
		console.log("ll:" +att + " " +sensor['W_att'][att]);

	});
	
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