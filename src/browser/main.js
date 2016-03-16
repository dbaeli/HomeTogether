import React from 'react';
import ReactDOM from 'react-dom';
import App from './app';
import occupantBehavior from './core/occupantBehavior';
import automation from './core/automation';
import Store from './core/store';

let store = new Store();

ReactDOM.render(
  <App store={store}/>,
  document.getElementById('root')
);

occupantBehavior(store);
automation(store);
