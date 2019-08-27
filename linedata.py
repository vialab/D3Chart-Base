'''NGram Data structures and processing functions'''
from collections import namedtuple
from math import ceil, floor, fabs, pow, log10

# Dev imports
import random
import math
import binascii
import json

import numpy as np
#        crc = binascii.crc32( bookdict['textbook']['content'][:1000].encode() )
        
        # textbook = sess.query(TextBook).get(format(crc,'x')) or  TextBook(id = format(crc,'x'))

# Point = namedtuple("Point", ['year','percent'])
# Point = namedtuple("Point", ['x','y'])
# LineData = namedtuple("LineData", ['points'] )
# LineData = namedtuple("LineData", ['xdomain','ydomain','points'])

def Point(year,percent):
    return {"x": year, "y": percent}

# def get_line_data( ):
#     # line = LineData((2000,2019),(0,0.001),[])
#     line = []

#     for year in range(1970,2020):
#         percent = random.uniform(0.000762,0.000005)
#         line.append( Point(year,percent) )

#     return line

import math
def normpdf(x, mean, sd):
    var = float(sd)**2
    denom = (2*math.pi*var)**.5
    num = math.exp(-(float(x)-float(mean))**2/(2*var))
    return num/denom

def get_line_data( ):
    # line = LineData((2000,2019),(0,0.001),[])
    line = []

    start = 1970
    end = 2020

    mu = np.random.randint(0,end-start)
    sigma = 12
    variance = float(sigma)**2
    # numerator = ( np.sqrt( 2 * np.pi * variance ) )

    for year in range(start,end):
        idx = ( year - start )# / (end-start)
        # percent = random.uniform(0.000762,0.000005)
        # percent = numpy.random.normal(0.0005,0.0001)
        # percent = 1/(sigma * np.sqrt(2 * np.pi)) * np.exp( - (idx - mu)**2 / (2 * sigma**2) )
        
        # denom = np.exp( - (( idx - mu )**2) / 2*variance )
        # percent = numerator/denom

        percent = normpdf(idx,mu,sigma)/100
        # percent = normpdf(year-start,15,10)
        # print("percent: ",year-start,percent)
        line.append( Point(year,percent) )

    return line



class LineDataset():
    ymax = 0
    ymin = 0
    
    xmax = 0
    xmin = 0
    
    def __init__(self):
        self.xdomain = (0,0)
        self.xmax = 0
        self.xmin = 9E99

        self.ydomain = (0,0)
        self.ymax = 0
        self.ymin = 9E99

        self.lines = []


    def addLine( self, line ):
        print('len:',len(self.lines),type(self.lines))
        # line['name']=len(self.lines)
        entry = {
            'name': 'test'+str(len(self.lines)),
            'rawdata': line,
            'data': line,
        }
        self.lines.append(entry)
        self.updateDomains( line )

        self.niceDomains()



    def updateDomains( self, line ):
        self.ymax = max( self.ymax, max( item['y'] for item in line ) )
        self.ymin = min( self.ymin, min( item['y'] for item in line ) )

        self.xmax = max( self.xmax, max( item['x'] for item in line ) )
        self.xmin = min( self.xmin, min( item['x'] for item in line ) )

        # print(self.xmax,self.xmin, min( item['x'] for item in line ))
    
    def calculateDomains( self ):
        self.ymax = 0
        self.ymin = 9E99
        
        self.xmax = 0
        self.xmin = 9E99

        for line in self.lines:
            self.updateDomains( line )
    

    near=10
    def niceDomains( self ):
        ymaxex = ceil( -1 * ( log10( self.ymax ) ) ) + 1
        ymaxround = ceil( self.ymax * pow( 10, ymaxex ) ) + 10
        conditionalroundup = (10 - (ymaxround%10) ) if ymaxround%10>0 else 0
        niceymax =  (ymaxround + conditionalroundup ) / pow( 10, ymaxex )

        self.ydomain= (0, niceymax)

        nicexmin = self.xmin#-1

        self.xdomain = (nicexmin,self.xmax)
        
        # print(self.ydomain)
        return self.ydomain, self.xdomain

    
    def serialize( self ):
        return {
            'ydomain':  self.ydomain,
            'xdomain':  self.xdomain,

            'lines':    self.lines
        }


print("Hello")