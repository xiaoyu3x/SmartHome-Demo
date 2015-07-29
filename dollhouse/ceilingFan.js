function addCeilingFan(sensor){
	console.log("Test adding: "+ JSON.stringify(sensor));

	//print the attributes
	sensor.att.forEach(function(att) {
		console.log("ll:" + att + " " + sensor['W_att'][att]);

	});
	//TODO: animation
	//spinningCeilingFan = sensor['W_att']['on_off'];
} 
function updateCeilingFan(sensor){
	console.log("Updating ceiling fan: "+ JSON.stringify(sensor));
} 

function dropCeilingFan (){
	console.log("Dropping ceiling fan");
}

listOBJ['ceilingFan'] = {};
listOBJ['ceilingFan']['add'] = addCeilingFan;
listOBJ['ceilingFan']['update'] = updateCeilingFan;
listOBJ['ceilingFan']['drop'] = dropCeilingFan;