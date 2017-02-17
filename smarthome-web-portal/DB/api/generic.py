# -*- coding: utf-8 -*-
"""
CRUD operation for generic model
"""
from DB.api import database
from DB import exception
from DB.models import Generic
from DB.api import dbutils as utils


RESP_FIELDS = ['id', 'resource', 'json_data', 'created_at']
SRC_EXISTED_FIELD = {'id': 'id',
                     'json_data': 'json_data',
                     'resource_id': 'resource_id',
                     'created_at': 'created_at'
                     }


@database.run_in_session()
@utils.wrap_to_dict(RESP_FIELDS)
def new(session, src_dic, content={}):
    for k, v in SRC_EXISTED_FIELD.items():
        content[k] = src_dic.get(v, None)
    return utils.add_db_object(session, Generic, **content)


def _get_generic(session, resource_id, order_by=[], limit=None, **kwargs):
    if isinstance(resource_id, int):
        resource_ids = {'eq': resource_id}
    elif isinstance(resource_id, list):
        resource_ids = {'in': resource_id}
    else:
        raise exception.InvalidParameter('parameter uuid format are not supported.')
    return \
        utils.list_db_objects(session, Generic, order_by=order_by, limit=limit, resource_id=resource_ids, **kwargs)


@database.run_in_session()
@utils.wrap_to_dict(RESP_FIELDS)  # wrap the raw DB object into dict
def get_generic_by_gateway_uuid(session, resource_id):
    return _get_generic(session, resource_id)


# get the latest status if exists
@database.run_in_session()
@utils.wrap_to_dict(RESP_FIELDS)      # wrap the raw DB object into dict
def get_latest_by_gateway_uuid(session, resource_id, ):
    generic = _get_generic(session, resource_id, order_by=[('id', True)], limit=1)
    return generic[0] if len(generic) else None