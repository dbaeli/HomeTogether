import React from 'react';
import _ from 'lodash';

import craftai from 'craft-ai';
import {actionTable,setCurrentInstance} from '../actions/actions';
import {ActionStore,devices} from '../actions/actionStore';
import FloorMap from './components/floorMap';
import Occupant from './components/occupant';
import ChatHistory from './components/chatHistory';
import { Grid, Row, Col, ProgressBar } from 'react-bootstrap';
import Light from './components/light';
import ColorPicker from './components/colorPicker';
import Reflux from 'reflux';
import DayAndNight from './components/dayAndNight';
import Webcam from './components/webcam';

import HomeK from '../knowledge/home.json';
import RoomK from '../knowledge/room.json';
import OccupantK from '../knowledge/occupant.json';

let craftConf = {
  owner: __CRAFT_PROJECT_OWNER__,
  name: __CRAFT_PROJECT_NAME__,
  version: __CRAFT_PROJECT_VERSION__,
  appId: __CRAFT_APP_ID__,
  appSecret: __CRAFT_APP_SECRET__,
  httpApiUrl: 'https://api.craft.ai/v1',
  wsApiUrl: 'wss://api.craft.ai/v1',
  hubApiUrl:'https://api.craft.ai/v1'
};

function registerActions(instance) {
  return Promise.all(
    _.map(actionTable, (obj, key)=>{
      return instance.registerAction(key, obj.start, obj.cancel);
    })
  );
}

export default React.createClass({
  updateNight: function(val) {
    return Promise.all(
      _.map([0,1,2,3,4,5,6], a => this.state.instance.updateAgentKnowledge(a, {outsideLightIntensity: {value:val}}, 'merge'))
    )
  },
  updateTV: function(val) {
    devices.updateTVState(val);
    return this.state.instance.updateInstanceKnowledge( {tvState:val}, 'merge' );
  },
  getInitialState: function() {
    return {instance:null, started:false, devices: ActionStore.getInitialState(), streaming: false, failure: false}
  },
  componentWillMount() {
    this.n = -50;

    (() => {
      if (_.isUndefined(navigator) ||
          _.isUndefined(navigator.mediaDevices) ||
          _.isUndefined(navigator.mediaDevices.enumerateDevices) ||
          _.isUndefined(navigator.mediaDevices.getUserMedia) // Accessed by navigator.mediaDevices.enumerateDevices
      ) {
        console.log("Unable to access media devices, not using the webcam for luminosity");
        return new Promise(resolve => resolve([]));
      }
      else {
        return navigator.mediaDevices.enumerateDevices();
      }
    })()
    .then(devices => {
      if (_.some(devices, item => item.kind === 'videoinput'))
        this.setState({streaming: true});
      else
        this.forceUpdate();
      return craftai(craftConf);
    })
    .then(instance => {
      this.setState( {instance: instance} ) ;
      setCurrentInstance(instance);
    })
    .then(() => this.state.instance.updateInstanceKnowledge(OccupantK))
    .then(() => this.state.instance.createAgent('src/decision/Home.bt', HomeK))
    .then(agent =>  {
      this.agentId = agent.id;
      this.state.instance.createAgent('src/decision/rooms/LivingRoom.bt', RoomK);
    })
    .then(() => this.state.instance.createAgent('src/decision/rooms/DiningRoom.bt', RoomK))
    .then(() => this.state.instance.createAgent('src/decision/rooms/Corridor.bt', RoomK))
    .then(() => this.state.instance.createAgent('src/decision/rooms/Bathroom.bt', RoomK))
    .then(() => this.state.instance.createAgent('src/decision/rooms/WaterCloset.bt',RoomK))
    .then(() => this.state.instance.createAgent('src/decision/rooms/Bedroom.bt', RoomK))
    .then(() => registerActions(this.state.instance))
    .then(() => {
      this.state.instance.update(1);
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
            <h3><img src='./favicons/craft-ai.gif'/><span style={{verticalAlign:'middle'}}>&nbsp;craft ai - CES&nbsp;demo</span></h3>
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
            <Col xs={7}>
              <FloorMap onUpdateTV={(val)=>this.updateTV(val)} onUpdateLocation={(location) => devices.updatePresence('player', location)}/>
              <Occupant onUpdateLocation={(location) => devices.updatePresence('occupant', location)}/>
              <Light/>
            </Col>
            <Col xs={5}>
              <ChatHistory id='hist' placeholder='No message...' instance={this.state.instance}/>
              <DayAndNight streaming={this.state.streaming} onUpdateNight={(val) => this.updateNight(val)}/>
              <ColorPicker />
            </Col>
          </Row>
        </Grid>
      );
  }
});
