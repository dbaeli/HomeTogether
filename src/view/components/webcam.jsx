import React from 'react';
import Reflux from 'reflux';
import {devices} from '../../actions/actionStore';
import _ from 'lodash';

let video;
let width = 320;
let height = 240;

export default React.createClass({
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
  },
  streamVideo: function() {
    navigator.mediaDevices.getUserMedia({video:{width:width, height:height, frameRate:{max:6}}, audio:false})
    .then(stream => {
      video = document.querySelector('video');
      let vendorURL = window.URL || window.webkitURL;
      video.src = vendorURL.createObjectURL(stream);
      video.play();
      this.setState({canvas: document.getElementById('canvas')});
    })
    .catch(r => console.log(r));
  },
  componentWillMount: function() {
    this.streamVideo();
  },
  componentWillUpdate: function(nextProps, nextState) {
    setTimeout(() => {this.getBrightness(this.state.canvas); this.forceUpdate();}, 3000);
  },
  render: function() {
    return (
      <div style={{textAlign:'center', height:130}}>
        <video id='video' style={{width:128, height:96}}></video>
        <canvas id='canvas' style={{display:'none'}}></canvas>
      </div>
   );
  }
});

