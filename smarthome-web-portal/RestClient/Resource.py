# -*- coding: utf-8 -*-
"""
A resource wrapper to send http requests
"""
import logging
from RestClient.api.IoTClient import IoTClient
from utils.config import config

logger = logging.getLogger(__name__)


class Resource(object):
    _client = None

    def __init__(self, username):
        self.connect(username)

    def connect(self, username):
        """
        Connect to IoT web service
        """
        if self._client is None:
            self._client = IoTClient(username, proxies=config.get_all_proxy())

    def list_resource(self):
        """
        Return all the resources discovered in the network
        """
        result = self._client.get('/res')

        sensors = []
        if result.ok():
            for item in result:
                """
                sample response in json
                [
                  {
                    "di": "d38d75a3-f1be-4d2d-b084-e943005fbf8d",
                    "links": [
                      {
                        "href": "/a/fan",
                        "rt": "oic.r.fan",
                        "if": "o"
                      }
                    ]
                  }
                ]
                """
                try:
                    href = str(item['links'][0]['href'])
                    rt = str(item['links'][0]['rt'])
                    if rt and not rt.startswith("oic.wk") and href \
                            and (href.startswith("/a/") or href.startswith("/brillo/")):
                        sensors.append((item['di'], href, rt))
                    else:
                        # ignore the wrong or unregistered json types
                        pass
                except:
                    logging.error("Failed to get resources: index out of range. ")

        else:
            logging.error("Failed to get resources: {}".format(str(result.errors())))
        return sensors








