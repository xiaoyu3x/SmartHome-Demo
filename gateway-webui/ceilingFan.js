function addCeilingFan(sensor){
	console.log("Test adding: "+ JSON.stringify(sensor));

	//sensor appears in WebGL
	ceilingFanVisible(true);

	//print the attributes
	if (debug) {
		for (var att in sensor.att){
    		if (typeof sensor.att[att] !== 'function') {
         		console.log("Key: " + att + ", value: " + sensor.att[att]);
    		}
		}

	}
	//TODO: animation
	//spinningCeilingFan = sensor['W_att']['on_off'];
} 
function updateCeilingFan(sensor){
	console.log("Updating ceiling fan: "+ JSON.stringify(sensor));
} 

function ceilingFanVisible (bool){
	console.log("Dropping ceiling fan");
	//TODO: makeVisible("name", false)
    findObjectsById('group_5').forEach(function(item) {
    	item.traverse(function (object) {
        	object.visible = bool;
    	});
	});

    findObjectsById('Ceiling_Fan6').forEach(function(item) {
    	item.traverse(function (object) {
        	object.visible = bool;
    	});
	});

}

listOBJ['ceilingFan'] = {};
listOBJ['ceilingFan']['add'] = addCeilingFan;
listOBJ['ceilingFan']['update'] = updateCeilingFan;
listOBJ['ceilingFan']['drop'] = ceilingFanVisible;