import React from 'react';
import _ from 'lodash';

import craft from '../lib/craft-ai/craft-ai';
import onExit from 'craft-ai/lib/onExit';
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

const AGENT_LIGHTBULB = {
  knowledge: {
    presence: {
      player: {
        type: 'boolean'
      },
      occupant: {
        type: 'boolean'
      }
    },
    lightIntensity:  {
      type: 'continuous',
      min: 0,
      max: 2.5
    },
    lightbulbState: {
      type: 'enum_output'
    }
  }
};

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

onExit(() => {
  console.log('Destroying temporary devices before exiting...');
  sami.deleteTemporaryDevices();
});

export default React.createClass({
  updateLight: function(val) {
    return devices.updateLightIntensity(val);
  },
  updateTV: function(val) {
    return devices.updateTVState(val);
  },
  getInitialState: function() {
    return {instance:null, started:false, devices: ActionStore.getInitialState(), failure: false, playerPosition:''}
  },
  componentWillMount: function() {
    this.n = 0;
    new Promise((resolve) => {
      if (!_.isUndefined(__HUE_USER__)) {
        return hue.init()
        .then(res => res.json())
        .then(addr => {
          if (!_.isUndefined(__HUE_BRIDGE_IP__)) {
            hue.bridgeIpAddress = __HUE_BRIDGE_IP__;
            return resolve(getHueUserId());
          }
          else if (_.size(addr) === 0 || _.isUndefined(_.first(addr).internalipaddress)) {
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
            return resolve(getHueUserId());
          }
        })
        .catch(err => {
          console.log('Error at Hue initialization, skipping this step\n', err);
          return resolve()
        });
      }
      else
        return resolve();
    })
    .then(() => new Promise((resolve) => {
      if (!_.isUndefined(__SAMI_CLIENT_ID__)) {
        sami.createDevices()
        .then(() => sami.createListenerWS())
        .then(() => {
          console.log('SAMI initialization succeeded, connected devices are\n', sami.devices);
          return resolve();
        })
        .catch(err => {
          console.log('Error at SAMI initialization, skipping this step\n', err);
          return resolve()
        });
      }
      else
        return resolve();
    }))
    .then(() => craft.createAgent(AGENT_LIGHTBULB))
    .then(agent => {
      this.setState({started: true});
      console.log(`Agent '${agent.id}' successfully created.`);
      craft.agent = agent.id;
      let timestamp = Date.now()/1000;
      let diff = {
        presence: {
          player: false,
          occupant: false
        },
        lightIntensity:  2.5
      }
      return craft.updateAgentContext(craft.agent, {timestamp: timestamp, diff: diff})
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
                <h4 style={{fontWeight:'bolder',marginTop:-50}}>Creating agent...</h4>
              </Col>
            :
              <Col xs={4}>
                <ProgressBar bsStyle='danger' striped now={100} style={{height:40, border:'2px solid #42348B'}} />
                <h4 style={{fontWeight:'bolder',marginTop:-50}}>Agent creation failed...</h4>
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
