function Rules(jsonRulesConfig)
{
	this.rules = JSON.parse(jsonRulesConfig)
	var devices = this.rules
	var conditionFuncStr = "function(new_value, old_value){ ${0} }";

	//Iterate through all the devides, events and triggers and make condition a callable js function
	for (var i = 0; i < devices.attributes.length; i++) 
	{
		var events = devices.attributes[i]
		if(!events.specified)
			continue;

		var events = device
		for (var 	x = 0; x < events.attributes.length; i++) 
		{
			var triggers = events.attributes[x]
			if(!event.specified)
				continue;
			for (var i = 0; i < triggers.attributes.length; i++) {
				var trigger = triggers.attributes[i]
				if(!trigger.specified)
					continue;

				try 
				{
					trigger.condition = eval(conditionFuncStr.replace("${0}", trigger.condition));
				}
				catch(error)
				{
					console.error(error);
				}
				
			}
		}
	}
}

Rules.prototype.processEvents = function(jsonEvent)
{
	newupdate = jsonEvent;

	var events = JSON.parse(jsonEvent);
	var actions = [];

	for (var i = 0; i < events.attributes.length; i++) 
	{
		var event = events.attributes[i];
		if(!event.specified)
			continue;

		valueNames = this.rules[event.Type][event.Event]

		for (var i = 0; i < valueNames.attributes.length; i++) 
		{
			valueName = valueNames.attributes[i];
			if(!valueName.specified)
				continue;
			
			if(event.att[valueName] !== undefined)
			{
				value = event.att[valueName]

				triggers = this.rules[event.Type][event.Event]

				for (var i = 0; i < triggers.attributes.length; i++) 
				{
					trigger = triggers.attributes[i]
					if(!trigger.specified)
						continue;

					if(trigger.name == valueName)
					{

						condition = trigger.condition;
						old_value = trigger.old_value;
						if(condition(old_value, value))
						{
							actions.push(trigger.action);
						}

						trigger.old_value = value;
					}
				}
			}
		}
	}

	return JSON.stringify(actions);
};

Rules.prototype.rules = {};

Rules.prototype.toJson = function()
{
	return JSON.stringify(this.rules)
}
