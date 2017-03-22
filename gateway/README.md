# The Home Gateway

The demo was built leveraging the [Ostro OS
Project](https://ostroproject.org/) and we recommend you use it to build your
own demo.
Ostro is a Linux operating system tailored for IoT
smart devices and it fulfills many of the software stack requirements to run
this demo out of the box.

## Node.js dependencies

Node.js dependencies can be installed using `npm install <node_module>` (you need a live network connection) for those not already provided by the OS.
* [Express](https://www.npmjs.com/package/express)
* [WebSocket](https://www.npmjs.com/package/websocket)
* [IoTivity-node](https://www.npmjs.com/package/iotivity-node) (already provided in Ostro)
* [mraa](https://www.npmjs.com/package/mraa)

## How to start the Home GW SW

1. Transfer the content of this repo to your Home Gateway (e.g. `git clone https://github/01org/SmartHome-Demo`)
2. Install all `node.js` dependencies (see above)
3. Start the services:

```
    node gateway/gateway-server.js # Start server with 3D UI and rules engine.
    node gateway/gateway-server.js -r # Start server with rules engine only.
```

## SmartHome Gateway in a [Docker] container
The [`start-gateway-in-docker.sh`](./start-gateway-in-docker.sh) script is used when building a Docker container that runs the Gateway functions. The following services are started by the script:
* Home Gateway SW: the core is provided by the content of this folder and started by the [`gateway-server.js`](./gateway-server.js) script.
* [IoT REST API Server](https://github.com/01org/iot-rest-api-server): this is the service that exposes OIC (OCF) API over HTTP(S)

For more details, please take a look at the [Dockerfile](./Dockerfile).

[Docker]: https://www.docker.com/
