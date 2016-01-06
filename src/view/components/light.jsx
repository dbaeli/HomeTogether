import React from 'react';
import Reflux from 'reflux';
import {ActionStore} from '../../actions/actionStore';
import _ from 'lodash';

import lightOn from '../static/LightOn.png';
import lightOff from '../static/LightOff.png';
import inLight from '../static/inLight_.png';

export default React.createClass({
  mixins: [Reflux.connect(ActionStore, 'devices')],
  componentWillUpdate: function(nextProps, nextState) {
    _.map(nextState.devices.lights, (value, key) => {
      let l = document.getElementById('light'+key);
      let b = document.getElementById('bulb'+key);
      l.style.opacity = value.brightness;
      if (!_.isUndefined(value.color))
        l.style.backgroundColor = value.color;
      b.style.opacity = 1-value.brightness;
    });
  },
  render: function() {
    return (
      <div>
        <div>
          <div className="light" style={{left:200, top:530}}><img id="bulb0" className="light" src={lightOff} /><span className="room">0</span></div>
          <div className="light" style={{left:167, top:200}}><img id="bulb1" className="light" src={lightOff} /><span className="room">1</span></div>
          <div className="light" style={{left:480, top:176}}><img id="bulb2" className="light" src={lightOff} /><span className="room">2</span></div>
          <div className="light" style={{left:441, top:57}}><img id="bulb3" className="light" src={lightOff} /><span className="room">3</span></div>
          <div className="light" style={{left:589, top:57}}><img id="bulb4" className="light" src={lightOff} /><span className="room">4</span></div>
          <div className="light" style={{left:480, top:328}}><img id="bulb5" className="light" src={lightOff} /><span className="room">5</span></div>
        </div>
        <div>
          <img id="light0" className="light" style={{left:200, top:530}} src={inLight} />
          <img id="light1" className="light" style={{left:167, top:200}} src={inLight} />
          <img id="light2" className="light" style={{left:480, top:176}} src={inLight} />
          <img id="light3" className="light" style={{left:441, top:57}} src={inLight} />
          <img id="light4" className="light" style={{left:589, top:57}} src={inLight} />
          <img id="light5" className="light" style={{left:480, top:328}} src={inLight} />
        </div>
      </div>
    );
  }
});