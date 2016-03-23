import _ from 'lodash';
import fetch from 'isomorphic-fetch';
import colorHelper from 'node-hue-api/hue-api/rgb.js';

let hue = {
  request: HueRequest,
  init: HueInit,
  convertRGBtoXY: colorHelper.convertRGBtoXY,
  convertXYtoRGB: colorHelper.convertXYtoRGB,
  convertXYtoHex: convertXYtoHex,
  convertHextoXY: convertHextoXY
};
 
function rgb2hex(red, green, blue) {
  var rgb = blue | (green << 8) | (red << 16);
  return '#' + (0x1000000 + rgb).toString(16).slice(1)
}

function hexToRGB(hex) {
  var intColor = parseInt(hex.split('#')[1], 16);
  return [(intColor >> 16) & 255, (intColor >> 8) & 255, intColor & 255];
}

function convertXYtoHex(x,y,b) {
  let rgb = colorHelper.convertXYtoRGB(x,y,b);
  return rgb2hex(rgb[0],rgb[1],rgb[2]);
}

function convertHextoXY(hex) {
  return colorHelper.convertRGBtoXY(hexToRGB(hex));
}

function HueInit(bridgeName, bridgeIp, userName) {
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
    console.log('Error at Hue initialization, skipping this step\n', err);
  });
}

function HueRequest(r) {
  r = _.defaults(r || {}, {
    method: 'GET',
    path: '',
    headers: {},
    body: {}
  });
  let url = 'http://' + hue.bridgeIp + '/api/' + r.path;
  return fetch(url, {
    method: r.method,
    body: r.body
  });
}

function getHueUserId(bridgeIp, userName) {
  hue.bridgeIp = bridgeIp;
  console.log('Hue bridge IP address =', bridgeIp);
  return hue.request({path: userName})
  .then(res => res.json())
  .then(json => {
    if (!_.isUndefined(json.config))
      return userName;
    else {
      let r = {};
      r.devicetype = 'home_together#craft_hue';
      r.username = userName;
      return hue.request({method:'POST', body: JSON.stringify( r )})
      .then(res => res.json())
      .then(json => {
        let r = _.first(json);
        if (!_.isUndefined(r.success)) {
          return Promise.resolve(r.success.username);
        }
        else {
          console.log(r.error.description);
          window.setTimeout(() => 
            getHueUserId(hue.bridgeIp, userName)
            .then(r => Promise.resolve(r))
            , 5000);
        }
      })
    }
  })
  .then(name => {
    hue.userName = name;
    console.log('Hue user name =', hue.userName);
    return hue.userName;
  })
  .catch((err) => {
    console.log('error while retrieving Hue userId, skipping this step\n', err);
    Promise.reject();
  });
}

module.exports = hue;