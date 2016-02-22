var util = require('util');
var _ = require('lodash');
var fetch = require('isomorphic-fetch');

var sami = {
  API_BASE_WS_URL: 'wss://api.samsungsami.io/v1.1',
  devices: {
    'tv': {
      'ID':  __SAMI_TV__,
      'data' : {}
    },
    'blind1': {
      'ID': __SAMI_BLIND__,
      'data' : {}
    },
    'light_sensor1': {
      'ID': __SAMI_LIGHT_SENSOR__,
      'data' : {}
    },
    'shower_head': {
      'ID': __SAMI_SHOWER_HEAD__,
      'data' : {}
    },
    'light_bulb_0': {
      'ID': __SAMI_BULB_0__,
      'data' : {}
    },
    'light_bulb_1': {
      'ID': __SAMI_BULB_1__,
      'data' : {}
    },
    'light_bulb_2': {
      'ID': __SAMI_BULB_2__,
      'data' : {}
    },
    'light_bulb_3': {
      'ID': __SAMI_BULB_3__,
      'data' : {}
    },
    'light_bulb_4': {
      'ID': __SAMI_BULB_4__,
      'data' : {}
    },
    'light_bulb_5': {
      'ID': __SAMI_BULB_5__,
      'data' : {}
    },
    'presence': {
      'ID': __SAMI_PRESENCE__,
      'data' : {}
    }
  },
  sendMessageToDevice: sendMessageToDevice,
  createListenerWS: createListenerWS
};

function updateDeviceDataCache(deviceID, deviceData) {
  console.log('deviceID =', deviceID, ', data =', JSON.stringify(deviceData) );
  for (var device in sami.devices) {
    if (sami.devices[device].ID === deviceID) {
      device = _.merge(sami.devices[device].data, deviceData);
      break;
    }
  }
}

function sendMessageToDevice(deviceName, messageContent) {
  console.log('SAMI send message to device', sami.devices[deviceName].ID);
  return fetch('/sami/message', {
    method: 'post',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      'message': messageContent,
      'deviceID': sami.devices[deviceName].ID
    })
  })
  .then(function(response) {
    return response.json()
  })
  .then(function(json) {
    return json;
  })
  .catch(function(ex) {
    console.log('Error in function sendMessageToDevice:', ex);
  })
}

function createListenerWS(uid, sdids, refreshCallbacks) {
  return fetch('/sami/accessToken', {
    method: 'get'
  })
  .then(function(response) {
    return response.json();
  })
  .then(function(json) {
    var auth = json.value;
    var sdids = _.reduce(sami.devices, function(res, val) {return (!_.isUndefined(val.ID) ? (res === '' ? res : res + ',') + val.ID : res)}, '');
    var wsUrlRoute = util.format(sami.API_BASE_WS_URL + '/live?sdids=%s&uid=%s&Authorization=%s', sdids, uid, auth);
    console.log('SAMI WS Connexion on', wsUrlRoute);
    console.log('requesting WS connexion...');
    var ws = new WebSocket(wsUrlRoute);
    ws.onmessage = function(evt) {
      var dataJSON = JSON.parse(evt.data);
      if (!_.isUndefined(dataJSON.sdid)) {
        updateDeviceDataCache(dataJSON.sdid, dataJSON.data);
        _.forEach(refreshCallbacks, function(callback) {
          callback();
        })
        console.log('SAMI WS Update data: ' + evt.data + ' on device ' + dataJSON.sdid );
      }
      else {
        console.log('SAMI WS received message:' + evt.data);
      }
      ws.send('Done');
    };
    ws.onopen = function() {
      console.log('SAMI WS Connexion open', ws);
      ws.send('socket open');
    };
    ws.onclose = function() {
      console.log('SAMI WS Connexion closed', ws);
    };
    ws.onerror = function(evt) {
      console.log('SAMI WS Connexion error:' + evt.data, ws);
    };
  })
  .catch(function(ex) {
    console.log('Error in function createListenerWS:', ex);
  })
}

module.exports = sami;