# -*- coding: utf-8 -*-
"""
CRUD operation for temperature model
"""
import database
from sqlalchemy import func
from DB import exception
from DB.models import Temperature
from DB.api import dbutils as utils

RESP_FIELDS = ['id', 'resource', 'temperature', 'units', 'range', 'created_at']
SRC_EXISTED_FIELD = {
    'id': 'id',
    # 'uuid': 'uuid',
    'temperature': 'temperature',
    'units': 'units',
    'range': 'range',
    'resource_id': 'resource_id',
    'created_at': 'created_at'
}


@database.run_in_session()
@utils.wrap_to_dict(RESP_FIELDS)
def new(session, src_dic, content={}):
    for k, v in SRC_EXISTED_FIELD.items():
        content[k] = src_dic.get(v, None)
    return utils.add_db_object(session, Temperature, **content)


def _get_temperature(session, resource_id, order_by=[], limit=None, **kwargs):
    if isinstance(resource_id, int):
        resource_ids = {'eq': resource_id}
    elif isinstance(resource_id, list):
        resource_ids = {'in': resource_id}
    else:
        raise exception.InvalidParameter('parameter uuid format are not supported.')
    return \
        utils.list_db_objects(session, Temperature, order_by=order_by, limit=limit, resource_id=resource_ids, **kwargs)


@database.run_in_session()
@utils.wrap_to_dict(RESP_FIELDS)  # wrap the raw DB object into dict
def get_temperature_by_gateway_uuid(session, resource_id):
    return _get_temperature(session, resource_id)


@database.run_in_session()
@utils.wrap_to_dict(RESP_FIELDS)  # wrap the raw DB object into dict
def get_latest_by_gateway_uuid(session, resource_id, ):
    temperature = _get_temperature(session, resource_id, order_by=[('id', True)], limit=1)
    return temperature[0] if len(temperature) else None


@database.run_in_session()
# @utils.wrap_to_dict(["avg_temp", "hour"])
def get_data_by_time(session, start_time, end_time, resource_list):
    return utils.list_db_objects_by_group(session, Temperature,
                                          select=[func.avg(Temperature.temperature).label("avg_temp"),
                                                  func.hour(Temperature.created_at).label("hour")],
                                          group_by=func.hour(Temperature.created_at),
                                          created_at={'ge': str(start_time), 'le': str(end_time)},
                                          resource_id={'in': resource_list})
