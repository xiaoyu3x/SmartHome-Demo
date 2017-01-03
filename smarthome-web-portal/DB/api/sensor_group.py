# -*- coding: utf-8 -*-
"""
CRUD operation for sensor_group model
"""
from DB.api import database
from DB.models import SensorGroup
from DB.api import dbutils as utils

RESP_FIELDS = ['id', 'name', 'color']
SRC_EXISTED_FIELD = {
    'name': 'name',
    'color': 'color',
    'gateway_id': 'gateway_id',
}


@database.run_in_session()
@utils.wrap_to_dict(RESP_FIELDS)
def new(session, src_dic, content={}):
    for k, v in SRC_EXISTED_FIELD.items():
        content[k] = src_dic.get(v, None)
    return utils.add_db_object(session, SensorGroup, **content)


@database.run_in_session()
@utils.wrap_to_dict(RESP_FIELDS)  # wrap the raw DB object into dict
def get_all_groups(session, gateway_id):
    return utils.list_db_objects(session, SensorGroup, gateway_id=gateway_id)


@database.run_in_session()
@utils.wrap_to_dict(RESP_FIELDS)  # wrap the raw DB object into dict
def get_sensor_group(session, sg_id):
    return utils.get_db_object(session, SensorGroup, id=sg_id)
