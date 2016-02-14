# SmartHome "Dollhouse" demo

This repository includes code that allows to demonstrate a SmartHome network using [OIC](http://openinterconnect.org/) and [IoTivity](https://www.iotivity.org/) to communicate between smart appliances (OIC servers) and a Home GW (OIC client). The User Interface (UI) is a 3D model of the house (<insert reference here>) that is exposed through a webserver running on the HomeGW.

The repository is organised as follows:
* root: the root folder is the code code running on the HomeGW
* `oic-servers`: provides a number of OIC server implementations, a few are implemented in C code (`c-servers/`) and others are implemented in JavaScript (`js-servers`). The documentation for these servers is availabe in the `doc/` folder. These are not strictly part of the code running on the gateway but are provided here as a convenience.

## Home GW dependencies

### Node.js dependencies

Node.js dependencies can be installed using `npm install <node_module>` (you need a live network connection).
* [Express](https://www.npmjs.com/package/express)
* [http](https://www.npmjs.com/package/http)
* [WebScoket](https://www.npmjs.com/package/websocket)
* [IoTivity-node](https://www.npmjs.com/package/iotivity-node)

### Python dependencies
Python dependencies can be installed using `pip install <python_module>` (you need a live network connection).
* [Autobahn](http://autobahn.ws/python/): version 0.10.9
* [Icarus](https://github.com/tripzero/icarus)
* [Pysolar](http://pysolar.org/): version 0.6
* [Pytz](http://pytz.sourceforge.net/): version 2015.7
* [setuptools](https://pypi.python.org/pypi/setuptools): version 18.2
* [Six](https://pypi.python.org/pypi/six): version 1.10.0 
* [Twisted](https://twistedmatrix.com/): version 15.4.0
* [txaio](https://pypi.python.org/pypi/txaio): version 2.0.4
* [zope.interface](https://pypi.python.org/pypi/zope.interface): version 4.1.3

## How to start the Home GW SW

1. Transfer the content of this repo (minus the `oic-servers` folder that you don't need)
2. Install all `node.js` and `Python` dependencies (see above)
3. Start the services: 

```
    node first_server.js
    python icarus/python/icarus_tracker.py --location <location>
```

***To Be Completed***
