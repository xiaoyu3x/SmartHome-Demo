# -*- coding: utf-8 -*-
"""
CRUD operation for energy model
"""
from DB.api import database
from DB import exception
from DB.models import Energy
from DB.api import dbutils as utils


RESP_FIELDS = ['id', 'uuid', 'status', 'gateway_id', 'value', 'created_at']
SRC_EXISTED_FIELD = {'id': 'id',
                     'uuid': 'uuid',
                     'value': 'value',
                     'gateway_id': 'gateway_id',
                     'created_at': 'created_at'
                     }


@database.run_in_session()
@utils.wrap_to_dict(RESP_FIELDS)
def new(session, src_dic, content={}):
    for k, v in SRC_EXISTED_FIELD.items():
        content[k] = src_dic.get(v, None)
    return utils.add_db_object(session, Energy, **content)


def _get_energy(session, gateway_id, uuid, order_by=[], limit=None, **kwargs):
    if isinstance(uuid, basestring):
        ids = {'eq': uuid}
    elif isinstance(uuid, list):
        ids = {'in': uuid}
    else:
        raise exception.InvalidParameter('parameter uuid format are not supported.')
    return \
        utils.list_db_objects(session, Energy, order_by=order_by, limit=limit, gateway_id=gateway_id, uuid=ids, **kwargs)


@database.run_in_session()
@utils.wrap_to_dict(RESP_FIELDS)  # wrap the raw DB object into dict
def get_solar_by_gateway_uuid(session, gateway_id, uuid):
    return _get_energy(session, gateway_id, uuid)


# get the latest status if exists
@database.run_in_session()
@utils.wrap_to_dict(RESP_FIELDS)      # wrap the raw DB object into dict
def get_latest_by_gateway_uuid(session, gateway_id, uuid, ):
    solar = _get_energy(session, gateway_id, uuid, order_by=[('id', True)], limit=1)
    return solar[0] if len(solar) else None