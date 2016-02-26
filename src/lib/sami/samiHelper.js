import format from 'string-format';
import _ from 'lodash';
import fetch from 'isomorphic-fetch';
import syncRequest from 'sync-request';

let ws;

let sami = {
  API_BASE_WS_URL: 'wss://api.samsungsami.io/v1.1/websocket',
  devices: {
    'tv': {
      'ID':  __SAMI_TV__,
      'deviceType': 'dt3fdf857d42f943919d103aa3e0316052',
      'data' : {}
    },
    'blind1': {
      'ID': __SAMI_BLIND__,
      'deviceType': 'dt1b8e051f028f4b95a35452238c3684c4',
      'data' : {}
    },
    'light_sensor1': {
      'ID': __SAMI_LIGHT_SENSOR__,
      'deviceType': 'dt793c92541dcf4e99a79ded0444244168',
      'data' : {}
    },
    'light_bulb_0': {
      'ID': __SAMI_BULB_0__,
      'deviceType': 'dt6f3f2abffe33490695515a5ed26efd24',
      'data' : {}
    },
    'light_bulb_1': {
      'ID': __SAMI_BULB_1__,
      'deviceType': 'dt6f3f2abffe33490695515a5ed26efd24',
      'data' : {}
    },
    'light_bulb_2': {
      'ID': __SAMI_BULB_2__,
      'deviceType': 'dt6f3f2abffe33490695515a5ed26efd24',
      'data' : {}
    },
    'light_bulb_3': {
      'ID': __SAMI_BULB_3__,
      'deviceType': 'dt6f3f2abffe33490695515a5ed26efd24',
      'data' : {}
    },
    'light_bulb_4': {
      'ID': __SAMI_BULB_4__,
      'deviceType': 'dt6f3f2abffe33490695515a5ed26efd24',
      'data' : {}
    },
    'light_bulb_5': {
      'ID': __SAMI_BULB_5__,
      'deviceType': 'dt6f3f2abffe33490695515a5ed26efd24',
      'data' : {}
    },
    'presence': {
      'ID': __SAMI_PRESENCE__,
      'deviceType': 'dtff8e26eaa7f04047ace3b5ff542a9696',
      'data' : {}
    }
  },
  createDevices: createDevices,
  sendMessageToDevice: sendMessageToDevice,
  createListenerWS: createListenerWS,
  deleteTemporaryDevices: deleteTemporaryDevices
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
        _.map(sami.devices, (val, key) => {
          if (!_.isUndefined(val.token)) {
            console.log('authenticating device', key, val.ID);
            let message = {
                            Authorization: 'bearer ' + val.token,
                            sdid: val.ID,
                            type: 'register'
                          };
            return ws.send(JSON.stringify(message))
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

function getDeviceToken(id) {
  return fetch(format('/sami/{deviceId}/token/',{deviceId:id}), {
    method: 'put'
  })
  .then(response => {
    return response.json();
  })
  .then(json => json.data.accessToken)
  .catch(ex => {
    console.log('Error in function createDevices:', ex);
  })
}

function deleteTemporaryDevices() {
  _.map(sami.devices, (val, key) => { 
    if (!_.isUndefined(val.temporary) && val.temporary === true)
      return syncRequest('delete', format('/sami/device/{deviceId}',{deviceId:val.ID}))
  });
}

function createDevices() {
  return fetch('/sami/user', {
    method: 'get'
  })
  .then(response => {
    return response.json();
  })
  .then(json => sami.uid = json.data.id)
  .then(() => {
    return Promise.all(
      _.map(sami.devices, (val, key) => { 
        if (_.isUndefined(val.ID)) { 
          return fetch('/sami/device', {
            method: 'post',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              'user': sami.uid,
              'deviceType': val.deviceType,
              'name': 'craft.' + key
            })
          })
          .then(response => response.json())
          .then(json => {
            val.ID = json.data.id;
            val.temporary = true;
            return getDeviceToken(val.ID);
          })
          .then(accessToken => val.token = accessToken)
          .catch(ex => {
            console.log('Error in function createDevices:', ex);
          });
        }
        else {
          return getDeviceToken(val.ID)
          .then(accessToken => val.token = accessToken)
          .catch(ex => {
            console.log('Error in function createDevices:', ex);
          });
        }
      })
    );
  })
  .then(() => {
    return fetch('/sami/listDevices', {
      method: 'post',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        'devices': sami.devices
      })
    });
  });
}

module.exports = sami;