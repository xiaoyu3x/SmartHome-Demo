# -*- coding: utf-8 -*-
"""
CRUD operation for actual weather model
"""
from DB.api import database
from DB import exception
from DB.models import ActualWeather
from DB.api import dbutils as utils
from sqlalchemy import func

RESP_FIELDS = ['id', 'region_id', 'forecast_date', 'order', 'temperature', 'humidity', 'weather', 'publish_date']
SRC_EXISTED_FIELD = {
    'region_id': 'region_id',
    'forecast_date': 'forecast_date',
    'temperature': 'temperature',
    'humidity': 'humidity',
    'weather': 'weather',
    'order': 'order',
    'publish_date': 'publish_date',
    'create_at': 'create_at'
}

@database.run_in_session()
@utils.wrap_to_dict(RESP_FIELDS)
def new(session, src_dic, content={}):
    for k, v in SRC_EXISTED_FIELD.items():
        content[k] = src_dic.get(v, None)
    return utils.add_db_object(session, ActualWeather, **content)


@database.run_in_session()
@utils.wrap_to_dict(RESP_FIELDS)
def get_weather_by_date(session, start_time, end_time, **kwargs):
    date_range={'ge': str(start_time), 'le': str(end_time)}
    return utils.list_db_objects(session, ActualWeather, publish_date=date_range, **kwargs) 

if __name__ == "__main__":
    print get_weather_by_date('2017-01-09', '2017-01-12', order=24, region_id=1, order_by=[('publish_date', False)])
