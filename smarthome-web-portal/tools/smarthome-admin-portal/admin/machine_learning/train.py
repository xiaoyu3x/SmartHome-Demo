# -*- coding: utf-8 -*-
"""
data analytics: train datasets
"""
from numpy import *
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
import scipy as sp
import pickle


def load_data(file_name, delimiter):
    a = []
    with open(file_name, 'r') as f:
        data = f.readlines()
        for line in data:
            odom = line.split(delimiter)
            numbers_float = map(float,odom)
            a.append(numbers_float)
            array = np.array(a)
    return array


def get_data(arr):
    x_train = []
    y_train = []
    x_train.append(arr[0:500, 1])
    y_train.append(arr[0:500, 0])
    x_train = np.array(x_train[0])
    y_train = np.array(y_train[0])
    return x_train, y_train


def train_data(x_train, y_train, iteration):
    fp = []
    for i in range(1, iteration):
        fp = sp.polyfit(x_train, y_train, iteration, full=True)
    f = sp.poly1d(fp[i-1])
    return fp, f


def save_model(model_name, model):
    output = open(model_name+'.pkl', 'wb')
    pickle.dump(model, output)
    output.close()
    

def train(data_file, model_path, model_name, iteration, pic_path):
    arr = load_data(data_file, ',')
    x_train, y_train = get_data(arr)
    model, f = train_data(x_train, y_train, iteration)
    save_model(model_path, model)
   
    plt.figure(1)
    plt.scatter(x_train, y_train, s=25, c='r', alpha=0.5, marker='o', label='eigenvalues')
    fx = sp.linspace(0, 100, 1000)

    plt.plot(fx, f(fx), linewidth=4, label="curve fitting")
    plt.title("power & temperature (" + model_name+")")
    plt.xlabel(u'temperature')
    plt.ylabel(u'power')
    plt.legend(loc='upper left')
    plt.savefig(pic_path, dpi=75)
    plt.close(1)   
 
#Train('Shanghai_2013_NoHead.csv','ShangHai_Linear',2)
#Train('EU_2009_NoHead.csv','EU_Linear',2)
