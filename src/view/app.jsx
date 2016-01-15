import React from 'react';
import _ from 'lodash';

import craftai from 'craft-ai';
import {actionTable,setCurrentInstance} from '../actions/actions';
import {ActionStore,devices} from '../actions/actionStore';
import FloorMap from './components/floorMap';
import Occupant from './components/occupant';
import ChatHistory from './components/chatHistory';
import { Input, Button, Grid, Row, Col, ProgressBar } from 'react-bootstrap';
import Light from './components/light';
import ColorPicker from './components/colorPicker';
import Reflux from 'reflux';
import DayAndNight from './components/dayAndNight';

import HomeK from '../knowledge/home.json';
import RoomK from '../knowledge/room.json';
import OccupantK from '../knowledge/occupant.json';

let craftConf = {
  owner: __CRAFT_PROJECT_OWNER__,
  name: __CRAFT_PROJECT_NAME__,
  version: __CRAFT_PROJECT_VERSION__,
  appId: __CRAFT_APP_ID__,
  appSecret: __CRAFT_APP_SECRET__,
};

function registerActions(instance) {
  return Promise.all(
    _.map(actionTable, (obj, key)=>{
      return instance.registerAction(key, obj.start, obj.cancel);
    })
  );
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
    return {instance:null, started:false, devices: ActionStore.getInitialState(), failure: false, showModal:true, appSecret:'', appID:'', ghUser:'', ghProject:'', ghBranch:''}
  },
  componentWillMount: function() {
    let url = window.location.search.substring(1);
    if (url.substr(-1) === '/') {
      url = url.substr(0, url.length - 1);
    }
    let vars = url.split('&');
    let owner='';
    let repo='';
    let branch='';
    let id='';
    let secret=''
    for( let i = 0; i < vars.length; ++i ){
      let pair = vars[i].split('=');
      if (pair[0] === 'owner' )
        owner=pair[1];
      if (pair[0] === 'project' )
        repo=pair[1];
      if (pair[0] === 'branch' )
        branch=pair[1];
      if (pair[0] === 'appid' )
        id=pair[1];
      if (pair[0] === 'appsecret' )
        secret=pair[1];
    }
    this.setState({ ready: false, ghUser:owner, ghProject:repo, ghBranch:branch, appSecret:secret, appID:id });
  },
  start:function() {
    this.n = 0;

    if( this.state.ghUser !== '' 
      &&this.state.ghProject !== ''
      &&this.state.ghBranch !== ''
      &&this.state.appID !== ''
      &&this.state.appSecret !== ''){
      craftConf.owner = this.state.ghUser;
      craftConf.name = this.state.ghProject;
      craftConf.version = this.state.ghBranch;
      craftConf.appId = this.state.appID;
      craftConf.appSecret = this.state.appSecret;
    }
    else {
      history.pushState(undefined, undefined, window.location.origin + window.location.pathname 
      + '?owner=' + this.state.ghUser 
      + '&project=' + this.state.ghProject 
      + '&branch=' + this.state.ghBranch 
      + '&appid=' + this.state.appID 
      + '&appsecret=' + this.state.appSecret);
    }
    this.setState({ showModal: false });
    craftai(craftConf)
    .then(instance => {
      this.setState( {instance: instance} );
      setCurrentInstance(instance);
    })
    .then(() => this.state.instance.updateInstanceKnowledge(OccupantK))
    .then(() => this.state.instance.createAgent('src/decision/Home.bt', HomeK))
    .then(() => this.state.instance.createAgent('src/decision/rooms/LivingRoom.bt', _.assign(RoomK, {roomLightId: (!_.isUndefined(__LIFX_BULB_0__) ? __LIFX_BULB_0__ : '')})))
    .then(() => this.state.instance.createAgent('src/decision/rooms/DiningRoom.bt', _.assign(RoomK, {roomLightId: (!_.isUndefined(__LIFX_BULB_1__) ? __LIFX_BULB_1__ : '')})))
    .then(() => this.state.instance.createAgent('src/decision/rooms/Corridor.bt', _.assign(RoomK, {roomLightId: (!_.isUndefined(__LIFX_BULB_2__) ? __LIFX_BULB_2__ : '')})))
    .then(() => this.state.instance.createAgent('src/decision/rooms/Bathroom.bt', _.assign(RoomK, {roomLightId: (!_.isUndefined(__LIFX_BULB_3__) ? __LIFX_BULB_3__ : '')})))
    .then(() => this.state.instance.createAgent('src/decision/rooms/WaterCloset.bt',_.assign(RoomK, {roomLightId: (!_.isUndefined(__LIFX_BULB_4__) ? __LIFX_BULB_4__ : '')})))
    .then(() => this.state.instance.createAgent('src/decision/rooms/Bedroom.bt', _.assign(RoomK, {roomLightId: (!_.isUndefined(__LIFX_BULB_5__) ? __LIFX_BULB_5__ : '')})))
    .then(() => registerActions(this.state.instance))
    .then(() => {
      this.state.instance.update(10);
      this.setState({started: true});
    })
    .catch((err) => {
      console.log('Unexpected error:', err);
      this.setState({failure: true, showModal: true});
    });
  },
  render: function() {
    if(this.state.showModal)
      return (
        <Grid>
          <Row>
            <h2><img src='favicons/craft-ai.gif'/>&nbsp;craft ai - Home Together&nbsp;demo</h2>
          </Row>
          <center><p className='small'>If you want to use the default BTs, just leave all fields blank</p></center>
          <center><Button bsStyle='info' bsSize='large' onClick={this.start}>Start Instance</Button></center>
          <br/>
          <Row>
            <Col xs={12} style={{backgroundColor:'#F0F8FF'}} >
              <br/>
              <p>In order to run this demo with your own BTs, you need to fork <a href='https://github.com/craft-ai/demo.HomeTogether' target='_blank'>this</a> repository with your GitHub account</p>
              <p>If you do not have a GitHub account, sign up for one <a href='https://github.com'  target='_blank'>here</a></p> 
              <p>Then using <a href='https://workbench.craft.ai' target='_blank'>craft ai workbench</a>, you need to retrieve your appID/appSecret for this fork by editing the craft_project.json</p>
              <center><img src='favicons/workbench.png' width='600px'/></center>
              <br/>
            </Col>
          </Row>
          <Row>
            <br/><br/><br/>
            <Input ref='inputUser' type='text' label='GitHub user' onChange={()=>{this.setState({ghUser:this.refs.inputUser.getValue()})}} value={this.state.ghUser} placeholder='Github user account that have forked the repository'/>
            <Input ref='inputRepo' type='text' label='GitHub repository' onChange={()=>{this.setState({ghProject:this.refs.inputRepo.getValue()})}} value={this.state.ghProject} placeholder='Name of the github fork repository'/>
            <Input ref='inputBranch' type='text' label='GitHub branch' onChange={()=>{this.setState({ghBranch:this.refs.inputBranch.getValue()})}} value={this.state.ghBranch} placeholder='Which branch (master)'/>
            <Input ref='inputID' type='text' label='craft ai AppID' onChange={()=>{this.setState({appID:this.refs.inputID.getValue()})}} value={this.state.appID} placeholder='Your craft ai app ID, can be found in craft_project.json from workbench.craft.ai'/>
            <Input ref='inputSecret' type='text' label='craft ai AppSecret' onChange={()=>{this.setState({appSecret:this.refs.inputSecret.getValue()})}} value={this.state.appSecret} placeholder='Your craft ai app Secret, can be found in craft_project.json from workbench.craft.ai'/>
            <center><Button bsStyle='info' onClick={this.start}>Start Instance</Button></center>
          </Row>
        </Grid>
      );
    else if(this.state.started === false)
      return (
        <Grid style={{textAlign:'center', marginTop:'50px'}}>
          <Row style={{height:90}}>
            <h3><img src='favicons/craft-ai.gif'/><span style={{verticalAlign:'middle'}}>&nbsp;craft ai - CES&nbsp;demo</span></h3>
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
              <DayAndNight onUpdateLightIntensity={(val) => this.updateLight(val)}/>
              <ColorPicker />
            </Col>
          </Row>
        </Grid>
      );
  }
});
