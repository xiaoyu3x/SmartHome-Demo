FROM ubuntu:15.04

ARG http_proxy

ARG https_proxy

ENV http_proxy ${http_proxy}

ENV https_proxy ${https_proxy}

# update apt source.list
COPY sources.list /etc/apt

RUN rm /var/lib/apt/lists/* -vfr

RUN apt-get clean && apt-get update

# install dependenties
RUN apt-get install -y python-pip python-dev liblapack-dev gfortran git scons wget pkg-config uuid-dev libglib2.0-dev unzip libboost-dev libboost-thread-dev curl

# download Dollhouse source
RUN git clone --progress https://github.com/01org/SmartHome-Demo.git /opt/SmartHome-Demo

WORKDIR /opt/SmartHome-Demo

# update nodejs version
RUN curl -sL https://deb.nodesource.com/setup_4.x | bash -

RUN apt-get install -y nodejs supervisor

ADD dollhouse.conf /etc/supervisor/conf.d/dollhouse.conf

# install npm dependencies
RUN npm install

# checkout iot rest api server
RUN npm install iot-rest-api-server -g

RUN npm install node-gyp -g

# forward port
EXPOSE 8000 8080

# startup 
CMD ["/usr/bin/supervisord", "-n"]
