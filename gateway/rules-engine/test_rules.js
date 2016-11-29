var fs = require("fs");
var rules = require("./rules_engine");

var jsonRulesConfig = fs.readFileSync(__dirname+"/rules.json", "utf8");
rulesEngine = rules.createRulesEngine(jsonRulesConfig);

console.log("rules engine: " + jsonRulesConfig);

var newEvents = rulesEngine.processEvents("[{ \"Type\": \"gasSensor\", \"att\": { \"value\": false }, \"Event\": \"update\" }, { \"Type\": \"gasSensor\", \"att\": { \"value\": true }, \"Event\" : \"update\"}]");

console.log("returned events: "+ newEvents)
