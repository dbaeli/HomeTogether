var dotenv = require('dotenv');
var path = require('path');
var webpack = require('webpack');

dotenv.load();

module.exports = {
  devtool: 'eval',
  entry: [
    './src/main'
  ],
  output: {
    path: path.join(__dirname, 'app'),
    filename: 'bundle.js',
    publicPath: '/'
  },
  plugins: [
    new webpack.ProvidePlugin({
      'es6-promise': 'es6-promise',
      'fetch': 'imports?this=>global!exports?global.fetch!whatwg-fetch'
    }),
    new webpack.DefinePlugin({
      __CRAFT_HTTP_API_URL__: JSON.stringify(process.env.CRAFT_HTTP_API_URL),
      __CRAFT_WS_API_URL__: JSON.stringify(process.env.CRAFT_WS_API_URL),
      __CRAFT_APP_ID__: JSON.stringify(process.env.CRAFT_APP_ID),
      __CRAFT_APP_SECRET__: JSON.stringify(process.env.CRAFT_APP_SECRET),
      __CRAFT_PROJECT_OWNER__: JSON.stringify(process.env.CRAFT_PROJECT_OWNER),
      __CRAFT_PROJECT_NAME__: JSON.stringify(process.env.CRAFT_PROJECT_NAME),
      __CRAFT_PROJECT_VERSION__: JSON.stringify(process.env.CRAFT_PROJECT_VERSION),
      __ZIPABOX_USER__: JSON.stringify(process.env.ZIPABOX_USER),
      __LIFX_TOKEN__: JSON.stringify(process.env.LIFX_TOKEN),
      __LIFX_BULB_0__: JSON.stringify(process.env.LIFX_BULB_0),
      __LIFX_BULB_1__: JSON.stringify(process.env.LIFX_BULB_1),
      __LIFX_BULB_2__: JSON.stringify(process.env.LIFX_BULB_2),
      __LIFX_BULB_3__: JSON.stringify(process.env.LIFX_BULB_3),
      __LIFX_BULB_4__: JSON.stringify(process.env.LIFX_BULB_4),
      __LIFX_BULB_5__: JSON.stringify(process.env.LIFX_BULB_5)
    })
  ],
  resolve: {
    extensions: ['', '.js', '.jsx']
  },
  module: {
    preLoaders : [
      { test: /\.json$/, loader: 'json'}
    ],
    loaders: [{
      test: /\.jsx?$/,
      loaders: ['babel'],
      exclude: /node_modules/
    }, {
      test: /\.css?$/,
      loaders: ['style', 'css']
    }, {
      test: /\.(png|svg|eot|ttf|woff)$/,
      loaders: ['url']
    }]
  }
};
