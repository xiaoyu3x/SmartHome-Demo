# -*- coding: utf-8 -*-
"""
CRUD operation for sms_history model
"""
from DB.api import database
from DB import exception
from DB.models import SmsHistroy
from DB.api import dbutils as utils

RESP_FIELDS = ['id', 'uuid', 'gateway_id', 'created_at']
SRC_EXISTED_FIELD = {
    'id': 'id',
    'uuid': 'uuid',
    'gateway_id': 'gateway_id',
    'created_at': 'created_at'
}


@database.run_in_session()
@utils.wrap_to_dict(RESP_FIELDS)
def new(session, src_dic, content={}):
    for k, v in SRC_EXISTED_FIELD.items():
        content[k] = src_dic.get(v, None)
    return utils.add_db_object(session, SmsHistroy, **content)


def _get_history(session, gateway_id, uuid, order_by=[], limit=None, **kwargs):
    if isinstance(uuid, basestring):
        ids = {'eq': uuid}
    elif isinstance(uuid, list):
        ids = {'in': uuid}
    else:
        raise exception.InvalidParameter('parameter uuid format are not supported.')
    return \
        utils.list_db_objects(session, SmsHistroy, order_by=order_by, limit=limit, gateway_id=gateway_id, uuid=ids, **kwargs)


# get the latest timestamp if exists
@database.run_in_session()
def get_latest_by_gateway_uuid(session, gateway_id, uuid, token):
    date_range = {'gt': token}
    log = _get_history(session, gateway_id, uuid, created_at=date_range)
    return len(log) > 0
