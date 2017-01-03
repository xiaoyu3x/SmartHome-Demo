# -*- coding: utf-8 -*-
"""
CRUD operation for resource model
"""
from DB.models import Resource
from DB.api import dbutils as utils
from DB.api import database

RESP_FIELDS = ['id', 'uuid', 'sensor_type', 'path', 'status', 'tag', 'gateway_id', 'sensor_group', 'sensor_type_id',
               'sensor_group_id', 'created_at']
SRC_EXISTED_FIELD = {
    'uuid': 'uuid',
    'sensor_type_id': 'sensor_type_id',
    'sensor_group_id': 'sensor_group_id',
    'status': 'status',
    'path': 'path',
    'tag': 'tag',
    'gateway_id': 'gateway_id',
    'created_at': 'created_at',
}


@database.run_in_session()
@utils.wrap_to_dict(RESP_FIELDS)
def add_resource(session, src_dic, content={}):
    for k, v in SRC_EXISTED_FIELD.items():
        content[k] = src_dic.get(v, None)
    return utils.add_db_object(session, Resource, **content)


@utils.supported_filters(optional_support_keys=['id', 'uuid', 'path', 'gateway_id', 'status', 'exception_when_missing'])
@database.run_in_session()
@utils.wrap_to_dict(RESP_FIELDS)
def get_resource(session=None, exception_when_missing=True,  **kwargs):
    """
    :param session:
    :param exception_when_missing: raise exception when missing
    :return:get field of the resource
    """
    return utils.get_db_object(
        session, Resource, exception_when_missing, **kwargs)


@utils.supported_filters(optional_support_keys=['status', 'gateway_id', 'sensor_type_id'])
@database.run_in_session()
@utils.wrap_to_dict(RESP_FIELDS)
def list_resource(session=None, **filters):
    """
    :param session:
    :param filters:
    :return: list blocks
    """
    return utils.list_db_objects(session, Resource, **filters)


@utils.wrap_to_dict(RESP_FIELDS)
def _update_resource(session, resource_id, **kwargs):
    res = utils.get_db_object(session, Resource, id=resource_id)
    return utils.update_db_object(session, res, **kwargs)


@utils.supported_filters(optional_support_keys=['id', 'status', 'gateway_id', 'sensor_type_id', 'sensor_group_id', 'tag'])
@database.run_in_session()
def update_resource(session, id, **kwargs):
    return _update_resource(
        session, id, **kwargs
    )


if __name__ == "__main__":
    print get_resource(id=2)