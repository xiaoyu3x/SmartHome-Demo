#!/bin/bash

# The script is to start/stop the celery work service
# ./celery-worker.sh start|stop|status|restart

TOPDIR=`pwd`
# [[ -e $TOPDIR/localrc ]] && source $TOPDIR/localrc

BASE_DIR=$(cd `dirname $0`; pwd)
cd $TOPDIR

SMART_HOME_DIR=${SMART_HOME_DIR:-$BASE_DIR}
LOG_DIR=${LOG_DIR:-$SMART_HOME_DIR/log}
LOG_NAME=celery.log

help()
{
    echo "Usage: $0 start|restart|stop|status"
}

start()
{
    if [ `ps aux | grep 'CeleryTask.celeryapp' | grep -v $0 | grep -v grep | wc -l` -gt 0 ]; then
        echo "Celery worker is already running."
    else
        cd $SMART_HOME_DIR
        export PYTHONPATH=$SMART_HOME_DIR
        /usr/bin/python2.7 CeleryTask/tasks.py
        nohup celery -A CeleryTask.celeryapp worker -l info> $LOG_DIR/$LOG_NAME 2>&1 &
        cd $TOPDIR
    fi
}

stop()
{
    ps aux | grep 'CeleryTask.celeryapp' | grep -v grep | grep -v $0 | awk '{print $2}' | xargs kill -9 
    celery -A CeleryTask.tasks purge -f 
}

restart()
{
   stop;
   start;
}

status()
{
    if [ `ps aux | grep 'CeleryTask.celeryapp' | grep -v $0 | grep -v grep | wc -l` -eq 0 ]; then
        echo "Celery worker is stopped."
    else
        echo "Celery worker is running."
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
