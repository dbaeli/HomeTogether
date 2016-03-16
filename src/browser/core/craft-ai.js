import fetch from 'isomorphic-fetch';
import _ from 'lodash';

const CRAFT_TOKEN = __CRAFT_TOKEN__;
const CRAFT_URL = __CRAFT_URL__;

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

  let owner = 'home_together';

  let url = CRAFT_URL + '/api/' + owner + '/' + r.path + '?' + _.map(_.toPairs(r.queries), p => p.join('=')).join('&');
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
  .catch(err => {
    const msg = 'Agent creation failed:\n' + err;
    console.log(msg);
    throw new Error(msg);
  });
}

export function updateCraftAgentContext(agent, diffs) {
  return craftRequest({
    method: 'POST',
    path: 'agents/' + agent + '/knowledge',
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
