module.exports = {
	createRulesEngine : function(jsonRulesConfig) {
		return new Rules(jsonRulesConfig);
	}
};

function Rules(jsonRulesConfig)
{
	this.rules = JSON.parse(jsonRulesConfig);
	var devices = this.rules;

	//Iterate through all the devides, events and triggers and make condition a callable js function
	/*for(var i in devices) 
	{
		var events = devices[i];
		for (var x in events) 
		{
			var triggers = events[x];
			for (var t in triggers)
			{
				var trigger = triggers[t];

				try 
				{
					trigger.condition = eval(conditionFuncStr.replace("${0}", trigger.condition));
				}
				catch(error)
				{
					console.error("eval error: " + error);
				}
			}
		}
	}*/
}

Rules.prototype.processEvents = function(jsonEvent)
{
	newupdate = jsonEvent;

	var events = JSON.parse(jsonEvent);
	var actions = events;

	for (var i in events) 
	{
		var event = events[i];
		valueNames = this.rules[event.Type][event.Event]
		
		console.log(JSON.stringify(this.rules[event.Type][event.Event]))		

		for (var i in valueNames) 
		{
			valueName = valueNames[i].name;
			console.log("value: " + valueName);

			if(event.att[valueName] !== undefined)
			{
				value = event.att[valueName]

				triggers = this.rules[event.Type][event.Event]

				for (var i in triggers)
				{
					
					trigger = triggers[i];
					console.log("processing trigger: " + JSON.stringify(trigger));

					if(trigger.name == valueName)
					{
						new_value = value;
						old_value = trigger.old_value;
						console.log("new_value: " + new_value);
						console.log("old_value: " + old_value);

						condition = eval(trigger.condition);
						console.log("condition success? " + condition);
						if(condition === true)
						{
							if(trigger.action)
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
	return JSON.stringify(this.rules);
};

