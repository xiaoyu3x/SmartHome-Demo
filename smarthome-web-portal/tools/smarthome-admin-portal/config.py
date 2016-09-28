# -*- coding: utf-8 -*-
"""
app settings
"""
import os
from admin.utils import get_vcap_service

KEY_SIZE = 32
SECRET_KEY = os.urandom(KEY_SIZE)

DEBUG = True

SQLALCHEMY_TRACK_MODIFICATIONS = True

SQLALCHEMY_DATABASE_URI = get_vcap_service()
