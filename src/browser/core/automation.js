import { createCraftAgent, updateCraftAgentContext, getCraftAgentDecision } from './craft-ai';
import _ from 'lodash';
import { getPresence } from './store';

const BRIGHTNESS_AGENT_MODEL = {
  knowledge: {
    presence: {
      type: 'enum'
    },
    lightIntensity:  {
      type: 'continuous',
      min: 0,
      max: 2.5
    },
    lightbulbBrightness: {
      type: 'enum_output'
    }
  }
};

const COLOR_AGENT_MODEL = {
  knowledge: {
    presence: {
      type: 'enum'
    },
    lightIntensity:  {
      type: 'continuous',
      min: 0,
      max: 2.5
    },
    lightbulbColor: {
      type: 'enum_output'
    }
  }
};

const INITIAL_BRIGHTNESS_HISTORY = require('./initialBrightnessHistory.json');
const INITIAL_COLOR_HISTORY = require('./initialColorHistory.json');

function timestamp() {
  return Math.floor(Date.now()/1000);
}

function strFromPresence(presence) {
  if (presence.length == 0) {
    return 'none';
  }
  else {
    return presence.join('+');
  }
}

export default function startAutomation(store) {
  // Extract the room having a light
  const enlightenedRooms = store.getState().getIn(['locations']).filter(location => location.has('light')).keySeq();
  // Initialize the agents list
  const brightnessHistory = _.map(
    INITIAL_BRIGHTNESS_HISTORY,
    sample => {
      _.set(sample, 'timestamp', timestamp() + sample.timestamp);
      return sample;
    }
  );
  const colorHistory = _.map(
    INITIAL_COLOR_HISTORY,
    sample => {
      _.set(sample, 'timestamp', timestamp() + sample.timestamp);
      return sample;
    }
  );
  let agents = enlightenedRooms.reduce((agents, roomName) => {
    agents[roomName] = {
      brightness: null,
      color: null,
      brightnessHistory: brightnessHistory,
      colorHistory:colorHistory
    };
    return agents;
  },
  {});

  let createAgents = () => Promise.all(
    enlightenedRooms.map((roomName) =>
      createCraftAgent(BRIGHTNESS_AGENT_MODEL)
      .then(agent => {
        console.log(`Agent ${agent.id} created for ${roomName} brightness`);
        agents[roomName].brightness = agent.id;
      })
      .then(() => createCraftAgent(COLOR_AGENT_MODEL))
      .then(agent => {
        console.log(`Agent ${agent.id} created for ${roomName} color`);
        agents[roomName].color = agent.id;
      })
      .catch(err => console.log(`Error while creating agent for ${roomName}`, err))
    ).toJSON()
  );

  let sendAgentsContextHistory = () => {
    console.log('Sending agent context history...');
    return Promise.all(
      enlightenedRooms.map((roomName) =>
        agents[roomName].brightnessHistory.length && updateCraftAgentContext(agents[roomName].brightness, agents[roomName].brightnessHistory)
        .then(() => agents[roomName].brightnessHistory = [])
        .then(() => agents[roomName].colorHistory.length && updateCraftAgentContext(agents[roomName].color, agents[roomName].colorHistory))
        .then(() => agents[roomName].colorHistory = [])
        .catch(err => console.log(`Error while updating the context history for ${roomName}`, err))
      ).toJSON()
    );
  };

  let takeDecisions = (state, rooms) => {
    console.log(`Taking a decision for rooms ${rooms.join(', ')}...`);
    return Promise.all(_.map(rooms, (roomName) =>
      getCraftAgentDecision(agents[roomName].brightness, {
        presence: strFromPresence(getPresence(state, roomName)),
        lightIntensity: state.getIn(['locations', 'outside', 'lightIntensity'])
      }, timestamp())
      .then((brightnessDecision) => {
        store.setLocationLightBrightness(roomName, brightnessDecision.output.result);
      })
      .then(() => getCraftAgentDecision(agents[roomName].color, {
        presence: strFromPresence(getPresence(state, roomName)),
        lightIntensity: state.getIn(['locations', 'outside', 'lightIntensity'])
      }, timestamp()))
      .then((colorDecision) => {
        store.setLocationLightColor(roomName, colorDecision.output.result);
      })
      .catch(err => console.log(`Error while taking decision for ${roomName}`, err))
    ));
  };

  // Let's create the agents
  return createAgents()
  .then(() => sendAgentsContextHistory())
  .then(() => {
    console.log('learning initialization done!');
    takeDecisions(store.getState(), enlightenedRooms.toJSON());
    store.addListener('update_light_color', (state, location, color) => {
      if (_.has(agents, location)) {
        agents[location].colorHistory.push({
          timestamp: timestamp(),
          diff: {
            lightbulbColor: color
          }
        });
      }
    });
    store.addListener('update_light_brightness', (state, location, brightness) => {
      if (_.has(agents, location)) {
        agents[location].brightnessHistory.push({
          timestamp: timestamp(),
          diff: {
            lightbulbBrightness: brightness
          }
        });
      }
    });
    store.addListener('update_tv_state', (state, location, tvState) => {
      if (_.has(agents, location)) {
        agents[location].brightnessHistory.push({
          timestamp: timestamp(),
          diff: {
            tv: state
          }
        });
        agents[location].colorHistory.push({
          timestamp: timestamp(),
          diff: {
            tv: state
          }
        });
        takeDecisions(state, [location]);
      }
    });
    store.addListener('update_presence', (state, location, presence) => {
      if (_.has(agents, location)) {
        agents[location].brightnessHistory.push({
          timestamp: timestamp(),
          diff: {
            presence: strFromPresence(presence)
          }
        });
        agents[location].colorHistory.push({
          timestamp: timestamp(),
          diff: {
            presence: strFromPresence(presence)
          }
        });
        takeDecisions(state, [location]);
      }
    });
    store.addListener('update_light_intensity', (state, location, intensity) => {
      _.forEach(enlightenedRooms.toJSON(), roomName => {
        agents[roomName].brightnessHistory.push({
          timestamp: timestamp(),
          diff: {
            lightIntensity: intensity
          }
        });
        agents[roomName].colorHistory.push({
          timestamp: timestamp(),
          diff: {
            lightIntensity: intensity
          }
        });
      });
      takeDecisions(state, enlightenedRooms.toJSON());
    });
    setInterval(sendAgentsContextHistory, 5000);
  });
}
