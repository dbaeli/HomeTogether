import _ from 'lodash';
import Promise from 'bluebird';
import WebSocket from 'ws';
import { createLight, createTv, createPresenceDetector, createLightSensor } from './devices';

const INITIAL_DEVICES = {
  'living_room+presence': createPresenceDetector(),
  'dining_room+presence': createPresenceDetector(),
  'corridor+presence': createPresenceDetector(),
  'bathroom+presence': createPresenceDetector(),
  'water_closet+presence': createPresenceDetector(),
  'bedroom+presence': createPresenceDetector(),
  'outside+presence': createPresenceDetector()
}
const API_BASE_WS_URL = 'wss://api.samsungsami.io/v1.1/websocket';

export default function createSimulatedBackend() {
  let ws;
  let token;
  let devices = {
    'living_room+tv': {
      id:  process.env.SAMI_TV_ID,
      deviceType: 'dt3fdf857d42f943919d103aa3e0316052',
      state: createTv()
    },
    // blind1: { //TODO add blind in model
    //   id: process.env.SAMI_BLIND_ID,
    //   deviceType: 'dt1b8e051f028f4b95a35452238c3684c4',
    //   state: {}
    // },
    'outside+lightSensor': {
      id: process.env.SAMI_LIGHT_SENSOR_ID,
      deviceType: 'dt793c92541dcf4e99a79ded0444244168',
      state: createLightSensor()
    },
    'living_room+light': {
      id: process.env.SAMI_BULB_0_ID,
      deviceType: 'dt6f3f2abffe33490695515a5ed26efd24',
      state: createLight()
    },
    'dining_room+light': {
      id: process.env.SAMI_BULB_1_ID,
      deviceType: 'dt6f3f2abffe33490695515a5ed26efd24',
      state: createLight()
    },
    'corridor+light': {
      id: process.env.SAMI_BULB_2_ID,
      deviceType: 'dt6f3f2abffe33490695515a5ed26efd24',
      state: createLight()
    },
    'bathroom+light': {
      id: process.env.SAMI_BULB_3_ID,
      deviceType: 'dt6f3f2abffe33490695515a5ed26efd24',
      state: createLight()
    },
    'water_closet+light': {
      id: process.env.SAMI_BULB_4_ID,
      deviceType: 'dt6f3f2abffe33490695515a5ed26efd24',
      state: createLight()
    },
    'bedroom+light': {
      id: process.env.SAMI_BULB_5_ID,
      deviceType: 'dt6f3f2abffe33490695515a5ed26efd24',
      state: createLight()
    // },
    // 'living_room+presence': { //TODO for all rooms
    //   id: process.env.SAMI_PRESENCE_ID,
    //   deviceType: 'dtff8e26eaa7f04047ace3b5ff542a9696',
    //   state: createPresenceDetector()
    }
  };

  function updateSamiDeviceState(deviceName, deviceState) {
    console.log('SAMI updating device', deviceName, 'with state', deviceState);
    if (_.has(devices, deviceName))
      devices[deviceName].state = _.extend(devices[deviceName].state, deviceState);
  };

  function sendMessageToDevice(deviceName, messageContent, type='message') {
    return new Promise((resolve, reject) => {
      if (!_.isUndefined(ws)) {
        let message = {
                        ddid: devices[deviceName].id,
                        sdid: devices[deviceName].id, 
                        type: type,
                        data: messageContent
                      };
        ws.send(JSON.stringify(message));
        console.log('SAMI WS push', type, messageContent, 'for device', deviceName);
        if (type === 'message')
          updateSamiDeviceState(deviceName, messageContent);
        return resolve();
      }
      else
        return reject(Error('SAMI websocket not found'));
    });
  };

  function createListenerWS(samiToken) {
    return new Promise((resolve, reject) => {
      console.log('requesting WS connexion to SAMI...');
      ws = new WebSocket(API_BASE_WS_URL);
      ws.on('message', evt => {
        if (!_.isUndefined(evt.data)) {
          let dataJSON = JSON.parse(evt.data);
          if (!_.isUndefined(dataJSON.sdid) && dataJSON.type === 'message') {
            updateSamiDeviceState(_.findKey(devices, d => d.id === dataJSON.sdid), dataJSON.data);
          };
          // if (!_.isUndefined(dataJSON.ddid) && dataJSON.type === 'action') {
          //   let hueId = _.parseInt(_.split(_.findKey(devices, o => o.id === dataJSON.ddid),'_')[2]);
          //   if (!_.isUndefined(hue.userId) && !_.isUndefined(hue.lights[hueId].id)) {
          //     let r = _.reduce(dataJSON.data.actions, (res, val) => {
          //       if (val.name === 'setColor') {
          //         res.xy = hue.convertRGBtoXY([val.parameters.colorRGB.r, val.parameters.colorRGB.g, val.parameters.colorRGB.b]);
          //       }
          //       else if (val.name === 'setBrightness') {
          //         res.bri = val.parameters.brightness
          //       }
          //       else if (val.name === 'setOn')
          //         res.on = true;
          //       else if (val.name === 'setOff')
          //         res.on = false;
          //       return res;
          //     }, {});
          //     r.bri = _.isUndefined(r.bri) ? 127 : parseInt(Math.max(Math.min(r.bri*255, 254),1))
          //     return hue.request({
          //       method: 'PUT',
          //       path: hue.userId+'/lights/'+ hue.lights[hueId].id +'/state',
          //       body: JSON.stringify( r )
          //     })
          //     .catch(ex => console.log('updating Hue state failed:', ex));
          //   }
          // }
        }
      });
      ws.on('open', () => {
        console.log('SAMI WS Connection open');
        Promise.all(
          _.map(devices, (val, key) => {
            if (!_.isUndefined(val.id)) {
              let message = {
                              Authorization: 'bearer ' + samiToken,
                              sdid: val.id,
                              type: 'register'
                            };
              console.log('Registering SAMI device', key);
              return resolve(ws.send(JSON.stringify(message)));
            }
          })
        )
        .then(() => {
          token = samiToken;
          return;
          // if (!_.isUndefined(hue.userId))
          //   createHueListener(hue.lights);
        });
      });
      ws.on('close', () => {
        console.log('SAMI WS Connection closed');
      });
      ws.on('error', evt => {
        console.log('SAMI WS Connection error:', evt.data);
      });
    })
    .catch(ex => {
      console.log('Error in function createListenerWS:', ex);
      return reject();
    });
  };
  
  return {
    init: (samiToken) => createListenerWS(samiToken),
    list: () => token ? _.keys(devices) : {},
    has: deviceName => token ? _.has(devices, deviceName) : {},
    get: deviceName => new Promise((resolve, reject) => {
      console.log(`Retrieving device '${deviceName}' state.`);
      if (_.has(devices, deviceName)) {
        resolve(devices[deviceName]);
      }
      else {
        reject(new Error(`Device '${deviceName}' is unknown.`));
      }
    }),
    update: (deviceName, state) => new Promise((resolve, reject) => {
      console.log(`Updating device '${deviceName}' state.`);
      if (_.has(devices, deviceName)) {
        resolve(sendMessageToDevice(deviceName, state));
      }
      else {
        reject(new Error(`Device '${deviceName}' is unknown.`));
      }
    })
  };
}
