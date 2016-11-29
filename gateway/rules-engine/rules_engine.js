module.exports = {
    createRulesEngine : function(jsonRulesConfig) {
        return new Rules(jsonRulesConfig);
    }
};

function Rules(jsonRulesConfig)
{
    this.rules = JSON.parse(jsonRulesConfig);
}

Rules.prototype.processEvents = function(jsonEvent)
{
    var events = JSON.parse(jsonEvent);
    var actions;
    for (var i in events)
    {
        var event = events[i];
        if (!this.rules[event.Type])
            return;
        valueNames = this.rules[event.Type][event.Event];
        for (var i in valueNames)
        {
            valueName = valueNames[i].name;
            if (event.att[valueName] !== undefined)
            {
                value = event.att[valueName];
                trigger = valueNames[i];
                new_value = value;
                old_value = trigger.old_value;
                condition = eval(trigger.condition);
                if (condition === true)
                {
                    if (trigger.actions) {
                        actions = trigger.actions;
                    }
                }
                trigger.old_value = value;
            }
        }
    }
    return JSON.stringify(actions);
};

Rules.prototype.rules = {};
