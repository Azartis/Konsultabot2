# Python 3.14 compatibility fix for Django 4.2.7
# This must be imported before Django initializes
try:
    from . import compat
except ImportError:
    pass

