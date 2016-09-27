# -*- coding: utf-8 -*-
"""
CRUD operation for temperature model
"""
import database
from sqlalchemy import func
from DB import exception
from DB.models import Temperature
from DB.api import dbutils as utils

RESP_FIELDS = ['id', 'uuid', 'temperature', 'units', 'range', 'gateway_id', 'created_at']
SRC_EXISTED_FIELD = {
    'id': 'id',
    'uuid': 'uuid',
    'temperature': 'temperature',
    'units': 'units',
    'range': 'range',
    'gateway_id': 'gateway_id',
    'created_at': 'created_at'
}


@database.run_in_session()
@utils.wrap_to_dict(RESP_FIELDS)
def new(session, src_dic, content={}):
    for k, v in SRC_EXISTED_FIELD.items():
        content[k] = src_dic.get(v, None)
    return utils.add_db_object(session, Temperature, **content)


def _get_temperature(session, gateway_id, uuid, order_by=[], limit=None, **kwargs):
    if isinstance(uuid, basestring):
        ids = {'eq': uuid}
    elif isinstance(uuid, list):
        ids = {'in': uuid}
    else:
        raise exception.InvalidParameter('parameter uuid format are not supported.')
    return \
        utils.list_db_objects(session, Temperature, order_by=order_by, limit=limit, gateway_id=gateway_id, uuid=ids, **kwargs)


@database.run_in_session()
@utils.wrap_to_dict(RESP_FIELDS)  # wrap the raw DB object into dict
def get_temperature_by_gateway_uuid(session, gateway_id, uuid):
    return _get_temperature(session, gateway_id, uuid)


@database.run_in_session()
@utils.wrap_to_dict(RESP_FIELDS)  # wrap the raw DB object into dict
def get_latest_by_gateway_uuid(session, gateway_id, uuid, ):
    temperature = _get_temperature(session, gateway_id, uuid, order_by=[('id', True)], limit=1)
    return temperature[0] if len(temperature) else None


@database.run_in_session()
# @utils.wrap_to_dict(["avg_temp", "hour"])
def get_data_by_time(session, start_time, end_time):
    #return utils.list_db_objects(session, Temperature, created_at={'ge': str(start_time), 'le': str(end_time)})
    return utils.list_db_objects_by_group(session, Temperature,
                                          select=[func.avg(Temperature.temperature).label("avg_temp"),
                                                  func.hour(Temperature.created_at).label("hour")],
                                          group_by=func.hour(Temperature.created_at),
                                          created_at={'ge': str(start_time), 'le': str(end_time)})
