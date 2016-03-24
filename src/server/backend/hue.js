import _ from 'lodash';
import Promise from 'bluebird';
import hue from '../api/hueHelper';
import { createLight, createTv, createPresenceDetector, createLightSensor } from './devices';

export default function createSimulatedBackend() {
  function updateHueState(deviceName, state) {
    console.log(`Updating device '${deviceName}' state.`);
    if (_.has(devices, deviceName)) {
      let r = {};
      if (!_.isUndefined(state.color))
        r.xy = hue.convertHextoXY(state.color);
      if (!_.isUndefined(state.brightness)) {
        r.on = (state.brightness !== '0');
        r.bri = _.isUndefined(state.brightness) ? 127 : parseInt(Math.max(Math.min(state.brightness*255, 254),1));
      }
      return hue.request({
        method: 'PUT',
        path: hue.userName+'/lights/'+devices[deviceName].id+'/state',
        body: JSON.stringify(r)
      })
      .then(() => {
        devices[deviceName].state = _.extend(devices[deviceName].state, state);
        return devices[deviceName].state;
      })
      .catch(ex => {
        throw new Error(`Updating '${deviceName}' state through Hue API failed:\n'${ex}'`)
      });
    }
    else
      return Promise.reject(new Error(`Device '${deviceName}' is unknown.`));
  };

  let devices = {
    'living_room+light': {
      id: process.env.HUE_BULB_0,
      state: createLight()
    },
    'dining_room+light': {
      id: process.env.HUE_BULB_1,
      state: createLight()
    },
    'corridor+light': {
      id: process.env.HUE_BULB_2,
      state: createLight()
    }
  };

  hue.init(process.env.HUE_PREFERRED_BRIDGE, process.env.HUE_BRIDGE_IP, process.env.HUE_USER)
  .then(() => {
    return Promise.all(
      _.map(devices, (v, k) => updateHueState(k, v.state))
    )
  })
  .catch(ex => {
    devices = {};
    throw new Error(`Initializing Hue bulbs failed:\n'${ex}'`)
  });
  return {
    name: 'hue',
    list: () => _.keys(devices),
    has: deviceName => _.has(devices, deviceName),
    get: deviceName => {
      console.log(`Retrieving device '${deviceName}' state.`);
      if (_.has(devices, deviceName)) {
        return hue.request({
          path: hue.userName+'/lights/'+devices[deviceName].id
        })
        .then(res => res.json())
        .then(json => {
          let color = hue.convertXYtoHex(json.state.xy[0], json.state.xy[1], json.state.bri);
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
