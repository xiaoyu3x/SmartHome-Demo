# OCF Zephyr Temperature Sensor
This is an example of Zephyr temperature sensor functioning as an OCF server on
an Arduino 101 board, using Zephyr and iotivity-constrained. The device collects
temperature data using a Grove temperature sensor and sends to a connected
device using 6LowPAN over BLE.

## Sensor wiring
The [Grove temperature sensor](http://wiki.seeed.cc/Grove-Temperature_Sensor_V1.2/) should be connected to port A0 on the [Grove base
shield](http://wiki.seeed.cc/Base_Shield_V2/). Both of them are included in the [Grove starter kit for Arduino 101](https://seeeddoc.github.io/Grove_Starter_kit_for_Arduino_101/).

## Building and flashing the applications
In order to build the Zephyr app for the Arduino 101 board, first setup the
Zephyr dev environment following steps:
* Setup dev environment on Host following this [guide](https://www.zephyrproject.org/doc/getting_started/getting_started.html)
* Download Zephyr project source code and enable environment configure
```
    $ git clone https://gerrit.zephyrproject.org/r/zephyr && cd zephyr
    $ source ./zephyr-env.sh
```
* Following this [instruction](https://wiki.zephyrproject.org/view/Arduino_101#Bluetooth_firmware_for_the_Arduino_101) to build and flash the Zephyr bluetooth firmware to the board

**Note**: You can learn more information from this [wiki](https://wiki.zephyrproject.org/view/Arduino_101)

* Download iotivity-constrained project source code and prepare the environment
```
    $ git clone https://github.com/iotivity/iotivity-constrained && cd iotivity-constrained
    $ git submodule update --init
    $ export IOTIVITY_CONSTRAINED_BASE=$PWD
```

In the app source folder sensors/ocf-temperature-sensor, use the following commands to build and flash the app
to Arduino 101 board:

### ARC core application
```
    $ cd arc
    $ make pristine && make
    $ dfu-util -a sensor_core -D outdir/arduino_101_sss/zephyr.bin
```
### x86 core application
```
    $ cd ../x86
    $ make pristine && make
    $ dfu-util -a x86_app -D outdir/arduino_101/zephyr.bin
```
**Note**: By default, the name of the device is defined as "OCF Temperature Sensor", but it is possible to change by modifying the Kconfig CONFIG_BLUETOOTH_DEVICE_NAME in the prj.conf.
## How to setup a BLE connection
Use the following steps to connect the device to an Ubuntu host with BLE connectivity. User should be root
```
    # hciconfig # You should see the device hci0
    # rfkill unblock bluetooth
    # hciconfig hci0 up
    # modprobe bluetooth_6lowpan
    # echo 1 > /sys/kernel/debug/bluetooth/6lowpan_enable
    # bluetoothctl
    [bluetooth]# scan on
    [bluetooth]# scan off
    [bluetooth]# devices # You will see the "OCF Temperature Sensor" with the address
    [bluetooth]# quit

    # echo "connect <OCF Temperature Node Address> 2"  >/sys/kernel/debug/bluetooth/6lowpan_control
    (e.g. echo "connect E6:DF:CD:CE:65:14 2" >/sys/kernel/debug/bluetooth/6lowpan_control)

    # ifconfig  ##You should see bt0 interface, if everything was okay
```

### Run the tests on host browser:

* Discovery: http://localhost:8000/api/oic/res
You should see the /a/temperature resource.

* Get: http://localhost:8000/api/oic/a/temperature?di=\<device ID\>
You should see the temperature properties.
