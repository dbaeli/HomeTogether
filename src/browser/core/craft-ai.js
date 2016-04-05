import fetch from 'isomorphic-fetch';
import _ from 'lodash';
import { CRAFT_TOKEN, CRAFT_URL, OWNER } from '../constants';

function craftRequest(r) {
  r = _.defaults(r || {}, {
    method: 'GET',
    path: '',
    queries: {},
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + CRAFT_TOKEN
    },
    body: {}
  });

  let url = CRAFT_URL + '/api/' + OWNER + '/' + r.path + '?' + _.map(_.toPairs(r.queries), p => p.join('=')).join('&');
  return fetch(url, {
    method: r.method,
    headers:r.headers,
    body: r.body
  })
  .then(response => {
    if (response.status >= 400) {
      return response.json()
        .catch(() => {
          throw new Error(`Error ${response.status} in craft ai request, invalid json returned.`);
        })
        .then( json => {
          throw new Error(`Error ${response.status} in craft ai request: ${json.message}`);
        });
    }
    else {
      return response.json();
    }
  });
}

export function createCraftAgent(model) {
  return craftRequest({
    method: 'POST',
    path: 'agents',
    body: JSON.stringify({model: model})
  })
  .then(agent => {
    console.log(`Agent '${agent.id}' created, inspect at ${CRAFT_URL}/inspector?token=${CRAFT_TOKEN}&owner=${OWNER}&agent=${agent.id}`);
    return agent;
  })
  .catch(err => {
    const msg = 'Agent creation failed:\n' + err;
    console.log(msg);
    throw new Error(msg);
  });
}

export function updateCraftAgentContext(agent, diffs) {
  return craftRequest({
    method: 'POST',
    path: 'agents/' + agent + '/context',
    body: JSON.stringify(diffs)
  })
  .catch(err => {
    const msg = 'Context update failed:\n' + err;
    console.log(msg);
    throw new Error(msg);
  });
}

export function getCraftAgentDecision(agent, context, ts) {
  return craftRequest({
    method: 'POST',
    path: 'agents/' + agent + '/decision',
    queries: {
      t: ts
    },
    body: JSON.stringify(context)
  })
  .catch(err => {
    const msg = 'Decision retrieval failed:\n' + err;
    console.log(msg);
    throw new Error(msg);
  });
}
