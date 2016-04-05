import { createCraftAgent, updateCraftAgentContext, getCraftAgentDecision } from './craft-ai';
import _ from 'lodash';

const BRIGHTNESS_AGENT_MODEL = require('./brightnessModel.json');
const COLOR_AGENT_MODEL = require('./colorModel.json');
const INITIAL_BRIGHTNESS_HISTORY = require('./initialBrightnessHistory.json');
const INITIAL_COLOR_HISTORY = require('./initialColorHistory.json');

function timestamp() {
  return Math.floor(Date.now()/1000);
}

function strFromPresence(presence) {
  if (presence.size == 0) {
    return 'none';
  }
  else {
    return presence.sort().join('+');
  }
}

export default function startAutomation(store) {
  // Extract the room having a light
  const enlightenedRooms = store.getState().filter(location => location.has('light')).keySeq();
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

        // Providing the agent ids to the store.
        store.setAgentsId(roomName, agents[roomName].color, agents[roomName].brightness);
      })
      .catch(err => console.log(`Error while creating agent for ${roomName}`, err))
    ).toJSON()
  );

  let sendAgentsContextHistory = () => {
    console.log('Sending agent context history...');
    return Promise.all(
      enlightenedRooms.map((roomName) => {
        const brightnessHistoryLength = agents[roomName].brightnessHistory.length;
        const colorHistoryLength = agents[roomName].colorHistory.length;
        let promises = [];
        if (brightnessHistoryLength > 0) {
          promises.push(
            updateCraftAgentContext(agents[roomName].brightness, agents[roomName].brightnessHistory)
            .then(() => agents[roomName].brightnessHistory = _.drop(agents[roomName].brightnessHistory, brightnessHistoryLength)));
        }
        if (colorHistoryLength > 0) {
          promises.push(
            updateCraftAgentContext(agents[roomName].color, agents[roomName].colorHistory)
            .then(() => agents[roomName].colorHistory = _.drop(agents[roomName].colorHistory, colorHistoryLength)));
        }
        return Promise.all(promises)
          .catch(err => console.log(`Error while updating the context history for ${roomName}`, err));
      }).toJSON()
    );
  };

  let takeDecisions = (state, rooms) => {
    console.log(`Taking a decision for rooms ${rooms.join(', ')}...`);
    return Promise.all(_.map(rooms, (roomName) =>
      Promise.all([
        getCraftAgentDecision(agents[roomName].brightness, {
          presence: strFromPresence(state.getIn([roomName, 'presence'])),
          lightIntensity: state.getIn(['outside', 'lightIntensity'])
        }, timestamp()),
        getCraftAgentDecision(agents[roomName].color, {
          presence: strFromPresence(state.getIn([roomName, 'presence'])),
          lightIntensity: state.getIn(['outside', 'lightIntensity'])
        }, timestamp())
      ])
      .then(([brightnessDecision, colorDecision]) => {
        store.setLocationLightBrightness(roomName, brightnessDecision.decision.lightbulbBrightness);
        store.setLocationLightColor(roomName, colorDecision.decision.lightbulbColor);
      })
      .catch(err => console.log(`Error while taking decision for ${roomName}`, err))
    ));
  };

  // Let's create the agents
  return createAgents()
  .then(() => sendAgentsContextHistory())
  .then(() => {
    console.log('Learning initialization done!');
    takeDecisions(store.getState(), enlightenedRooms.toJSON());
    store.on('update_light_color', (state, location, color) => {
      if (_.has(agents, location)) {
        agents[location].colorHistory.push({
          timestamp: timestamp(),
          diff: {
            lightbulbColor: color
          }
        });
      }
    });
    store.on('update_light_brightness', (state, location, brightness) => {
      if (_.has(agents, location)) {
        agents[location].brightnessHistory.push({
          timestamp: timestamp(),
          diff: {
            lightbulbBrightness: `${brightness}`
          }
        });
      }
    });
    store.on('update_tv_state', (state, location, tvState) => {
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
    store.on('update_presence', (state, location, presence) => {
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
    store.on('update_light_intensity', (state, location, intensity) => {
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
