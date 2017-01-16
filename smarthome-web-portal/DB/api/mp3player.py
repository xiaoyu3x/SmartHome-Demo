# -*- coding: utf-8 -*-
"""
CRUD operation for environment model
"""
from DB.api import database
from DB import exception
from DB.models import MP3Player
from DB.api import dbutils as utils


RESP_FIELDS = ['id', 'resource', 'resource_id', 'media_states', 'playlist', 'state', 'title', 'created_at']
SRC_EXISTED_FIELD = {'id': 'id',
                     'resource_id': 'resource_id',
                     'media_states': 'media_states',
                     'playlist': 'playlist',
                     'state': 'state',
                     'title': 'title',
                     'created_at': 'created_at'
                     }


@database.run_in_session()
@utils.wrap_to_dict(RESP_FIELDS)
def new(session, src_dic, content={}):
    for k, v in SRC_EXISTED_FIELD.items():
        content[k] = src_dic.get(v, None)
    return utils.add_db_object(session, MP3Player, **content)


def _get_mp3player(session, resource_id, order_by=[], limit=None, **kwargs):
    if isinstance(resource_id, int):
        resource_ids = {'eq': resource_id}
    elif isinstance(resource_id, list):
        resource_ids = {'in': resource_id}
    else:
        raise exception.InvalidParameter('parameter resource id format are not supported.')
    return \
        utils.list_db_objects(session, MP3Player, order_by=order_by, limit=limit,
                              resource_id=resource_ids, **kwargs)


@database.run_in_session()
@utils.wrap_to_dict(RESP_FIELDS)  # wrap the raw DB object into dict
def get_mp3player_by_gateway_uuid(session, resource_id):
    return _get_mp3player(session, resource_id)


# get the latest data if exists
@database.run_in_session()
@utils.wrap_to_dict(RESP_FIELDS)      # wrap the raw DB object into dict
def get_latest_by_gateway_uuid(session, resource_id, ):
    player = _get_mp3player(session, resource_id, order_by=[('id', True)], limit=1)
    return player[0] if len(player) else None