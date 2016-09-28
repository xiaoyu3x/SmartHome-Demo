# -*- coding: utf-8 -*-
"""
A device sensor wrapper to send http requests
"""
import logging
import json
from RestClient.api.IoTClient import IoTClient
from utils.config import config

logger = logging.getLogger(__name__)


class Sensor(object):
    _client = None

    _object_map = {
        '/a/pir': None,
        '/a/gas': None,
        '/a/fan': None,
        '/a/solar': None,
        '/a/illuminance': None,
        '/a/led': None,
        '/a/rgbled': None,
        '/a/buzzer': None,
        '/a/temperature': None,
        '/a/button': None,
        '/a/power': None
    }

    def __init__(self, uuid, path, username):
        self.path = path
        self.id = uuid
        self.resp = None
        if self.path not in self._object_map.keys():
            raise Exception("Unsupported query path: {}. ". format(self.path))
        self.connect(username)

    def connect(self, username):
        """
        Connect to IoT web service
        """
        if self._client is None:
            self._client = IoTClient(username, proxies=config.get_all_proxy())

    def get_data(self, stream=False, callback=None, **kargs):
        # obj = self._object_map[self.path]
        data = {'obs': 1} if stream else {}
        uri = "{}?di={}".format(self.path, self.id)
        self.resp = self._client.get(uri, data=data, stream=stream)
        if stream:
            self.resp.get_data(callback, **kargs)
        else:
            return self.resp.content if self.resp.ok() else None

    def terminate(self):
        self.resp.close()

    def update_status(self, data):
        ret = False
        uri = "{}?di={}".format(self.path, self.id)
        if isinstance(data, dict):
            self.resp = self._client.put(uri, json.dumps(data))
            if self.resp.ok():
                # print "The response status is " + str(self.resp.status_code)
                ret = True
            else:
                print('Failed to update {} status: {}'.format(uri, str(self.resp.errors())))
        return ret









