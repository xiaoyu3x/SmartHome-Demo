function addGasSensor(sensor){
	console.log("Test adding: " + JSON.stringify(sensor));

	//sensor appears in WebGL
    gasSensorVisible(true);

	//print attributes
	if (debug) {
		for (var att in sensor.att){
    		if (typeof sensor.att[att] !== 'function') {
         		console.log("Key: " + att + ", value: " + sensor.att[att]);
    		}
		}
	}
} 

function updateGasSensor(sensor){
	console.log("Updating Gas Sensor: "+ JSON.stringify(sensor));
	if ('value' in sensor['att']) {
		if (sensor['att']['value']) {
		    findObjectsById('smoke_red_button').forEach(function(item) {
		        item.traverse(function (object) {
		            object.visible = true;
		        });
		    });
		} else {
		    findObjectsById('smoke_red_button').forEach(function(item) {
		        item.traverse(function (object) {
		            object.visible = false;
		        });
		    });
		}
	}

} 

//make object invisible in webGL
function gasSensorVisible (bool) {
/*	makeVisible('_445CTmine', false)
*/
	if(!bool){
		console.log("Dropping Gas Sensor");
	}
    findObjectsById('_445CTmine').forEach(function(item) {
    	item.traverse(function (object) {
        	object.visible = bool;
    	});
	});
}


listOBJ['gasSensor'] = {};
listOBJ['gasSensor']['add'] = addGasSensor;
listOBJ['gasSensor']['update'] = updateGasSensor;
listOBJ['gasSensor']['drop'] = gasSensorVisible;
