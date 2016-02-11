This folder contains templates for implementing OIC servers running on the
Edison board (it may be applicable to other Linux-based systems).

**Beware that these are based on an outdated version of IoTivity (0.9.0) and would need to ported to version 1.0.x to work with the rest of the SW**

It contains a number of OIC devices (servers) located in sub-folders:

* `fan`: fan device, can be turned on/off
* `gas`: CO2 sensor
* `motion`: motion detection sensor
* `solar`: Smart Solar Panel device

**Add real instructions on how to build these**

E.g.:

1. Install dev tools ond the following dev packages on target:
  * `mraa-dev`
  * `iotivity-resource-dev`
  * `upm-dev` (for `solar`)
2. Transfer code to target
3. Run `make` within the OIC server directory
4. Start the OIC server as follows:
   `./ocserver`

**To Be Sanitized**
