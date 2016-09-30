FROM ubuntu:14.04

ARG http_proxy

ARG https_proxy

ARG git_token

ENV http_proxy ${http_proxy}

ENV https_proxy ${https_proxy}

ENV git_url "github.com/01org/SmartHome-Demo.git"

RUN echo $https_proxy 

RUN echo $http_proxy

# update apt source.list
COPY sources.list /etc/apt

RUN rm /var/lib/apt/lists/* -vf

RUN apt-get clean && apt-get update 

# install python dependencies
RUN apt-get -y install gcc build-essential checkinstall libreadline-gplv2-dev \
libncursesw5-dev libssl-dev libsqlite3-dev tk-dev libgdbm-dev libc6-dev libbz2-dev wget

WORKDIR /usr/src

#COPY Python-2.7.10.tgz .
RUN ["wget", "--no-check-certificate", "https://www.python.org/ftp/python/2.7.10/Python-2.7.10.tgz"]

RUN tar zxvf Python-2.7.10.tgz

WORKDIR Python-2.7.10

RUN ./configure && make altinstall

# forward port 
EXPOSE 3000 4000

RUN echo "alias python='/usr/local/bin/python2.7'" > ~/.bash_aliases

RUN . ~/.bash_aliases

# Install MySQL Server in a Non-Interactive mode. Default root password will be "intel123"
RUN apt-get install -y debconf-utils libmysqlclient-dev \
    && echo "mysql-server-5.6 mysql-server/root_password password intel123" | debconf-set-selections \
    && echo "mysql-server-5.6 mysql-server/root_password_again password intel123" | debconf-set-selections \
    && apt-get -y install mysql-server-5.6 \
    && sed -i -e"s/^bind-address\s*=\s*127.0.0.1/bind-address = 0.0.0.0/" /etc/mysql/my.cnf 

# Install rabbitmq
RUN apt-get install -y rabbitmq-server git python-pip python-dev ca-certificates git-core ssh supervisor

# checkout source code
RUN echo "https://$git_token@$git_url"

RUN git clone --progress "https://$git_token@$git_url" /opt/SmartHome-Demo

ADD web-portal.conf /etc/supervisor/conf.d/web-portal.conf

WORKDIR /opt/SmartHome-Demo/smarthome-web-portal

# install portal dependencies
#RUN pip install -r requirements.txt -t /usr/local/lib/python2.7/site-packages/

RUN pip install -r requirements.txt

RUN pip install Flask-SQLAlchemy==2.1

# configure portal settings
ADD SHProject.conf utils/SHProject.conf

ADD utils.py tools/smarthome-admin-portal/admin/utils.py

# unset proxy
ENV http_proxy ""
ENV https_proxy ""

ENV PYTHONPATH $PYTHONPATH:/opt/SmartHome-Demo/smarthome-web-portal

# start supervisor
CMD ["/usr/bin/supervisord", "-n"]

