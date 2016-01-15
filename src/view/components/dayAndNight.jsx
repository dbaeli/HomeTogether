import _ from 'lodash';
import {devices, ActionStore} from '../../actions/actionStore';
import React from 'react';
import ReactDOM from 'react-dom';

export default React.createClass({
  getInitialState: function() {
    return {
      lightIntensity: 2.5
    }
  },
  handleInputChange(event) {
    if (!_.isUndefined(event)) {
      this.handleLightIntensityChange(parseFloat(event.target.value));
    }
  },
  handleLightIntensityChange(lightIntensity) {
    devices.updateLightIntensity(lightIntensity);
    this.props.onUpdateLightIntensity(lightIntensity);
    this.setState({
      lightIntensity: lightIntensity
    });
  },
  render: function() {
    let val = this.state.lightIntensity >= 1 ? Math.ceil(this.state.lightIntensity) : this.state.lightIntensity;

    console.log('this.state.lightIntensity', this.state.lightIntensity);
    return (
      <div>
        <div style={{textAlign:'center', height:50}}>
          <div className={val < 0.5 ? 'icon focus' : 'icon'} style={{left:'11%'}}><i className='fa fa-moon-o'/></div>
          <div className={val >= 2 ? 'icon focus' : 'icon'} style={{left:'86%'}}><i className='fa fa-sun-o'/></div>
        </div>
        <input style={{width:'70%',marginLeft:'16%', marginTop:-48}} type='range' value={val} min='0' max='2' step='1' onChange={this.handleInputChange} list='ticks' />
        <datalist id='ticks'>
          <option>0</option>
          <option>1</option>
          <option>2</option>
        </datalist>
      </div>
    );
  }
});