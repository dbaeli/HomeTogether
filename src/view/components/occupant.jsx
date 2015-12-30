import React from 'react';
import {ActionStore} from '../../actions/actionStore';
import Character from './character';

import gisele from '../static/gisele.png';

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
    let position = {
      x: 0,
      y: 0
    };
    switch(this.state.room) {
      case 0:
        position.x = 266 + 25;
        position.y = -300 + 25;
        break;
      case 1:
        position.x = 172 + 25;
        position.y = -497 + 25;
        break;
      case 2:
        position.x = 406 + 25;
        position.y = -605 + 25;
        break;
      case 3:
        position.x = 348 + 25;
        position.y = -732 + 25;
        break;
      case 4:
        position.x = 559 + 25;
        position.y = -769 + 25;
        break;
      case 5:
        position.x = 360 + 25;
        position.y = -432 + 25;
        break;
    }
    return (
      <Character x={position.x} y={position.y} image={gisele}/>
    );
  }
});
