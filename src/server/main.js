import bodyParser from 'body-parser';
import devices from './devices';
import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
import createSimulatedBackend from './backend/simulated';
import createHueBackend from './backend/hue';

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
let simulatedBackend = createSimulatedBackend();
let hueBackend = createHueBackend();

app.use('/devices', devices([hueBackend, simulatedBackend]));

let server = app.listen(FRONT_PORT, () => {
  let port = server.address().port;
  console.log(`Listening to http://localhost:${port}`);
});
