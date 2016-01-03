var dotenv = require('dotenv');
var path = require('path');
var webpack = require('webpack');

dotenv.load();

module.exports = {
  devtool: 'eval',
  entry: {
    main: './src/main',
    lifx: './src/lifx'
  },
  output: {
    path: path.join(__dirname, 'app'),
    filename: '[name]/bundle.js',
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
      __LI_MIN__: JSON.stringify(process.env.LI_MIN),
      __LI_NIGHT_MAX__: JSON.stringify(process.env.LI_NIGHT_MAX),
      __LI_DAY_MIN__: JSON.stringify(process.env.LI_DAY_MIN),
      __LI_MAX__: JSON.stringify(process.env.LI_MAX)
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
