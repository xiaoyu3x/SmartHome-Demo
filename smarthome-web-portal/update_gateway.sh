#!/bin/bash 

# The script is to update the gateway IP and geo location in DB
# ./update_gateway.sh [-p <gateway IP>] [-n <gatway_name>] [-a <latitude>] [-o <longitude>]

TOP_DIR=`pwd`

BASE_DIR=$(cd `dirname $0`; pwd)
cd $TOPDIR

SMART_HOME_DIR=${SMART_HOME_DIR:-$BASE_DIR}
CONF_DIR=$SMART_HOME_DIR/utils
CONF_NAME=SHProject.conf

function print_help()
{
    echo "Usage: $0 [-p <gateway IP>] [-n <gatway_name>] [-a <latitude>] [-o <longitude>]"
    exit 0 
}

function valid_ip()
{
    local  ip=$1
    local  stat=1

    if [[ $ip =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
        OIFS=$IFS
        IFS='.'
        ip=($ip)
        IFS=$OIFS
        [[ ${ip[0]} -le 255 && ${ip[1]} -le 255 \
            && ${ip[2]} -le 255 && ${ip[3]} -le 255 ]]
        stat=$?
    fi
    return $stat
}

function get_conn_str()
{
    local list="host port username password database"
    local is_first=false
    local host='', port='', password='', db='', username=''

    IFS="="
    while read -r name value
    do
        if [[ $name =~ '[' ]]; then
            if $is_first; then
                break;
            else
                is_first=true
            fi
        fi
        if [[ $list =~ $name ]]; then
            if [ "$name" == "host" ]; then
                host=`echo ${value//\"/} | tr -d '\015'`
                #host=${value//\"/}
                #echo "$name is $host"
            elif [ "$name" == "port" ]; then
                if [[ -z $value ]];
                then
                    port=3306
                else
                    port=`echo ${value//\"/} | tr -d '\015'`
                fi
                #port=${value//\"/}
            #echo "$name is $port"
            elif [ "$name" == "password" ]; then
                password=`echo ${value//\"/} | tr -d '\015'`
            #echo "$name is $password"
            elif [ "$name" == "database" ]; then
                db=`echo ${value//\"/} | tr -d '\015'`
            #echo "$name is $db"
            elif [ "$name" == "username" ]; then
                username=`echo ${value//\"/} | tr -d '\015'`
            #echo "$name is $username"
            fi
        fi
    done < $CONF_DIR/$CONF_NAME
    echo "mysql -u$username -p$password -h$host -P$port $db"
}

if [[ $# -lt 1 ]]
then
    print_help
fi

until [[ -z "$1" ]]
do
    if [[ "$1" == "-h" ]]
    then
    print_help
    elif [[ "$1" == "-p" ]]
    then
        shift
        ip=$1
    elif [[ "$1" == "-n" ]]
    then
        shift
        gname=$1
    elif [[ "$1" == "-a" ]]
    then
        shift
        latitude=$1
    elif [[ "$1" == "-o" ]]
    then
        shift
        longitude=$1
    else
    print_help
    fi
    shift
done

if [[ -z $ip ]]
then
    echo "Gateway ip is not given, exiting ..."
    exit 1
elif ! valid_ip $ip;
then
    echo "The given gateway ip is not a valid ipv4 address, exiting ..."
    exit 1
fi

if [[ -z $gname ]] 
then
    echo "Gateway name is not given, use default name: 'demo'. "
    gname=demo
fi

conn_str=`get_conn_str`
query_str="update gateway set url='https://$ip:8000/'"

if [[ ! -z $latitude ]]
then
    query_str="$query_str, latitude='$latitude'"
fi

if [[ ! -z $longitude ]]
then
    query_str="$query_str, longitude='$longitude'"
fi

query_str="$query_str where name='$gname';"
echo $query_str
sql_str="$conn_str -e \"$query_str\""

eval $sql_str
if [[ $? -eq 0 ]];
then
    echo "Gateway IP has been updated to $ip."
else
    echo "There is sth wrong with the command: $sql_str"
    exit 1
fi
