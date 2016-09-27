# -*- coding: utf-8 -*-
"""
Set up logging
"""
import logging
import os
import logging.config
from config import config, Configuration
from utils.util import get_full_path


def setup_log():
    # Load logging configuration
    logger = logging.getLogger('sLogger')
    filename = config.get_log_path().replace("\\", "\\\\")
    if os.path.exists(filename):
        logger.info("log file initialized successfully")
    else:
        os.mkdir(get_full_path('log'))
    logging.config.fileConfig(Configuration.get_config_path(),
                              defaults={'logfilename': filename})

    # Create the logger
    # sLogger: The name of a logger defined in the config file

    logger.info("-----------------------------------")
    logger.info("Log system successfully initialised")
    logger.info("-----------------------------------")
    return logger
