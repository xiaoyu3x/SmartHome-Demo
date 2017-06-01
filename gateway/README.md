# The Home Gateway

The Home Gateway can run on a variety of Operating Systems (OS), from Linux-based OS such as [Ubuntu](https://www.ubuntu.com/) or [Yocto](https://www.yoctoproject.org/) to Windows and Mac OS. This is possible thanks to the [Docker] container set-up which is described below. There are three ways you can set-up the Home Gateway function, in no particular order:

1. [Docker] container
2. [Snap](https://snapcraft.io/) package
3. Native installation

This README.md only covers options 1. and 3. Deploying the SmartHome Gateway via [`snap`](https://snapcraft.io/) is described in great details in this [README.md](../snap/README.md). We shall note that using the [Docker] container or [`snap`](https://snapcraft.io/) package is the quickest way to do it so this is what we recommend you do for the very first time.

## SmartHome Gateway in a [Docker] container

In order to make deploying the SmartHome Gateway easy, a [Docker] container has been created and is available on [Docker Hub](https://hub.docker.com). It is called [smarthome2cloud/smarthome-gateway](https://hub.docker.com/r/smarthome2cloud/smarthome-gateway/). You will find more detailed instructions on how to pull it and run it in the [top-level README.md](../README.md).

Internally, this [Docker] container uses the [`start-gateway-in-docker.sh`](./start-gateway-in-docker.sh) script to start the following couple of services:
* Home Gateway SW: the core is provided by the content of this folder and started by the [`gateway-server.js`](./gateway-server.js) script
* [IoT REST API Server]: this is the service that exposes the OIC (OCF) API over HTTP(S)

The [IoT REST API Server] can take a number of command-line arguments that tweak its behaviour, by default it starts on port 8000 using 'http'. Should you want to change any of these, you can pass any of the [IoT REST API Server] command-line arguments to the [Docker] container and they will be used. The command-line arguments that are available today are:
```
usage: node index.js [options]
options:
  -h, --help
  -v, --verbose
  -p, --port <number>
  -s, --https
  -c, --cors
```

For more details, please take a look at the [Dockerfile](./Dockerfile).

## Native installation

A native installation assumes that you have [node.js](https://nodejs.org/) running on your system, please refer to the [node.js](https://nodejs.org/) website or your OS documentation for how to install it. Once [node.js](https://nodejs.org/) is installed, please proceed to the following sections to:
1. Install the node.js dependencies
2. Start the SmartHome Gateway services

### Node.js dependencies

Node.js dependencies can be installed using `npm install <node_module>` (you need a live network connection) for those not already provided by the OS.
* [IoT REST API Server]
* [IoTivity-node](https://www.npmjs.com/package/iotivity-node): this is in fact automatically pulled in when installing the [IoT REST API Server]
* [Express](https://www.npmjs.com/package/express)
* [WebSocket](https://www.npmjs.com/package/websocket)
* [mraa](https://www.npmjs.com/package/mraa): this is only needed if you want to use the Smart Power Meter with a serial line connection. See this [README.md](../sensors//DC_power_meter/README.md) for more details on the Smart Power Meter.

## How to start the Home GW SW

1. Transfer the content of this repo to your Home Gateway (e.g. `git clone https://github/01org/SmartHome-Demo`)
2. Install all `node.js` dependencies (see above)
3. Start the services:

```
    node gateway/gateway-server.js # Start server with 3D UI and rules engine.
    node gateway/gateway-server.js -r # Start server with rules engine only.
```

[Docker]: https://www.docker.com/
[IoT REST API Server]: https://github.com/01org/iot-rest-api-server
