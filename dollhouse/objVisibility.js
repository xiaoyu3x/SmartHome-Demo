function makeVisible(component, bool) {
	try {
		var list = findObjectsById(component);
		for (item in list){
			item.traverse(function (object) {
			    if (bool) {
			        object.visible = true;
			    }
			    else {
			        object.visible = false;
			    }
		    });

		}

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
	catch (err) {
                //controlLine('TypeError caught1');

	}
}


//intialize every item as invisible
var components = ['_445CTmine', 'security-system_motion-detector', 'Component_36', 'Component_35', 'Component_34', 'Component_33'];
for (entry in components){
 makeVisible(entry, false)
}