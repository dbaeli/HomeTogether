import { EventEmitter } from 'events';
import { is, fromJS, List } from 'immutable';

import house from './house.json';

export function getInitialState() {
  return fromJS(house);
}

export function getCharacterLocation(state, character) {
  return state.findEntry(room => room.has('presence') && room.get('presence').includes(character))[0];
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
      .updateIn([location, 'presence'], presence => (presence || new List()).push(character));
    if (!is(nextState, this.state)) {
      console.log(`Moving the ${character} to ${location}.`);
      this.emit('update', nextState);
      this.emit('update_presence', nextState, location, nextState.getIn([location, 'presence']) || new List());
      this.emit('update_presence', nextState, previousLocation, nextState.getIn([previousLocation, 'presence']) || new List());
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
  getState() {
    return this.state;
  }
}
