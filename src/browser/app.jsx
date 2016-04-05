import _ from 'lodash';
import { CRAFT_TOKEN, CRAFT_URL, OWNER } from './constants';
import { getInitialState, getCharacterLocation } from './core/store';
import { Grid, Row, Col } from 'react-bootstrap';
import ColorPicker from './components/colorPicker';
import DayAndNight from './components/dayAndNight';
import FloorMap from './components/floorMap';
import Lights from './components/lights';
import Occupant from './components/occupant';
import Player from './components/player';
import React from 'react';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/css/bootstrap-theme.min.css';
import 'font-awesome/css/font-awesome.min.css';

function createAgentInspectorUrl(agent) {
  if (_.isUndefined(agent)) {
    return undefined;
  }
  else {
    return `${CRAFT_URL}/inspector?owner=${OWNER}&agent=${agent}&token=${CRAFT_TOKEN}`;
  }
}

export default React.createClass({
  getInitialState: function() {
    return {
      house: getInitialState()
    };
  },
  componentWillMount: function() {
    this.storeListener = state => {
      this.setState({
        house: state
      });
    };
    this.props.store.addListener('update', this.storeListener);
  },
  componentWillUnmount: function() {
    this.props.store.removeListener('update', this.storeListener);
    this.storeListener = undefined;
  },
  render: function() {
    const tvState = this.state.house.getIn(['living_room', 'tv']);
    const playerLocation = getCharacterLocation(this.state.house, 'player');
    const occupantLocation = getCharacterLocation(this.state.house, 'occupant');
    const lights = this.state.house
    .filter(location => location.has('light'))
    .map(location => ({
      color: location.getIn(['light', 'color']),
      brightness: location.getIn(['light', 'brightness']),
      visible: true
    })).toJSON();
    const playerLocationLight = lights[playerLocation];
    const outsideLightIntensity = this.state.house.getIn(['outside', 'lightIntensity']);
    const colorAgentUrl = createAgentInspectorUrl(this.state.house.getIn([playerLocation, 'agent', 'color']));
    const brightnessAgentUrl =  createAgentInspectorUrl(this.state.house.getIn([playerLocation, 'agent', 'brightness']));
    return (
      <Grid>
        <Row>
          <Col xs={12} lg={8}>
            <FloorMap
              tv={tvState}
              onUpdateTV={val => this.props.store.setTvState(val)}
              onMovePlayer={location => this.props.store.setCharacterLocation('player', location)} />
            <Player location={playerLocation} />
            <Occupant location={occupantLocation} />
            <Lights lights={lights} />
          </Col>
          <Col xs={12} lg={4} style={{paddingTop:'100px', paddingBottom:'100px'}}>
            <DayAndNight
              light={outsideLightIntensity}
              onUpdateLight={(val) => this.props.store.setOutsideLightIntensity(val)}/>
            {
              playerLocationLight && playerLocationLight.visible ?
              (
                <ColorPicker
                  label={playerLocation}
                  color={playerLocationLight.color}
                  brightness={playerLocationLight.brightness}
                  colorAgentUrl={colorAgentUrl}
                  brightnessAgentUrl={brightnessAgentUrl}
                  onUpdateColor={color => this.props.store.setLocationLightColor(playerLocation, color)}
                  onUpdateBrightness={brightness => this.props.store.setLocationLightBrightness(playerLocation, brightness)}/>
              ) : (
                void 0
              )
            }

          </Col>
        </Row>
      </Grid>
    );
  }
});
