# -*- coding: utf-8 -*-
"""
app settings
"""
import os
import hashlib

basedir = os.path.abspath(os.path.dirname(__file__))

KEY_SIZE = 32
SECRET_KEY = os.urandom(KEY_SIZE)

DEBUG = True

SQLALCHEMY_TRACK_MODIFICATIONS = True

#from admin.utils import get_vcap_service
#SQLALCHEMY_DATABASE_URI = get_vcap_service()

ADMIN_PWD = hashlib.sha256('admin').hexdigest()
UPLOAD_FOLDER= basedir + '/dataset/' 
Model_Seria_FOLDER= basedir + '/model/seria/'
Model_Pic_FOLDER= basedir + '/static/images/model/'
