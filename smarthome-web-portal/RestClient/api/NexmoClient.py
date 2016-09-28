# -*- coding: utf-8 -*-
"""
The SMS client and its exceptions
"""
from datetime import timedelta
from RestClient.api import ApiClient
from utils.config import config
from DB.api.user import get_user_phone_by_gateway
from DB.api.sms_history import get_latest_by_gateway_uuid, new
from utils.util import get_utc_now


class Error(Exception):
    pass


class ClientError(Error):
    pass


class ServerError(Error):
    pass


class AuthenticationError(ClientError):
    pass


class Client(ApiClient):
    def __init__(self, api_key, api_secret, proxy=None):
        api_uri = 'https://rest.nexmo.com'

        self.api_key = api_key

        self.api_secret = api_secret

        self.api_host = 'api.nexmo.com'

        super(Client, self).__init__(api_uri, proxy)

    def send_message(self, param):
        param = dict(param, api_key=self.api_key, api_secret=self.api_secret)
        return self.parse(self.get('/sms/json', param))

    def parse(self, response):
        if response.status_code == 401:
            raise AuthenticationError
        elif 200 <= response.status_code < 300:
            return response.json
        elif 400 <= response.status_code < 500:
            message = "{code} response from {host}".format(code=response.status_code, host=self.api_host)
            raise ClientError(message)
        elif 500 <= response.status_code < 600:
            message = "{code} response from {host}".format(code=response.status_code, host=self.api_host)
            raise ServerError(message)


class NexmoClient(object):
    api_key = config.get_api_key()
    api_secret = config.get_api_secret()
    interval = config.get_sms_interval()
    proxy = config.get_all_proxy()

    @staticmethod
    def send_message(gateway_id, uuid, sensor_type):
        try:
            if any([NexmoClient.api_key is None, NexmoClient.api_secret is None]):
                raise AuthenticationError

            # check sms history and decide whether it's already sent in the interval.
            token = get_utc_now() - timedelta(seconds=int(NexmoClient.interval))
            if get_latest_by_gateway_uuid(gateway_id, uuid, token):
                # already sent to all users, ignore
                return False

            # get user phone number by gateway id
            phone_numbers = get_user_phone_by_gateway(gateway_id)

            # Unsupported sensor type
            if sensor_type not in ('gas',):
                return False

            msg = ''
            if sensor_type == 'motion':
                msg = 'Motion was detected at your home just now. '
            elif sensor_type == 'gas':
                msg = 'There was a gas leak detected at your home just now. '

            for to in phone_numbers:
                params = {
                    'from': 'NEXMO',
                    'to': to,
                    'text': msg,
                }
                cl = Client(api_key=NexmoClient.api_key, api_secret=NexmoClient.api_secret, proxy=NexmoClient.proxy)
                print cl.send_message(params)
                print new({'gateway_id': gateway_id, 'uuid': uuid})
            return True
        except (AuthenticationError, ClientError, ServerError):
            return False
