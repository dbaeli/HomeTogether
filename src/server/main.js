import bodyParser from 'body-parser';
import devices from './devices';
import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
import { createLight, createTv, createPresenceDetector, createLightSensor } from './backend/devices';
import createSimulatedBackend from './backend/simulated';

var config = require('../webpack.config');

dotenv.load();

const FRONT_PORT = process.env.CRAFT_HOME_TOGETHER_PORT || 4444;

let compiler = webpack(config);
let app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

if (process.env.NODE_ENV !== 'production') {
  app.use(webpackDevMiddleware(compiler, {
    historyApiFallback: true,
    stats: {
      colors: true
    }
  }));
}

app.use(express.static(path.join(__dirname, 'static')));

// Let's create some backends
let simulatedBackend = createSimulatedBackend([
  createPresenceDetector('living_room+presence'),
  createLight('living_room+light'),
  createTv('living_room+tv'),
  createPresenceDetector('dining_room+presence'),
  createLight('dining_room+light'),
  createPresenceDetector('corridor+presence'),
  createLight('corridor+light'),
  createPresenceDetector('bathroom+presence'),
  createLight('bathroom+light'),
  createPresenceDetector('water_closet+presence'),
  createLight('water_closet+light'),
  createPresenceDetector('bedroom+presence'),
  createLight('bedroom+light'),
  createPresenceDetector('outside+presence'),
  createLightSensor('outside+lightSensor')
]);

app.use('/devices', devices([simulatedBackend]));

let server = app.listen(FRONT_PORT, () => {
  let port = server.address().port;
  console.log(`Listening to http://localhost:${port}`);
});
