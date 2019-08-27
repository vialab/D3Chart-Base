import time
import datetime
# import logging
from loguru import logger
from functools import wraps

def profile(func):
    @wraps(func)
    def wrap(*args, **kwargs):
        started_at = time.time()
        result = func(*args, **kwargs)
        # logging.info(time.time() - started_at)
        # timestr = time.strftime('%H:%M:%S', time.gmtime(time.time() - started_at) )
        delta = datetime.timedelta( seconds = (time.time() - started_at) )
        # print(f'\t Function "{func.__name__}" ran in {delta}')
        logger.info(f'\t Function "{func.__name__}" ran in {delta}')
        return result

    return wrap

def dummy(input):
    return input