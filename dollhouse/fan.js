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
	recieveUpdate(sensor);
} 

//Fan has physically changed status; reflect in model
function recieveUpdate(sensor){
	//animate iff sensor is on
	if ('on_off' in sensor['att']) {
		spinningBoxFan = sensor['att']['on_off'];
	}
}

//sending a message to change fan repr -> server
function sendUpdateFan(){
	console.log("Sending update fan ");
    
    var test_payload = {
        Event:'update',
        Type:'boxFan',
        att:{on_off: !spinningBoxFan}
    };
     //onUpdate(test_payload);
    socket.send(JSON.stringify(test_payload));

} 

function dropFan (){
	console.log("Dropping Fan");
}



listOBJ['boxFan'] = {};
listOBJ['boxFan']['add'] = addFan;

listOBJ['boxFan']['update'] = recieveUpdate;

listOBJ['boxFan']['sendUpdate'] = sendUpdateFan;

listOBJ['boxFan']['drop'] = dropFan;