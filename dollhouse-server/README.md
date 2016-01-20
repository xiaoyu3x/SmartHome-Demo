# JavaScript OIC servers
This folder contains JavaScript implementation of various OIC servers, such as:
* Fan
* CO2 detector
* Motion Sensor
* RGB LED
* LED (on/off)
* Buzzer
* Ambient Light Sensor
* Temperature
* Solar Panel

# How to start these OIC servers
## Prerequisites
* Have the corresponding HW hooked up to your board (see table below)
* `node <oic-server>.js`
* Et voila...

## Setting up the HW devices/sensors
The connector listed below was derived from the corresponding `*.js` files. Please double-check in the code (`*.js`) in case of problems as the table may have gone out-of-sync.

| OIC server | Connector | HW device |
|------------|-----------|-----------|
| Fan | GPIO 9 | [Grove Mini Fan] (http://www.seeedstudio.com/wiki/Grove_-_Mini_Fan) |
| CO2 (carbonDioxide) | A0 analog pin | [Grove - Gas Sensor(MQ2)] (http://www.seeedstudio.com/depot/Grove-Gas-SensorMQ2-p-937.html) |
| Motion Sensor | GPIO 5 | [Grove PIR Motion Sensor] (http://www.seeedstudio.com/depot/Grove-PIR-Motion-Sensor-p-802.html) |
| RGB LED | GPIO 7 (clock) and 8 (data) | [Grove Chainable RGB LED] (http://www.seeedstudio.com/depot/twig-chainable-rgb-led-p-850.html?cPath=156_157) |
| LED | GPIO 2 | [Grove LED Socket kit] (http://www.seeedstudio.com/wiki/Grove_-_LED) |
| Buzzer | GPIO 6 | [Grove Buzzer] (http://www.seeedstudio.com/wiki/Grove_-_Buzzer) |
| Ambient Light Sensor (Illuminance) | A3 analog pin | [Grove Light Sensor] (http://www.seeedstudio.com/depot/Grove-Light-Sensor-p-746.html) |
| Temperature | A1 analog pin | [Grove Temperature Sensor] (http://www.seeedstudio.com/depot/Grove-Temperature-Sensor-p-774.html) |

## Setting up the Smart Solar Panel
### Hardware components required
* 1x [Solar Panel] (http://www.adafruit.com/products/200)
* 1x [Line Actuator] (http://www.robotshop.com/en/firgelli-technologies-l12-30-210-12-p.html)
* 1x [Actuator Controller Board] (http://www.robotshop.com/en/firgelli-technologies-linear-actuator-control-board.html)
* 1x set of mounting brackets (3D printed, CAD model to be added later to the repo)
* 1x [Box Fan] (http://www.coolerguys.com/840556100690.html#__utma=89875097.248028884.1450303989.1450303989.1450303989.1&__utmb=89875097.7.10.1450303989&__utmc=89875097&__utmx=-&__utmz=89875097.1450303989.1.1.utmcsr=(direct)|utmccn=(direct)|utmcmd=(none)&__utmv=-&__utmk=245640909)

### Software components
**To Be Completed**
