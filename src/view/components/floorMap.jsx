import React from 'react';
import _ from 'lodash';
import {ActionStore} from '../../actions/actionStore';

import home from '../static/home_.png';
import tvOff from '../static/tv_off.png';
import tvOn from '../static/tv_on.png';

var lastId;
export default React.createClass({
  getInitialState: function() {
    return {TV: ActionStore.getTVState()}
  },
  roomSelected: function(id) {
    if (!_.isUndefined(lastId)) {
      let i = document.getElementById('div'+lastId);
      i.style.display = 'none';
    }
    if (id !== 'out') {
      let d = document.getElementById('div'+id);
      d.style.display = 'block';
      lastId = id;
    }
    this.props.onUpdateLocation(String(id));
  },
  tvSelected: function(id) {
    if (id === '9') {
      let tvState = !this.state.TV
      this.props.onUpdateTV(tvState);
      this.roomSelected(0);
      this.setState({TV: tvState});
    }
  },
  render: function() {
    return (
      <div>
        <img style={{position:'relative',left:'-15px'}} src={home} width="651" height="646" alt="home" useMap="#rooms" id="out" onClick={e=>this.roomSelected(e.target.id)}/>
        <map name="rooms">
          <area shape="rect" id="9" coords="102,447,130,633" onClick={e=>this.tvSelected(e.target.id)} alt="TV" />
          <area shape="rect" id="0" coords="132,447,331,633" onClick={e=>this.roomSelected(e.target.id)} alt="living room" />
          <area shape="rect" id="1" coords="13,13,331,446" onClick={e=>this.roomSelected(e.target.id)} alt="dining room"/>
          <area shape="rect" id="2" coords="332,156,637,235" onClick={e=>this.roomSelected(e.target.id)} alt="corridor" />
          <area shape="rect" id="3" coords="346,13,545,141" onClick={e=>this.roomSelected(e.target.id)} alt="bathroom" />
          <area shape="rect" id="4" coords="561,13,637,141" onClick={e=>this.roomSelected(e.target.id)} alt="water closet" />
          <area shape="rect" id="5" coords="346,251,637,445" onClick={e=>this.roomSelected(e.target.id)} alt="bedroom" />
        </map>
        <div>
          <div id="div0" className="highlight" style={{left:'132px',top:'447px', height:'187', width:'200'}}/>
          <div id="div1" className="highlight" style={{left:'13px',top:'13px', height:'434', width:'319'}}/>
          <div id="div2" className="highlight" style={{left:'332px',top:'156px', height:'80', width:'306'}}/>
          <div id="div3" className="highlight" style={{left:'346px',top:'13px', height:'129', width:'200'}}/>
          <div id="div4" className="highlight" style={{left:'561px',top:'13px', height:'129', width:'77'}}/>
          <div id="div5" className="highlight" style={{left:'346px',top:'251px', height:'195', width:'292'}}/>
        </div>
        <img style={{position:'relative', top:'-150px',left:'400px'}} src={this.state.TV === true ? tvOn : tvOff}/>
      </div>
    );
  }
});