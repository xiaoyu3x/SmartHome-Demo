# -*- coding: utf-8 -*-
"""
CRUD operation for motion model
"""
from DB.api import database
from DB import exception
from DB.models import Motion
from DB.api import dbutils as utils

RESP_FIELDS = ['id', 'uuid', 'status', 'gateway_id', 'created_at']
SRC_EXISTED_FIELD = {
    'id': 'id',
    'uuid': 'uuid',
    'status': 'status',
    'gateway_id': 'gateway_id',
    'created_at': 'created_at'
}


@database.run_in_session()
@utils.wrap_to_dict(RESP_FIELDS)
def new(session, src_dic, content={}):
    for k, v in SRC_EXISTED_FIELD.items():
        content[k] = src_dic.get(v, None)
    return utils.add_db_object(session, Motion, **content)


def _get_motion(session, gateway_id, uuid, order_by=[], limit=None, **kwargs):
    if isinstance(uuid, basestring):
        ids = {'eq': uuid}
    elif isinstance(uuid, list):
        ids = {'in': uuid}
    else:
        raise exception.InvalidParameter('parameter uuid format are not supported.')
    return \
        utils.list_db_objects(session, Motion, order_by=order_by, limit=limit, gateway_id=gateway_id, uuid=ids, **kwargs)


@database.run_in_session()
@utils.wrap_to_dict(RESP_FIELDS)  # wrap the raw DB object into dict
def get_motion_by_gateway_uuid(session, gateway_id, uuid):
    return _get_motion(session, gateway_id, uuid)


# get the latest true status if exists
@database.run_in_session()
@utils.wrap_to_dict(RESP_FIELDS)      # wrap the raw DB object into dict
def get_latest_alert_by_gateway_uuid(session, gateway_id, uuid, token):
    date_range = {'gt': token}
    motion = _get_motion(session, gateway_id, uuid, order_by=[('id', True)], limit=1, status=True, created_at=date_range)
    # print motion
    return motion[0] if len(motion) else None


# get the latest status if exists
@database.run_in_session()
@utils.wrap_to_dict(RESP_FIELDS)      # wrap the raw DB object into dict
def get_latest_by_gateway_uuid(session, gateway_id, uuid,):
    motion = _get_motion(session, gateway_id, uuid, order_by=[('id', True)], limit=1)
    return motion[0] if len(motion) else None


@database.run_in_session()
@utils.wrap_to_dict(RESP_FIELDS)  # wrap the raw DB object into dict
def get_motion_by_time(session, start_time, end_time):
    return utils.list_db_objects(session, Motion, created_at={'ge': str(start_time), 'le': str(end_time)})