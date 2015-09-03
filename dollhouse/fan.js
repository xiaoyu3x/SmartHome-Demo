
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

//Fan has physically changed status --> change model animation
function recieveUpdate(sensor){

	


	//animate iff sensor is on
	if ('on_off' in sensor['att']) {
		console.log("Updating Fan")
		if((sensor['att']['on_off']) == 'on'){
			spinningBoxFan = 1;
		}else{
			spinningBoxFan = 0;
		}

	}else{
		console.log("Error Updating Fan")
	}
}

//sending a message to change fan repr -> server
function sendUpdateFan(){
	console.log("Sending fan update");
    
    var test_payload = {
        Event:'update',
        Type:'boxFan',
        att:{on_off: !spinningBoxFan}
    };
    //onUpdate(test_payload); //commentout
    socket.send(JSON.stringify(test_payload));
} 


function dropFan () {
	makeVisible('Component_33', false)
	makeVisible('Component_34', false)
	makeVisible('Component_35', false)
	makeVisible('Component_36', false)
}



listOBJ['boxFan'] = {};
listOBJ['boxFan']['add'] = addFan;

listOBJ['boxFan']['update'] = recieveUpdate;

listOBJ['boxFan']['sendUpdate'] = sendUpdateFan;

listOBJ['boxFan']['drop'] = dropFan;