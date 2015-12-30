#!/usr/bin/env python

from lifxlan import *

from gevent import monkey
monkey.patch_all()
from gevent.pywsgi import WSGIServer

import bottle
from bottle import Bottle, request,response
from json import dumps

app = Bottle()
bottle.debug = True

def enable_cors(fn):
	def _enable_cors(*args,**kwargs):
		response.headers['Access-Control-Allow-Origin'] = '*'
		response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
		response.headers['Access-Control-Allow-Headers'] = 'Authorization, Origin, Accept, content-type,X-Requested-With,X-CSRF-Token'
		response.headers['Cache-Control'] = 'no-cache'
		response.headers['Pragma'] = 'no-cache'

		if bottle.request.method != 'OPTIONS':
			return fn(*args,**kwargs)
		return {}
	return _enable_cors

def hex2rgb( hex ):
	intCol = int( hex.split('#')[1],16)
	return (intCol >> 16)&255, (intCol>>8)&255, intCol&255

def rgb2HSB( (r,g,b)):
	cmax = r
	if g > cmax:
		cmax = g
	if b > cmax:
		cmax = b
	cmin = r
	if g < cmin:
		cmin = g
	if b < cmin:
		cmin = b

	brightness = float(cmax)/255.0
	if cmax != 0:
		saturation = float(cmax-cmin)/float(cmax)
	else:
		saturation = 0
	if saturation == 0:
		hue = 0
	else:
		redc = float(cmax-r)/float(cmax-cmin)
		greenc= float(cmax-g)/float(cmax-cmin)
		bluec= float(cmax-b)/float(cmax-cmin)
		print redc,greenc,bluec
		if r==cmax:
			hue = bluec-greenc
		elif g == cmax:
			hue = 2.0+redc-bluec
			print hue
		else:
			hue = 4.0+greenc-redc
		hue = hue/6.0
		if hue < 0:
			hue = hue +1.0
	return hue,saturation,brightness

@app.route('/')
def test():
	print "totootototo"

@app.route('/lights/<light_id>',method=['GET','OPTIONS'])
@enable_cors
def getLightState(light_id):
	print 'get'
	if ''.join(bulb.get_mac_addr().split(':')) != light_id:
		return bottle.HTTPResponse(status=404)
	power = bulb.get_power();
	color = bulb.get_color();
	if power > 32765:
		power = 'on'
	else:
		power = 'off'
	print color
	hue = (float(color[0])/float(65535))*float(360)
	saturation = (float(color[1])/float(65535))
	brightness = (float(color[2])/float(65535))
	print hue,saturation,brightness
	result = [{'id':light_id,'power':power, 'color': {'hue':hue,'saturation':saturation},'brightness':brightness}]
	response.content_type = 'application/json'
	return dumps(result)

@app.route('/lights/<light_id>/state',method=['PUT','OPTIONS'])
@enable_cors
def setLightState(light_id):
	print 'set'
	if ''.join(bulb.get_mac_addr().split(':')) != light_id:
		return bottle.HTTPResponse(status=404)
	json_data = None
	if request.content_length > 0:
		json_data = request.json
	print json_data;
	bulb.set_power( json_data['power'] );
	color = json_data['color']
	if color.startswith('#'):
		(r,g,b) = hex2rgb(color)
		print r,g,b
		hue,saturation,brightness = rgb2HSB( (r,g,b) )
		if "brightness" in json_data:
			brightness = json_data["brightness"]
	else:
		color = color.split(' ')
		hue = float(color[0].split(':')[1])/360.0
		saturation = float(color[1].split(':')[1])
		brightness = json_data['brightness']
	print hue,saturation,brightness

	hue = hue * 65535;
	saturation = saturation * 65535;
	brightness = brightness * 65535;

	bulb.set_color([hue,saturation,brightness,3500]);

	return {}



print("Discovering lights...")
lifx = LifxLAN(1)
# get devices
devices = lifx.get_lights()
bulb = devices[0]
print("Selected {}".format(bulb.get_label()))
print ''.join(bulb.get_mac_addr().split(':'))
print bulb.get_color()

try:
		server = WSGIServer(("",5555),app, log = None )
		server.serve_forever();
except:
		raise
