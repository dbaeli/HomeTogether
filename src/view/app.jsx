import React from 'react';
import _ from 'lodash';

import craftai from 'craft-ai';
import {actionTable,setCurrentInstance} from '../actions/actions';
import {ActionStore,devices} from '../actions/actionStore';
import FloorMap from './components/floorMap';
import Occupant from './components/occupant';
import Player from './components/player';
import { Input, Button, Grid, Row, Col, ProgressBar } from 'react-bootstrap';
import Light from './components/light';
import ColorPicker from './components/colorPicker';
import Reflux from 'reflux';
import DayAndNight from './components/dayAndNight';
import sami from '../lib/sami/samiHelper';
import hue from '../lib/hue/hueHelper';

import HomeK from '../knowledge/home.json';
import RoomK from '../knowledge/room.json';
import OccupantK from '../knowledge/occupant.json';

let craftConf = {
  owner: __CRAFT_PROJECT_OWNER__,
  name: __CRAFT_PROJECT_NAME__,
  version: __CRAFT_PROJECT_VERSION__,
  appId: __CRAFT_APP_ID__,
  appSecret: __CRAFT_APP_SECRET__,
  wsApiUrl: __CRAFT_WS_API_URL__,
  httpApiUrl: __CRAFT_HTTP_API_URL__
};

function registerActions(instance) {
  return Promise.all(
    _.map(actionTable, (obj, key)=>{
      return instance.registerAction(key, obj.start, obj.cancel);
    })
  );
}

function getHueUserId() {
  return new Promise((resolve, reject) => {
    if (!_.isUndefined(hue.bridgeIpAddress)) {
      console.log('Hue bridge IP address =', hue.bridgeIpAddress);
      hue.request({path: __HUE_USER__})
      .then(res => res.json())
      .then(json => {
        if (!_.isUndefined(json.config))
          return true;
        else {
          let r = {};
          r.devicetype = 'home_together#craft_hue';
          r.username = __HUE_USER__;
          return hue.request({method:'POST', body: JSON.stringify( r )})
          .then(res => res.json())
          .then(json => {
            return new Promise((accept) => {
              let r = _.first(json);
              if (!_.isUndefined(r.success)) {
                console.log('Hue userId retrieved:', r.success.username);
                hue.userId = r.success.username;
                accept(true);
              }
              else {
                console.log(r.error.description);
                window.setTimeout(() => 
                  getHueUserId()
                  .then(r => resolve(r))
                  , 5000);
              }
            })
          })
        }
      })
      .then(() => hue.request({path: hue.userId + '/lights'}))
      .then(res => res.json())
      .then(json => {
        console.log('Hue light bulbs retrieved =', json);
        resolve();
      })
      .catch((err) => {
        console.log('error while retrieving Hue userId, skipping this step\n', err);
        _.map(hue.lights, (val, key) => val.id = undefined);
        resolve(false);
      });
    }
    else {
      console.log('invalid Hue bridge IP address');
      _.map(hue.lights, (val, key) => val.id = undefined);
      resolve(false);
    }
  });
}

export default React.createClass({
  updateLight: function(val) {
    return this.state.instance.updateAgentKnowledge(0, {outsideLightIntensity: {value:val}}, 'merge');
  },
  updateTV: function(val) {
    devices.updateTVState(val);
    return this.state.instance.updateInstanceKnowledge( {tvState:val}, 'merge' );
  },
  getInitialState: function() {
    return {instance:null, started:false, devices: ActionStore.getInitialState(), failure: false, playerPosition:''}
  },
  componentWillMount: function() {
    if (!_.isUndefined(__SAMI_USER__))
      sami.createListenerWS(__SAMI_USER__);
    this.n = 0;
    hue.init()
    .then(res => res.json())
    .then(addr => {
      if (_.size(addr) === 0 || _.isUndefined(_.first(addr).internalipaddress)) {
        console.log('no Hue bridge found');
        _.map(hue.lights, (val, key) => val.id = undefined);
        return true;
      }
      else {
        let bridge = _.find(addr, (v) => v.id === __HUE_PREFERRED_BRIDGE__);
        if (!_.isUndefined(bridge)) {
          hue.bridgeIpAddress = bridge.internalipaddress;
        }
        else
          hue.bridgeIpAddress = _.first(addr).internalipaddress;
        return getHueUserId();
      }
    })
    .then(() => craftai(craftConf, OccupantK))
    .then(instance => {
      this.setState( {instance: instance} );
      setCurrentInstance(instance);
    })
    .then(() => this.state.instance.createAgent('src/decision/Home.bt', HomeK))
    .then(() => this.state.instance.createAgent('src/decision/rooms/LivingRoom.bt', _.assign(RoomK, {roomLightId: _.reduce([__SAMI_BULB_0__,hue.lights[0].id,__LIFX_BULB_0__], (res, val) => val || res, '') })))
    .then(() => this.state.instance.createAgent('src/decision/rooms/DiningRoom.bt', _.assign(RoomK, {roomLightId: _.reduce([__SAMI_BULB_1__,hue.lights[1].id,__LIFX_BULB_1__], (res, val) => val || res, '') })))
    .then(() => this.state.instance.createAgent('src/decision/rooms/Corridor.bt', _.assign(RoomK, {roomLightId: _.reduce([__SAMI_BULB_2__,hue.lights[2].id,__LIFX_BULB_2__], (res, val) => val || res, '') })))
    .then(() => this.state.instance.createAgent('src/decision/rooms/Bathroom.bt', _.assign(RoomK, {roomLightId: _.reduce([__SAMI_BULB_3__,hue.lights[3].id,__LIFX_BULB_3__], (res, val) => val || res, '') })))
    .then(() => this.state.instance.createAgent('src/decision/rooms/WaterCloset.bt',_.assign(RoomK, {roomLightId: _.reduce([__SAMI_BULB_4__,hue.lights[4].id,__LIFX_BULB_5__], (res, val) => val || res, '') })))
    .then(() => this.state.instance.createAgent('src/decision/rooms/Bedroom.bt', _.assign(RoomK, {roomLightId: _.reduce([__SAMI_BULB_5__,hue.lights[5].id,__LIFX_BULB_5__], (res, val) => val || res, '') })))
    .then(() => registerActions(this.state.instance))
    .then(() => {
      this.state.instance.update(100);
      this.setState({started: true});
    })
    .catch((err) => {
      console.log('Unexpected error:', err);
      this.setState({failure: true});
    });
  },
  render: function() {
    if(this.state.started === false)
      return (
        <Grid style={{textAlign:'center', marginTop:'50px'}}>
          <Row style={{height:90}}>
            <h3><img src='favicons/craft-ai.gif'/><span style={{verticalAlign:'middle'}}>&nbsp;craft ai - Home&nbsp;Together</span></h3>
          </Row>
          <Row>
            <Col xs={4}></Col>
            {this.state.failure === false ?
              <Col xs={4}>
                <ProgressBar bsStyle='success' active now={this.n=this.n+50} style={{height:40, border:'2px solid #42348B'}} />
                <h4 style={{fontWeight:'bolder',marginTop:-50}}>{this.state.instance === null ? 'Creating instance...' : 'Initializing agents...'}</h4>
              </Col>
            :
              <Col xs={4}>
                <ProgressBar bsStyle='danger' striped now={100} style={{height:40, border:'2px solid #42348B'}} />
                <h4 style={{fontWeight:'bolder',marginTop:-50}}>Instance creation failed...</h4>
              </Col>
            }
          </Row>
        </Grid>
      );
    else
      return (
        <Grid>
          <Row>
            <Col sm={0} md={2}>
            </Col>
            <Col sm={12} md={8}>
              <FloorMap onUpdateTV={(val)=>this.updateTV(val)} onUpdateLocation={(location) => {devices.updatePresence('player', location); this.setState({playerPosition: location})}}/>
              <Player location={this.state.playerPosition}/>
              <Occupant onUpdateLocation={(location) => devices.updatePresence('occupant', location)}/>
              <Light/>
            </Col>
          </Row>
          <Row style={{marginTop:'20px'}}>
            <Col sm={0} md={2}>
            </Col>
            <Col sm={12} md={8}>
              <DayAndNight style={{marginTop:'10px'}} onUpdateLightIntensity={(val) => this.updateLight(val)}/>
              <ColorPicker style={{marginTop:'10px'}} />
            </Col>
          </Row>
        </Grid>
      );
  }
});
