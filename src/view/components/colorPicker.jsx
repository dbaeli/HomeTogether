import React from 'react';
import Reflux from 'reflux';
import { Button, Row, Col, Input } from 'react-bootstrap';
import {devices, ActionStore} from '../../actions/actionStore';
import _ from 'lodash';
import hue from '../../lib/hue/hueHelper';
import sami from '../../lib/sami/samiHelper';

function hexToRGB(hex) {
  var intColor = parseInt(hex.split('#')[1], 16);
  return {r: (intColor >> 16) & 255, g: (intColor >> 8) & 255, b: intColor & 255};
}

let loc;
let color;
let setting = {};
let lifx_bulbs = [
  __LIFX_BULB_0__,
  __LIFX_BULB_1__,
  __LIFX_BULB_2__,
  __LIFX_BULB_3__,
  __LIFX_BULB_4__,
  __LIFX_BULB_5__
];
let hue_bulbs = [
  hue.lights[0].id,
  hue.lights[1].id,
  hue.lights[2].id,
  hue.lights[3].id,
  hue.lights[4].id,
  hue.lights[5].id
];
let colorPalette = [
  '#FFF3D9',
  '#E8F3F7',
  '#D9EBFF',
  '#FB9902',
  '#FE2712',
  '#8601AF',
  '#0247FE',
  '#66B032'
]


export default React.createClass({
  mixins: [Reflux.connect(ActionStore, 'devices')],
  convertLightToColor: function(light) {
    let rgb = hexToRGB(light.color);
    rgb['a'] = light.brightness;
    return {rgb: rgb, hex: light.color.split('#')[1]};
  },
  getInitialState: function() {
    return {setting:{color:{}, brightness:0.0}, location:'out'}
  },
  changeColor(val) {
    if (loc !== 'out' && loc !== '') {
      let power = 'on';
      if (this.state.setting.brightness === 0.0)
        power = 'off';
      devices.updateLights(loc, val, this.state.setting.brightness, power);
      if (!_.isUndefined(__SAMI_CLIENT_ID__) && !_.isUndefined(sami.devices['light_bulb_'+loc].ID))
        sami.sendMessageToDevice('light_bulb_'+loc, {color: val, brightness: this.state.setting.brightness, power: power});
    }
  },
  changeBrightness(val) {
    if (loc !== 'out' && loc !== '') {
      let power = 'on';
      if (val === 0.0)
        power = 'off';
      devices.updateLights(loc, this.state.setting.color, val, power);
      if (!_.isUndefined(__SAMI_CLIENT_ID__) && !_.isUndefined(sami.devices['light_bulb_'+loc].ID))
        sami.sendMessageToDevice('light_bulb_'+loc, {color: this.state.setting.color, brightness: val, power: power});
    }
  },
  shouldComponentUpdate: function(nextProps, nextState) {
    loc = ActionStore.getPlayerLocation();
    let lightState = ActionStore.getLightState(loc);
    if (!_.isUndefined(lightState)) {
      setting.color = lightState.color;
      setting.brightness = lightState.brightness;
    }
    return this.state.location !== loc 
            || (!_.isUndefined(setting.color)
            && !_.isEqual(this.state.setting.color, setting.color))
            || (!_.isUndefined(setting.brightness)
            && !_.isEqual(this.state.setting.brightness, setting.brightness));
  },
  componentWillUpdate: function(nextProps, nextState) {
    let res = {location: loc};
    if (!_.isUndefined(setting))
      res['setting'] = {color: setting.color, brightness: setting.brightness};
    this.setState(res);
  },
  render: function() {
    if (this.state.location !== 'out' && this.state.location !== '')
      return (
        <Row style={{marginTop:20}}>
          <h4 style={{display:'inline-block',verticalAlign:'top',margin:35}}>Room&nbsp;{this.state.location} <br />settings</h4>
          {
            !_.isUndefined(hue_bulbs[parseInt(this.state.location)]) ?
              <h4 style={{display:'inline-block',verticalAlign:'top',margin:35}}>Use the Philips Hue application <br />to change the light color</h4>
            : (
              !_.isUndefined(lifx_bulbs[parseInt(this.state.location)]) ?
                <h4 style={{display:'inline-block',verticalAlign:'top',margin:35}}>Use the LiFX application <br />to change the light color</h4>
              :
                <div style={{display:'inline-block'}}>
                  <ColorPicker color={this.state.setting.color} onChangeComplete={this.changeColor} />
                  <BrightnessPicker level={this.state.setting.brightness} onChangeComplete={this.changeBrightness} />
                </div>
              )
          }
        </Row>
      );
    else
      return (<div></div>)
  }
});

let ColorPicker = React.createClass({
  render: function() {
    let currentColor = '#' + this.props.color;
    let range = _.map(colorPalette, (k) => {
      return(
        <div key={k} className='colorDiv' style={{backgroundColor:k}} onClick={()=>this.props.onChangeComplete(k)}></div>
      );
    });
    return(
      <div>
        <span style={{fontWeight:600}}>Color:</span>
        <div>{range}</div>
      </div>
    );
  }
});

let BrightnessPicker = React.createClass({
  render: function() {
    let range = _.map(_.range(3), (k) => {
      let val = k/2;
      return(
        <div key={k} className={val > 0.7 ? 'colorDivNegative' : 'colorDiv'} style={{backgroundColor:'rgba(0,0,0,'+(1-val)+')'}} onClick={()=>this.props.onChangeComplete(val)}></div>
      );
    });
    return(
      <div>
        <span style={{fontWeight:600}}>Brightness:</span>
        <div>{range}</div>
      </div>
    );
  }
});