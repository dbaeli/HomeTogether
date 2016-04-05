import _ from 'lodash';
import { EventEmitter } from 'events';
import { is, fromJS } from 'immutable';

import house from './house.json';

export function getInitialState() {
  return fromJS(house);
}

export function getCharacterLocation(state, character) {
  const entry = state.findEntry(room => room.get('presence').includes(character));
  return _.isUndefined(entry) ? 'outside' : entry[0];
}

export default class Store extends EventEmitter {
  constructor() {
    super();
    this.state = getInitialState();
  }
  setLocationLightColor(location, color) {
    color = color.toLowerCase();
    const nextState = this.state.setIn([location, 'light', 'color'], color);
    if (!is(nextState, this.state)) {
      console.log(`Setting ${location} light color to ${color}.`);
      this.emit('update', nextState);
      this.emit('update_light_color', nextState, location, color);
      this.state = nextState;
    }
  }
  setLocationLightBrightness(location, brightness) {
    brightness = parseFloat(brightness);
    const nextState = this.state.setIn([location, 'light', 'brightness'], brightness);
    if (!is(nextState, this.state)) {
      console.log(`Setting ${location} light brightness to ${brightness}.`);
      this.emit('update', nextState);
      this.emit('update_light_brightness', nextState, location, brightness);
      this.state = nextState;
    }
  }
  setTvState(val) {
    const nextState = this.state.updateIn(['living_room', 'tv'], () => val);
    if (!is(nextState, this.state)) {
      console.log(`Turning ${val ? 'ON' : 'OFF'} the TV.`);
      this.emit('update', nextState);
      this.emit('update_tv_state', 'living_room', nextState, val);
      this.state = nextState;
    }
  }
  setCharacterLocation(character, location) {
    const previousLocation = getCharacterLocation(this.state, character);
    const nextState = this.state
      .updateIn([previousLocation, 'presence'], presence => presence.filterNot(c => c === character))
      .updateIn([location, 'presence'], presence => presence.push(character));
    if (!is(nextState, this.state)) {
      console.log(`Moving the ${character} to ${location}.`);
      this.emit('update', nextState);
      this.emit('update_presence', nextState, location, nextState.getIn([location, 'presence']));
      this.emit('update_presence', nextState, previousLocation, nextState.getIn([previousLocation, 'presence']));
      this.state = nextState;
    }
  }
  setOutsideLightIntensity(intensity) {
    const nextState = this.state.updateIn(['outside', 'lightIntensity'], () => intensity);
    if (!is(nextState, this.state)) {
      console.log(`Setting the outside light intensity to ${intensity}.`);
      this.emit('update', nextState);
      this.emit('update_light_intensity', nextState, 'outside', intensity);
      this.state = nextState;
    }
  }
  setAgentsId(location, colorAgent, brightnessAgent) {
    const nextState = this.state
      .updateIn([location, 'agent', 'color'], () => colorAgent)
      .updateIn([location, 'agent', 'brightness'], () => brightnessAgent);
    if (!is(nextState, this.state)) {
      console.log(`Setting the agent name for ${location} to '${colorAgent}' (color) and '${brightnessAgent}' (bright).`);
      this.emit('update', nextState);
      this.emit('update_agents', nextState, location, colorAgent, brightnessAgent);
      this.state = nextState;
    }
  }
  getState() {
    return this.state;
  }
}
