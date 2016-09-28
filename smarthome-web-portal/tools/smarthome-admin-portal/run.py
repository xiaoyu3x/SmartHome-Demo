# -*- coding: utf-8 -*-
"""
app entry
"""
import os
from admin import app

try:
    import pymysql
    pymysql.install_as_MySQLdb()
except ImportError:
    pass

PORT = os.getenv('PORT', '4000')
app.run(port=int(PORT), host='0.0.0.0', debug=False)
