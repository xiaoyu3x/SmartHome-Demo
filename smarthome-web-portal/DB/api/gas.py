# -*- coding: utf-8 -*-
"""
CRUD operation for gas model
"""
from DB.api import database
from DB import exception
from DB.models import Gas
from DB.api import dbutils as utils
from sqlalchemy import func

RESP_FIELDS = ['id', 'status', 'resource', 'created_at']
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
    return utils.add_db_object(session, Gas, **content)


def _get_gas(session, resource_id, order_by=[], limit=None, **kwargs):
    if isinstance(resource_id, int):
        resource_ids = {'eq': resource_id}
    elif isinstance(resource_id, list):
        resource_ids = {'in': resource_id}
    else:
        raise exception.InvalidParameter('parameter resource id format are not supported.')
    return \
        utils.list_db_objects(session, Gas, order_by=order_by, limit=limit, resource_id=resource_id, **kwargs)


@database.run_in_session()
@utils.wrap_to_dict(RESP_FIELDS)  # wrap the raw DB object into dict
def get_gas_by_gateway_uuid(session, resource_id):
    return _get_gas(session, resource_id)


# get the latest true status if exists
@database.run_in_session()
@utils.wrap_to_dict(RESP_FIELDS)      # wrap the raw DB object into dict
def get_latest_alert_by_gateway_uuid(session, resource_id, token):
    date_range = {'gt': token}
    gas = _get_gas(session, resource_id, order_by=[('id', True)], limit=1, status=True, created_at=date_range)
    return gas[0] if len(gas) else None


# get the latest status if exists
@database.run_in_session()
@utils.wrap_to_dict(RESP_FIELDS)      # wrap the raw DB object into dict
def get_latest_by_gateway_uuid(session, resource_id, ):
    gas = _get_gas(session, resource_id, order_by=[('id', True)], limit=1)
    return gas[0] if len(gas) else None


@database.run_in_session()
# @utils.wrap_to_dict(RESP_FIELDS)  # wrap the raw DB object into dict
def get_data_by_time(session, start_time, end_time, resource_list):
    # return utils.list_db_objects(session, Gas, status=True, created_at={'ge': str(start_time), 'le': str(end_time)})
    return utils.list_db_objects_by_group(session, Gas,
                                          select=[func.count(Gas.status).label("cnt"),
                                                  func.hour(Gas.created_at).label("hour")],
                                          group_by=func.hour(Gas.created_at),
                                          status=True,
                                          created_at={'ge': str(start_time), 'le': str(end_time)},
                                          resource_id={'in': resource_list})
