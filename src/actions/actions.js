require('es6-promise').polyfill();
import fetch from 'isomorphic-fetch';
import format from 'string-format';
import _ from 'lodash';
import btoa from 'btoa';
import {devices, ActionStore} from './actionStore';

import chatHistoryStore from '../view/components/chatHistoryStore';

var currentInstance = null;

export function setCurrentInstance( instance ) {
  currentInstance = instance;
}

export var actionTable = {
  'CheckDeviceValue':{'start':(!_.isUndefined(__ZIPABOX_USER__) ? CheckDeviceValue : DoNothing),'cancel':cancelCheck},
  'CheckPresence':{'start':CheckPresence,'cancel':cancelCheck},
  'Compute':{'start':Compute},
  'GetDeviceLogs':{'start':(!_.isUndefined(__ZIPABOX_USER__) ? GetDeviceLogs : DoNothing)},
  'GetDeviceValue':{'start':(!_.isUndefined(__ZIPABOX_USER__) ? GetDeviceValue : DoNothing)},
  'GetLightIntensity':{'start':GetLightIntensity,'cancel':cancelCheck},
  'LiFXCheckState':{'start':(!_.isUndefined(__LIFX_TOKEN__) ? LiFXCheckState : MockLightCheckState),'cancel':cancelCheck},
  'LiFXEffect':{'start':(!_.isUndefined(__LIFX_TOKEN__) ? LiFXEffect : LiFXSetState)},
  'LiFXGetState':{'start':(!_.isUndefined(__LIFX_TOKEN__) ? LiFXGetState : MockLightGetState)},
  'LiFXSetState':{'start':(!_.isUndefined(__LIFX_TOKEN__) ? LiFXSetState : MockLightSetState)},
  'Log':{'start':Log},
  'MockLightCheckState':{'start':MockLightCheckState,'cancel':cancelCheck},
  'MockLightGetState':{'start':MockLightGetState},
  'MockLightSetState':{'start':MockLightSetState},
  'PreventCancel':{'start':PreventCancel},
  'ResetCancel':{'start':ResetCancel},
  'SetDeviceValue':{'start':(!_.isUndefined(__ZIPABOX_USER__) ? SetDeviceValue : DoNothing)},
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

function LiFXGetState(requestId, agentId, input, success, failure) {
  return LiFXRequest({
    path: 'lights/'+input.id
  })
  .then(res => res.json())
  .then(json => {
    let lightSetting = _.pick(_.first(json), ['color', 'brightness', 'power']);
    let color = 'hue:' + lightSetting.color.hue + ' saturation:' + lightSetting.color.saturation;
    let obj = {settings: {color: color, brightness: lightSetting.brightness, power: lightSetting.power}};
    success(obj);
  }) 
  .catch(ex => {
    console.log('action LiFXGetState [' + requestId + '] failed:', ex);
    failure();
  });
}

function LiFXCheckState(requestId, agentId, input, success, failure) {
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
        success({settings: obj});
      }
      else
        timeout[requestId] = window.setTimeout(() => getLightState(input, success), 2000);
    }) 
    .catch(ex => {
      console.log('action LiFXCheckState [' + requestId + '] failed:', ex);
      failure({settings: input.settings});
    });
  }
  timeout[requestId] = window.setTimeout(() => getLightState(input, success), 2000);
}

function LiFXEffect(requestId, agentId, input, success, failure) {
  let r = {power_on:'true', persist:false, peak:0.5};
  r.period = _.isUndefined(input.period) ? 0 : input.period;
  r.color = !_.isUndefined(input.color1) ? input.color1 : undefined;
  r.from_color = !_.isUndefined(input.color2) ? input.color2 : undefined;
  r.cycles = _.isUndefined(input.number) ? 5 : input.number;
  return LiFXRequest({
    method: 'POST',
    path: 'lights/'+input.id+'/effects/'+input.effect,
    body: JSON.stringify( r )
  })
  .then(() => success())
  .catch(ex => {
    console.log('action LiFXEffect [' + requestId + '] failed:', ex);
    failure(requestId);
  });
}

// ZIPATO Actions: only available if a __ZIPABOX_USER__ has been set in the environment variables (will run indefinitely otherwise)

function GetDeviceValue(requestId, agentId, input, success, failure) {
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

function GetDeviceLogs(requestId, agentId, input, success, failure) {
  return fetch(format('/devices/{device}/attributes/{attribute}/logs', {device:input.device, attribute:input.attribute}), {
    method: 'get'
  })
  .then(res => res.json())
  .then(json => {
    let out = {value:_.first(json.logs)};
    out.value.value = (out.value.value.toLowerCase() === 'true');
    return success(out);
  })
  .catch(ex => {
    console.log('action GetDeviceLogs [' + requestId + '] failed:', ex);
    failure();
  });
}

function CheckDeviceValue(requestId, agentId, input, success, failure) {
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
        return success(out);
      }
      else
        timeout[requestId] = window.setTimeout(() => getValue(input, success), 5000);
    })
    .catch(ex => {
      console.log('action CheckDeviceValue [' + requestId + '] failed:', ex);
      failure({value: input.value});
    });
  }
  getValue(input, success);
}

function DoNothing(requestId, agentId, input, success, failure) {
  // Do nothing (obviously)
}

// Generic actions

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

function SetDeviceValue(requestId, agentId, input, success, failure) {
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
  success({settings: out});
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
      success({settings: out});
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
        success({intensity: parseFloat(out)});
      }
      else
        timeout[requestId] = window.setTimeout(() => getIntensity(input, success), 2000);
    else
      timeout[requestId] = window.setTimeout(() => getIntensity(input, success), 2000);
  }
  getIntensity(input, success);
}

function TVSwitched(requestId, agentId, input, success, failure) {
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