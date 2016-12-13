# -*- coding: utf-8 -*-
"""
CRUD operation for fan model
"""
import database
from DB import exception
from DB.models import Fan
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
    return utils.add_db_object(session, Fan, **content)


def _get_fan(session, resource_id, order_by=[], limit=None, **kwargs):
    if isinstance(resource_id, int):
        resource_ids = {'eq': resource_id}
    elif isinstance(resource_id, list):
        resource_ids = {'in': resource_id}
    else:
        raise exception.InvalidParameter('parameter resource id format are not supported.')
    return \
        utils.list_db_objects(session, Fan, order_by=order_by, limit=limit, resource_id=resource_ids, **kwargs)


@database.run_in_session()
@utils.wrap_to_dict(RESP_FIELDS)      # wrap the raw DB object into dict
def get_fan_by_gateway_uuid(session, resource_id):
    return _get_fan(session, resource_id)


@database.run_in_session()
@utils.wrap_to_dict(RESP_FIELDS)      # wrap the raw DB object into dict
def get_latest_by_gateway_uuid(session, resource_id, ):
    fan = _get_fan(session, resource_id, order_by=[('id', True)], limit=1)
    return fan[0] if len(fan) else None


@database.run_in_session()
@utils.wrap_to_dict(RESP_FIELDS)
def get_fan_by_time(session, start_time, end_time):
    return utils.list_db_objects(session, Fan, created_at={'ge': str(start_time), 'le': str(end_time)})

