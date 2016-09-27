# -*- coding: utf-8 -*-
"""
Base task class
"""
from celery.utils.log import get_task_logger


class BaseTask(object):
    """
    Base class for Celery task
    """
    Error = None
    Desc = "Base task Object"

    def run(self):
        pass

    @property
    def log(self):
        return get_task_logger('%s.%s' % (__name__, self.__class__.__name__))


class TaskException(Exception):
    pass


def task_entry(app):
    try:
        app.log.info("Ready to proceed task: %s." % app.Desc)
        app.run()
    except Exception, e:
        app.log.error(e.message)
        raise e
