# JavaScript\* OCF Servers for Zephyr&trade; OS

This folder contains JavaScript implementation of various OCF servers written in [OCF API](https://github.com/01org/zephyr.js/blob/master/docs/ocf.md) of the [JavaScript runtime for Zephyr OS (ZJS)](https://github.com/01org/zephyr.js), which leverage iotivity-constrained for devices with less memory, such as [Arduino 101](https://www.arduino.cc/en/Main/ArduinoBoard101), to communicate with the connected gateway using the OCF networking protocol over Bluetooth 6LoWPAN.

## Setup ZJS Build Environment
Follow the [ZJS Getting Started](https://github.com/01org/zephyr.js#getting-started) guide for setting up the ZJS development environment except the version of the [ZJS repository](https://github.com/01org/zephyr.js) to be checked out. The ZJS OCF API has been extended to support multiple resource registrations, ZJS version 0.3 and below won’t work with the scripts in this folder, you should remain on the master branch after cloning the ZJS source code repo, or checkout the branch for version 0.4 or above once it’s available.
​
## Build and Flash the OCF Servers
The ZJS development environment designs with a comprehensive Makefile for building both x86 and ARC images from the given JavaScript code, and for flashing the images to an Arduino 101 board. For example, to build the multi-server OCF server images:
```
$ cd $ZEPHYR_BASE
~/zephyr.js $ make ROM=256 JS=<Path to SmartHome-Demo repo>/ocf-servers/zjs-servers/multiserver.js
```
The `ROM=256` parameter in the above command instructs the linker to allocate 256KB for x86 as the default partition size is not sufficient. Reference the [Getting more space on your Arduino 101](https://github.com/01org/zephyr.js#getting-more-space-on-your-arduino-101) section in the ZJS project for more information.

Then connect the Arduino 101 to your development host with a USB A/B cable, press the onboard `Master Reset` button, and flash the Arduino 101 board with the following command in few seconds:
```
~/zephyr.js $ make dfu
```

After successfully flashing both ARC and x86 images to the Arduino 101 board, press the `Master Reset` button again to run the uploaded OCF server script.

## Establish a BLE Connection from Gateway
The OCF server communicates with the OCF client or gateway over BLE through 6LoWPAN. On the SmartHome gateway with BLE capability, enter the following commands to establish a 6LoWPAN connection to the Arduino 101 board. Reference the [ZJS 6LoWPAN](https://github.com/01org/zephyr.js/blob/master/docs/6lowpan-ble.md) document for detailed instructions.
```
# hciconfig # You should see the device hci0
# rfkill unblock bluetooth
# hciconfig hci0 up
# modprobe bluetooth_6lowpan
# echo 1 > /sys/kernel/debug/bluetooth/6lowpan_enable
# bluetoothctl
[bluetooth]# scan on
[bluetooth]# scan off
[bluetooth]# devices # You will see the "ZJS Device" with the address
[bluetooth]# quit
# echo "connect <ZJS OCF Sensors Address> 2"  >/sys/kernel/debug/bluetooth/6lowpan_control
(e.g. echo "connect E6:DF:CD:CE:65:14 2" >/sys/kernel/debug/bluetooth/6lowpan_control)
# ifconfig  ##You should see bt0 interface, if everything was okay
```

| ZJS OCF server | Port on Grove base shield | Sensor |
|----------------|---------------------------|--------|
| led.js         | n/a | onboard LED |
| temperature.js | n/a | onboard temperature sensor |
| multiserver.js | D2  | [Grove PIR motion sensor](http://wiki.seeed.cc/Grove-PIR_Motion_Sensor/) |
|                | D4  | [Grove button](http://wiki.seeed.cc/Grove-Button/) |
|                | D7  | [Grove buzzer](http://wiki.seeed.cc/Grove-Buzzer/) |
|                | D8  | [Grove mini fan](http://wiki.seeed.cc/Grove-Mini_Fan/) |
|                | A0<sup>*1</sup>  | [Grove light sensor](http://wiki.seeed.cc/Grove-Light_Sensor/) |

<sup>*1 The illuminance sensor values are converted from the onchip ADC, which is sensitive to the analog voltage input (AREF). The Grove base shield doesn't drive the AREF input while selecting 3.3V as Vcc through the power switch. It's recommended to turn the switch to 5V position to get correct ADC values.</sup>
