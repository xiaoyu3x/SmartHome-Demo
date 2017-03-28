# -*- coding: utf-8 -*-
"""
A wrapper to connect to IoT rest service by user
"""
import logging
from urlparse import urljoin
from RestClient.api import ApiClient
from DB.api.gateway import get_gateway

logger = logging.getLogger(__name__)


class IoTClient(ApiClient):
    """
    RestClient for IoTRestful api
    """
    def __init__(self, gateway_id, proxies=None):
        self.url = get_gateway(gateway_id).get('url')

        if self.url:
            self.api_url = urljoin(self.url, '/api/oic')
            # scheme = urlparse.urlparse(self.api_url).scheme
            # ca_cert = get_full_path(os.path.join(config.get_cert_path(), config.get_cert_name())) if scheme == 'https' else None
            super(IoTClient, self).__init__(self.api_url, proxies)

    # @staticmethod
    # def get_gateway_by_user(username=None):
    #
    #     logger.debug("gateway url: " + username)
    #     return user_gatewayurl(username)

    # @staticmethod
    # def get_gatewayid_by_user(username=None):
    #     from DB.api.user import user_gatewayid
    #     return user_gatewayid(username)



