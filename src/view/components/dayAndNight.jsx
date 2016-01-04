import _ from 'lodash';
import {devices, ActionStore} from '../../actions/actionStore';
import React from 'react';
import ReactDOM from 'react-dom';
import Slider from 'rc-slider';

import 'rc-slider/assets/index.css';

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
    console.log(`Brightness retrieved from webcam = ${brightness}`);
    this.handleLightIntensityChange(brightness);
    setTimeout(() => this.readBrightnessFromCamera(), VIDEO_SAMPLING_INTERVAL);
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
    const SLIDER_MARKS = {};
    SLIDER_MARKS[LI_MIN] = 'night';
    SLIDER_MARKS[(LI_NIGHT_MAX + LI_DAY_MIN) / 2.5] = '';
    SLIDER_MARKS[LI_MAX] = 'day';

    console.log('this.state.lightIntensity', this.state.lightIntensity);

    return (
      <div style={{height:40}}>
        <video ref='video' style={{display:'none'}}></video>
        <canvas ref='canvas' width={VIDEO_WIDTH} height={VIDEO_HEIGHT} style={{display:'none'}}></canvas>
        {
          this.state.streaming ? (
            <Slider
              min={LI_MIN}
              max={LI_MAX}
              marks={SLIDER_MARKS}
              step={null}
              disabled
              included
              value={ this.state.lightIntensity } />
          ) : (
            <Slider
              min={LI_MIN}
              max={LI_MAX}
              marks={SLIDER_MARKS}
              step={null}
              onAfterChange={v => this.handleLightIntensityChange(v)}
              defaultValue={LI_MAX} />
          )
        }
      </div>
    );
  }
});
