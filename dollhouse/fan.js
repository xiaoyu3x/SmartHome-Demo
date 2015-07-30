function addFan(sensor){
	console.log("Test adding: "+ JSON.stringify(sensor));

	//print attributes in debug mode
	if (debug) {
		for (var att in sensor.att){
    		if (typeof sensor.att[att] !== 'function') {
         		console.log("Key: " + att + ", value: " + sensor.att[att]);
    		}
		}

	}
	//animate iff sensor is on
	if ('on_off' in sensor['att']) {
		spinningBoxFan = sensor['att']['on_off'];
	}
} 
function updateFan(sensor){
	console.log("Updating Fan: "+ JSON.stringify(sensor));
    
    var test_payload = {
        Event:'add',
        Type:'boxFan',
        att:{on_off: spinningBoxFan}
    };
    socket.send(JSON.stringify(test_payload));

} 

function dropFan (){
	console.log("Dropping Fan");
}



listOBJ['boxFan'] = {};
listOBJ['boxFan']['add'] = addFan;
listOBJ['boxFan']['update'] = updateFan;
listOBJ['boxFan']['drop'] = dropFan;