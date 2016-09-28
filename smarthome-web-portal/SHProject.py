# -*- coding: utf-8 -*-
"""
app view
"""
import os
import json
import logging
import hashlib
import functools
import datetime
from flask import redirect, url_for, abort
from flask import request, session, make_response
from flask import Flask, render_template, jsonify
from flask.ext.socketio import SocketIO, emit, disconnect
from utils import logsettings
from utils import util
from utils.config import config
from DB.api import resource, user, gateway
from RestClient.sensor import Sensor
from RestClient.api import ApiClient

try:
    import pymysql
    pymysql.install_as_MySQLdb()
except ImportError:
    pass

""" static resource location"""
static_url_prefix = ''
app = Flask(__name__, static_url_path='')

"""random secret key"""
KEY_SIZE = 32
SECRET_KEY = os.urandom(KEY_SIZE)
app.config['SECRET_KEY'] = SECRET_KEY

logger = logging.getLogger(__name__)
socketio = SocketIO(app, pingTimeout=60)


def login_required(func):
    """
    Decorator to check whether user's login
    If not, redirect to login page
    """
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        if 'username' in session:
            return func(*args, **kwargs)
        else:
            return redirect(url_for('login'))
    return wrapper


def authenticated_only(f):
    """
    Check login for web socket connections
    """
    @functools.wraps(f)
    def wrapped(*args, **kwargs):
        if 'username' not in session:
            disconnect()
        else:
            return f(*args, **kwargs)
    return wrapped


@socketio.on('my event', namespace='/index')
def test_message(message):
    emit('my response', {'data': message['data']})


def _get_historical_data(sensor, start_time, end_time):
    try:
        get_data = util.get_class("DB.api.{}.get_data_by_time".format(sensor))
        dic = get_data(start_time, end_time)
        # print dic
        return [] if len(dic) == 0 else dic
    except ImportError:
        abort(400)


@socketio.on('my data', namespace='/index')
def get_historical_data(message):
    """
    Get average sensor data in a period of time
    """
    sensor = message['data']
    date_range = message['date']
    print sensor, date_range
    start_time = date_range[0]
    end_time = date_range[1]
    data = _get_historical_data(sensor, start_time, end_time)
    emit('my ' + sensor, {'data': data})


@socketio.on('my broadcast event', namespace='/index')
def test_message(message):
    emit('my response', {'data': message['data']}, broadcast=True)


@socketio.on('connect', namespace='/index')
@authenticated_only
def test_connect():
    logger.info('Connected.')
    emit('my response', {'data': 'Connected'})


@socketio.on('disconnect', namespace='/index')
def test_disconnect():
    #disconnect()
    logger.info('Client disconnected')


@socketio.on_error('/index')  # handles the '/index' namespace
def error_handler_chat(e):
    print e

# Divide sensors into groups
ALERT_GRP = ['motion', 'gas', 'buzzer', 'button']
STATUS_GRP = ['led', 'fan', 'rgbled']
DATA_GRP = ['temperature', 'solar', 'illuminance', 'power', 'energy']
UPDATE_GRP = ['fan']  # controllable sensors


def _get_sensor_data(token_dict):
    res = resource.list_resource(status=1, gateway_id=session['gateway_id'])
    ret = {
        'alert': {},
        'status': {},
        'data': {}
    }
    for sensor in res:
        typ = sensor.get('sensor_type').get('type')
        if typ in ALERT_GRP:
            latest_data = util.get_class("DB.api.{}.get_latest_alert_by_gateway_uuid".format(typ))(gateway_id=session['gateway_id'],
                                                                                                   uuid=sensor.get('uuid'),
                                                                                                   token=token_dict[typ+'-token'])
        elif typ == 'power':
            latest_data = util.get_class("DB.api.energy.get_latest_by_gateway_uuid")(gateway_id=session['gateway_id'],
                                                                                     uuid=sensor.get('uuid'))
        else:
            latest_data = util.get_class("DB.api.{}.get_latest_by_gateway_uuid".format(typ))(gateway_id=session['gateway_id'],
                                                                                             uuid=sensor.get('uuid'))
        if latest_data is None:
            continue
        if typ in ALERT_GRP:
            ret['alert'].update({typ: latest_data.get('created_at')})
        elif typ in STATUS_GRP:
            if typ == "rgbled":
                val = True if latest_data.get('rgbvalue') == "255,0,0" else False
                ret['status'].update({typ: val})
            else:
                ret['status'].update({typ: latest_data.get('status')})
        elif typ in DATA_GRP:
            data = None
            if typ == 'temperature':
                data = str(latest_data.get('temperature'))
            elif typ == 'solar':
                data = str(latest_data.get('tiltpercentage'))
            elif typ == 'illuminance':
                data = str(latest_data.get('illuminance'))
            elif typ == 'power':
                data = str(latest_data.get('value'))
            ret['data'].update({typ: data})
    return ret


@app.route('/get_sensor')
@login_required
def get_sensor():
    """
    Get sensor data by token
    """
    token_dict = {}
    default_token = util.format_datetime(util.get_utc_now() - datetime.timedelta(minutes=1))
    # print default_token
    tlist = [name+'-token' for name in ALERT_GRP]
    for t in tlist:
        token_dict.update({t: request.headers.get(t) if request.headers.get(t) else default_token})
    # print str(token_dict)
    ret = _get_sensor_data(token_dict)
    return jsonify({'data': ret}), 201


@app.route('/get_geo_location')
@login_required
def get_geo_location():
    """Get the Geolocation of the current account"""
    location = gateway.get_geo(gateway_id=session.get('gateway_id'))
    return jsonify({'geo': location}), 201


@app.route('/update_sensor', methods=['PUT'])
@login_required
def update_sensor():
    """
    update sensor status
    Http PUT: {
                'href': '/a/fan',
                'data': { 'value': false}
                }
    """
    content = request.get_json(silent=True)
    path = content.get('href')
    data = content.get('data')
    path_list = ['/a/' + typ for typ in UPDATE_GRP]
    # validate put parameters
    if not content or not path or not data or path not in path_list:
        abort(400)
    print "content: " + str(content)
    res = resource.get_resource(path=path, gateway_id=session.get('gateway_id'), status=True)
    uuid = res.get('uuid')
    sensor = Sensor(uuid=uuid, path=path, username=session.get('username'))
    sts = sensor.update_status(data)
    return jsonify({'status': sts}), 201


@app.route('/')
def root():
    return redirect(url_for('login'), code=302)


@app.route('/login')
def login():
    return render_template('login.html', 
                           static_url_prefix=static_url_prefix)


@app.route('/index')
@login_required
def index():
    return render_template('home_dashboard.html',
                           static_url_prefix=static_url_prefix)


@app.route('/energy')
def energy():
    return render_template('energy_dashboard.html',
                           static_url_prefix=static_url_prefix)


def _get_cf_instance_number():
    num = ''
    endpoint = config.get_tap_auth_endpoint()
    api = config.get_tap_api_endpoint()
    if endpoint and api:
        proxy = config.get_all_proxy()
        client = ApiClient(endpoint, proxy)
        client.add_header('content-type', 'application/x-www-form-urlencoded;charset=utf-8')
        client.add_header('accept', 'application/json;charset=utf-8')
        client.add_header('authorization', 'Basic Y2Y6')
        data = {
                    'grant_type': 'password',
                    'username': config.get_tap_uname(),
                    'password': config.get_tap_pwd(),
                }
        ret = client.post('/oauth/token', data)
        if ret.ok():
            at = ret.content.get('access_token')
            cc = ApiClient(api, proxy)
            cc.add_header('authorization', 'bearer ' + at)
            resp = cc.get('/v2/apps?q=name:{}'.format(config.get_tap_app_name()))
            if resp.ok():
                num = resp.content['resources'][0]['entity']['instances']
        else:
            print "response: " + str(ret.content)
            print "status code:" + str(ret.status_code)
            print "post data:" + str(data)
    return str(num)


ENV_VARS = ['INSTANCE_ID', 'VERSION', 'NAME', 'URIS']
@app.route('/cf_instance')
@login_required
def get_instance():
    """
    Get instance ID and total running instances in the CF Cloud
    Return data in json format
    """
    inst = {}
    env_str = os.getenv("VCAP_APPLICATION", "")
    if env_str:
        inst['Instance'] = os.getenv('CF_INSTANCE_INDEX', '')
        inst['Total'] = _get_cf_instance_number()

        env_dict = json.loads(env_str)
        for key in sorted(env_dict.keys()):
            if str(key).upper() in ENV_VARS:
                inst[key] = env_dict[key]
    return jsonify({'cf_instance': inst}), 201


@app.route('/get_gateways')
def list_gateways():
    # todo: need some security mechanism to protect the data
    gateways = gateway.list_gateways(status=True)
    keyword = config.get_map_keyword()
    types = config.get_map_types()
    return jsonify({'gateways': gateways,
                    'keyword': keyword,
                    'types': types}), 201


@app.route('/authenticate', methods=['POST'])
def authenticate():
    username = request.form['username']
    password = request.form['password']
    password_sha = hashlib.sha256(password).hexdigest()
    if password_sha == user.login(username):
        gateway_id = user.user_gatewayid(username)
        # url = user.user_url(username)
        session['gateway_id'] = str(gateway_id)
        session['username'] = username
        info = 'Welcome ' + username
        print info
        resp = make_response(redirect(url_for('index'), code=302))
        resp.set_cookie('JSESSIONID', 'Sticky session.')
        return resp
    else:
        info = 'Username or password are incorrect'
        return render_template('login.html', info=info,
                               static_url_prefix=static_url_prefix)


@app.route('/logout')
def logout():
    session.pop('gateway_id', None)
    session.pop('username', None)
    resp = make_response(redirect(url_for('login'), code=302))
    resp.set_cookie('__VCAP_ID__', '', expires=0)
    return resp


if __name__ == '__main__':
    logger = logsettings.setup_log()
    logger.info('init SMART HOME project ...')
    port = os.getenv('PORT', '3000')
    socketio.run(app, debug=False, port=int(port), host="0.0.0.0")
