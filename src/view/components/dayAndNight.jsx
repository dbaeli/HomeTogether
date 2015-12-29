import React from 'react';
import Reflux from 'reflux';
import {devices, ActionStore} from '../../actions/actionStore';
import _ from 'lodash';

import dayNight from '../static/day_night.png';

let video;
let width = 320;
let height = 240;

export default React.createClass({
  getInitialState: function() {
    return {night: false, lightIntensity:2.5}
  },
  getBrightness: function(canvas) {
    let context = canvas.getContext('2d');
    canvas.width = width;
    canvas.height = height;
    context.drawImage(video, 0, 0, width, height);

    let data = context.getImageData(0,0,canvas.width,canvas.height).data;

    let colorSum = _(data).chunk(4).reduce((colorSum, i) => colorSum + Math.floor((i[0]+i[1]+i[2])/3), 0);

    let brightness = (colorSum / (canvas.width*canvas.height) / 100).toFixed(1);
    console.log('webcam light intensity =', brightness);
    devices.updateLightIntensity(brightness);
    let mask = document.getElementById('mask')
    if (brightness >= 1)
      mask.className  = 'mask day';
    else if (brightness >= 0.5)
      mask.className  = 'mask';
    else
      mask.className  = 'mask night';
    this.setState({lightIntensity: brightness});
  },
  streamingVideo: function() {
    navigator.mediaDevices.getUserMedia({video:{width:width, height:height, frameRate:{max:6}}, audio:false})
    .then(streaming => {
      video = document.querySelector('video');
      let vendorURL = window.URL || window.webkitURL;
      video.src = vendorURL.createObjectURL(streaming);
      video.play();
      this.setState({canvas: document.getElementById('canvas')});
    })
    .catch(r => console.log(r));
  },
  componentWillMount: function() {
    if (this.props.streaming)
      this.streamingVideo();
  },
  shouldComponentUpdate: function(nextProps, nextState) {
    if (this.props.streaming)
      return (!_.isEqual(nextProps, this.props) || !_.isEqual(nextState, this.state));
    else
      return ActionStore.getIsNight() !== nextState.night;
  },
  componentWillUpdate: function(nextProps, nextState) {
    if (this.props.streaming)
      setTimeout(() => {this.getBrightness(this.state.canvas); this.forceUpdate();}, 3000);
    else
      this.setState({night: ActionStore.getIsNight()});
  },
  handleClick() {
    let night = this.state.night === false;
    let lightIntensity = (night === false ? 2.5 : 0.0);
    devices.updateIsNight(night);
    devices.updateLightIntensity(lightIntensity);
    this.props.onUpdateNight(lightIntensity);
    this.setState({night: night});
  },
  render: function() {
    if (this.props.streaming) {
      return (
        <div style={{textAlign:'center', height:130}}>
          <video id='video' style={{display:'none'}}></video>
          <canvas id='canvas' style={{display:'none'}}></canvas>
          <img src={dayNight} useMap='#cycle' />
          <map name='cycle'>
            <area disabled='disabled' shape='circle' coords='50,50,50' alt='day/night cycle' />
          </map>
          <div id='mask' className='mask'></div>
        </div>
      );
    } else {
      return (
        <div style={{textAlign:'center', height:130}}>
          <img src={dayNight} useMap='#cycle' />
          <map name='cycle'>
            <area shape='circle' coords='50,50,50' alt='day/night cycle' onClick={this.handleClick} />
          </map>
          <div id='mask' className={this.state.night ? 'mask night' : 'mask day'}></div>
        </div>
      );
    }
  }
});