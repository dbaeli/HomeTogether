import React from 'react';
import Reflux from 'reflux';
import { Button, Row, Col } from 'react-bootstrap';
import {devices, ActionStore} from '../../actions/actionStore';
import _ from 'lodash';
import ColorPicker from 'react-color';

function hexToRGB(hex) {
  var intColor = parseInt(hex.split('#')[1], 16);
  return {r: (intColor >> 16) & 255, g: (intColor >> 8) & 255, b: intColor & 255};
}

let loc;
let color;

export default React.createClass({
  mixins: [Reflux.connect(ActionStore, 'devices')],
  convertLightToColor: function(light) {
    let rgb = hexToRGB(light.color);
    rgb['a'] = light.brightness;
    return {rgb: rgb, hex: light.color.split('#')[1]};
  },
  getInitialState: function() {
    return {color:{}, location:'out'}
  },
  handleChange(val) {
    if (loc !== 'out' && loc !== '' && loc !== '0') {
      devices.updateLights(loc, '#' + val.hex, val.rgb.a)
    }
  },
  shouldComponentUpdate: function(nextProps, nextState) {
    loc = ActionStore.getPlayerLocation();
    let lightState = ActionStore.getLightState(loc);
    if (!_.isUndefined(lightState)) {
      color = this.convertLightToColor(lightState);
    }
    return this.state.location !== loc || (!_.isUndefined(color) && !_.isEqual(this.state.color.rgb, color.rgb));
  },
  componentWillUpdate: function(nextProps, nextState) {
    let res = {location: loc};
    if (!_.isUndefined(color))
      res['color'] = color;
    this.setState(res);
  },
  render: function() {
    let display = this.state.location !== 'out' && this.state.location !== '' && this.state.location !== '0';
    if (this.state.location === '0') {
      return (
        <Row>
        <Col xs={7}>
        <h4>Use the LiFX application to change the light color</h4>
        </Col>
        <Col xs={2}>
          <h4>Room&nbsp;0<br />settings</h4>
        </Col>
        </Row>
        );
    }
    else return (
      <Row style={display ? {display:'block'} : {display:'none'}}>
        <Col xs={7}>
          <ColorPicker style={{marginRight: -5}} color={this.state.color.rgb} onChangeComplete={this.handleChange} type='chrome' />
        </Col>
        <Col xs={2}>
          <h4>Room&nbsp;{this.state.location}<br />settings</h4>
        </Col>
      </Row>
   );
  }
});