import express from 'express';
import _ from 'lodash';
import Promise from 'bluebird';

export default function createMiddleware(backends){
  let router = express.Router();

  router.get('/', (req, res) => {
    _.reduceRight(
      backends,
      (devicesPromise, backend) => devicesPromise
        .then(devices => Promise.all(_.map(
            backend.list(),
            deviceName => backend.get(deviceName).then(device => _.set(device, 'name', deviceName))
          ))
          .then(deviceArray => _.reduce(
            deviceArray,
            (devices, device) => _.set(devices, device.name, device),
            devices))
      ),
      Promise.resolve({})
    )
    .then(devices => {
      res.send(devices);
    })
    .catch(err => {
      res.status(500).send({
        message: `Error while retrieving the state of all devices: ${err}.`
      });
    });
  });

  router.get('/:deviceName', (req, res) => {
    const deviceName = req.params.deviceName;
    const backend = _.find(backends, backend => backend.has(deviceName));
    if (_.isUndefined(backend)) {
      res.status(400).send({
        message: `Error while retrieving the state of device '${deviceName}': the device is not handled by any backend.`
      });
    }
    else {
      backend.get(req.params.device)
      .then(deviceState => res.send(deviceState))
      .catch(err => {
        res.status(500).send({
          message: `Error while retrieving the state of device '${deviceName}': ${err}.`
        });
      });
    }
  });

  router.post('/:deviceName', (req, res) => {
    const deviceName = req.params.deviceName;
    const newState = req.body;
    const backend = _.find(backends, backend => backend.has(deviceName));
    if (_.isUndefined(backend)) {
      res.status(400).send({
        message: `Error while retrieving the state of device '${deviceName}': the device is not handled by any backend.`
      });
    }
    else {
      backend.update(deviceName, newState)
      .then(deviceState => res.send(deviceState))
      .catch(err => {
        res.status(500).send({
          message: `Error while setting the state of '${deviceName}': ${err}.`
        });
      });
    }
  });

  return router;
}
