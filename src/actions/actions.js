require('es6-promise').polyfill();
import fetch from 'isomorphic-fetch';
import format from 'string-format';
import _ from 'lodash';
import btoa from 'btoa';
import {devices, ActionStore} from './actionStore';
import sami from '../lib/sami/samiHelper.js';

import chatHistoryStore from '../view/components/chatHistoryStore';

var currentInstance = null;

export function setCurrentInstance( instance ) {
  currentInstance = instance;
}

export var actionTable = {
  'CheckDeviceValue':{'start':CheckDeviceValue,'cancel':cancelCheck},
  'CheckPresence':{'start':CheckPresence,'cancel':cancelCheck},
  'Compute':{'start':Compute},
  'GetDeviceLogs':{'start':GetDeviceLogs},
  'GetDeviceValue':{'start':GetDeviceValue},
  'GetLightIntensity':{'start':GetLightIntensity,'cancel':cancelCheck},
  'LiFXCheckState':{'start': LiFXCheckState,'cancel':cancelCheck},
  'LiFXGetState':{'start': LiFXGetState},
  'LiFXSetState':{'start': LiFXSetState},
  'Log':{'start':Log},
  'PreventCancel':{'start':PreventCancel},
  'ResetCancel':{'start':ResetCancel},
  'SetDeviceValue':{'start':SetDeviceValue},
  'TVSwitched':{'start':TVSwitched}
};

let timeout = {};

// Helpers for conversions between LIFX color values and web colors.

function hsl2rgb(H, S, L) {
/*
 * H ∈ [0°, 360°)
 * S ∈ [0, 1]
 * L ∈ [0, 1]
 */
    /* calculate chroma */
    var C = (1 - Math.abs((2 * L) - 1)) * S;
    /* Find a point (R1, G1, B1) along the bottom three faces of the RGB cube, with the same hue and chroma as our color (using the intermediate value X for the second largest component of this color) */
    var H_ = H / 60;
    var X = C * (1 - Math.abs((H_ % 2) - 1));
    var R1, G1, B1;
    if (H === undefined || isNaN(H) || H === null) {
        R1 = G1 = B1 = 0;
    }
    else {
        if (H_ >= 0 && H_ < 1) {
            R1 = C;
            G1 = X;
            B1 = 0;
        }
        else if (H_ >= 1 && H_ < 2) {
            R1 = X;
            G1 = C;
            B1 = 0;
        } else if (H_ >= 2 && H_ < 3) {
            R1 = 0;
            G1 = C;
            B1 = X;
        } else if (H_ >= 3 && H_ < 4) {
            R1 = 0;
            G1 = X;
            B1 = C;
        } else if (H_ >= 4 && H_ < 5) {
            R1 = X;
            G1 = 0;
            B1 = C;
        }
        else if (H_ >= 5 && H_ < 6) {
            R1 = C;
            G1 = 0;
            B1 = X;
        }
    }
    /* Find R, G, and B by adding the same amount to each component, to match lightness */
    var m = L - (C / 2);
    var R, G, B;
    /* Normalise to range [0,255] by multiplying 255 */
    R = (R1 + m) * 255;
    G = (G1 + m) * 255;
    B = (B1 + m) * 255;
    R = Math.round(R);
    G = Math.round(G);
    B = Math.round(B);
    return {
        r: R,
        g: G,
        b: B
    };
}

function hsb2rgb(hue, saturation, value) {
  hue = hue % 360;
  saturation = Math.max(0, Math.min(saturation, 1));
  value = Math.max(0, Math.min(value, 1));

  var rgb;
  if (saturation === 0) {
    return { r:255*value, g:255*value, b:255* value };
  }

  var side = hue / 60;
  var chroma = value * saturation;
  var x = chroma * (1 - Math.abs(side % 2 - 1));
  var match = value - chroma;

  switch (Math.floor(side)) {
  case 0: rgb = [ chroma, x, 0 ]; break;
  case 1: rgb = [ x, chroma, 0 ]; break;
  case 2: rgb = [ 0, chroma, x ]; break;
  case 3: rgb = [ 0, x, chroma ]; break;
  case 4: rgb = [ x, 0, chroma ]; break;
  case 5: rgb = [ chroma, 0, x ]; break;
  default: rgb = [ 0, 0, 0 ];
  }

  rgb[0] = Math.round(255 * (rgb[0] + match));
  rgb[1] = Math.round(255 * (rgb[1] + match));
  rgb[2] = Math.round(255 * (rgb[2] + match));

  return {r:rgb[0],g:rgb[1],b:rgb[2]};
}

function hexToRGB(hex) {
  var intColor = parseInt(hex.split('#')[1], 16);
  return {r: (intColor >> 16) & 255, g: (intColor >> 8) & 255, b: intColor & 255};
}

function rgb2hex(red, green, blue) {
  var rgb = blue | (green << 8) | (red << 16);
  return '#' + (0x1000000 + rgb).toString(16).slice(1)
}

function cancelCheck(requestId, agentId, canceled) {
  window.clearTimeout(timeout[requestId]);
  canceled();
}

function LiFXRequest(r) {
  r = _.defaults(r || {}, {
    method: 'GET',
    path: '',
    headers: {},
    body: {}
  });

  let url = 'https://api.lifx.com/v1/' + r.path;
  r.headers['Content-Type'] = 'application/json; charset=utf-8';
  r.headers['accept'] = '';
  r.headers['Authorization']='Basic '+ btoa(__LIFX_TOKEN__);
  return fetch(url, {method: r.method,
    headers:r.headers,
    body: r.body
  });
}

// LIFX Actions: only available if a __LIFX_TOKEN__ has been set in the environment variables (will fall back to the 'mockLight' actions otherwise)

function LiFXSetState(requestId, agentId, input, success, failure) {
  if (!_.isUndefined(__LIFX_TOKEN__) && input.light !== '') {
    let r = {};
    r.duration = input.duration;
    r.color = input.color;
    r.power = input.power;
    r.brightness = _.isUndefined(input.brightness) ? 0.5 : input.brightness;
    return LiFXRequest({
      method: 'PUT',
      path: 'lights/'+input.id+'/state',
      body: JSON.stringify( r )
    })
    .then(() => success())
    .catch(ex => {
      console.log('action LiFXSetState [' + requestId + '] failed:', ex);
      failure();
    });
  }
  else
    MockLightSetState(requestId, agentId, input, success, failure)
}

function LiFXGetState(requestId, agentId, input, success, failure) {
  if (!_.isUndefined(__LIFX_TOKEN__) && input.light !== '') {
    return LiFXRequest({
      path: 'lights/'+input.id
    })
    .then(res => res.json())
    .then(json => {
      let lightSetting = _.pick(_.first(json), ['color', 'brightness', 'power']);
      let color = 'hue:' + lightSetting.color.hue + ' saturation:' + lightSetting.color.saturation;
      let obj = {result: {color: color, brightness: lightSetting.brightness, power: lightSetting.power}};
      success(obj);
    }) 
    .catch(ex => {
      console.log('action LiFXGetState [' + requestId + '] failed:', ex);
      failure();
    });
  }
  else
    MockLightGetState(requestId, agentId, input, success, failure)
}

function LiFXCheckState(requestId, agentId, input, success, failure) {
  if (!_.isUndefined(__LIFX_TOKEN__) && input.light !== '') {
    let getLightState = function (input, success) {
      return LiFXRequest({
        path: 'lights/'+input.id
      })
      .then(res => res.json())
      .then(json => {
        let lightSettings = _.pick(_.first(json), ['color', 'brightness', 'power']);
        var rgb;
        if(input.settings.color.startsWith('#')) {
          rgb = hexToRGB( input.settings.color );
        } else {
          var patt = /hue:(.*) saturation:(.*)/;
          var res =  patt.exec(input.settings.color);

          rgb = hsb2rgb( res[1], res[2], input.settings.brightness );  
        }
        var rgbNew = hsb2rgb( lightSettings.color.hue, lightSettings.color.saturation, lightSettings.brightness );
        let color = 'hue:' + lightSettings.color.hue + ' saturation:' + lightSettings.color.saturation;
        let obj = {color: color, brightness: lightSettings.brightness, power: lightSettings.power};      
        if (!_.isEqual(rgb, rgbNew )) {
          success({result: obj});
        }
        else
          timeout[requestId] = window.setTimeout(() => getLightState(input, success), 2000);
      }) 
      .catch(ex => {
        console.log('action LiFXCheckState [' + requestId + '] failed:', ex);
        failure({result: input.settings});
      });
    }
    getLightState(input, success);
  }
  else
    MockLightCheckState(requestId, agentId, input, success, failure)
}

// ZIPATO Actions: only available if a __ZIPABOX_USER__ has been set in the environment variables (will run indefinitely otherwise)

function GetZipatoDeviceValue(requestId, agentId, input, success, failure) {
  return fetch(format('/devices/{device}/attributes/{attribute}/value', {device:input.device, attribute:input.attribute}), {
    method: 'get'
  })
  .then(res => res.json())
  .then(json => success(json))
  .catch(ex => {
    console.log('action GetDeviceValue [' + requestId + '] failed:', ex);
    failure();
  });
}

function GetZipatoDeviceLogs(requestId, agentId, input, success, failure) {
  return fetch(format('/devices/{device}/attributes/{attribute}/logs', {device:input.device, attribute:input.attribute}), {
    method: 'get'
  })
  .then(res => res.json())
  .then(json => {
    let out = {value:_.first(json.logs)};
    return success({result: (out.value.value.toLowerCase() === 'true')});
  })
  .catch(ex => {
    console.log('action GetDeviceLogs [' + requestId + '] failed:', ex);
    failure();
  });
}

function CheckZipatoDeviceValue(requestId, agentId, input, success, failure) {
  let getValue = function (input, success) {
    return fetch(format('/devices/{device}/attributes/{attribute}/logs', {device:input.device, attribute:input.attribute}), {
      method: 'get'
    })
    .then(res => res.json())
    .then(json => {
      let out = _.first(json.logs);
      out.value = out.value.toLowerCase() === 'true';
      let val = input.value;
      if (val == 0.0)
        val = true;
      else if (val == 2.5)
        val = false;
      if (!_.isEqual(out.value, val)) {
        if (input.device === 'light_sensor1'){
          out.value = parseFloat(out.value === true ? 0.0 : 2.5);
          devices.updateLightIntensity(out.value);
        }
        return success({result: out.value});
      }
      else
        timeout[requestId] = window.setTimeout(() => getValue(input, success), 5000);
    })
    .catch(ex => {
      console.log('action CheckDeviceValue [' + requestId + '] failed:', ex);
      failure({result: input.value});
    });
  }
  getValue(input, success);
}

function SetZipatoDeviceValue(requestId, agentId, input, success, failure) {
  return fetch(format('/devices/{device}/attributes/{attribute}/value', {device:input.device, attribute:input.attribute}), {
    method: 'post',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      value: input.value
    })
  })
  .then(function(res) {
    if ((res.status == 200) || (res.status == 202) ) {
      success();
    }
    else {
      failure();
    }
  })
  .catch(ex => {
    console.log('action SetDeviceValue [' + requestId + '] failed:', ex);
    failure();
  });
}

// Generic actions

function CheckDeviceValue(requestId, agentId, input, success, failure) {
  if (!_.isUndefined(__ZIPABOX_USER__))
    return CheckZipatoDeviceValue(requestId, agentId, input, success, failure);
  else if (!_.isUndefined(__SAMI_USER__))
    return GetSamiDeviceValue(requestId, agentId, input, success, failure);
  //else does nothing
}

function GetDeviceLogs(requestId, agentId, input, success, failure) {
  if (!_.isUndefined(__ZIPABOX_USER__))
    return GetZipatoDeviceLogs(requestId, agentId, input, success, failure);
  else if (!_.isUndefined(__SAMI_USER__))
    return GetSamiDeviceValue(requestId, agentId, input, success, failure);
  //else does nothing
}

function GetDeviceValue(requestId, agentId, input, success, failure) {
  if (!_.isUndefined(__ZIPABOX_USER__))
    return GetZipatoDeviceValue(requestId, agentId, input, success, failure);
  else if (!_.isUndefined(__SAMI_USER__) && !_.isUndefined(sami.devices[input.device].ID))
    return GetSamiDeviceValue(requestId, agentId, input, success, failure);
  //else does nothing
}


function SetDeviceValue(requestId, agentId, input, success, failure) {
  if (!_.isUndefined(__ZIPABOX_USER__))
    return SetZipatoDeviceValue(requestId, agentId, input, success, failure);
  else if (!_.isUndefined(__SAMI_USER__) && !_.isUndefined(sami.devices[input.device].ID))
    return SetSamiDeviceValue(requestId, agentId, input, success, failure);
  //else does nothing
}

function Compute(requestId, agentId, input, success, failure) {
  let res = eval(format( input.expression, input ));
  success({result:res});
}

function Log(requestId, agentId, input, success, failure) {
  console.log ('LOG FROM CRAFT :', format( input.message, input ) );
  if( _.isUndefined(input.cancel) || input.cancel === false )
    chatHistoryStore.addCraftMessage( agentId, format( input.message, input ) );
  else
    chatHistoryStore.addCancelMessage( agentId, format( input.message, input ) );
  success();
}

function PreventCancel(requestId, agentId, input, success, failure) {
  chatHistoryStore.cancelMessage();
  success(); 
}

function ResetCancel(requestId, agentId, input, success, failure) {
  currentInstance.updateInstanceKnowledge({cancel:false},'merge')
  success(); 
}

function CheckPresence(requestId, agentId, input, success, failure) {
  let check = function (input, success) {
    let presence = ActionStore.getPresence(input.id);
    if (!_.isEqual(presence, input.presence)) {
      success({result: presence});
    }
    else
      timeout[requestId] = window.setTimeout(() => check(input, success), 500);
  }
  check(input, success);
}

function MockLightGetState(requestId, agentId, input, success, failure) {
  let out = ActionStore.getLightState(input.room);
  if (_.isUndefined(out))
    out = {color: "#000000", brightness: 0};
  success({result: out});
}

function MockLightCheckState(requestId, agentId, input, success, failure) {
  let getLightState = function (input, success) {
    let out = ActionStore.getLightState(input.room);
    if (_.isUndefined(out))
      out = {color: "#000000", brightness: 0};
    if (!_.isUndefined(input.settings.power))
      out.power = input.settings.power;
    if (!_.isUndefined(input.settings.bypassTV))
      out.bypassTV = input.settings.bypassTV;
    if (!_.isEqual(out, input.settings)) {
      success({result: out});
    }
    else
      timeout[requestId] = window.setTimeout(() => getLightState(input, success), 2000);
  }
  getLightState(input, success);
}

function MockLightSetState(requestId, agentId, input, success, failure) {
  let brightness = _.isUndefined(input.brightness) ? 0.5 : input.brightness;
  if (input.power == 'off') {
    brightness = 0;
  }
  devices.updateLights(input.room, input.color, brightness);
  success();
}

function GetLightIntensity(requestId, agentId, input, success, failure) {
  let getIntensity = function (input, success) {
    let out = ActionStore.getLightIntensity();
    if (!_.isUndefined(out))
      if (!_.isEqual(out, input.intensity)) {
        success({result: parseFloat(out)});
      }
      else
        timeout[requestId] = window.setTimeout(() => getIntensity(input, success), 2000);
    else
      timeout[requestId] = window.setTimeout(() => getIntensity(input, success), 2000);
  }
  getIntensity(input, success);
}

function TVSwitched(requestId, agentId, input, success, failure) {
  if (!_.isUndefined(__SAMI_USER__) && !_.isUndefined(__SAMI_TV__)) {
    input.device = 'tv';
    input.attribute = 'power';
    if (!_.isUndefined(sami.devices[input.device]))
      return GetSamiDeviceValue(requestId, agentId, input, success, failure);
    else
      console.log('action TVSwitched [' + requestId + '] failed: device not found');
  }
  else {
    let initialState = ActionStore.getTVState();
    let check = function (success) {
      let currentState = ActionStore.getTVState();
      if (initialState !== currentState) {
        success({result: currentState});
      }
      else
        timeout[requestId] = window.setTimeout(() => check(success), 500);
    }
    check(success);
  }
}

function SetSamiDeviceValue(requestId, agentId, input, success, failure) {
  let res = {};
  _.set(res, input.attribute, input.value);
  return sami.sendMessageToDevice(input.device, res)
  .then(json => {
    if (!_.isUndefined(json.data.mid)) {
      success();
    }
    else {
      failure();
    }
  })
  .catch(ex => {
    console.log('action SetDeviceValue [' + requestId + '] failed:', ex);
    failure();
  });
}

function GetSamiDeviceValue(requestId, agentId, input, success, failure) {
  let res = _.pick(sami.devices[input.device].data, input.attribute);
  if (_.isUndefined(sami.devices[input.device].ID)) {
    console.log('action GetDeviceValue [' + requestId + '] failed: device ID not found');
    failure({result: input.value});
  }
  else if (_.isUndefined(res)) {
    console.log('action GetDeviceValue [' + requestId + '] failed: device data not found');
    failure();
  }
  else {
    console.log('get action sami =', res);
    success({result: res[input.attribute]});
  }
}