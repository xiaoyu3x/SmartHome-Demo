
function addFan(sensor){
	console.log("Test adding: "+ JSON.stringify(sensor));

	//adding the fan into WebGL
	allFanComponentsVisible(true);

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
		if((sensor['att']['on_off']) == true){
			spinningBoxFan = 1;
			console.log("Updating Fan On")
		}else{
			spinningBoxFan = 0;
			console.log("Updating Fan Off")
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

    controlLine('boxFan is ' + (spinningBoxFan ? 'Off' : 'On'));
    //onUpdate(test_payload); //commentout
    socket.send(JSON.stringify(test_payload));
} 


function fanVisible1 (bool) {
    findObjectsById('Component_33').forEach(function(item) {
    	item.traverse(function (object) {
        	object.visible = bool;
    	});
	});
}

function fanVisible2 (bool) {
    findObjectsById('Component_34').forEach(function(item) {
    	item.traverse(function (object) {
        	object.visible = bool;
    	});
	});
}

function fanVisible3 (bool) {
    findObjectsById('Component_35').forEach(function(item) {
    	item.traverse(function (object) {
        	object.visible = bool;
    	});
	});
}

function fanVisible4 (bool) {
    findObjectsById('Component_36').forEach(function(item) {
    	item.traverse(function (object) {
        	object.visible = bool;
    	});
	});
}

function fanVisible5 (bool) {
    findObjectsById('Component_33').forEach(function(item) {
    	item.traverse(function (object) {
        	object.visible = bool;
    	});
	});
}

function boxFanVisible(bool){
	boxFan.visible = bool;
}

function allFanComponentsVisible (bool){
	fanVisible1(bool);fanVisible2(bool);
	fanVisible3(bool);fanVisible4(bool);
	fanVisible5(bool);	boxFanVisible(bool);
}

/*//TODO: debug as this could be a cleaner function
function dropFanALL () {
	makeVisible('Component_33', false)
	makeVisible('Component_34', false)
	makeVisible('Component_35', false)
	makeVisible('Component_36', false)
	console.log("Dropping Fan Sensor");
	var components = ['Component_36', 'Component_35', 'Component_34', 'Component_33'];
	for (var x in components){
	    findObjectsById(components).forEach(function(item) {
	    	item.traverse(function (object) {
	        	object.visible = false;
	    	});
		});
	}
}
*/
listOBJ['boxFan'] = {};
listOBJ['boxFan']['add'] = addFan;
listOBJ['boxFan']['update'] = recieveUpdate;
listOBJ['boxFan']['sendUpdate'] = sendUpdateFan;
listOBJ['boxFan']['drop'] = allFanComponentsVisible;
