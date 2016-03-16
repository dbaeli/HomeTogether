import _ from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';

import './dayAndNight.css';

export default React.createClass({
  getInitialState: function() {
    return {
      lightIntensity: 2.5
    };
  },
  handleLightChange(event) {
    if (!_.isUndefined(this.props.onUpdateLight) && !_.isUndefined(event)) {
      const light = parseFloat(event.target.value);
      this.props.onUpdateLight(light);
    }
  },
  render: function() {
    return (
      <div>
        <div style={{textAlign:'center', height:50}}>
          <div className={this.props.light < 0.5 ? 'icon focus' : 'icon'} style={{left:'11%'}}><i className='fa fa-moon-o'/></div>
          <div className={this.props.light >= 2 ? 'icon focus' : 'icon'} style={{left:'86%'}}><i className='fa fa-sun-o'/></div>
        </div>
        <input
          style={{width:'70%',marginLeft:'16%', marginTop:-48}}
          type='range'
          value={this.props.light}
          min='0'
          max='2'
          step='1'
          onChange={this.handleLightChange}
          list='ticks' />
        <datalist id='ticks'>
          <option>0</option>
          <option>1</option>
          <option>2</option>
        </datalist>
      </div>
    );
  }
});
