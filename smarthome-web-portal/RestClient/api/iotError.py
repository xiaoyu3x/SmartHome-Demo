# -*- coding: utf-8 -*-
"""
Customized IoT Error
"""
import logging

logger = logging.getLogger(__name__)


class IoTError(Exception):

    """Base class for IoT exceptions"""
    pass


class IoTConnectionError(IoTError):
    """Raised when the connection needs to be re-established"""
    def __init__(self, value):
        super(Exception, self).__init__(value)
        logger.error('%s %s' % (type(value), value))


class IoTRequestError(IoTError):
    """Raised when request fails"""
    def __init__(self, status_code):
        if status_code >= 500:
            msg = 'IoT Web Service internal error (you may re-try)'
        else:
            msg = 'IoT request failed'
        logger.info('Status code %d: %s' % (status_code, msg))
        super(Exception, self).__init__(msg)
        self.status_code = status_code

    def __str__(self):
        return '%s (%d)' % (self.args[0], self.status_code)
