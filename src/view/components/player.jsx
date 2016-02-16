import React from 'react';
import {ActionStore} from '../../actions/actionStore';
import Character from './character';

import player from '../static/player.png';

const POSITION_FROM_ROOM = {
  0: {
    x: 265 + 25,
    y: -97 + 25
  },
  1: {
    x: 178 + 25,
    y: -606 + 25
  },
  2: {
    x: 506 + 25,
    y: -469 + 25
  },
  3: {
    x: 484 + 25,
    y: -638 + 25
  },
  4: {
    x: 558 + 25,
    y: -646 + 25
  },
  5: {
    x: 399 + 25,
    y: -368 + 25
  },
};


export default React.createClass({
  render: function() {
    if (_.isUndefined(this.props.location) || this.props.location === '' || this.props.location === 'out') {
      return (
        <div/>
      );
    }
    else {
      let position = POSITION_FROM_ROOM[this.props.location];
      return (
        <Character x={position.x} y={position.y} image={player}/>
      );
    }
  }
});
