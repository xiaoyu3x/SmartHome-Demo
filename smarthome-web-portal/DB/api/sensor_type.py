# -*- coding: utf-8 -*-
"""
CRUD operation for sensor_type model
"""
from DB.api import database
from DB.models import SensorType
from DB.api import dbutils as utils

RESP_FIELDS = ['id', 'type']
SRC_EXISTED_FIELD = {
    'id': 'id',
    'type': 'type',
}


@database.run_in_session()
def add_sensor_type(session, src_dic, content={}):
    for k, v in SRC_EXISTED_FIELD.items():
        content[k] = src_dic.get(v, None)
    return utils.add_db_object(session, SensorType, **content)


@database.run_in_session()
@utils.wrap_to_dict(RESP_FIELDS)  # wrap the raw DB object into dict
def get_all_types(session):
    return utils.list_db_objects(session, SensorType)

