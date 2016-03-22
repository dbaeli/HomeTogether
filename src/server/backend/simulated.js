import _ from 'lodash';
import Promise from 'bluebird';

export default function createDummyBackend(deviceArray) {
  let devices = _.reduce(deviceArray, (devices, device) => _.set(devices, device.name, _.clone(device)), {});
  return {
    list: () => _.keys(devices),
    has: deviceName => _.has(devices, deviceName),
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
        devices[deviceName] = _.extend(devices[deviceName], state);
        resolve(devices[deviceName]);
      }
      else {
        reject(new Error(`Device '${deviceName}' is unknown.`));
      }
    })
  };
}
