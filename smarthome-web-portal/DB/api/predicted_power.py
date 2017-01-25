# -*- coding: utf-8 -*-
"""
CRUD operation for predicted power usage model
"""
from DB.api import database
from DB import exception
from DB.models import PredictedPower
from DB.api import dbutils as utils
from sqlalchemy import func

RESP_FIELDS = ['id', 'region_id', 'publish_date', 'order', 'power',] #'predict_date']
SRC_EXISTED_FIELD = {
    'region_id': 'region_id',
    'publish_date': 'publish_date',
    'order': 'order',
    'power': 'power',
    'predict_date': 'predict_date'
}


@database.run_in_session()
@utils.wrap_to_dict(RESP_FIELDS)
def new(session, src_dic, content={}):
    for k, v in SRC_EXISTED_FIELD.items():
        content[k] = src_dic.get(v, None)
    return utils.add_db_object(session, PredictedPower, **content)


@database.run_in_session()
@utils.wrap_to_dict(RESP_FIELDS)
def get_power(session, **kwargs):
    return utils.list_db_objects(session, PredictedPower, **kwargs)


@database.run_in_session()
@utils.wrap_to_dict(RESP_FIELDS)
def get_power_by_date(session, start_time, end_time, **kwargs):
    date_range = {'ge': str(start_time), 'le': str(end_time)}
    return utils.list_db_objects(session, PredictedPower, publish_date=date_range, **kwargs) 

if __name__ == "__main__":
    print get_power_by_date('2017-01-09', '2017-01-15', order=24, region_id=1, order_by=[('publish_date', False)])
    # print get_power_by_date(publish_date='2017-01-09', order_by=[('publish_date', False)])
