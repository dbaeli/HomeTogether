import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';

var config = require('../webpack.config');

dotenv.load();

const FRONT_PORT = process.env.CRAFT_HOME_TOGETHER_PORT || 8080;

let compiler = webpack(config);
let app = express();

if (process.env.NODE_ENV !== 'production') {
  app.use(webpackDevMiddleware(compiler, {
    historyApiFallback: true,
    stats: {
      colors: true
    }
  }));
}

app.use(express.static(path.join(__dirname, 'static')));

let server = app.listen(FRONT_PORT, () => {
  let port = server.address().port;
  console.log(`Listening to http://localhost:${port}`);
});
