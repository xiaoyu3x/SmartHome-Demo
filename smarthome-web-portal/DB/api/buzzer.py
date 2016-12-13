# -*- coding: utf-8 -*-
"""
CRUD operation for buzzer model
"""
from DB.api import database
from DB import exception
from DB.models import Buzzer
from DB.api import dbutils as utils
from sqlalchemy import func

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
    return utils.add_db_object(session, Buzzer, **content)


def _get_buzzer(session, resource_id, order_by=[], limit=None, **kwargs):
    if isinstance(resource_id, int):
        resource_ids = {'eq': resource_id}
    elif isinstance(resource_id, list):
        resource_ids = {'in': resource_id}
    else:
        raise exception.InvalidParameter('parameter uuid format are not supported.')
    return \
        utils.list_db_objects(session, Buzzer, order_by=order_by, limit=limit, resource_id=resource_ids, **kwargs)


@database.run_in_session()
@utils.wrap_to_dict(RESP_FIELDS)      # wrap the raw DB object into dict
def get_buzzer_by_gateway_uuid(session, resource_id):
    return _get_buzzer(session, resource_id)


@database.run_in_session()
@utils.wrap_to_dict(RESP_FIELDS)      # wrap the raw DB object into dict
def get_latest_alert_by_gateway_uuid(session, resource_id, token):
    date_range = {'gt': token}
    buzzer = _get_buzzer(session, resource_id, order_by=[('id', True)], limit=1, status=True, created_at=date_range)
    return buzzer[0] if len(buzzer) else None


@database.run_in_session()
@utils.wrap_to_dict(RESP_FIELDS)      # wrap the raw DB object into dict
def get_latest_by_gateway_uuid(session, resource_id):
    buzzer = _get_buzzer(session, resource_id, order_by=[('id', True)], limit=1)
    return buzzer[0] if len(buzzer) else None


@database.run_in_session()
# @utils.wrap_to_dict(RESP_FIELDS)
def get_data_by_time(session, start_time, end_time):
    # return utils.list_db_objects(session, Buzzer, created_at={'ge': str(start_time), 'le': str(end_time)})
    return utils.list_db_objects_by_group(session, Buzzer,
                                          select=[func.count(Buzzer.status),
                                                  func.hour(Buzzer.created_at)],
                                          group_by=func.hour(Buzzer.created_at),
                                          status=True,
                                          created_at={'ge': str(start_time), 'le': str(end_time)})

