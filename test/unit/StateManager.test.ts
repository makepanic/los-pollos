const StateManager = require('../../lib/StateManager/StateManager');
import test from 'ava';

test('stabilize', t => {
  const sm = new StateManager(3);

  {
    const state = [, , , true];
    let newState = sm.stabilize({
      stableState: state,
      buffer: [
        [, , , false],
        [, , , false],
        [, , , false],
      ]
    });
    t.is(newState.stableState[3], false);
  }

  {
    const state = [, , , true];
    let newState = sm.stabilize({
      stableState: state,
      buffer: [
        [, , , false],
        [, , , true],
        [, , , false],
      ]
    });
    t.is(newState.stableState[3], true);
  }
});

test('buffers changes before stabilizing', t => {
  const sm = new StateManager(3);
  let state;

  state = sm.update(['prod', 'api', 'http://api.app', true, 16]);
  t.truthy(state[3]);
  state = sm.update(['prod', 'api', 'http://api.app', true, 16]);
  t.truthy(state[3]);
  state = sm.update(['prod', 'api', 'http://api.app', true, 16]);
  t.truthy(state[3]);
  state = sm.update(['prod', 'api', 'http://api.app', false, 16]);
  t.truthy(state[3]);
  state = sm.update(['prod', 'api', 'http://api.app', false, 16]);
  t.truthy(state[3]);
  state = sm.update(['prod', 'api', 'http://api.app', false, 16]);
  t.truthy(!state[3]);
});

test('it separates states', t => {
  const sm = new StateManager(3);
  let state;

  state = sm.update(['prod', 'api', 'http://api.app', true, 16]);
  t.truthy(state[3]);
  sm.update(['prod', 'lb', 'http://lb.app', false, 16]);
  state = sm.update(['prod', 'api', 'http://api.app', true, 16]);
  t.truthy(state[3]);
  state = sm.update(['prod', 'api', 'http://api.app', true, 16]);
  t.truthy(state[3]);
  state = sm.update(['prod', 'api', 'http://api.app', false, 16]);
  t.truthy(state[3]);
  state = sm.update(['prod', 'api', 'http://api.app', false, 16]);
  t.truthy(state[3]);
  state = sm.update(['prod', 'api', 'http://api.app', false, 16]);
  t.truthy(!state[3]);
});
