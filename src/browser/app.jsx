import { Grid, Row, Col } from 'react-bootstrap';
import FloorMap from './components/floorMap';
import Lights from './components/lights';
import Occupant from './components/occupant';
import Player from './components/player';
import DayAndNight from './components/dayAndNight';
import ColorPicker from './components/colorPicker';
import React from 'react';
import { getInitialState } from './core/store';

import 'font-awesome/css/font-awesome.min.css';

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
    const tvState = this.state.house.getIn(['locations', 'living_room', 'tv']);
    const playerLocation = this.state.house.getIn(['characters', 'player']);
    const occupantLocation = this.state.house.getIn(['characters', 'occupant']);
    const lights = this.state.house.getIn(['locations'])
    .filter(location => location.has('light'))
    .map(location => ({
      color: location.getIn(['light', 'color']),
      brightness: location.getIn(['light', 'brightness']),
      simulated: true
    })).toJSON();
    const playerLocationLight = lights[playerLocation];
    const outsideLightIntensity = this.state.house.getIn(['locations', 'outside', 'lightIntensity']);
    return (
      <Grid>
        <Row>
          <Col sm={12}>
            <FloorMap
              tv={tvState}
              onUpdateTV={val => this.props.store.setTvState(val)}
              onMovePlayer={location => this.props.store.setCharacterLocation('player', location)} />
            <Player location={playerLocation} />
            <Occupant location={occupantLocation} />
            <Lights lights={lights} />
          </Col>
        </Row>
        <Row style={{marginTop:'20px'}}>
          <Col sm={12}>
            <DayAndNight
              style={{marginTop:'10px'}}
              light={outsideLightIntensity}
              onUpdateLight={(val) => this.props.store.setOutsideLightIntensity(val)}/>
            {
              playerLocationLight && playerLocationLight.simulated ?
              (
                <ColorPicker
                  label={playerLocation}
                  color={playerLocationLight.color}
                  brightness={playerLocationLight.brightness}
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
