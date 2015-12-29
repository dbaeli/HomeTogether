import React from 'react';
import {ActionStore} from '../../actions/actionStore';

let lastId;
let id = 1;

export default React.createClass({
  wander: function() {
    let playerLoc = ActionStore.getPlayerLocation();
    if (!_.isUndefined(lastId)) {
      let i = document.getElementById('occ'+lastId);
      i.style.display = 'none';
    }
    if (playerLoc == '0' || playerLoc == '1') {
      switch (lastId) {
        case 0:
          id = 1;
          break;
        case 1:
          id = 0;
          break;
        case 2:
          id = 1;
          break;
        case 3:
          id = 2;
          break;
        case 4:
          id = 2;
          break;
      }
    }    
    else if (playerLoc !== 'out' && playerLoc !== '') {
      switch (lastId) {
        case 0:
          id = 1;
          break;
        case 1:
          id = 2;
          break;
        case 2:
          id = 5;
          break;
        case 3:
          id = 2;
          break;
        case 4:
          id = 2;
          break;
      }
    }
    else {
      switch (lastId) {
        case 0:
          id = 1;
          break;
        case 1:
          id = _.sample([0,0,2]);
          break;
        case 2:
          id = _.sample([1,1,1,3,4,5]);
          break;
        case 3:
          id = 2;
          break;
        case 4:
          id = 2;
          break;
        case 5:
          id = 2;
          break;
      }
    }
    let d = document.getElementById('occ'+id);
    d.style.display = 'block';
    lastId = id;
    this.props.onUpdateLocation(String(id));
    setTimeout(()=>this.wander(), _.random(6,12)*1000);
  },
  componentDidMount() {
    this.wander();
  },
  render: function() {
    return (
      <div>
        <div id="occ0" className="occupant" style={{left:'102px',top:'447px', height:'187', width:'230'}}/>
        <div id="occ1" className="occupant" style={{left:'13px',top:'13px', height:'434', width:'319'}}/>
        <div id="occ2" className="occupant" style={{left:'332px',top:'156px', height:'80', width:'306'}}/>
        <div id="occ3" className="occupant" style={{left:'346px',top:'13px', height:'129', width:'200'}}/>
        <div id="occ4" className="occupant" style={{left:'561px',top:'13px', height:'129', width:'77'}}/>
        <div id="occ5" className="occupant" style={{left:'346px',top:'251px', height:'195', width:'292'}}/>
      </div>
    );
  }
});