# JavaScript OCF servers
This folder contains JavaScript implementation of various OCF servers, such as:
* Fan
* CO2 detector
* Motion Sensor
* RGB LED
* LED (on/off)
* Buzzer
* Ambient Light Sensor
* Temperature
* Solar Panel
* Button
* Switch

# How to start these OCF servers
## Prerequisites
* Have the corresponding HW hooked up to your board (see table below)
* `node <ocf-server>.js`
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
| Button | GPIO 4 | [Grove Button] (http://www.seeedstudio.com/wiki/Grove_-_Button) |
| button-toggle [note] | GPIO 4 | [Grove Button] (http://www.seeedstudio.com/wiki/Grove_-_Button) |
| Switch | GPIO 4 | [Grove Switch(P)] (http://www.seeedstudio.com/wiki/Grove_-_Switch(P)) |

[note]: This is a variation of the classical `Button` implemenation in that it makes the button act as a toggle between `true` and `false` (instead of reporting `true` when pressed and `false` otherwise.

## Setting up the Smart Solar Panel
### Hardware components required
* 1x [Solar Panel] (http://www.adafruit.com/products/200)
* 1x [Line Actuator] (http://www.robotshop.com/en/firgelli-technologies-l12-30-210-12-p.html)
* 1x [Actuator Controller Board] (http://www.robotshop.com/en/firgelli-technologies-linear-actuator-control-board.html)
* 1x set of mounting brackets (3D printed, CAD model to be added later to the repo)
* 1x [Grove LCD RGB panel] (http://www.seeedstudio.com/wiki/Grove_-_LCD_RGB_Backlight)

### Software components
**To Be Completed**
