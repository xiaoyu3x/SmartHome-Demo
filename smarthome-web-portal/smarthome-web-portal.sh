#!/bin/bash

# The script is to start the web application hosted by gunicorn
# ./smarthome-wev-portal.sh start|restart|stop|status

TOPDIR=`pwd`
# [[ -e $TOPDIR/localrc ]] && source $TOPDIR/localrc

BASE_DIR=$(cd `dirname $0`; pwd)
cd $TOPDIR

SMART_HOME_DIR=${SMART_HOME_DIR:-$BASE_DIR}
LOG_DIR=${LOG_DIR:-$SMART_HOME_DIR/log}
LOG_NAME=portal.log

help()
{
    echo "Usage: $0 start|restart|stop|status"
}

start()
{
    if [ `ps aux | grep 'SHProject:app' | grep -v grep | wc -l` -gt 0 ]; then
        echo "Gunicorn service is already running."
    else
        cd $SMART_HOME_DIR
        #export PYTHONPATH=$SMART_HOME_DIR
        gunicorn --worker-class=eventlet -w 1 -b 0.0.0.0:3000 -D --log-file=$LOG_DIR/$LOG_NAME SHProject:app
        cd $TOPDIR
    fi
}

stop()
{
    ps aux | grep 'SHProject:app' | grep -v grep | awk '{print $2}' | xargs -i kill -9 {}
}

restart()
{
   stop;
   start;
}

status()
{
    if [ `ps aux | grep 'SHProject:app' | grep -v grep | wc -l` -eq 0 ]; then
        echo "Gunicorn service is stopped."
    else
        echo "Gunicorn service is running."
        tail -5 $LOG_DIR/$LOG_NAME
    fi   
}

if [ $# != 1 ] ; then 
    help
elif [ "$1"x = "startx" ]; then
    start;
elif  [ "$1"x = "stopx" ]; then
    stop;
elif  [ "$1"x = "restartx" ]; then
    restart;
elif  [ "$1"x = "statusx" ]; then
    status;
else
    echo "Unrecognized command: $@";
fi 
