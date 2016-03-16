import React from 'react';
import { Row, Col } from 'react-bootstrap';
import _ from 'lodash';

import './colorPicker.css';

export default React.createClass({
  handleColorChange(color) {
    if (!_.isUndefined(this.props.onUpdateColor)) {
      this.props.onUpdateColor(color);
    }
  },
  handleBrightnessChange(brightness) {
    if (!_.isUndefined(this.props.onUpdateBrightness)) {
      this.props.onUpdateBrightness(brightness);
    }
  },
  render: function() {
    return (
      <Row style={{marginTop:20}}>
        <h4 style={{display:'inline-block',verticalAlign:'top',margin:35}}>
          Room&nbsp;{this.props.label}<br/>settings
        </h4>
        <div style={{display:'inline-block'}}>
          <ColorPicker color={this.props.color} onChange={this.handleColorChange} />
          <BrightnessPicker brightness={this.props.brightness} onChange={this.handleBrightnessChange} />
        </div>
      </Row>
    );
  }
});

const COLOR_PALETTE = [
  '#FFF3D9',
  '#E8F3F7',
  '#D9EBFF',
  '#FB9902',
  '#FE2712',
  '#8601AF',
  '#0247FE',
  '#66B032'
];

let ColorPicker = React.createClass({
  render: function() {
    return(
      <div>
        <span style={{fontWeight:600}}>Color:</span>
        <div>
        {
          _.map(COLOR_PALETTE, color => (
            <div
              key={color}
              className='colorDiv'
              style={{backgroundColor:color}}
              onClick={()=>this.props.onChange(color)}>
            </div>)
          )
        }
        </div>
      </div>
    );
  }
});

const BRIGHTNESS_PALETTE = [
  0,
  0.8,
  1
];


let BrightnessPicker = React.createClass({
  render: function() {
    return(
      <div>
        <span style={{fontWeight:600}}>Brightness:</span>
        <div>
        {
          _.map(BRIGHTNESS_PALETTE, brightness => {
            return(
              <div
                key={brightness}
                className={brightness > 0.7 ? 'colorDivNegative' : 'colorDiv'}
                style={{backgroundColor:'rgba(0,0,0,'+(1-brightness)+')'}}
                onClick={()=>this.props.onChange(brightness)}>
              </div>
            );
          })
        }
        </div>
      </div>
    );
  }
});
