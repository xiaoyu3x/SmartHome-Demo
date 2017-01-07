# -*- coding: utf-8 -*-
"""
Created on Mon Nov 28 13:14:46 2016

@author: xlin1x
"""

from numpy import *
import matplotlib.pyplot as plt
import numpy as np
import scipy as sp
import pprint, pickle
from admin.config import Model_Seria_FOLDER

 
def Predict(model_name,Iteration,Predict_value):
    file_name = Model_Seria_FOLDER+model_name+'.pkl'
    pkl_file = open(file_name,'rb')
    model = pickle.load(pkl_file)
    pkl_file.close()
    #value = (((model[0][0]* float(Predict_value))**Iteration) + (model[0][1]*float(Predict_value)) + (model[0][2]))
    value = model[0][0]*Predict_value**Iteration + model[0][1]*Predict_value + model[0][2] 
    print value
    r_value = str(round(float(str(value)), 2))
    print r_value
    return r_value


#print Predict('ShangHai_Linear',2,80)
#print Predict('test',2,55)
