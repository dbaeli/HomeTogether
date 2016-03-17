import { EventEmitter } from 'events';
import { is, fromJS } from 'immutable';

import house from './house.json';

export function getInitialState() {
  return fromJS(house);
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
      this.state = nextState;
    }
  }
  setLocationLightBrightness(location, brightness) {
    const nextState = this.state.updateIn(['locations', location, 'light', 'brightness'], () => brightness);
    if (!is(nextState, this.state)) {
      console.log(`Setting ${location} light brightness to ${brightness}.`);
      this.emit('update', nextState);
      this.state = nextState;
    }
  }
  setTvState(val) {
    const nextState = this.state.updateIn(['locations', 'living_room', 'tv'], () => val);
    if (!is(nextState, this.state)) {
      console.log(`Turning ${val ? 'ON' : 'OFF'} the TV.`);
      this.emit('update', nextState);
      this.emit('update_context', nextState);
      this.state = nextState;
    }
  }
  setCharacterLocation(character, location) {
    const nextState = this.state.updateIn(['characters', character], () => location);
    if (!is(nextState, this.state)) {
      console.log(`Moving the ${character} to ${location}.`);
      this.emit('update', nextState);
      this.emit('update_context', nextState);
      this.state = nextState;
    }
  }
  setOutsideLightIntensity(intensity) {
    const nextState = this.state.updateIn(['locations', 'outside', 'lightIntensity'], () => intensity);
    if (!is(nextState, this.state)) {
      console.log(`Setting the outside light intensity to ${intensity}.`);
      this.emit('update', nextState);
      this.emit('update_context', nextState);
      this.state = nextState;
    }
  }
  get(path) {
    return this.state.getIn(path);
  }
}
