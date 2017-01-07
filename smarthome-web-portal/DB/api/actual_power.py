# -*- coding: utf-8 -*-
"""
CRUD operation for actual power usage model
"""
from DB.api import database
from DB import exception
from DB.models import ActualPower
from DB.api import dbutils as utils
from sqlalchemy import func

RESP_FIELDS = ['id', 'region_id', 'collect_date', 'power']
SRC_EXISTED_FIELD = {
    'region_id': 'region_id',
    'collect_date': 'collect_date',
    'power': 'power',
}


@database.run_in_session()
@utils.wrap_to_dict(RESP_FIELDS)
def new(session, src_dic, content={}):
    for k, v in SRC_EXISTED_FIELD.items():
        content[k] = src_dic.get(v, None)
    return utils.add_db_object(session, ActualPower, **content)


@database.run_in_session()
@utils.wrap_to_dict(RESP_FIELDS)
def get_power_by_date(session, start_time, end_time, **kwargs):
    date_range={'ge': str(start_time), 'le': str(end_time)}
    return utils.list_db_objects(session, ActualPower, collect_date=date_range, **kwargs) 

if __name__ == "__main__":
    print get_power_by_date('2017-02-09', '2017-02-12', region_id=1, order_by=[('collect_date', False)])
