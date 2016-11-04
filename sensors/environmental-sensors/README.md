# Zephyr Environmental Sensor

This is an environmental sensing application for the Arduino 101 board.

The sensor subsystem application collects temperature, humidity, pressure and UV
data from a set of sensors connected to the Arduino 101 and sends it to the SoC
through IPM. The collected sensor data is also displayed by the sensor subsystem
on a Grove LCD.

The SoC application exposes the received sensor data as a simple Bluetooth
Environmental Sensing Service.

## Sensor wiring:

The sample uses the BME280 sensor for temperature, humidity and air pressure
measurement, and the Grove UV sensor for UV index measurement. This section
describes how to wire these sensors to the Arduino 101 board.

Both sensors operate at 3.3V or 5V. The BME280 uses I2C to communicate with
the Arduino, while the UV sensor sends data via analog port (ADC). For the
BME280, its SDL, SDA and GND pins are connected to the SDL, SDA and GND pins
respectively, and the Vin pin is connected to 5V pin on the port. The Grove
UV sensor has 3 pins, GND to GND pin, Vcc to 3.3V pin and SIG pin to A0 pin
on the board.

The BME280 and the Grove UV sensor can be found here:
http://www.ebay.com/itm/like/281745479989?lpid=82&chn=ps&ul_noapp=true
https://www.seeedstudio.com/Grove-UV-Sensor-p-1540.html

## Grove LCD:

Using the Grove LCD is optional and it can be disabled by removing the Grove
configuration options from the arc/proj.conf file.

The Grove LCD communicates with the sensor subsystem through the I2C bus. When
connecting the Grove LCD to the Arduino 101, either directly or through a Grove
Base Shield, you need to make sure that the I2C SDA and SCL lines have pull-up
resistors connected between GND and the 3.3V power source.

Take note that even though SDA and SCL are connected to a 3.3V power source, the
Grove LCD VDD line needs to be connected to the 5V power line, otherwise
characters will not be displayed on the LCD (3.3V is enough to power just the
backlight).

The Grove LCD can be found here:
https://www.seeedstudio.com/Grove-LCD-RGB-Backlight-p-1643.html

## Building and flashing the app to Arduino 101
In order to build the Zephyr app for the Arduino 101 board, first setup the
Zephyr dev environment following the guidance here.
* https://wiki.zephyrproject.org/view/Arduino_101

In the app source folder, use the following commands to build and flash the app
to Arduino 101 board:

### ARC core application
```
    $ cd arc
    $ make pristine && make BOARD=arduino_101_sss_factory
    $ sudo dfu-util -a sensor_core -D outdir/zephyr.bin
```

### x86 core application
```
    $ cd ../x86
    $ make pristine && make BOARD=arduino_101_factory
    $ sudo dfu-util -a x86_app -D outdir/zephyr.bin
```

## Data flow and usage
The sensor app uses standard BLE's ESS (Environmental Sensing Service) service and attributes to send data. It acts as a BLE peripheral device advertising itself as a "Zephyr Environmental Sensor" that any client can scan, connect and have the data via "read" or "notify" methods. On Android or iOS devices with BLE support, BLE apps like nRF Connect can be used to communicate and receive sensor data. In the SmartHome-Demo system, a remote OCF resource server using BLE connects, receives data from the sensor and shares to other devices in the same network.

The OCF resource server is implemented in "ocf-servers/js-servers/environmental_sensor.js". Use the following command to launch it:
```
    $ node <path>/environmental_sensor.js
```

Please note that it requires noble to run. noble can be installed by using following command in the SmartHome-Demo folder:
```
    $ npm install noble
```

## Supported Zephyr versions:
The code has been verified to work with Zephyr v1.4.0 and v1.5.0
