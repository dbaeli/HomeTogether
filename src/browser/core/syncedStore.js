import _ from 'lodash';
import { EventEmitter } from 'events';
import { is, fromJS } from 'immutable';
import { getInitialState, getCharacterLocation } from './store';

import fetch from 'isomorphic-fetch';

function getDevicesState() {
  return fetch('/devices')
  .then(response => {
    if (response.status >= 400) {
      return response.json()
        .catch(() => {
          throw new Error(`Error ${response.status} while retrieving the state of all devices, invalid json returned.`);
        })
        .then( json => {
          throw new Error(`Error ${response.status} while retrieving the state of all devices, ${json.message}`);
        });
    }
    else {
      return response.json();
    }
  });
}

function updateDeviceState(room, device, state) {
  return fetch(`/devices/${room}+${device}`, {
    method: 'POST',
    body: JSON.stringify(state),
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    if (response.status >= 400) {
      return response.json()
        .catch(() => {
          throw new Error(`Error ${response.status} while updating the state of device '${room}+${device}', invalid json returned.`);
        })
        .then( json => {
          throw new Error(`Error ${response.status} while updating the state of device '${room}+${device}', ${json.message}`);
        });
    }
    else {
      return response.json();
    }
  });
}

export default class Store extends EventEmitter {
  constructor() {
    super();
    this.state = getInitialState();
    setInterval(() => this.syncFromServer(), 2000);
  }
  setLocationLightColor(location, color) {
    color = color.toLowerCase();
    if (color !== this.state.getIn([location, 'light', 'color'])) {
      console.log(`Setting ${location} light color to ${color}.`);
      updateDeviceState(location, 'light', {
        color: color
      })
      .then(deviceState => this.onLightUpdate(location, deviceState));
    }
  }
  setLocationLightBrightness(location, brightness) {
    if (brightness !== this.state.getIn([location, 'light', 'brightness'])) {
      console.log(`Setting ${location} light brightness to ${brightness}.`);
      updateDeviceState(location, 'light', {
        brightness: brightness
      })
      .then(deviceState => this.onLightUpdate(location, deviceState));
    }
  }
  onLightUpdate(location, deviceState) {
    let nextState = this.state
      .setIn([location, 'light', 'color'], deviceState.color)
      .setIn([location, 'light', 'brightness'], deviceState.brightness);
    if (this.state.getIn([location, 'light', 'color']) !== deviceState.color) {
      this.emit('update_light_color', nextState, location, deviceState.color);
    }
    if (this.state.getIn([location, 'light', 'brightness']) !== deviceState.brightness) {
      this.emit('update_light_brightness', nextState, location, deviceState.brightness);
    }
    if (!is(nextState, this.state)) {
      this.emit('update', nextState);
      this.state = nextState;
    }
  }
  setTvState(val) {
    if (val !== this.state.getIn(['living_room', 'tv'])) {
      console.log(`Turning ${val ? 'ON' : 'OFF'} the TV.`);
      updateDeviceState('living_room', 'tv', {
        state: val
      })
      .then(deviceState => this.onTvUpdate('living_room', deviceState));
    }
  }
  onTvUpdate(location, deviceState) {
    let nextState = this.state.setIn([location, 'tv'], deviceState.state);
    if (!is(nextState, this.state)) {
      this.emit('update', nextState);
      this.emit('update_tv_state', location, nextState, deviceState.state);
      this.state = nextState;
    }
  }
  setCharacterLocation(character, location) {
    const previousLocation = getCharacterLocation(this.state, character);
    if (previousLocation !== location) {
      console.log(`Moving the ${character} to ${location}.`);
      Promise.all([
        updateDeviceState(location, 'presence', {
          detected: this.state.getIn([location, 'presence']).push(character).toJSON()
        }),
        updateDeviceState(previousLocation, 'presence', {
          detected: this.state.getIn([previousLocation, 'presence']).filterNot(c => c === character).toJSON()
        })
      ])
      .then(([locationPresenceDetectorState, previousLocationPresenceDetectorState]) => {
        this.onPresenceUpdate(location, locationPresenceDetectorState);
        this.onPresenceUpdate(previousLocation, previousLocationPresenceDetectorState);
      });
    }
  }
  onPresenceUpdate(location, deviceState) {
    const immutablePresence = fromJS(deviceState.detected || []);
    const nextState = this.state.setIn([location, 'presence'], immutablePresence);
    if (!is(nextState, this.state)) {
      this.emit('update', nextState);
      this.emit('update_presence', nextState, location, immutablePresence);
      this.state = nextState;
    }
  }
  setOutsideLightIntensity(intensity) {
    if (intensity !== this.state.getIn(['outside', 'lightIntensity'])) {
      console.log(`Setting the outside light intensity to ${intensity}.`);
      updateDeviceState('outside', 'lightSensor', {
        brightness: intensity
      })
      .then(deviceState => this.onLightSensorUpdate('outside', deviceState));
    }
  }
  onLightSensorUpdate(location, deviceState) {
    let nextState = this.state.setIn(['outside', 'lightIntensity'], deviceState.brightness);
    if (!is(nextState, this.state)) {
      this.emit('update', nextState);
      this.emit('update_light_intensity', nextState, 'outside', deviceState.brightness);
      this.state = nextState;
    }
  }
  syncFromServer(){
    getDevicesState()
    .then(devices => {
      _.forEach(
        devices,
        (device, deviceName) => {
          let room = _.split(deviceName, '+')[0];
          switch (device.type) {
            case 'light':
              this.onLightUpdate(room, device);
              break;
            case 'tv':
              this.onTvUpdate(room, device);
              break;
            case 'lightSensor':
              this.onLightSensorUpdate(room, device);
              break;
            default:
            case 'presenceDetector':
              this.onPresenceUpdate(room, device);
              break;
          }
        });
    });
  }
  getState() {
    return this.state;
  }
}
