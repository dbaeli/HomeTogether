var bodyParser = require('body-parser');
var config = require('./webpack.config');
var dotenv = require('dotenv');
var express = require('express');
var proxy = require('proxy-middleware');
var webpack = require('webpack');
var webpackDevMiddleware = require('webpack-dev-middleware');
var WebpackDevServer = require('webpack-dev-server');
var _ = require('lodash');
var zipabox = require('./src/lib/avidsen/craft_zipabox');

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

var server = app.listen(4444, function () {
  if (!_.isUndefined(process.env.ZIPABOX_USER)) {
    zipabox.events.OnAfterConnect = function() {
      zipabox.LoadDevices();
    };
    zipabox.Connect();
  }
  var host = server.address().address;
  var port = server.address().port;

  console.log('Listening to http://localhost:%s', port);
});

require('socket.io').listen(server);
