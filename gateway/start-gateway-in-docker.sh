#!/bin/bash

# Print out container IP address
echo "This container IP address is: `hostname -i`"

# Set-up the path to where the node.js modules were installed
export NODE_PATH=/opt/SmartHome-Demo/gateway/node_modules/

# Start the Home Gateway
/usr/bin/node /opt/SmartHome-Demo/gateway/gateway-server.js -r &
sleep 0.2

# Start IoT REST API server
echo "Starting the IoT REST API Server..."
# We blindly pass all container command-line arguments to the IoT REST API Server
/usr/bin/node /opt/SmartHome-Demo/gateway/node_modules/iot-rest-api-server/index.js "$@" &

keepgoing=true

trap "keepgoing=false" SIGINT

echo "Press [CTRL+C] to stop.."

while $keepgoing
do
	:
done
