
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
		spinningBoxFan = sensor['att']['on_off'];
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
    onUpdate(test_payload); //commentout
    //socket.send(JSON.stringify(test_payload));
} 


function dropFanWTH () {
/*	makeVisible('Component_33', false)
	makeVisible('Component_34', false)
	makeVisible('Component_35', false)
	makeVisible('Component_36', false)*/
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

function dropFan1 () {
    findObjectsById('Component_33').forEach(function(item) {
    	item.traverse(function (object) {
        	object.visible = false;
    	});
	});
}

function dropFan2 () {
    findObjectsById('Component_34').forEach(function(item) {
    	item.traverse(function (object) {
        	object.visible = false;
    	});
	});
}

function dropFan3 () {
    findObjectsById('Component_35').forEach(function(item) {
    	item.traverse(function (object) {
        	object.visible = false;
    	});
	});
}

function dropFan4 () {
    findObjectsById('Component_36').forEach(function(item) {
    	item.traverse(function (object) {
        	object.visible = false;
    	});
	});
}

function dropFan5 () {
    findObjectsById('Component_33').forEach(function(item) {
    	item.traverse(function (object) {
        	object.visible = false;
    	});
	});
}

function dropBoxFan(){
	boxFan.visible = false;
}

function dropAllFanComponents (){
	dropFan1();dropFan2();dropFan3();dropFan4();dropFan5();	dropBoxFan();
}


listOBJ['boxFan'] = {};
listOBJ['boxFan']['add'] = addFan;
listOBJ['boxFan']['update'] = recieveUpdate;
listOBJ['boxFan']['sendUpdate'] = sendUpdateFan;
listOBJ['boxFan']['drop'] = dropAllFanComponents;