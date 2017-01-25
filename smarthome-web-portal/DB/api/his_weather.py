# -*- coding: utf-8 -*-
"""
CRUD operation for historical weather model
"""
from DB.api import database
from DB.models import HisWeather
from DB.api import dbutils as utils


RESP_FIELDS = ['id', 'region_id', 'temperature', 'humidity', 'weather', 'publish_date']
SRC_EXISTED_FIELD = {
    'region_id': 'region_id',
    'temperature': 'temperature',
    'humidity': 'humidity',
    'weather': 'weather',
    'publish_date': 'publish_date',
    'create_at': 'create_at'
}


@database.run_in_session()
@utils.wrap_to_dict(RESP_FIELDS)
def new(session, src_dic, content={}):
    for k, v in SRC_EXISTED_FIELD.items():
        content[k] = src_dic.get(v, None)
    return utils.add_db_object(session, HisWeather, **content)


@database.run_in_session()
@utils.wrap_to_dict(RESP_FIELDS)
def get_weather_by_date(session, start_time, end_time, **kwargs):
    date_range = {'ge': str(start_time), 'le': str(end_time)}
    return utils.list_db_objects(session, HisWeather, publish_date=date_range, **kwargs)


if __name__ == "__main__":
    print get_weather_by_date('2017-01-08', '2017-01-10', order_by=[('publish_date', False)])
 
