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
      __CRAFT_TOKEN__: JSON.stringify(process.env.CRAFT_TOKEN),
      __ZIPABOX_USER__: JSON.stringify(process.env.ZIPABOX_USER),
      __ZIPABOX_LIGHT_SENSOR__:JSON.stringify(process.env.ZIPABOX_LIGHT_SENSOR_DEVICE_UUID),
      __ZIPABOX_BLIND__:JSON.stringify(process.env.ZIPABOX_BLIND_DEVICE_UUID),
      __LIFX_TOKEN__: JSON.stringify(process.env.LIFX_TOKEN),
      __LIFX_BULB_0__: JSON.stringify(process.env.LIFX_BULB_0),
      __LIFX_BULB_1__: JSON.stringify(process.env.LIFX_BULB_1),
      __LIFX_BULB_2__: JSON.stringify(process.env.LIFX_BULB_2),
      __LIFX_BULB_3__: JSON.stringify(process.env.LIFX_BULB_3),
      __LIFX_BULB_4__: JSON.stringify(process.env.LIFX_BULB_4),
      __LIFX_BULB_5__: JSON.stringify(process.env.LIFX_BULB_5),
      __SAMI_CLIENT_ID__: JSON.stringify(process.env.SAMI_CLIENT_ID),
      __SAMI_TV__: JSON.stringify(process.env.SAMI_TV),
      __SAMI_BLIND__: JSON.stringify(process.env.SAMI_BLIND),
      __SAMI_SHOWER_HEAD__: JSON.stringify(process.env.SAMI_SHOWER_HEAD),
      __SAMI_BULB_0__: JSON.stringify(process.env.SAMI_BULB_0),
      __SAMI_BULB_1__: JSON.stringify(process.env.SAMI_BULB_1),
      __SAMI_BULB_2__: JSON.stringify(process.env.SAMI_BULB_2),
      __SAMI_BULB_3__: JSON.stringify(process.env.SAMI_BULB_3),
      __SAMI_BULB_4__: JSON.stringify(process.env.SAMI_BULB_4),
      __SAMI_BULB_5__: JSON.stringify(process.env.SAMI_BULB_5),
      __SAMI_LIGHT_SENSOR__: JSON.stringify(process.env.SAMI_LIGHT_SENSOR),
      __SAMI_PRESENCE__: JSON.stringify(process.env.SAMI_PRESENCE),
      __HUE_USER__: JSON.stringify(process.env.HUE_USER),
      __HUE_PREFERRED_BRIDGE__: JSON.stringify(process.env.HUE_PREFERRED_BRIDGE),
      __HUE_BRIDGE_IP__: JSON.stringify(process.env.HUE_BRIDGE_IP),
      __HUE_BULB_0__: JSON.stringify(process.env.HUE_BULB_0),
      __HUE_BULB_1__: JSON.stringify(process.env.HUE_BULB_1),
      __HUE_BULB_2__: JSON.stringify(process.env.HUE_BULB_2),
      __HUE_BULB_3__: JSON.stringify(process.env.HUE_BULB_3),
      __HUE_BULB_4__: JSON.stringify(process.env.HUE_BULB_4),
      __HUE_BULB_5__: JSON.stringify(process.env.HUE_BULB_5)
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
