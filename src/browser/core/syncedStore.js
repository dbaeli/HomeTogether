import _ from 'lodash';
import fetch from 'isomorphic-fetch';
import Promise from 'bluebird';
import Store from './store';

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

export default class SyncedStore extends Store {
  constructor() {
    super();
    this.currentRequest = Promise.resolve();
    setInterval(() => this.syncFromServer(), 2000);
  }
  onLightUpdate(location, lightState) {
    this.currentRequest = this.currentRequest
    .then(() => updateDeviceState(location, 'light', lightState))
    .then(device => super.onLightUpdate(location, device));
  }
  onTvUpdate(location, tvState) {
    this.currentRequest = this.currentRequest
    .then(() => updateDeviceState(location, 'tv', {
      state: tvState
    }))
    .then(device => super.onTvUpdate(location, device.state));
  }
  onPresenceUpdate(location, presenceState) {
    this.currentRequest = this.currentRequest
    .then(() => updateDeviceState(location, 'presence', {
      detected: presenceState
    }))
    .then(device => super.onPresenceUpdate(location, device.detected));
  }
  onLightSensorUpdate(location, lightSensorState) {
    this.currentRequest = this.currentRequest
    .then(() => updateDeviceState(location, 'lightIntensity', {
      intensity: lightSensorState
    }))
    .then(device => super.onLightSensorUpdate(location, device.intensity));
  }
  syncFromServer(){
    this.currentRequest = this.currentRequest
    .then(() => getDevicesState())
    .then(devices => {
      _.forEach(
        devices,
        (device, deviceName) => {
          let room = _.split(deviceName, '+')[0];
          switch (device.type) {
            case 'light':
              super.onLightUpdate(room, device);
              break;
            case 'tv':
              super.onTvUpdate(room, device.state);
              break;
            case 'lightSensor':
              super.onLightSensorUpdate(room, device.intensity);
              break;
            default:
            case 'presenceDetector':
              super.onPresenceUpdate(room, device.detected);
              break;
          }
        });
    });
  }
}
