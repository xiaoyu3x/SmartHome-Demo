# -*- coding: utf-8 -*-
"""
CRUD operation for solar model
"""
from DB.api import database
from DB import exception
from DB.models import Solar
from DB.api import dbutils as utils

RESP_FIELDS = ['id', 'uuid', 'status', 'gateway_id', 'tiltpercentage', 'lcd_first', 'lcd_second', 'created_at']
SRC_EXISTED_FIELD = {'id': 'id',
                     'uuid': 'uuid',
                     'status': 'status',
                     'tiltpercentage': 'tiltpercentage',
                     'lcd_first': 'lcd_first',
                     'lcd_second': 'lcd_second',
                     'gateway_id': 'gateway_id',
                     'created_at': 'created_at'
                     }


@database.run_in_session()
@utils.wrap_to_dict(RESP_FIELDS)
def new(session, src_dic, content={}):
    for k, v in SRC_EXISTED_FIELD.items():
        content[k] = src_dic.get(v, None)
    return utils.add_db_object(session, Solar, **content)


def _get_solar(session, gateway_id, uuid, order_by=[], limit=None, **kwargs):
    if isinstance(uuid, basestring):
        ids = {'eq': uuid}
    elif isinstance(uuid, list):
        ids = {'in': uuid}
    else:
        raise exception.InvalidParameter('parameter uuid format are not supported.')
    return \
        utils.list_db_objects(session, Solar, order_by=order_by, limit=limit, gateway_id=gateway_id, uuid=ids, **kwargs)


@database.run_in_session()
@utils.wrap_to_dict(RESP_FIELDS)  # wrap the raw DB object into dict
def get_solar_by_gateway_uuid(session, gateway_id, uuid):
    return _get_solar(session, gateway_id, uuid)


# get the latest status if exists
@database.run_in_session()
@utils.wrap_to_dict(RESP_FIELDS)      # wrap the raw DB object into dict
def get_latest_by_gateway_uuid(session, gateway_id, uuid, ):
    solar = _get_solar(session, gateway_id, uuid, order_by=[('id', True)], limit=1)
    return solar[0] if len(solar) else None


@database.run_in_session()
@utils.wrap_to_dict(RESP_FIELDS)  # wrap the raw DB object into dict
def get_solar_by_time(session, start_time, end_time):
    return utils.list_db_objects(session, Solar, created_at={'ge': str(start_time), 'le': str(end_time)})
