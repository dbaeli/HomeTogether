import React from 'react';
import {ActionStore} from '../../actions/actionStore';
import Character from './character';

import gisele from '../static/gisele.png';

const POSITION_FROM_ROOM = {
  0: {
    x: 265 + 25,
    y: -172 + 25
  },
  1: {
    x: 171 + 25,
    y: -403 + 25
  },
  2: {
    x: 404 + 25,
    y: -480 + 25
  },
  3: {
    x: 347 + 25,
    y: -603 + 25
  },
  4: {
    x: 561 + 25,
    y: -644 + 25
  },
  5: {
    x: 365 + 25,
    y: -301 + 25
  },
};

export default React.createClass({
  getInitialState: function() {
    return {
      room: 1
    };
  },
  wander: function() {
    let playerLoc = ActionStore.getPlayerLocation();
    let newRoom;
    if (playerLoc == '0' || playerLoc == '1') {
      switch (this.state.room) {
        case 0:
          newRoom = 1;
          break;
        case 1:
          newRoom = 0;
          break;
        case 2:
          newRoom = 1;
          break;
        case 3:
          newRoom = 2;
          break;
        case 4:
          newRoom = 2;
          break;
        case 5:
          newRoom = 2;
          break;
      }
    }
    else if (playerLoc !== 'out' && playerLoc !== '') {
      switch (this.state.room) {
        case 0:
          newRoom = 1;
          break;
        case 1:
          newRoom = 2;
          break;
        case 2:
          newRoom = 5;
          break;
        case 3:
          newRoom = 2;
          break;
        case 4:
          newRoom = 2;
          break;
        case 5:
          newRoom = 5;
          break;
      }
    }
    else {
      switch (this.state.room) {
        case 0:
          newRoom = 1;
          break;
        case 1:
          newRoom = _.sample([0,0,2]);
          break;
        case 2:
          newRoom = _.sample([1,1,1,3,4,5]);
          break;
        case 3:
          newRoom = 2;
          break;
        case 4:
          newRoom = 2;
          break;
        case 5:
          newRoom = 2;
          break;
      }
    }
    this.setState({
      room: newRoom
    });
    this.props.onUpdateLocation(String(newRoom));
    setTimeout(()=>this.wander(), _.random(6,12)*1000);
  },
  componentDidMount() {
    this.wander();
  },
  render: function() {
    let position = POSITION_FROM_ROOM[this.state.room];
    return (
      <Character x={position.x} y={position.y} image={gisele}/>
    );
  }
});
