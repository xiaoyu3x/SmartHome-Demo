# -*- coding: utf-8 -*-
"""
Created on Mon Nov 28 12:57:23 2016

@author: xlin1x
"""

from numpy import *
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
import scipy as sp
import pprint,pickle


def Load_Data(fileName,delimiter):
    a=[]
    with open(fileName,'r') as f:
        data=f.readlines()
        for line in data:
            odom = line.split(delimiter)
            numbers_float = map(float,odom)
            a.append(numbers_float)
            array = np.array(a)
    return array
    
def Get_Data(array):
    x_train = []
    y_train = []
    x_train.append(array[0:500,1])
    y_train.append(array[0:500,0])
    x_train = np.array(x_train[0])
    y_train = np.array(y_train[0])
    return x_train,y_train


def Train_Data(x_train,y_train,Iteration):
    fp=[]
    for i in range(1,Iteration):        
        fp = sp.polyfit(x_train, y_train, Iteration, full=True)
        #f =  sp.poly1d(fp)
    #fp2, res2, rank2, sv2, rcond2 = sp.polyfit(x_train, y_train, 2, full=True)
    f = sp.poly1d(fp[i-1])
    return fp,f

def SaveModel(model_name,model):
    output = open(model_name+'.pkl','wb')
    pickle.dump(model,output)
    output.close()
    

def Train(data_file,model_path,model_name,Iteration,pic_path):
    array = Load_Data(data_file,',')
    x_train,y_train = Get_Data(array)
    model,f = Train_Data(x_train,y_train,Iteration)
    SaveModel(model_path,model)
   
    plt.figure(1)
    plt.scatter(x_train,y_train,s=25,c='r',alpha=0.5,marker='o',label='eigenvalues')
    fx = sp.linspace(0, 100, 1000)

    plt.plot(fx, f(fx), linewidth=4,label="curve fitting")	
    plt.title("power & temperature (" + model_name+")")
    plt.xlabel(u'temperature')
    plt.ylabel(u'power')
    plt.legend(loc='upper left')
    plt.savefig(pic_path, dpi=75)
    plt.close(1)   
 
#Train('Shanghai_2013_NoHead.csv','ShangHai_Linear',2)
#Train('EU_2009_NoHead.csv','EU_Linear',2)
