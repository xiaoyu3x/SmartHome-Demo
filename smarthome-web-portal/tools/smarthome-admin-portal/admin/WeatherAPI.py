# -*- coding: utf-8 -*-
"""
Created on Tue Jan 03 15:53:10 2017

@author: xlin1x
"""
import urllib2, urllib, json

baseurl = "https://query.yahooapis.com/v1/public/yql?"
yql_query = "select * from weather.forecast where woeid in (select woeid from geo.places(1) where text='shanghai')"

def Get_Forecast(city):
    yql_url = baseurl + urllib.urlencode({'q':yql_query}) + "&format=json"
    result = urllib2.urlopen(yql_url).read()
    data = json.loads(result)
    

def Get_Actual(city):
    data = Get_Forecast(city)
    temperature = data['query']['results']['channel']['item']['condition']['temp']
    pressure = data['query']['results']['channel']['atmosphere']['pressure']
    humidity = data['query']['results']['channel']['atmosphere']['humidity']
    forecast = data['query']['results']['channel']['item']['forecast']
    temp_24 = forecast[0]['high']
    temp_48 = forecast[1]['high']
    temp_72 = forecast[2]['high']
    return temperature,pressure,humidity,forecast,temp_24,temp_48,temp_72
    
#def Get_His(city , startDate , end Date):
   #pass;



    
