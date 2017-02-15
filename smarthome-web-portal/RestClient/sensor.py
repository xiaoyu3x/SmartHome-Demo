# -*- coding: utf-8 -*-
"""
A device sensor wrapper to send http requests
"""
import logging
import json
from RestClient.api.IoTClient import IoTClient
from RestClient.api.iotError import IoTRequestError
from utils.config import config
from DB.api import sensor_type

logger = logging.getLogger(__name__)


class Sensor(object):
    _client = None

    def __init__(self, uuid, path, resource_type, username):
        self.path = path
        self.id = uuid
        self.resource_type = resource_type.strip() if resource_type else None
        self.resp = None
        self._object_map = Sensor.get_sensor_types_map()
        if self.resource_type not in self._object_map:
            raise Exception("(Sensor): Unsupported resource type: {}. ". format(self.path))
        self.connect(username)

    @staticmethod
    def get_sensor_types_map():
        types = sensor_type.get_all_types()
        mapping = [t_dict['type'] for t_dict in types]
        return mapping

    def connect(self, username):
        """
        Connect to IoT web service
        """
        if self._client is None:
            self._client = IoTClient(username, proxies=config.get_all_proxy())

    def get_data(self, stream=False, callback=None, **kargs):
        data = {'obs': 1} if stream else {}
        uri = "{}?di={}".format(self.path, self.id)
        self.resp = self._client.get(uri, data=data, stream=stream)
        if stream:
            self.resp.get_data(callback, **kargs)
        else:
            return self.resp.content if self.resp.ok() else None

    def terminate(self):
        if self.resp:
            self.resp.close()

    def update_status(self, data):
        ret = False
        uri = "{}?di={}".format(self.path, self.id)
        if isinstance(data, dict):
            self.resp = self._client.post(uri, json.dumps(data))
            # print "########POST data " + json.dumps(data)
            if self.resp.ok():
                # print "The response status is " + str(self.resp.status_code)
                ret = True
            else:
                print('Failed to update {} status: {}'.format(uri, str(self.resp.errors())))
                raise IoTRequestError(self.resp.status_code)
        return ret









