import format from 'string-format';
import _ from 'lodash';
import fetch from 'isomorphic-fetch';

let ws;

let sami = {
  API_BASE_WS_URL: 'wss://api.samsungsami.io/v1.1/websocket',
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
  console.log('SAMI updating device', deviceID, 'with data', deviceData);
  for (let device in sami.devices) {
    if (sami.devices[device].ID === deviceID) {
      device = _.merge(sami.devices[device].data, deviceData);
      break;
    }
  }
}

function sendMessageToDevice(deviceName, messageContent) {
  console.log('SAMI sendMessageToDevice', deviceName, messageContent);
  return new Promise((resolve, reject) => {
    if (!_.isUndefined(ws)) {
      let message = {
                      sdid: sami.devices[deviceName].ID, 
                      type: 'message',
                      data: messageContent
                    };
      ws.send(JSON.stringify(message));
      updateDeviceDataCache(sami.devices[deviceName].ID, messageContent)
      console.log('SAMI WS push data:', messageContent, 'for device', deviceName);
      return resolve();
    }
    else
      return reject(Error('SAMI websocket not found'));
  });
}

function createListenerWS(refreshCallbacks) {
  return fetch('/sami/accessToken', {
    method: 'get'
  })
  .then(response => {
    return response.json();
  })
  .then(json => {
    let auth = json.value;
    console.log('requesting WS connexion to SAMI...');
    ws = new WebSocket(sami.API_BASE_WS_URL);
    ws.onmessage = function(evt) {
      var dataJSON = JSON.parse(evt.data);
      if (!_.isUndefined(dataJSON.sdid)) {
        updateDeviceDataCache(dataJSON.sdid, dataJSON.data);
        _.forEach(refreshCallbacks, function(callback) {
          callback();
        })
        console.log('SAMI WS pull data:', evt.data, 'for device', dataJSON.sdid );
      }
      else {
        console.log('SAMI WS received message:', evt.data);
      }
      // ws.send('Done');
    };
    ws.onopen = function() {
      console.log('SAMI WS Connection open', ws);
      Promise.all(
        _.map(sami.devices, val => { 
          if (!_.isUndefined(val.ID)) { 
            return fetch(format('/sami/{deviceId}/token/',{deviceId:val.ID}), {
              method: 'put'
            })
            .then(response => {
              return response.json();
            })
            .then(json => {
              console.log('device authenticated', json);
              let message = {
                              Authorization: 'bearer ' + json.data.accessToken,
                              sdid: val.ID,
                              type: 'register'
                            };
              return ws.send(JSON.stringify(message))
            })
            .catch(ex => {
              console.log('Error in function createListenerWS:', ex);
            })
          }
        })
      );
    };
    ws.onclose = function() {
      console.log('SAMI WS Connection closed', ws);
    };
    ws.onerror = function(evt) {
      console.log('SAMI WS Connection error:', evt.data, ws);
    };
  })
  .catch(ex => {
    console.log('Error in function createListenerWS:', ex);
  });
}

module.exports = sami;