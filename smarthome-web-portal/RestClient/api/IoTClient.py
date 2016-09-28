# -*- coding: utf-8 -*-
"""
A wrapper to connect to IoT rest service by user
"""
import logging
from urlparse import urljoin
from RestClient.api import ApiClient

logger = logging.getLogger(__name__)


class IoTClient(ApiClient):
    """
    RestClient for IoTRestful api
    """
    def __init__(self, username, proxies=None):
        self.url = self.get_gateway_by_user(username)

        if self.url:
            self.api_url = urljoin(self.url, '/api/oic')
            # scheme = urlparse.urlparse(self.api_url).scheme
            # ca_cert = get_full_path(os.path.join(config.get_cert_path(), config.get_cert_name())) if scheme == 'https' else None
            super(IoTClient, self).__init__(self.api_url, proxies)

    @staticmethod
    def get_gateway_by_user(username=None):
        from DB.api.user import user_gatewayurl
        logger.debug("gateway url: " + username)
        return user_gatewayurl(username)

    @staticmethod
    def get_gatewayid_by_user(username=None):
        from DB.api.user import user_gatewayid
        return user_gatewayid(username)



