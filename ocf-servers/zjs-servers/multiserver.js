// Copyright 2017 Intel Corporation
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/*
 * Grove base shield configurations for the sensors supported by this script
 *     +-----------------------------------+
 *     | Sensor                     | Port |
 *     +----------------------------+------+
 *     | Onchip BMI160 temperature  |  --  |
 *     | Grove PIR motion sensor    |  D2  |
 *     | Grove button               |  D4  |
 *     | Grove buzzer               |  D7  |
 *     | Grove mini fan             |  D8  |
 *     | Grove light sensor         |  A0  |
 *     +----------------------------+------+
 */
var gpio   = require('gpio');
var ocf    = require('ocf');
var server = ocf.server;

var updateTemperatureFrequency = 1;  /* desire frequency in Hz */

// BMI160 Temperature Sensor
// http://www.mouser.com/ds/2/783/BST-BMI160-DS000-07-786474.pdf
var temperatureSensor = new TemperatureSensor({
        controller: 'bmi160',
        frequency : updateTemperatureFrequency
    }),
    resPathTemperature = '/a/temperature',
    resTypeTemperature = 'oic.r.temperature',
    temperatureResource = null,
    temperatureProperties = {
        temperature: 25.0,
        units: 'C'
    },
    temperatureResourceInit = {
        resourcePath : resPathTemperature,
        resourceTypes: [ resTypeTemperature ],
        interfaces   : [ 'oic.if.baseline' ],
        discoverable : true,
        observable   : false,
        properties   : temperatureProperties
    };

// PIR Motion Sensor
var PIR = gpio.open({ pin: 2, mode: 'in', edge: 'any' }),
    resPathMotion = '/a/pir',
    resTypeMotion = 'oic.r.sensor.motion',
    motionResource = null,
    motionProperties = {
        value: (PIR.read() != 0)? true : false
    },
    motionResourceInit = {
        resourcePath : resPathMotion,
        resourceTypes: [ resTypeMotion ],
        interfaces   : [ 'oic.if.baseline' ],
        discoverable : true,
        observable   : true,
        properties   : motionProperties
    };

// Button
var button = gpio.open({ pin: 4, mode: 'in', edge: 'any' }),
    resPathButton = '/a/button',
    resTypeButton = 'oic.r.button',
    buttonResource = null,
    buttonProperties = {
        value: (button.read() != 0)? true : false
    },
    buttonResourceInit = {
        resourcePath : resPathButton,
        resourceTypes: [ resTypeButton ],
        interfaces   : [ 'oic.if.baseline' ],
        discoverable : true,
        observable   : true,
        properties   : buttonProperties
    };

// Buzzer
var buzzer = gpio.open({ pin: 7, mode: 'out', activeLow: false }),
    resPathBuzzer = '/a/buzzer',
    resTypeBuzzer = 'oic.r.buzzer',
    buzzerResource = null,
    buzzerProperties = {
        value: (buzzer.read() != 0)? true : false
    },
    buzzerResourceInit = {
        resourcePath : resPathBuzzer,
        resourceTypes: [ resTypeBuzzer ],
        interfaces   : [ 'oic.if.baseline' ],
        discoverable : true,
        observable   : true,
        properties   : buzzerProperties
    };

// Mini Fan
var fan = gpio.open({ pin: 8, mode: 'out', activeLow: false }),
    resPathFan = '/a/fan',
    resTypeFan = 'oic.r.fan',
    fanResource = null,
    fanProperties = {
        value: (fan.read() != 0)? true : false
    },
    fanResourceInit = {
        resourcePath : resPathFan,
        resourceTypes: [ resTypeFan ],
        interfaces   : [ 'oic.if.baseline' ],
        discoverable : true,
        observable   : true,
        properties   : fanProperties
    };

// Light sensor
var lightSensor = new AmbientLightSensor({
        pin: 'A0'
    }),
    resPathIlluminance = '/a/illuminance',
    resTypeIlluminance = 'oic.r.sensor.illuminance',
    illuminanceResource = null,
    illuminanceProperties = {
        illuminance: 450.0
    },
    illuminanceResourceInit = {
        resourcePath : resPathIlluminance,
        resourceTypes: [ resTypeIlluminance ],
        interfaces   : [ 'oic.if.baseline' ],
        discoverable : true,
        observable   : true,
        properties   : illuminanceProperties
    };

console.log('Starting Multiple OCF servers...');

// Event Handlers
temperatureSensor.onchange = function() {
    var temperature = temperatureSensor.celsius;
    console.log('temperature: ' + temperature + '°C');
    temperatureProperties.temperature = temperature;
};

temperatureSensor.onactivate = function() {
    console.log('temperature sensor activated');
};

temperatureSensor.onerror = function(event) {
    console.log('exception occurs: ' + event.error.name + ' - ' + event.error.message);
};

lightSensor.onchange = function() {
    var illuminance = lightSensor.illuminance;
    console.log('illuminance: ' + illuminance);
    illuminanceProperties.illuminance = illuminance;
};

lightSensor.onactivate = function() {
    console.log('light sensor activated');
};

lightSensor.onerror = function(event) {
    console.log('exception occurs: ' + event.error.name + ' - ' + event.error.message);
};

PIR.onchange = function(event) {
    var state = (PIR.read() != 0)? true : false;
    console.log('motion: ' + state);
    motionProperties.value = state;
};

button.onchange = function(event) {
    var state = event.value? true : false;
    console.log('button: ' + state);
    buttonProperties.value = state;
};

function getTemperatureRepresentation(request) {
    request.respond(temperatureProperties);
}

function getMotionOcRepresentation(request) {
    request.respond(motionProperties);
}

function getButtonOcRepresentation(request) {
    request.respond(buttonProperties);
}

function getBuzzerOcRepresentation(request) {
    request.respond(buzzerProperties);
}

function setBuzzerOcRepresentation(request) {
    if (request.data.properties) {
        var state = request.data.properties.value? true : false;
        console.log('Set buzzer ' + (state? 'On' : 'Off'));
        buzzer.write((buzzerProperties.value = state)? 1 : 0);
    }
    request.respond(buzzerProperties);
}

function getFanOcRepresentation(request) {
    request.respond(fanProperties);
}

function setFanOcRepresentation(request) {
    if (request.data.properties) {
        var state = request.data.properties.value? true : false;
        console.log('Fan ' + (state? 'On' : 'Off'));
        fan.write((fanProperties.value = state)? 1 : 0);
    }
    request.respond(fanProperties);
}

function getIlluminanceOcRepresentation(request) {
    request.respond(illuminanceProperties);
}

// Resource Registration
server.register(temperatureResourceInit).then(function(resource) {
    console.log("Temperature sensor registered");
    temperatureResource = resource;
}).catch(function(error) {
    console.log('Registration failure: ' + error.name);
});

server.register(motionResourceInit).then(function(resource) {
    console.log("Motion sensor registered");
    motionResource = resource;
}).catch(function(error) {
    console.log('Motion sensor registration failure: ' + error.name);
});

server.register(buttonResourceInit).then(function(resource) {
    console.log("Button registered");
    buttonResource = resource;
}).catch(function(error) {
    console.log('Button registration failure: ' + error.name);
});

server.register(buzzerResourceInit).then(function(resource) {
    console.log("Buzzer registered");
    buzzerResource = resource;
}).catch(function(error) {
    console.log('Buzzer registration failure: ' + error.name);
});

server.register(fanResourceInit).then(function(resource) {
    console.log("Fan registered");
    fanResource = resource;
}).catch(function(error) {
    console.log('Fan registration failure: ' + error.name);
});

server.register(illuminanceResourceInit).then(function(resource) {
    console.log("Light sensor registered");
    illuminanceResource = resource;
}).catch(function(error) {
    console.log('Light sensor registration failure: ' + error.name);
});

// Register Listeners
server.on('retrieve', function(request, observe) {
    if (request.target.resourcePath == resPathMotion) {
        getMotionOcRepresentation(request);
    } else if (request.target.resourcePath == resPathButton) {
        getButtonOcRepresentation(request);
    } else if (request.target.resourcePath == resPathBuzzer) {
        getBuzzerOcRepresentation(request);
    } else if (request.target.resourcePath == resPathTemperature) {
        getTemperatureRepresentation(request);
    } else if (request.target.resourcePath == resPathFan) {
        getFanOcRepresentation(request);
    } else if (request.target.resourcePath == resPathIlluminance) {
        getIlluminanceOcRepresentation(request);
    }
});

server.on('update', function(request) {
    if (request.target.resourcePath == resPathBuzzer) {
        setBuzzerOcRepresentation(request);
    } else if (request.target.resourcePath == resPathFan) {
        setFanOcRepresentation(request);
    }
});

/* Start the sensor instance and emit events */
temperatureSensor.start();
lightSensor.start();

/* Start the OCF stack */
ocf.start();
