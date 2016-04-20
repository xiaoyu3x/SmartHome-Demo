var fs = require("fs");
var rules = require("./rules_engine");

var jsonRulesConfig = fs.readFileSync(__dirname+"/../data.json", "utf8");
rulesEngine = rules.createRulesEngine(jsonRulesConfig);

console.log("rules engine: " + rulesEngine);

var newEvents = rulesEngine.processEvents("[{ \"Type\": \"Gas\", \"att\": { \"value\": 99 }, \"Event\": \"update\" }, { \"Type\": \"Gas\", \"att\": { \"value\": 110 }, \"Event\" : \"update\"}]");

console.log("returned events: "+ newEvents)



