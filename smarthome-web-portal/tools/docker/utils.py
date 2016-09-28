import datetime
import json
import os


def get_utc_now():
    return datetime.datetime.utcnow()


def format_datetime(date_time):
    """Generate string from datetime object."""
    return date_time.strftime("%Y-%m-%d %H:%M:%S")


def get_vcap_service():
    vcap_config = os.getenv('VCAP_SERVICES', None)
    if vcap_config:
        decoded_config = json.loads(vcap_config)
        for key, value in decoded_config.iteritems():
            if key.startswith('mysql56'):
                mysql_creds = decoded_config[key][0]['credentials']
                return "{}?charset=utf8".format(str(mysql_creds['uri']))
    else:
        return 'mysql://root:intel123@localhost:3306/smart_home??charset=utf8'


