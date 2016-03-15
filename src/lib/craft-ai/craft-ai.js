import fetch from 'isomorphic-fetch';
import _ from 'lodash';

let token = __CRAFT_TOKEN__;
console.log('token =', token);
// craft ai functions

function craftRequest(r) {
  r = _.defaults(r || {}, {
    method: 'GET',
    path: '',
    queries: {},
    headers: {
      'Content-Type': 'application/json'
    },
    body: {}
  });

  let base_url = 'https://labs-integration.craft.ai/api';
  let owner = 'home_together';

  let url = base_url + '/' + owner + '/' + r.path + '?token=' + token + _.reduce(r.queries, (res, val, key) => res = res + '&' + key + '=' + val, '');
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
};

function createCraftAgent(model, id) {
  return craftRequest({
    method: 'POST',
    path: 'agents',
    body: JSON.stringify({model: model, id: id})
  })
  .catch(err => {
    const msg = 'Agent creation failed:\n' + err;
    console.log(msg);
    throw new Error(msg);
  });
};

function updateCraftAgentContext(agent, diffs) {
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
};

function getCraftAgentDecision(agent, context, ts) {
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
};

exports = module.exports = {
  agent: undefined,
  createAgent: createCraftAgent,
  updateAgentContext: updateCraftAgentContext,
  getAgentDecision: getCraftAgentDecision
};
