# -*- coding: utf-8 -*-
"""
CRUD operation for gateway model
"""
from DB.api import database
from DB.models import GatewayModel
from DB.api import dbutils as utils

RESP_FIELDS = ['id', 'gateway_id', 'model_id', 'data_model', 'gateway']
SRC_EXISTED_FIELD = {
    'id': 'id',
    'gateway_id': 'gateway_id',
    'model_id': 'model_id',
}


@database.run_in_session()
@utils.wrap_to_dict(RESP_FIELDS)
def get_gateway_model(session, gateway_id, exception_when_missing=False):
    return utils.get_db_object(session, GatewayModel, exception_when_missing=exception_when_missing,
                               gateway_id=gateway_id)

