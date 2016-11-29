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

