# -*- coding: utf-8 -*-
"""
CRUD operation for led model
"""
import database
from DB import exception
from DB.models import Led
from DB.api import dbutils as utils

RESP_FIELDS = ['id', 'resource', 'status', 'created_at']
SRC_EXISTED_FIELD = {
    'id': 'id',
    # 'uuid': 'uuid',
    'status': 'status',
    'resource_id': 'resource_id',
    'created_at': 'created_at'
}


@database.run_in_session()
@utils.wrap_to_dict(RESP_FIELDS)
def new(session, src_dic, content={}):
    for k, v in SRC_EXISTED_FIELD.items():
        content[k] = src_dic.get(v, None)
    return utils.add_db_object(session, Led, **content)


def _get_led(session, resource_id, order_by=[], limit=None, **kwargs):
    if isinstance(resource_id, int):
        resource_ids = {'eq': resource_id}
    elif isinstance(resource_id, list):
        resource_ids = {'in': resource_id}
    else:
        raise exception.InvalidParameter('parameter uuid format are not supported.')
    return \
        utils.list_db_objects(session, Led, order_by=order_by, limit=limit, resource_id=resource_ids, **kwargs)


@database.run_in_session()
@utils.wrap_to_dict(RESP_FIELDS)      # wrap the raw DB object into dict
def get_led_by_gateway_uuid(session, resource_id):
    return _get_led(session, resource_id)


@database.run_in_session()
@utils.wrap_to_dict(RESP_FIELDS)      # wrap the raw DB object into dict
def get_latest_by_gateway_uuid(session, resource_id, ):
    led = _get_led(session, resource_id, order_by=[('id', True)], limit=1)
    return led[0] if len(led) else None


@database.run_in_session()
@utils.wrap_to_dict(RESP_FIELDS)
def get_led_by_time(session, start_time, end_time):
    return utils.list_db_objects(session, Led, created_at={'ge': str(start_time), 'le': str(end_time)})

