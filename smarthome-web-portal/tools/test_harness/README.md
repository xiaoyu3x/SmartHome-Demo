Run the Home Gateway and its rest api server in containers
==========================================================

Here are the steps to instantiate IoT Home Gateway in the docker container.

## Prerequisite
* Install Docker engine in your OS, referring to the guidance here https://docs.docker.com/engine/installation/ 

## Steps to run the container
1. Checkout source code
    * checkout the source to build the image and enter the test_harness folder (smarthome-web-portal/tools/test_harness)

2. Configurations
    * Update the preferred source in source.list    
      eg. change archive.ubuntu.com to hk.archive.ubuntu.com

3. Build the image
    * Under the test_harness folder, run the command below to build the image. *smarthome2cloud* is the image name and *latest* is the tag of the image.    
        * `docker build -t smarthome2cloud/test-harnesss:latest .`    
        * If the container is running behind a proxy, set up the http and https proxies through build args as below:    
        `docker build --build-arg http_proxy=http://10.240.252.16:911 --build-arg  https_proxy=http://10.240.252.16:911  -t smarthome2cloud/test-harnesss:latest .`    
        **Notice**: if you are using a corporate proxy, the proxy host name could not be parsed by the container's local DNS. Better to use ip address instead of host name.     
        * When completed, you will see the following message:     
            ```    
            Removing intermediate container 82b756f0b245    
            Successfully built 5efd905d09df    
            ```       
    * The command to check the image status   
        `docker image`  

4. Load the image (optional, skip this step if you build the image by yourself)
    * Download the image from the Github release and save it in your local file system
    * Load the image to your docker 
    `docker load -i <path to image tar file>`
        
5. Run the Home Gateway and OCF servers in one container    
    `docker run --name test-harness -p 8881:8080 -p 8882:8000 smarthome2cloud/test-harness:latest `    
    **test-harness** is the name of the container;    
    **8881** is the forward port listening on the host. All the requests will be forwarded to the gateway on 8080 in the container;    
    **8882** is the forward port listening on the host, which forwards the requests to iot rest api server on 8000;    
    **smarthome2cloud/test-harness:latest** is the combination of the name and tag of the image;    

6. Troubleshooting the container
    * `docker ps -a`     
    Check all the running containers and get the id and status of the containers. The output looks like below: 
    ```
    CONTAINER ID        IMAGE                       COMMAND                  CREATED             STATUS              PORTS      NAMES
    86d8d9221fb7        smarthome2cloud/test-harness:latest   "/usr/bin/supervisord"   About an hour ago   Up About an hour    0.0.0.0:8882->8000/tcp, 0.0.0.0:8881->8080/tcp   test-harness
    ```
    * `docker logs -f <container id>`    
   you can get the <container id> from `docker ps -a`. The commands tails the log from this container.
    * `docker start/stop/restart <container id>`    
    Update the container status