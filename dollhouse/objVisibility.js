//TODO: intialize stuff as invisible

function makeVisible(component, bool) {
	findObjectsById(component).forEach(function(item) {
    	item.traverse(function (object) {
	        if (bool) {
	        	object.visible = true;
	        }
	        else {
	        object.visible = false;
	        }
        });
    });
}