import moment from 'moment';
import util from 'util';
import _ from 'lodash';
import fetch from 'isomorphic-fetch';

exports = module.exports = {
  AUTH_URL:'https://accounts.samsungsami.io/authorize',
  TOKEN_URL: 'https://accounts.samsungsami.io/token',
  API_BASE_URL: 'https://api.samsungsami.io/v1.1',
  API_BASE_WS_URL: 'wss://api.samsungsami.io/v1.1',
  GRANT_TYPE: 'client_credentials',
  SCOPE: 'read,write',
  USER_ID: '75e9d6f17a6b42789728d89c1528be46',
  CLIENT_ID: 'b1d508c505c846b2b9be8f404de7a967',
  CLIENT_SECRET: 'a6f472ad89a846b0b61ffd8567a6815f',
  CALL_BACK_PATH: '/auth/samihub/callback',
  CALL_BACK_URL: 'http://localhost:4010/auth/samihub/callback',
  devices: {
    'craftTV': {
      'ID': '25f2e730542445e6b3991f5c1cbf593a',
      'data' : {}
    },
    'craftPhone': {
      'ID': '2b6a59f056fc4948a9bcd5ae1969596e',
      'data' : {}
    },
    'craftSensor': {
      'ID': '859e83d960234d10a3260202860c1772',
      'data' : {}
    },
    'avidsenAlarm': {
      'ID': '4a2ceb55a1d24257aa12cc09a67f2bb3',
      'data' : {}
    },
    'avidsenBlind': {
      'ID': '08a3cef522484a91a55cfa24c5caba06',
      'data' : {}
    },
    'senseCookie': {
      'ID': 'a28e857be84549fca447b90ca13c16f6',
      'data' : {}
    }
  },
  updateDeviceDataCache: function(deviceID, deviceData) {
    console.log('deviceID = ' + deviceID + 'JSON.stringify(deviceData)' + JSON.stringify(deviceData) );
    for (var device in this.devices) {
      if (this.devices[device].ID === deviceID) {
        device = _.merge(this.devices[device].data, deviceData);
        break;
      }
    }
  },
  getUserInfo: function() {
    return fetch('/sami/users/self', {
      method: 'get'
    })
    .then(function(response) {
      return response.json()
    })
    .then(function(json) {
      console.log('json ==' +  json);
      console.log('JSON.stringify(json) ==' +  JSON.stringify(json));
      return json;
    })
    .catch(function(ex) {
      console.log('JSON.stringify(ex) ==' +  JSON.stringify(ex));;
    })
  },
  getLastDeviceMessage: function(deviceName, deviceAttribute) {
    var url = util.format('/sami/message?startDate=%s&endDate=%s&deviceID=%s&deviceAttribute=%s',
      this.devices[deviceName].lastMessageTimestamp + 1,
      9999999999999,
      this.devices[deviceName].ID,
      deviceAttribute
    )
    return fetch(url, {
      method: 'get'
    })
    .then(function(response) {
      return response.json()
    })
    .then(function(json) {
      // Update lastMessageTimestamp if consumed
      if (json.data.length > 0) {
        console.log('json.data[0].data == ' + JSON.stringify(json.data[0].data));
        return json.data[0].data
      }
      else {
        return {};
      }
    })
    .catch(function(ex) {
      console.log('JSON.stringify(ex) ==' +  JSON.stringify(ex));;
    })
  },
  sendMessageToDevice: function(deviceName, messageContent) {
    return fetch('/sami/message', {
      method: 'post',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        'message': messageContent,
        'deviceID': this.devices[deviceName].ID
      })
    })
    .then(function(response) {
      return response.json()
    })
    .then(function(json) {
      return json;
    })
    .catch(function(ex) {
      console.log('JSON.stringify(ex) ==' +  JSON.stringify(ex));;
    })
  },
  createListenerWS: function(refreshCallbacks) {
    console.log('SAMI WS StartConnexion on');
    var self = this;
    return fetch('/sami/accessToken', {
      method: 'get'
    })
    .then(function(response) {
      return response.json();
    })
    .then(function(json) {
      var auth = json.value;
      var sdids = self.devices['craftTV'].ID + ',' + self.devices['craftPhone'].ID;
      var uid = self.USER_ID;
      console.log('SAMI json.value ==' + json.value);
      var wsUrlRoute = util.format(self.API_BASE_WS_URL + '/live?sdids=%s&uid=%s&Authorization=%s', sdids, uid, auth);
      console.log('SAMI WS Connexion on', wsUrlRoute);
      console.log('requesting WS connexion...');
      var ws = new WebSocket(wsUrlRoute);
      ws.onmessage = function(evt) {
        var dataJSON = JSON.parse(evt.data);
        if (!_.isUndefined(dataJSON.sdid)) {
          self.updateDeviceDataCache(dataJSON.sdid, dataJSON.data);
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
    .catch(function(error) {
      console.log('SAMI error == ' + ev);
    })
  }
}
