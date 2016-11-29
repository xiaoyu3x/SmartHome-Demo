# The IoT to Cloud SmartHome demo

This repository provides source code that allows to set-up and demonstrate an IoT to Cloud SmartHome demo leveraging [OCF](http://openconnectivity.org/) and [IoTivity](https://www.iotivity.org/) to communicate between smart appliances (OCF servers), a Home GW (OCF client) and a cloud-based portal (using the [IoT REST API Server](https://github.com/01org/iot-rest-api-server/)). The user can interact with the various devices via both an Android companion app (when on the local network) and via the cloud portal. For a more comprehensive overview of the architecture and a detailed step-by-step guide on how to put it all together, please take a look at our online [tutorial](https://01.org/smarthome).

The repository is organised as follows:
* `gateway`: code running on the Home Gateway
* `ocf-servers`: OCF server implementations in JavaScript (located in `js-servers`).
   * Generic documentation on how to set them up is available [here](ocf-servers/js-servers/README.md)
   * The specifications for the OCF servers is availabe in the `ocf-servers/doc/` folder
* `ostro-config`: a collection of `systemd` service files that can help automatically start the Home GW software (on the Home Gateway) and OCF servers (on the OCF server hardware). (*note:* these require manual adaptation and not all OCF servers have an associated service file available)
* `sensors`: source code for the various Smart Devices that are based on the [Zephyr Project](https://www.zephyrproject.org/)
* `smarthome-web-portal`: code for the cloud portal

You will find dedicated README.md files in most of these subfolders that will explain in more details how to use their respective contents.
