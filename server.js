var bodyParser = require('body-parser');
var config = require('./webpack.config');
var dotenv = require('dotenv');
var express = require('express');
var proxy = require('proxy-middleware');
var passport = require('passport');
var OAuth2Strategy = require('passport-oauth').OAuth2Strategy;
var webpack = require('webpack');
var webpackDevMiddleware = require('webpack-dev-middleware');
var WebpackDevServer = require('webpack-dev-server');
var _ = require('lodash');
var request = require('request');
var util = require('util');
var zipabox = require('./src/lib/avidsen/craft_zipabox');

var sami = {
  AUTH_URL:'https://accounts.samsungsami.io/authorize',
  TOKEN_URL: 'https://accounts.samsungsami.io/token',
  API_BASE_URL: 'https://api.samsungsami.io/v1.1',
  CALL_BACK_PATH: '/auth/samihub/callback',
  CALL_BACK_URL: 'http://localhost:4444/auth/samihub/callback',
}

var samiToken;

dotenv.load();

config.historyApiFallback= true;

var compiler = webpack(config);
var app = express();

if (process.env.NODE_ENV !== 'production') {
  app.use(webpackDevMiddleware(compiler, {
    historyApiFallback: true,
    stats: {
      colors: true
    }
  }));
}

app.use(express.static('./app/'));

app.use(bodyParser.json());
app.use(passport.initialize());
app.use(passport.session());

// Enable CORS
app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

if (!_.isUndefined(process.env.ZIPABOX_USER)) {
  zipabox.username = process.env.ZIPABOX_USER;
  zipabox.password = process.env.ZIPABOX_PASSWORD;
  zipabox.showlog = true;
  zipabox.checkforupdate_auto = false;

  var avidsenConfig = {
    "blind1":{
      "device_uuid": process.env.ZIPABOX_BLIND_DEVICE_UUID,
      "endpoint_uuid": process.env.ZIPABOX_BLIND_ENDPOINT_UUID,
      "attributes":{
        "value":{
          "id":8,
          "type":"integer"
        }
      }
    },
    "light_socket1":{
      "device_uuid": process.env.ZIPABOX_LIGHT_SOCKET_DEVICE_UUID,
      "endpoint_uuid": process.env.ZIPABOX_LIGHT_SOCKET_ENDPOINT_UUID,
      "attributes":{
        "state":{
          "id":11,
          "type":"boolean"
        }
      }
    },
    "Motion Sensor":{
      "device_uuid": process.env.ZIPABOX_MOTION_SENSOR_DEVICE_UUID,
      "endpoint_uuid": process.env.ZIPABOX_MOTION_SENSOR_ENDPOINT_UUID,
      "attributes":{
        "state":{
          "id":76,
          "type":"boolean"
        }
      }
    },
    "detecteur mag":{
      "device_uuid": process.env.ZIPABOX_MAG_DETECTOR_DEVICE_UUID,
      "endpoint_uuid": process.env.ZIPABOX_MAG_DETECTOR_ENDPOINT_UUID,
      "attributes":{
        "state":{
          "id":76,
          "type":"boolean"
        }
      }
    },
    "light_sensor1":{
      "device_uuid": process.env.ZIPABOX_LIGHT_SENSOR_DEVICE_UUID,
      "endpoint_uuid": process.env.ZIPABOX_LIGHT_SENSOR_ENDPOINT_UUID,
      "attributes":{
        "state":{
          "id":13,
          "type":"boolean"
        }
      }
    }
  }
  app.post('/devices/:deviceName/attributes/:attributeName/value', function(req,res) {
    var deviceUUID = avidsenConfig[req.params.deviceName].device_uuid;
    var attributeID = avidsenConfig[req.params.deviceName].attributes[req.params.attributeName].id;
    zipabox.SetDeviceValue(deviceUUID, attributeID, req.body.value);
    res.end();
  });

  app.get('/devices/:deviceName/attributes/:attributeName/logs', function(req,res) {
    var deviceUUID = avidsenConfig[req.params.deviceName].device_uuid;
    var attributeID = avidsenConfig[req.params.deviceName].attributes[req.params.attributeName].id;
    zipabox.GetDeviceLogs(deviceUUID, attributeID,
      function(device,datas) {
        res.send({logs: datas});
      },
      function(err) {
        console.log("get device logs failed:", err);
      },
      function() {
        res.end();
      }
    );
  });

  app.get('/devices/:deviceName/attributes/:attributeName/value', function(req, res) {
    var deviceUUID = avidsenConfig[req.params.deviceName].device_uuid;
    var attributeID = avidsenConfig[req.params.deviceName].attributes[req.params.attributeName].id;
    var attributeTYPE = avidsenConfig[req.params.deviceName].attributes[req.params.attributeName].type;
    zipabox.GetDeviceValue(deviceUUID, attributeID, function(val) {
      switch (attributeTYPE)
      {
        case 'boolean':
          if (val.toLowerCase() == 'true') {
            res.send({value: true});
          }
          else {
            res.send({value: false});
          }
          break;
        case 'integer':
          res.send({value: parseInt(val)});
          break;
        case 'real':
          res.send({value: parseFloat(val)});
          break;
        default:
          res.send({value: val});
      }
    });
  });
}

if (!_.isUndefined(process.env.SAMI_USER)) {
  sami.USER_ID = process.env.SAMI_USER;
  sami.CLIENT_ID = process.env.SAMI_CLIENT_ID;
  sami.CLIENT_SECRET = process.env.SAMI_CLIENT_SECRET;

  passport.deserializeUser(function(id, done) {
    // id => user
    done(null, 'user');
  });

  passport.serializeUser(function(user, done) {
    // user => id
    done(null, 'user');
  });

  passport.use(new OAuth2Strategy({
      authorizationURL: sami.AUTH_URL,
      tokenURL: sami.TOKEN_URL,
      clientID: sami.CLIENT_ID,
      clientSecret: sami.CLIENT_SECRET,
      callbackURL: sami.CALL_BACK_URL
    },
    function(accessToken, refreshToken, profile, done) {
      // set user
      samiToken = accessToken
      return done(null, 'user');
    }
  ));

  app.get('/', function(req, res, next) {
    // req.user
    res.redirect('/sami/auth');
  });

  app.get('/sami/auth',
    passport.authenticate('oauth2')
  );

  app.get('/sami/accessToken', function(req, res) {
    console.log('SAMI access token =', samiToken);
    res.status(200);
    res.send({value: 'bearer+' + samiToken});
  });

  app.put('/sami/:deviceId/token', function(req, res) {
    request({
      method: 'put',
      url: sami.API_BASE_URL + '/devices/' + req.params.deviceId + '/tokens',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + samiToken
      },
      json: true,
      body: {
        'deviceID': req.params.deviceId
      }
    },
    function(error, response, body) {
      console.log('response = ' + JSON.stringify(response));
      if (error) {
        res.status(500);
        res.send({'status': 500, 'error': '' + error});
      }
      else {
        res.send(body);
      }
    });
  });

  app.get('/sami/:deviceId/token', function(req, res) {
    request({
      method: 'get',
      url: sami.API_BASE_URL + '/devices/' + req.params.deviceId + '/tokens',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + samiToken
      }
    },
    function(error, response, body) {
      console.log('response = ' + JSON.stringify(response));
      if (error || (response.statusCode != 200)) {
        res.status(500);
        res.send({'status': 500, 'error': '' + error});
      }
      else {
        res.send(body);
      }
    });
  });

  app.get(sami.CALL_BACK_PATH,
    passport.authenticate('oauth2', { failureRedirect: '/error', successRedirect: '/' })
  );

  app.get('/sami/message', function(req, res) {
    request({
      method: 'get',
      url: sami.API_BASE_URL + '/messages',
      qs: {
        'count': 1,
        'endDate': req.query.endDate,
        'fieldPresence': req.query.deviceAttribute,
        'order': 'desc',
        'sdid': req.query.deviceID,
        'startDate': req.query.startDate
      },
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + samiToken
      },
    },
    function(error, response, body) {
      console.log('response =' + JSON.stringify(response));
      if (error || (response.statusCode != 200)) {
        res.status(500);
        res.send({'status': 500, 'error': '' + error});
      }
      else {
        res.send(body);
      }
    });
  });

  app.post('/sami/message', function(req, res) {
    request({
      method: 'post',
      url: sami.API_BASE_URL + '/messages',
      headers: {
        'Authorization': 'Bearer ' + samiToken,
        'Content-Type': 'application/json'
      },
      json: true,
      body: {
        'data':  req.body.message,
        'sdid': req.body.deviceID,
        'type': 'message'
      }
    },
    function(error, response, body) {
      console.log('response = ' + JSON.stringify(response));
      if (error || (response.statusCode != 200)) {
        res.status(500);
        res.send({'status': 500, 'error': '' + error});
      }
      else {
        res.send(body);
      }
    });
  });

  app.post('/sami/actions', function(req, res) {
    request({
      method: 'post',
      url: sami.API_BASE_URL + '/actions',
      headers: {
        'Authorization': 'Bearer ' + samiToken,
        'Content-Type': 'application/json'
      },
      json: true,
      body: {
        "data": req.body.action,
        "ddid": req.body.deviceID,
        "type": "action"
      }
    },
    function(error, response, body) {
      console.log('response = ' + JSON.stringify(response));
      if (error) {
        res.status(500);
        res.send({'status': 500, 'error': '' + error});
      }
      else {
        res.send(body);
      }
    });
  });
}

var server = app.listen(4444, function () {
  var port = server.address().port;
  if (!_.isUndefined(process.env.ZIPABOX_USER)) {
    zipabox.events.OnAfterConnect = function() {
      zipabox.LoadDevices();
    };
    zipabox.Connect();
  }

  console.log('Listening to http://localhost:%s', port);
});

require('socket.io').listen(server);
