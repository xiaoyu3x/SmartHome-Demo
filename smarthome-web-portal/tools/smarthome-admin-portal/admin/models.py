# -*- coding: utf-8 -*-
"""
Model definition
"""
import datetime
import functools
from admin import db
from admin import utils


def wrap_to_dict(support_keys=[], **filters):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            return _wrapper_dict(
                func(*args, **kwargs), support_keys, **filters
            )
        return wrapper
    return decorator


def _wrapper_dict(data, support_keys, **filters):
    """Helper for warpping db object into dictionary."""
    if isinstance(data, list):
        return [
            _wrapper_dict(item, support_keys, **filters)
            for item in data
        ]
    if isinstance(data, HelperMixin):
        data = data.join_to_dict()
        # data = data.to_dict()
    if not data:
        return None
    # if not isinstance(data, dict):
    #     raise exception.InvalidResponse(
    #         'response %s type is not dict' % data
    #     )
    info = {}
    for key in support_keys:
        if key in data:
            if key in filters:
                filter_keys = filters[key]
                if isinstance(filter_keys, dict):
                    info[key] = _wrapper_dict(
                        data[key], filter_keys.keys(),
                        **filter_keys
                    )
                else:
                    info[key] = _wrapper_dict(
                        data[key], filter_keys
                    )
            else:
                info[key] = data[key]
    return info


class HelperMixin(object):
    def initialize(self):
        self.update()

    def update(self):
        pass

    def to_dict(self):
        keys = self.__mapper__.columns.keys()
        dict_info = {}
        for key in keys:
            if key.startswith('_'):
                continue
            value = getattr(self, key)
            if value is not None:
                if isinstance(value, datetime.datetime):
                    value = utils.format_datetime(value)
                dict_info[key] = value
        return dict_info

    def join_to_dict(self):
        joined = dict([(k, v) for k, v in self.__dict__.iteritems()
                       if not k[0] == '_'])
        dict_info = {}
        for key in joined.keys():
            if key.startswith('_'):
                continue
            value = getattr(self, key)
            if value is not None:
                if isinstance(value, datetime.datetime):
                    value = utils.format_datetime(value)
                if isinstance(value, HelperMixin):
                    value = value.to_dict()
                dict_info[key] = value

        return dict_info

    def join_to_dict_recurse(self):
        joined = dict([(k, v) for k, v in self.__dict__.iteritems()
                       if not k[0] == '_'])
        dict_info = {}
        for key in joined.keys():
            if key.startswith('_'):
                continue
            value = getattr(self, key)
            if value is not None:
                if isinstance(value, datetime.datetime):
                    value = utils.format_datetime(value)
                if isinstance(value, HelperMixin):
                    value = value.join_to_dict_recurse()
                dict_info[key] = value

        return dict_info


class CRUDMixin(object):
    """A CRUD mixin for model classes"""
    @classmethod
    def get_or_404(cls, id):
        return cls.query.get_or_404(id)

    @classmethod
    def create(cls, **kwargs):
        inst = cls(**kwargs)
        return inst.save()

    def update(self, commit=True, **kwargs):
        for attr, value in kwargs.iteritems():
            setattr(self, attr, value)
        return commit and self.save() or self

    def save(self, commit=True):
        db.session.add(self)
        if commit:
            db.session.commit()
        return self

    def delete(self, commit=True):
        db.session.delete(self)
        return commit and db.session.commit()


class Gateway(CRUDMixin, HelperMixin, db.Model):
    __tablename__ = 'gateway'
    __table_args__ = {'extend_existing': True}

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.VARCHAR(30))
    url = db.Column(db.VARCHAR(30))
    address = db.Column(db.VARCHAR(50))
    latitude = db.Column(db.VARCHAR(20))
    longitude = db.Column(db.VARCHAR(20))
    status = db.Column(db.Boolean)
    created_at = db.Column(db.DateTime, default=utils.get_utc_now())

    def __init__(self, name=None, url=None, address=None, latitude=None, longitude=None, status=False):
        self.name = name
        self.url = url
        self.address = address
        self.latitude = latitude
        self.longitude = longitude
        self.status = status

    def __repr__(self):
        return "<Gateway(id='%s',name='%s',url='%s',address='%s',latitude='%s', longitude='%s', created_at='%s')>" % (
            str(self.id), self.name, self.url, self.address, self.latitude, self.longitude, str(self.created_at))


class User(CRUDMixin, HelperMixin, db.Model):
    __tablename__ = 'user'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.VARCHAR(20))
    password = db.Column(db.VARCHAR(64))
    phone = db.Column(db.VARCHAR(15))
    gateway_id = db.Column(db.Integer, db.ForeignKey('gateway.id', ondelete='CASCADE', onupdate='CASCADE'), nullable=False)
    gateway = db.relation('Gateway', backref='user', lazy=False)
    created_at = db.Column(db.DateTime, default=utils.get_utc_now())

    def __init__(self, username=None, password=None, gateway_id=None):
        self.username = username
        self.password = password
        self.gateway_id = gateway_id

    def __repr__(self):
        return "<User(id='%s',username='%s',password='%s',gateway_id='%s',created_at='%s')>" % (
            str(self.id), self.username, self.password, self.gateway_id, str(self.created_at))


