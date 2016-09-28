# -*- coding: utf-8 -*-
"""
CRUD operation for sensor_type model
"""
from DB.api import database
from DB.models import SensorType
from DB.api import dbutils as utils

SRC_EXISTED_FIELD = {
    'id': 'id',
    'type': 'type',
}


@database.run_in_session()
def add_sensor_type(session, src_dic, content={}):
    for k, v in SRC_EXISTED_FIELD.items():
        content[k] = src_dic.get(v, None)
    return utils.add_db_object(session, SensorType, **content)

