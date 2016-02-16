import React from 'react';
import _ from 'lodash';
import {ActionStore} from '../../actions/actionStore';

import home from '../static/Home.png';
import tv from '../static/tv.png';
export default React.createClass({
  getInitialState: function() {
    return {
      TV: ActionStore.getTVState(),
      room: undefined
    }
  },
  roomSelected: function(id) {
    if (id !== 'out') {
      this.setState({
        room: id
      });
    }
    else {
      this.setState({
        room: undefined
      });
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
  renderTv: function() {
    if (this.state.TV) {
      return (
        <img
          src={tv}
          style={{
            position: 'absolute',
            left: '120px',
            top: '491px',
            height: '98px',
            zIndex: 10
          }} />
      );
    }
    else {
      return (
        <div/>
      );
    }
  },
  render: function() {
    return (
      <div>
        <img style={{position:'relative',left:'-15px'}} src={home} width='651' height='646' alt='home' useMap='#rooms' id='out' onClick={e=>this.roomSelected(e.target.id)}/>
        <map name='rooms'>
          <area shape='rect' id={9} coords='102,447,130,633' onClick={e=>this.tvSelected(e.target.id)} alt='TV' />
          <area shape='rect' id={0} coords='132,447,331,633' onClick={e=>this.roomSelected(e.target.id)} alt='living room' />
          <area shape='rect' id={1} coords='13,13,331,446' onClick={e=>this.roomSelected(e.target.id)} alt='dining room'/>
          <area shape='rect' id={2} coords='332,156,637,235' onClick={e=>this.roomSelected(e.target.id)} alt='corridor' />
          <area shape='rect' id={3} coords='346,13,545,141' onClick={e=>this.roomSelected(e.target.id)} alt='bathroom' />
          <area shape='rect' id={4} coords='561,13,637,141' onClick={e=>this.roomSelected(e.target.id)} alt='water closet' />
          <area shape='rect' id={5} coords='346,251,637,445' onClick={e=>this.roomSelected(e.target.id)} alt='bedroom' />
        </map>
        { this.renderTv() }
      </div>
    );
  }
});
