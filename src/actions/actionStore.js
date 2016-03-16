import Reflux from 'reflux';
import _ from 'lodash';
import sami from '../lib/sami/samiHelper';
import craft from '../lib/craft-ai/craft-ai';

export const devices = {
  updateLights : Reflux.createAction(),
  updateLightIntensity : Reflux.createAction(),
  updatePresence : Reflux.createAction(),
  updateTVState : Reflux.createAction()
};

let initPres = {};
let lightBulbs = {};
_.map(['0', '1', '2', '3', '4', '5'], val =>{
  initPres[val]='';
  lightBulbs[val]={color: '#000000', brightness: 0.0, power: 'off'};
});

export let ActionStore = Reflux.createStore({
  listenables: devices,
  settings: {lights:lightBulbs, devices: {tv: {power: false}, light_sensor1: {state: 2.5}, presence: initPres}},

  onUpdateLights: function(id, color, brightness, power) {
    this.settings.lights[id]={color: color, brightness: brightness, power: power};
    let ts = Date.now()/1000;
    Promise.all(
      _.map(_.range(6), v => Promise.all(
        _.map(['brightness', 'color'], a => craft.updateAgentContext(craft.agents[[a,v].join('')], {timestamp: ts, diff: {lightbulbBrightness: brightness, lightbulbColor: color}}))
      ))
    );
    this.trigger(this.settings);
  },
  onUpdateLightIntensity: function(val) {
    if (!_.isUndefined(__SAMI_CLIENT_ID__) && !_.isUndefined(sami.devices.light_sensor1.ID))
      sami.sendMessageToDevice('light_sensor1', {state: val});
    let ts = Date.now()/1000;
    this.settings.devices.light_sensor1.state = val;
    Promise.all(
      _.map(_.range(6), v => Promise.all(
        _.map(['brightness', 'color'], a => craft.updateAgentContext(craft.agents[[a,v].join('')], {timestamp: ts, diff: {lightIntensity: val}}))
      ))
    );
    this.trigger(this.settings);
  },
  onUpdatePresence: function(entity, id) {
    if (!_.isUndefined(__SAMI_CLIENT_ID__) && !_.isUndefined(sami.devices.presence.ID)) {
      let res = {};
      res[entity]=id;
      sami.sendMessageToDevice('presence', res);
    }
    let presence = _.reduce(this.settings.devices.presence, (res, val, key) => {
      let names = _.words(val);
      if (key === id)
        names.push(entity);
      else
        _.pull(names, entity);
      res[key] =_.sortBy(names).join(' & ');
      return res;
    }, {});
    let hasChanged = _.map(_.range(6), v => {
      if (_.isEqual(presence[v], this.settings.devices.presence[v]))
        return false;
      return true;
    });
    console.log('hasChanged', hasChanged);
    this.settings.devices.presence = presence;
    let ts = Date.now()/1000;
    Promise.all(
      _.map(_.range(6), v => Promise.all(
        _.map(['brightness', 'color'], a => {
          if (hasChanged[v])
            return craft.updateAgentContext(craft.agents[[a,v].join('')], {timestamp: ts, diff: {presence: this.settings.devices.presence[v]}})
          return
        })
      ))
    );
    this.trigger(this.settings);
  },
  onUpdateTVState: function(val) {
    if (!_.isUndefined(__SAMI_CLIENT_ID__) && !_.isUndefined(sami.devices.tv.ID))
      sami.sendMessageToDevice('tv', {power: val});
    this.settings.devices.tv.power = val;
    this.trigger(this.settings);
  },
  getPresence: function(id) {
    return this.settings.devices.presence[id];
  },
  getLightState: function(id) {
    return this.settings.lights[id];
  },
  getTVState: function() {
    return this.settings.devices.tv.power;
  },
  getPlayerLocation: function() {
    let loc = _.findKey(this.settings.devices.presence, val => _.includes(_.words(val), 'player')) || '';
    return loc;
  },
  getLightIntensity: function() {
    return this.settings.devices.light_sensor1.state;
  },
  getInitialState: function() {
    _.forEach(this.settings.devices, (val, key) => {sami.devices[key].data = val});
    _.forEach(this.settings.lights, (val, key) => {sami.devices['light_bulb_'+key].data = val});
    return this.settings;    
  }
});