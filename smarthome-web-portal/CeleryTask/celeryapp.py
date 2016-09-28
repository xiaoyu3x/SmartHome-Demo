# -*- coding: utf-8 -*-
"""
Celery instance and config setting
"""
from __future__ import absolute_import
from celery import Celery

app = Celery('tasks')
app.config_from_object('CeleryTask.celeryconfig')

