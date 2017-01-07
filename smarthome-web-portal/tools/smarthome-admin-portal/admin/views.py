# -*- coding: utf-8 -*-
"""
app views
"""
import hashlib
import functools
import json
import os
import time
from datetime import timedelta
from flask import render_template, request, flash, redirect, url_for, make_response, session, abort
from admin import db, app
from admin.models import Gateway, _wrapper_dict, User, Test, DataSet, DataModel
from werkzeug import secure_filename

from admin import WeatherAPI
from admin.machine_learning import Train
from admin.machine_learning import Predict
from admin.config import ADMIN_PWD, UPLOAD_FOLDER, Model_Seria_FOLDER, Model_Pic_FOLDER


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
#####################################################################################

'''
@app.route('/dataset/create', methods=['POST'])
@login_required
def create_dataset():
    print 'dataset create'
    if request.method == 'POST':
        t = Test('sean','33')
        db.session.add(t)
        db.session.commit()
        obj = db.session.query(Test).filter(and_(Test.name=="Hehuan",Test.age=="28")).all()
        info = _wrapper_dict(obj, ['id', 'name', 'age'])
        print info
        flash('The Dataset was successfully created.')
        json_str = json.dumps(info)
    return json_str
    #return redirect(url_for('list_all_dataset'), 302)
'''

####################################
######## dataset ###################	
####################################

### list all dataset (for href)###
@app.route('/href_dataset/', methods=['GET'])
@login_required
def href_dataset():
    if request.method == 'GET':
        return render_template('dataset.html', username=session.get('username'))
    else:
        abort(404)


### list all dataset (for ajax)###
@app.route('/dataset', methods=['GET'])
@login_required
def list_all_dataset():
    if request.method == 'GET':
        obj = db.session.query(DataSet).filter(DataSet.status=="1").all()
        info = _wrapper_dict(obj, ['id', 'filename', 'dataformat', 'title', 'rows', 'columns', 'rows', 'description', 'uploadtime', 'status'])
        json_str = json.dumps(info)
        print json_str
    return json_str,200

### add a new dataset ###
@app.route('/dataset/create', methods=['POST'])
@login_required
def create_dataset():
    print 'dataset create'
    if request.method == 'POST':
        ## upload the file
        file=request.files['file']
        
        print file.filename
        filename = secure_filename(file.filename)
        print filename
        file.save(os.path.join(UPLOAD_FOLDER,filename))
        
        ## write to DB
        #content = request.get_json(silent=True)
        #file_name =  content.get('file_name')
        title = request.form['title']
        dataformat = "CSV"
        #title = content.get('title')
        rows = 356;
        columns = 3;
        description = "This is dataset for shanghai 2013 year"
        uploadtime = time.strftime('%Y-%m-%d %H:%M:%S',time.localtime(time.time()))
        status = "1"
        print uploadtime
        ds = DataSet(filename,dataformat,title,rows,columns,description,uploadtime,status)
        db.session.add(ds)
        db.session.commit()
        #obj = db.session.query(Test).filter(and_(Test.name=="Hehuan",Test.age=="28")).all()
        #info = _wrapper_dict(obj, ['id', 'name', 'age'])
        #print info
        flash('The Dataset was successfully created.')
        #json_str = json.dumps(info)
    #return json_str
    #return redirect(url_for('list_all_dataset'), 302)
    return redirect(url_for('href_dataset'),code=302)


####### delete a dataset ######
# Delete according to title #
@app.route('/dataset/delete', methods=['POST'])
@login_required
def delete_dataset():
    if request.method == 'POST':
        content = request.get_json(silent=True)
        title =  content.get('title')
        obj = db.session.query(DataSet).filter(DataSet.title==title).all()
        print "---delete---"
        print title
        db.session.query(DataSet).filter(DataSet.title==title).delete()
        db.session.commit()
		
        #obj = db.session.query(DataSet).filter(DataSet.title==title).all()
        #info = _wrapper_dict(obj, ['id', 'filename', 'dataformat', 'title', 'rows', 'columns', 'rows', 'description', 'uploadtime', 'status'])
        filename = obj[0].filename
        filepath = os.path.join(UPLOAD_FOLDER,filename)
        print filepath
        if os.path.exists(filepath):
            os.remove(filepath)
            print "delete successful"
    return redirect(url_for('list_all_dataset'), 302)

####################################
######  model ######################
####################################

######## training ###################

### list all model (for href)###
@app.route('/href_training/', methods=['GET'])
@login_required
def href_training():
    if request.method == 'GET':
        return render_template('training.html', username=session.get('username'))


@app.route('/training', methods=['GET'])
@login_required
def list_all_models():
    if request.method == 'GET':
        obj = db.session.query(DataModel).filter(DataModel.status=="1").all()
        info = _wrapper_dict(obj, ['id', 'dataset_id', 'name', 'algorithm_type', 'serialization', 'description', 'created_at', 'status', 'dataset'])
        json_str2 = json.dumps(info)
        print json_str2
    return json_str2,200
	

@app.route('/training/create', methods=['POST'])
@login_required
def create_model():
    print 'model create'
    if request.method == 'POST':
        #training data
        content = request.get_json(silent=True)
        model_name =  content.get('model_name')
		
        dataset_title = content.get('dataset_title')
        obj_dataset = db.session.query(DataSet).filter(DataSet.title==dataset_title).all()
        dataset_id = obj_dataset[0].id
        dataset_filename = obj_dataset[0].filename
        dataset_path = UPLOAD_FOLDER + dataset_filename
        pic_path = Model_Pic_FOLDER + model_name + ".png"
        Train.Train(dataset_path, Model_Seria_FOLDER + model_name ,model_name, 2 ,pic_path)
		
        #write to DB
        algorithm_type = "Linear"
        serialization = model_name + ".pkl"
        description = "This is a model with Linear , using 2012_shanghai dataset"
        created_at = time.strftime('%Y-%m-%d %H:%M:%S',time.localtime(time.time()))
        status = "1"
		
        dm = DataModel(dataset_id,model_name,algorithm_type,serialization,description,created_at,status)
        db.session.add(dm)
        db.session.commit()
        flash('The model was successfully created.')
        return redirect(url_for('list_all_models'),code=302)


@app.route('/training/delete', methods=['PUT'])
@login_required
def delete_model():
    if request.method == 'PUT':
        content = request.get_json(silent=True)
        model_name =  content.get('model_name')
        obj = db.session.query(DataModel).filter(DataModel.name==model_name).all()
        print "---delete---"
        print model_name
		
        filename = obj[0].serialization
        filepath = os.path.join(Model_Seria_FOLDER,filename)
        print filepath
        if os.path.exists(filepath):
            os.remove(filepath)
            print "delete model file successful"
        else:
		    print (filepath)
        
        pic_path = Model_Pic_FOLDER + model_name + ".png"
        if os.path.exists(pic_path):
            os.remove(pic_path)
            print "delete model pic successful"
        else:
		    print pic_path

        db.session.query(DataModel).filter(DataModel.name==model_name).delete()
        db.session.commit()
		
        
	return redirect(url_for('list_all_models'), 303)	
    #return redirect(url_for('href_training'), 302)

#####################################
######### predict ###################
#####################################


### render to predict (for href)###
@app.route('/href_predict/', methods=['GET'])
@login_required
def href_predict():
    if request.method == 'GET':
        info = None
    return render_template('predict.html', username=session.get('username'))


@app.route('/predict', methods=['PUT'])
@login_required
def predict():
    if request.method == 'PUT':
        content = request.get_json(silent=True)
        #print content
        model_name =  content.get('model_name')
        input_value = content.get('input_value')
        if not model_name or not isinstance(input_value, (int, long, float)):
            abort(400)
        r_value =  Predict.Predict(model_name, 2, input_value)
        jsonStr = json.dumps(r_value)
        print jsonStr
        return jsonStr,200


###################################
########## job  ###################
###################################
## create a job ##
## 1 import his weather data
@app.route('/weather', methods=['GET'])
@login_required
def collect_weather():
    if request.method == 'PUT':
        content = request.get_json(silent=True)
        city_name =  content.get('city_name')
        
        obj_gateway = db.session.query(Gateway).filter(Gateway.address.like("%"+city_name+"%")).all()
        gateway_id = obj[0].id
		
        #collect forcast data 
        temperature,pressure,humidity,forecast,temp_24,temp_48,temp_72 = Get_Actual(city_name)
        dm = DataModel(dataset_id,model_name,algorithm_type,serialization,description,created_at,status)
        db.session.add(dm)
        db.session.commit()
        flash('The model was successfully created.')
    return redirect(url_for('href_training'),code=302)
		
## 2 import actual weather data
## 3 generate predict power data 



