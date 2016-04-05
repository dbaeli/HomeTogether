import _ from 'lodash';
import fetch from 'isomorphic-fetch';
import Promise from 'bluebird';
import {hexToXY,XYtoHex} from '../lib/colorHelper';
import { createLight, createTv, createPresenceDetector, createLightSensor } from './devices';

export default function createSimulatedBackend() {
  let hueUserName;
  let hueBridgeIp;

  let devices = {};
  if (process.env.HUE_BULB_0) {
    devices['living_room+light'] = {
      id: process.env.HUE_BULB_0,
      state: createLight()
    };
  }
  if (process.env.HUE_BULB_1) {
    devices['dining_room+light'] = {
      id: process.env.HUE_BULB_1,
      state: createLight()
    };
  }
  if (process.env.HUE_BULB_2) {
    devices['corridor+light'] = {
      id: process.env.HUE_BULB_2,
      state: createLight()
    };
  }

  function hueInit(bridgeName, bridgeIp, userName) {
    return fetch('https://www.meethue.com/api/nupnp', {method: 'GET'})
    .then(res => res.json())
    .then(addr => {
      if (!_.isUndefined(bridgeIp)) // use bridge of specified IP
        return getHueUserId(bridgeIp, userName);
      else if (_.size(addr) === 0 || _.isUndefined(_.first(addr).internalipaddress)) {
        console.log('no Hue bridge found');
        return;
      }
      else {
        let bridge = _.find(addr, (v) => v.id === bridgeName);
        if (!_.isUndefined(bridge)) // use preferred bridge if detected
          return getHueUserId(bridge.internalipaddress, userName);
        else // else use the first bridge found
          return getHueUserId(_.first(addr).internalipaddress, userName);
      }
    })
    .catch(err => {
      let msg = 'Error while retrieving Hue userId, Hue API won\'t be used\n' + err;
      console.log(msg);
      throw new Error(msg);
    });
  }

  function hueRequest(r) {
    r = _.defaults(r || {}, {
      method: 'GET',
      path: '',
      headers: {},
      body: {}
    });
    let url = 'http://' + hueBridgeIp + '/api/' + r.path;
    return fetch(url, {
      method: r.method,
      body: r.body
    });
  }

  function getHueUserId(bridgeIp, userName) {
    hueBridgeIp = bridgeIp;
    console.log('Hue bridge IP address =', bridgeIp);
    return hueRequest({path: userName})
    .then(res => res.json())
    .then(json => {
      if (!_.isUndefined(json.config))
        return userName;
      else {
        let r = {};
        r.devicetype = 'home_together#craft_hue';
        r.username = userName;
        return hueRequest({method:'POST', body: JSON.stringify( r )})
        .then(res => res.json())
        .then(json => {
          let r = _.first(json);
          if (!_.isUndefined(r.success) && !_.isUndefined(r.success.username)) {
            return Promise.resolve(r.success.username);
          }
          else {
            if (!_.isUndefined(r.error) && !_.isUndefined(r.error.type) && r.error.type === 101) {
              console.log(r.error.description);
              setTimeout(() => getHueUserId(hueBridgeIp, userName),5000);
            }
            else
              return Promise.reject(r.error.description);
          }
        })
      }
    })
    .catch(err => Promise.reject());
  }
  function updateHueState(deviceName, state) {
    if (_.has(devices, deviceName)) {
      let r = {};
      if (!_.isUndefined(state.color)) {
        r.xy = hexToXY(state.color);
      }
      if (!_.isUndefined(state.brightness)) {
        r.on = (state.brightness !== '0');
        r.bri = _.isUndefined(state.brightness) ? 127 : parseInt(Math.max(Math.min(state.brightness*255, 254),1));
      }
      return hueRequest({
        method: 'PUT',
        path: hueUserName+'/lights/'+devices[deviceName].id+'/state',
        body: JSON.stringify(r)
      })
      .then(() => {
        devices[deviceName].state = _.extend(devices[deviceName].state, state);
        return devices[deviceName].state;
      })
      .catch(ex => {
        throw new Error(`Updating '${deviceName}' state through Hue API failed:\n'${ex}'`);
      });
    }
    else
      return Promise.reject(new Error(`Device '${deviceName}' is unknown.`));
  }

  hueInit(process.env.HUE_PREFERRED_BRIDGE, process.env.HUE_BRIDGE_IP, process.env.HUE_USER)
  .then(name => {
    return Promise.all(
      _.map(devices, (v, k) => updateHueState(k, v.state))
    )
    .then(() => {
      hueUserName = name;
      console.log('Hue user name =', hueUserName);
      return;
    });
  })
  .catch(ex => {
    devices = {};
    throw new Error(`Initializing Hue bulbs failed:\n'${ex}'`);
  });
  return {
    name: 'hue',
    list: () => hueUserName ? _.keys(devices) : [],
    has: deviceName => hueUserName ? _.has(devices, deviceName) : false,
    get: deviceName => {
      if (_.has(devices, deviceName)) {
        return hueRequest({
          path: hueUserName+'/lights/'+devices[deviceName].id
        })
        .then(res => res.json())
        .then(json => {
          let color = XYtoHex(json.state.xy[0], json.state.xy[1], json.state.bri);
          let brightness = parseFloat((json.state.bri/254).toFixed(1));
          devices[deviceName].state = _.extend(devices[deviceName].state, {color:color,brightness:brightness});
          return createLight(color, brightness);
        })
        .catch(ex => {
          throw new Error(`Getting '${deviceName}' state through Hue API failed:\n'${ex}'`)
        });
      }
      else
        return Promise.reject(new Error(`Device '${deviceName}' is unknown.`));
    },
    update: updateHueState
  };
}
