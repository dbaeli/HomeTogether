import _ from 'lodash';
import {devices, ActionStore} from '../../actions/actionStore';
import React from 'react';
import ReactDOM from 'react-dom';
import dayNight from '../static/day_night.png';

const VIDEO_WIDTH = 320;
const VIDEO_HEIGHT = 240;
const VIDEO_INITIAL_SAMPLING_DELAY = 5000;
const VIDEO_SAMPLING_INTERVAL = 1000;

const LI_MIN = _.isUndefined(__LI_MIN__) ? 0.0 : Number(__LI_MIN__);
const LI_NIGHT_MAX = _.isUndefined(__LI_NIGHT_MAX__) ? 0.1 : Number(__LI_NIGHT_MAX__);
const LI_DAY_MIN = _.isUndefined(__LI_DAY_MIN__) ? 2.0 : Number(__LI_DAY_MIN__);
const LI_MAX = _.isUndefined(__LI_MAX__) ? 2.5 : Number(__LI_MAX__);

export default React.createClass({
  getInitialState: function() {
    return {
      lightIntensity: LI_MAX,
      streaming: false
    }
  },
  componentDidMount: function() {
    this.videoNode = ReactDOM.findDOMNode(this.refs.video);
    this.canvasNode = ReactDOM.findDOMNode(this.refs.canvas);
    navigator.getUserMedia({
      video:{
        width: VIDEO_WIDTH,
        height: VIDEO_HEIGHT,
        frameRate:{
          max: 6
        }
      },
      audio:false
    },
    stream => {
      this.videoNode.srcObject = stream;
      setTimeout(() => this.readBrightnessFromCamera(), VIDEO_INITIAL_SAMPLING_DELAY);
      this.setState({
        streaming: true
      });
    },
    error => {
      console.log(error)
      this.setState({
        streaming: false
      });
    });
  },
  readBrightnessFromCamera: function() {
    let context = this.canvasNode.getContext('2d');
    context.drawImage(this.videoNode, 0, 0, VIDEO_WIDTH, VIDEO_HEIGHT);
    let data = context.getImageData(0, 0, VIDEO_WIDTH, VIDEO_HEIGHT).data;
    let colorSum = _(data).chunk(4).reduce((colorSum, i) => colorSum + Math.floor((i[0]+i[1]+i[2])/3), 0);
    let brightness = (colorSum / (VIDEO_WIDTH * VIDEO_HEIGHT) / 100).toFixed(1);
    this.handleLightIntensityChange(brightness);
    setTimeout(() => this.readBrightnessFromCamera(), VIDEO_SAMPLING_INTERVAL);
  },
  handleInputChange(event) {
    if (!_.isUndefined(event)) {
      this.handleLightIntensityChange(parseFloat(event.target.value));
    }
  },
  handleLightIntensityChange(lightIntensity) {
    lightIntensity = Math.max(Math.min(lightIntensity, LI_MAX), LI_MIN);
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
      <div className={val < 0.5 ? 'background night' : ( val >= 2 ? 'background day' : 'background dusk')}>
        <video ref='video' style={{display:'none'}}></video>
        <canvas ref='canvas' width={VIDEO_WIDTH} height={VIDEO_HEIGHT} style={{display:'none'}}></canvas>
        <div style={{textAlign:'center', height:50}}>
          <div className={val < 0.5 ? 'icon focus' : 'icon'} style={{left:'11%'}}><i className='fa fa-moon-o'/></div>
          <div className={val >= 2 ? 'icon focus' : 'icon'} style={{left:'86%'}}><i className='fa fa-sun-o'/></div>
        </div>
        <input disabled={this.state.streaming ? true : false} style={{width:'70%',marginLeft:'16%', marginTop:-48}} type='range' value={val} min='0' max='2' step='1' onChange={this.handleInputChange} list='ticks' />
        <datalist id='ticks'>
          <option>0</option>
          <option>1</option>
          <option>2</option>
        </datalist>
      </div>
    );
  }
});