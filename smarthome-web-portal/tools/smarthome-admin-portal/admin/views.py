# -*- coding: utf-8 -*-
"""
app views
"""
import hashlib
import functools
from datetime import timedelta
from flask import render_template, request, flash, redirect, url_for, make_response, session
from admin import db, app
from admin.models import Gateway, _wrapper_dict, User

ADMIN_PWD = hashlib.sha256('admin').hexdigest()


def login_required(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        if 'username' in session:
            return func(*args, **kwargs)
        else:
            return redirect(url_for('index'))
    return wrapper


@app.before_request
def make_session_permanent():
    """Set session timeout: 30 mins"""
    session.permanent = True
    app.permanent_session_lifetime = timedelta(minutes=30)


@app.route('/')
@app.route('/index')
def index():
    return render_template('index.html', username=session.get('username'))


@app.route('/authenticate', methods=['POST'])
def authenticate():
    username = request.form['username']
    password = request.form['password']
    password_sha = hashlib.sha256(password).hexdigest()
    if password_sha == ADMIN_PWD:
        session['username'] = username
        resp = make_response(redirect(url_for('index'), code=302))
        resp.set_cookie('JSESSIONID', 'Admin sticky session.')
        return resp
    else:
        info = 'Username or password are incorrect'
        return render_template('index.html', info=info)


@app.route('/logout')
def logout():
    session.pop('username', None)
    resp = make_response(redirect(url_for('index'), code=302))
    resp.set_cookie('__VCAP_ID__', '', expires=0)
    return resp


FORM_DATA = ['name', 'url', 'address', 'latitude', 'longitude']
@app.route('/gateway/update/<int:gw_id>', methods=['PUT', 'POST'])
@login_required
def update_gw(gw_id):
    if request.method == 'POST':
        post = {}
        for key in FORM_DATA:
            post[key] = request.form.get(key, None)
        gw = Gateway.get_or_404(gw_id)
        gw.update(**post)
        db.session.commit()
        flash('The entry was successfully updated.')
    return redirect(url_for('list_all_gws'), 302)
    # return render_template('list.html')


@app.route('/gateway/create', methods=['POST'])
@login_required
def create_gw():
    if request.method == 'POST':
        post = {}
        for key in FORM_DATA:
            post[key] = request.form.get(key, None)
        gw = Gateway.create(**post)
        print gw
        db.session.commit()
        flash('The entry was successfully created.')
    return redirect(url_for('list_all_gws'), 302)


@app.route('/gateways/', methods=['GET'])
@login_required
def list_all_gws():
    if request.method == 'GET':
        obj = Gateway.query.all()
        info = _wrapper_dict(obj, ['id', 'name', 'url', 'address', 'latitude', 'longitude', 'created_at'])
        print info
    return render_template('list.html', gateways=info, username=session.get('username'))


@app.route('/gateway')
@app.route('/gateway/<int:gw_id>', methods=['GET'])
@login_required
def show_gw(gw_id=None):
    if request.method == 'GET':
        info = None
        if gw_id:
            gw = Gateway.get_or_404(gw_id)
            info = _wrapper_dict(gw, ['id', 'name', 'url', 'address', 'latitude', 'longitude'])
    return render_template('edit.html', gateway=info, username=session.get('username'))


@app.route('/gateway/delete', methods=['POST', 'DELETE'])
@login_required
def delete_gw():
    if request.method == 'POST':
        gw_str = request.form.get('id', None)
        print gw_str
        if gw_str:
            gw_list = gw_str.split(',')
            for gw_id in gw_list:
                gw = Gateway.get_or_404(gw_id)
                gw.delete()
            flash('Gateway {} was successfully deleted.'.format(str(gw_str)))
    return redirect(url_for('list_all_gws'), 302)


@app.route('/users/', methods=['GET'])
@login_required
def list_all_users():
    if request.method == 'GET':
        obj = User.query.all()
        info = _wrapper_dict(obj, ['id', 'username', 'phone', 'gateway', 'created_at'])
    return render_template('list_users.html', users=info, username=session.get('username'))


@app.route('/user')
@app.route('/user/<int:uid>', methods=['GET'])
@login_required
def show_user(uid=None):
    if request.method == 'GET':
        info = None
        if uid:
            user = User.get_or_404(uid)
            info = _wrapper_dict(user, ['id', 'username', 'phone'])
    return render_template('edit_user.html', user=info, username=session.get('username'))


USER_FORM_DATA = ['phone']
@app.route('/user/update/<int:uid>', methods=['PUT', 'POST'])
@login_required
def update_user(uid):
    if request.method == 'POST':
        post = {}
        for key in USER_FORM_DATA:
            post[key] = request.form.get(key, None)
        u = User.get_or_404(uid)
        u.update(**post)
        db.session.commit()
        flash('The entry was successfully updated.')
    return redirect(url_for('list_all_users'), 302)
