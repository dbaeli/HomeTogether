import _ from 'lodash';
import auth from './auth';
import bodyParser from 'body-parser';
import createHueBackend from './backend/hue';
import createSamiBackend from './backend/sami';
import createSimulatedBackend from './backend/simulated';
import devices from './devices';
import dotenv from 'dotenv';
import express from 'express';
import morgan from 'morgan';
import path from 'path';
import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';

var config = require('../webpack.config');

dotenv.load();

const FRONT_PORT = process.env.CRAFT_HOME_TOGETHER_PORT || 4444;

let compiler = webpack(config);
let app = express();

app.use(morgan('dev'));

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

let backends = [createSimulatedBackend()];

// Let's create some backends
if (!_.isUndefined(process.env.HUE_USER)) {
  backends = [createHueBackend()].concat(backends);
}
if (!_.isUndefined(process.env.SAMI_USER)) {
  backends = [createSamiBackend()].concat(backends);
}

app.use('/auth', auth(backends));
app.use('/devices', devices(backends));

let server = app.listen(FRONT_PORT, () => {
  let port = server.address().port;
  console.log(`Listening to http://localhost:${port}`);
});
