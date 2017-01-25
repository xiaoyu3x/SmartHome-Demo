# -*- coding: utf-8 -*-
"""
CRUD operation for illuminance model
"""
import database
from DB import exception
from DB.models import Illuminance
from DB.api import dbutils as utils
from sqlalchemy import func

RESP_FIELDS = ['id', 'resource', 'illuminance', 'created_at']
SRC_EXISTED_FIELD = {
    'id': 'id',
    # 'uuid': 'uuid',
    'illuminance': 'illuminance',
    'resource_id': 'resource_id',
    'created_at': 'created_at'
}


@database.run_in_session()
@utils.wrap_to_dict(RESP_FIELDS)
def new(session, src_dic, content={}):
    for k, v in SRC_EXISTED_FIELD.items():
        content[k] = src_dic.get(v, None)
    return utils.add_db_object(session, Illuminance, **content)


def _get_illuminance(session, resource_id, order_by=[], limit=None, **kwargs):
    if isinstance(resource_id, int):
        resource_id = {'eq': resource_id}
    elif isinstance(resource_id, list):
        resource_id = {'in': resource_id}
    else:
        raise exception.InvalidParameter('parameter resource id format are not supported.')
    return \
        utils.list_db_objects(session, Illuminance, order_by=order_by, limit=limit, resource_id=resource_id, **kwargs)


@database.run_in_session()
@utils.wrap_to_dict(RESP_FIELDS)      # wrap the raw DB object into dict
def get_illuminance_by_gateway_uuid(session, resource_id):
    return _get_illuminance(session, resource_id)


@database.run_in_session()
@utils.wrap_to_dict(RESP_FIELDS)      # wrap the raw DB object into dict
def get_latest_by_gateway_uuid(session, resource_id, ):
    illuminance = _get_illuminance(session, resource_id, order_by=[('id', True)], limit=1)
    return illuminance[0] if len(illuminance) else None


@database.run_in_session()
def get_data_by_time(session, start_time, end_time, resource_list):
    #return utils.list_db_objects(session, Illuminance, created_at={'ge': str(start_time), 'le': str(end_time)})
    return utils.list_db_objects_by_group(session, Illuminance,
                                          select=[func.avg(Illuminance.illuminance).label("avg_illuminance"),
                                                  func.hour(Illuminance.created_at).label("hour")],
                                          group_by=func.hour(Illuminance.created_at),
                                          created_at={'ge': str(start_time), 'le': str(end_time)},
                                          resource_id={'in': resource_list})
