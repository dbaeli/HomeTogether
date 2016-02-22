let _ = require('lodash');
let fetch = require('isomorphic-fetch');
let colorHelper = require ('node-hue-api/hue-api/rgb.js');

let hue = {
  userId: __HUE_USER__,
  lights: [
    {
      id: __HUE_BULB_0__
    },
    {
      id: __HUE_BULB_1__
    },
    {
      id: __HUE_BULB_2__
    },
    {
      id: __HUE_BULB_3__
    },
    {
      id: __HUE_BULB_4__
    },
    {
      id: __HUE_BULB_5__
    }
  ],
  request: HueRequest,
  init: HueInit,
  convertRGBtoXY: colorHelper.convertRGBtoXY,
  convertXYtoRGB: colorHelper.convertXYtoRGB
};

function HueInit() {
  return fetch('https://www.meethue.com/api/nupnp', {method: 'GET'});
}

function HueRequest(r) {
  r = _.defaults(r || {}, {
    method: 'GET',
    path: '',
    headers: {},
    body: {}
  });

  let url = 'http://' + hue.bridgeIpAddress + '/api/' + r.path;
  return fetch(url, {method: r.method,
    body: r.body
  });
}

module.exports = hue;