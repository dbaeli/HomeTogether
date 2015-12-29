var dotenv = require('dotenv');
var path = require('path');
var webpack = require('webpack');

dotenv.load();

module.exports = {
  devtool: 'eval',
  entry: [
    'webpack-dev-server/client?http://localhost:4444',
    'webpack/hot/only-dev-server',
    './src/main'
  ],
  output: {
    path: path.join(__dirname, 'app'),
    filename: 'bundle.js',
    publicPath: '/'
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin(),
    new webpack.ProvidePlugin({
      'es6-promise': 'es6-promise',
      'fetch': 'imports?this=>global!exports?global.fetch!whatwg-fetch'
    }),
    new webpack.DefinePlugin({
      __CRAFT_APP_ID__: JSON.stringify(process.env.CRAFT_APP_ID),
      __CRAFT_APP_SECRET__: JSON.stringify(process.env.CRAFT_APP_SECRET),
      __CRAFT_PROJECT_OWNER__: JSON.stringify(process.env.CRAFT_PROJECT_OWNER),
      __CRAFT_PROJECT_NAME__: JSON.stringify(process.env.CRAFT_PROJECT_NAME),
      __CRAFT_PROJECT_VERSION__: JSON.stringify(process.env.CRAFT_PROJECT_VERSION)
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
      loaders: ['react-hot', 'babel'],
      exclude: /node_modules/
    }, {
      test: /\.css?$/,
      loaders: ['style', 'raw']
    }, {
      test: /\.(png|svg|eot|ttf|woff)$/,
      loaders: ['url']
    }]
  }
};
