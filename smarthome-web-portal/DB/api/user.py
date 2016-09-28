# -*- coding: utf-8 -*-
"""
CRUD operation for user model
"""
import database
from DB.models import User
from DB.api import dbutils as utils

RESPONSE_FIELDS = ['id', 'username', 'password', 'phone', 'gateway']
SRC_EXISTED_FIELD = {
    'id': 'id',
    'username': 'username',
    'password': 'password',
    'phone': 'phone',
    'gateway_id': 'gateway_id',
    'created_at': 'created_at',
}


@database.run_in_session()
def add_user(session, src_dic, content={}):
    for k, v in SRC_EXISTED_FIELD.items():
        content[k] = src_dic.get(v, None)
    return utils.add_db_object(session, User, **content)


@utils.supported_filters(optional_support_keys=['id', 'username', 'exception_when_missing'])
@database.run_in_session()
def delete_user(session, username, **kwargs):
    user = utils.get_db_object(session, User, exception_when_missing=False, username=username)
    return utils.del_db_object(session, user)


@database.run_in_session()
def login(session, user_name):
    u = _user_gateway(session, user_name, False)
    return u.get('password') if u else None


@utils.supported_filters(optional_support_keys=['id', 'username', 'exception_when_missing'])
@utils.wrap_to_dict(RESPONSE_FIELDS)
def _user_gateway(session, user_name, exception_when_missing=True):
    return utils.get_db_object(session, User, exception_when_missing=exception_when_missing, username=user_name)


@database.run_in_session()
def user_gatewayid(session, user_name):
    gateway_id = _user_gateway(session, user_name)['gateway']['id']
    return gateway_id


@database.run_in_session()
def user_gatewayurl(session, user_name):
    url = _user_gateway(session, user_name)['gateway']['url']
    return url


@database.run_in_session()
def get_all_user_names(session):
    users = utils.list_db_objects(session, User, exception_when_missing=False, status=True)
    u_list = [u.username for u in users if u.username]
    return set(u_list)


@utils.supported_filters(optional_support_keys=['id', 'gateway_id', 'exception_when_missing'])
@database.run_in_session()
def get_user_phone_by_gateway(session, gateway_id, exception_when_missing=True):
    users = utils.list_db_objects(session, User, exception_when_missing=exception_when_missing, gateway_id=gateway_id)
    return [u.phone for u in users]
