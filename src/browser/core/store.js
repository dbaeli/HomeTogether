import { EventEmitter } from 'events';
import { is, fromJS } from 'immutable';

import house from './house.json';

export function getInitialState() {
  return fromJS(house);
}

export function getPresence(state, location) {
  return state.get('characters').reduce((presence, characterLocation, character) => {
    if (characterLocation === location) {
      presence.push(character);
    }
    return presence;
  },
  []);
}

export default class Store extends EventEmitter {
  constructor() {
    super();
    this.state = getInitialState();
  }
  setLocationLightColor(location, color) {
    color = color.toLowerCase();
    const nextState = this.state.updateIn(['locations', location, 'light', 'color'], () => color);
    if (!is(nextState, this.state)) {
      console.log(`Setting ${location} light color to ${color}.`);
      this.emit('update', nextState);
      this.emit('update_light_color', nextState, location, color);
      this.state = nextState;
    }
  }
  setLocationLightBrightness(location, brightness) {
    const nextState = this.state.updateIn(['locations', location, 'light', 'brightness'], () => brightness);
    if (!is(nextState, this.state)) {
      console.log(`Setting ${location} light brightness to ${brightness}.`);
      this.emit('update', nextState);
      this.emit('update_light_brightness', nextState, location, brightness);
      this.state = nextState;
    }
  }
  setTvState(val) {
    const nextState = this.state.updateIn(['locations', 'living_room', 'tv'], () => val);
    if (!is(nextState, this.state)) {
      console.log(`Turning ${val ? 'ON' : 'OFF'} the TV.`);
      this.emit('update', nextState);
      this.emit('update_tv_state', 'living_room', nextState, val);
      this.state = nextState;
    }
  }
  setCharacterLocation(character, location) {
    const previousLocation = this.state.getIn(['characters', character]);
    const nextState = this.state.updateIn(['characters', character], () => location);
    if (!is(nextState, this.state)) {
      console.log(`Moving the ${character} to ${location}.`);
      this.emit('update', nextState);
      this.emit('update_presence', nextState, location, getPresence(nextState, location));
      this.emit('update_presence', nextState, previousLocation, getPresence(nextState, previousLocation));
      this.state = nextState;
    }
  }
  setOutsideLightIntensity(intensity) {
    const nextState = this.state.updateIn(['locations', 'outside', 'lightIntensity'], () => intensity);
    if (!is(nextState, this.state)) {
      console.log(`Setting the outside light intensity to ${intensity}.`);
      this.emit('update', nextState);
      this.emit('update_light_intensity', nextState, 'outside', intensity);
      this.state = nextState;
    }
  }
  getState() {
    return this.state;
  }
}
