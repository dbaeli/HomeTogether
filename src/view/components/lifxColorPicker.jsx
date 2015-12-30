import React from 'react';
import _ from 'lodash';
import ColorPicker from 'react-color';
import fetch from 'isomorphic-fetch';
import btoa from 'btoa';

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

  return {r:rgb[0],g:rgb[1],b:rgb[2],a:value};
}

function LiFXRequest(r) {
  r = _.defaults(r || {}, {
    method: 'GET',
    path: '',
    headers: {},
    body: {}
  });
  let url = 'https://api.lifx.com/v1/' + r.path;
  // let url = 'http://localhost:5555/' + r.path;
  r.headers['Content-Type'] = 'application/json; charset=utf-8';
  r.headers['accept'] = '';
  r.headers['Authorization']='Basic '+ btoa('c0a0bc7550a1fb78ee1e722268eacaba6585154db74c3f8da3a8c422c6f9053f:');
  return fetch(url, {method: r.method,
    headers:r.headers,
    body: r.body
  });
}

export default React.createClass({
  setLifxState: function(color) {
    let r = {};
    r.duration = 1;
    r.color = color.hex;
    r.power = 'on';
    r.brightness = color.rgb.a;
    return LiFXRequest({
      method: 'PUT',
      path: 'lights/d073d501f676/state',
      body: JSON.stringify( r )
    })
    .catch(ex => {
      console.log('setting of lifx state failed:', ex);
    });
  },
  getLifxState: function() {
    return LiFXRequest({
      path: 'lights/d073d501f676'
    })
    .then(res => res.json())
    .then(json => {
      let lightSettings = _.pick(_.first(json), ['color', 'brightness']);
      let rgb = hsb2rgb(lightSettings.color.hue, lightSettings.color.saturation, lightSettings.brightness);
      this.setState({color: rgb});
    })
    .catch(ex => {
      console.log('retrieval of lifx state failed:', ex);
    });
  },
  getInitialState: function() {
    return {color:{}};
  },
  componentWillUpdate: function(nextProps, nextState) {
    if (!_.isEqual(nextState, this.state))
      setTimeout(() => {this.getLifxState(); console.log('updating lifx state'); this.forceUpdate();}, 5000);
  },
  componentDidMount: function() {
    this.getLifxState();
  },
  render: function() {
    return (
      <ColorPicker color={this.state.color} onChangeComplete={this.setLifxState} type='chrome' />
    );
  }
});