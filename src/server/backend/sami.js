import _ from 'lodash';
import { convertHexToRGB, convertRGBtoHex } from '../lib/colorHelper';
import { createLight, createTv, createPresenceDetector, createLightSensor } from './devices';
import express from 'express';
import OAuth2Strategy from 'passport-oauth2/lib/strategy';
import passport from 'passport';
import Promise from 'bluebird';
import WebSocket from 'ws';

const API_BASE_WS_URL = 'wss://api.samsungsami.io/v1.1/websocket?ack=true';

const SAMI_LIGHT_DEVICE_TYPE_ID = 'dt6f3f2abffe33490695515a5ed26efd24';
const SAMI_TV_DEVICE_TYPE_ID = 'dt3fdf857d42f943919d103aa3e0316052';
const SAMI_LIGHTSENSOR_DEVICE_TYPE_ID = 'dt793c92541dcf4e99a79ded0444244168';

export default function createSimulatedBackend() {
  let ws;
  let token;
  let devices = {};
  let lastCid = 0;

  const CLIENT_ID = process.env.SAMI_CLIENT_ID;
  const CLIENT_SECRET = process.env.SAMI_CLIENT_SECRET;
  const AUTH_URL ='https://accounts.samsungsami.io/authorize';
  const TOKEN_URL = 'https://accounts.samsungsami.io/token';

  const SAMI_LIGHTS = {
    'living_room+light': {
      id: process.env.SAMI_LIVING_ROOM_LIGHT_ID,
      token: process.env.SAMI_LIVING_ROOM_LIGHT_TOKEN
    }
    // 'dining_room+light': {
    //   id: process.env.SAMI_DINING_ROOM_LIGHT_ID,
    //   token: process.env.SAMI_DINING_ROOM_LIGHT_TOKEN
    // },
    // 'corridor+light': {
    //   id: process.env.SAMI_CORRIDOR_LIGHT_ID,
    //   token: process.env.SAMI_CORRIDOR_LIGHT_TOKEN
    // },
    // 'bathroom+light': {
    //   id: process.env.SAMI_BATHROOM_LIGHT_ID,
    //   token: process.env.SAMI_BATHROOM_LIGHT_TOKEN
    // },
    // 'water_closet+light': {
    //   id: process.env.SAMI_WATER_CLOSET_LIGHT_ID,
    //   token: process.env.SAMI_WATER_CLOSET_LIGHT_TOKEN
    // },
    // 'bedroom+light': {
    //   id: process.env.SAMI_BEDROOM_LIGHT_ID,
    //   token: process.env.SAMI_BEDROOM_LIGHT_TOKEN
    // }
  };

  devices = _.reduce(
    SAMI_LIGHTS,
    (devices, light, deviceId) => {
      if (light.id && light.token) {
        devices[deviceId] = {
          id: light.id,
          token: light.token,
          deviceType: SAMI_LIGHT_DEVICE_TYPE_ID,
          state: createLight()
        };
      }
      return devices;
    },
    devices
  );

  function sendMessage(message) {
    return new Promise((resolve, reject) => {
      if (_.isUndefined(ws)) {
        reject(new Error('SAMI WS not found'));
      }
      else {
        try {
          const cid = lastCid;
          ++lastCid;
          //console.log(`SAMI WS - sending message #${cid}`, message);
          let ackListener = evt => {
            try {
              let evtJSON = JSON.parse(evt);
              if (evtJSON.data && evtJSON.data.cid == cid) {
                ws.removeListener('message', ackListener);
                if (evtJSON.error) {
                  reject(new Error(evtJSON.error.message));
                }
                else {
                  resolve();
                }
              }
              if (evtJSON.error) {
                reject(new Error(evtJSON.error.message));
              }
            }
            catch(e) {
              reject(e);
            }
          };
          ws.on('message', ackListener);
          ws.send(JSON.stringify(_.extend(message, {
            cid: cid
          })));
        }
        catch(e) {
          reject(e);
        }
      }
    });
  }

  function updateDeviceState(deviceName, state) {
    const messageContent = {
      type: 'message',
      sdid: devices[deviceName].id,
      data: state
    };
    return sendMessage(messageContent);
  }

  function sendLightAction(deviceName, newState) {
    let actions = [];
    console.log('sendLightAction', deviceName, newState);
    if (!_.isUndefined(newState.color)) {
      const [r, g, b] = convertHexToRGB(newState.color);
      console.log(newState.color, r, g, b);
      actions.push({
        name: 'setColorRGB',
        parameters: {
          colorRGB: {
            r: r,
            g: g,
            b: b
          }
        }
      });
    }
    if (!_.isUndefined(newState.brightness)) {
      if (newState.brightness == 0) {
        actions.push({name: 'setOff'});
      }
      else {
        actions.push({name: 'setOn'});
        actions.push({
          name: 'setBrightness',
          parameters: {
            brightness: newState.brightness * 100
          }
        });
      }
    }
    if (_.size(actions) > 0) {
      const messageContent = {
        type: 'action',
        ddid: devices[deviceName].id,
        data: {
          actions: actions
        }
      };
      return sendMessage(messageContent);
    }
    else {
      return Promise.resolve();
    }
  }

  function initialize(samiToken) {
    console.log(`Initializing the WS to SAMI using token '${samiToken}'`);
    return new Promise((resolve, reject) => {
      ws = new WebSocket(API_BASE_WS_URL);
      ws.on('open', () => {
        Promise.all(
          _.map(devices, (val, key) => {
            if (!_.isUndefined(val.id)) {
              return sendMessage({
                type: 'register',
                Authorization: 'bearer ' + val.token,
                sdid: val.id
              })
              .then(() => sendLightAction(key, val.state));
            }
          })
        )
        .then(() => {
          token = samiToken;
          console.log('SAMI WS initialized');
          // Resolving the ws initialization
          resolve();
        })
        .catch(e => {
          console.log('SAMI WS, error while sending devices initial state', e);
          reject(e);
        });
      });
      ws.on('close', () => {
        console.log('SAMI WS closed');
      });
      ws.on('error', evt => {
        console.log('SAMI WS error', evt.data);
      });
      ws.on('message', evt => {
        let evtJSON = JSON.parse(evt);
        if (!_.isUndefined(evtJSON)) {
          if (evtJSON.type === 'action') {
            // Simulating the device
            let deviceName = _.findKey(devices, d => d.id === evtJSON.ddid);
            const newDeviceState = _.reduce(evtJSON.data.actions, (deviceState, action) => {
              console.log('action', action);
              switch (action.name) {
                case 'setColorRGB':
                  {
                    deviceState.color = convertRGBtoHex(
                      action.parameters.colorRGB.r,
                      action.parameters.colorRGB.g,
                      action.parameters.colorRGB.b);
                    break;
                  }
                case 'setBrightness':
                  deviceState.brightness = (parseFloat(action.parameters.brightness) / 100).toFixed(1);
                  break;
                case 'setOff':
                  deviceState.brightness = 0;
                  break;
                default:
                case 'setOn':
                  deviceState.brightness = deviceState.brightness || 1 ;
                  break;
              }
              console.log('deviceState', deviceState);
              return deviceState;
            }, devices[deviceName].state);

            updateDeviceState(deviceName, newDeviceState);

            // Update the cache
            devices[deviceName].state = newDeviceState;
          }
        }
      });

    });
  }

  // Now let's create the router that'll deal with authentication
  let router = express.Router();

  passport.use(new OAuth2Strategy(
    {
      authorizationURL: AUTH_URL,
      tokenURL: TOKEN_URL,
      clientID: CLIENT_ID,
      clientSecret: CLIENT_SECRET
    },
    (accessToken, refreshToken, profile, done) => {
      initialize(accessToken);
      return done(null, {
        id: 'my_user',
        accessToken: accessToken,
        refreshToken: refreshToken
      });
    }
  ));
  router.get('/',
    passport.authenticate('oauth2')
  );
  router.get('/callback',
    passport.authenticate('oauth2', { failureRedirect: '/error', successRedirect: '/' })
  );

  return {
    name: 'sami',
    router: router,
    list: () => token ? _.keys(devices) : [],
    has: deviceName => token ? _.has(devices, deviceName) : false,
    get: deviceName => new Promise((resolve, reject) => {
      if (_.has(devices, deviceName)) {
        resolve(devices[deviceName].state);
      }
      else {
        reject(new Error(`Device '${deviceName}' is unknown.`));
      }
    }),
    update: (deviceName, state) => {
      return sendLightAction(deviceName, state)
      .then(() => state);
    }
  };
}
