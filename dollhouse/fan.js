function addFan(sensor){
	console.log("Test adding: "+ JSON.stringify(sensor));

	//print the attributes
	sensor.att.forEach(function(att) {
		console.log("ll:" + att + " " + sensor['W_att'][att]);

	});
	spinningBoxFan = sensor['W_att']['on_off'];
} 
function updateFan(sensor){
	console.log("Updating Fan: "+ JSON.stringify(sensor));
} 

function dropFan (){
	console.log("Dropping Fan");
}

listOBJ['fan'] = {};
listOBJ['fan']['add'] = addFan;
listOBJ['fan']['update'] = updateFan;
listOBJ['fan']['drop'] = dropFan;