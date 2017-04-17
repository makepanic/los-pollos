const assert = require('assert');
const nock = require('nock');

const Poller = require('../../build/lib/Poller');

describe('Poller', function () {
  beforeEach(() => {
    nock.cleanAll();
  });

  describe('request', function () {
    it('resolves for successful requests', function () {
      const poller = new Poller([], []);

      nock('http://poller.app')
        .get('/')
        .reply(200);

      return poller.request('http://poller.app/');
    });
    it('resolves for error requests', function () {
      const poller = new Poller([], []);

      nock('http://poller.app')
        .get('/')
        .reply(502);

      return poller.request('http://poller.app/');
    });
  });

  describe('isError', function () {
    it('returns true for expected valid errors', function () {
      const poller = new Poller([], []);

      assert.ok(poller.isError({statusCode: 502}));
      assert.ok(poller.isError({statusCode: 502}));
      assert.ok(poller.isError({statusCode: 504}));
      assert.ok(poller.isError({code: 'ECONNREFUSED'}));
    });
  });

  describe('start', function () {
    it('only allows to start once', function () {
      let didPoll = false;
      class NoopPoller extends Poller {
        poll() {
          didPoll = true;
        }
      }

      const poller = new NoopPoller([], []);
      poller.running = true;
      poller.start();
      assert.equal(didPoll, false);
    });
  });

  describe('diffState', function () {
    it('diffs two PollStates', function () {
      // [string, string, string, boolean, number]
      const initialState = ['foo', 'bar', 'http://poll.app', true];
      const newState = ['foo', 'bar', 'http://poll.app', false];

      const poller = new Poller([initialState], []);
      assert.deepEqual(poller.diffState([]), []);
      assert.deepEqual(poller.diffState([initialState]), []);
      assert.deepEqual(poller.diffState([newState]), [newState]);
    })
  });

  describe('poll', function () {
    it('notifies reporters for changes', function (done) {
      const initialState = ['foo', 'bar', 'http://poller.app/'];

      class DummyReporter {
        setup() {
          return Promise.resolve();
        }

        notifyChanges([firstChange]) {
          const [level, instance, url, up] = firstChange;
          assert.equal(level, initialState[0]);
          assert.equal(instance, initialState[1]);
          assert.equal(url, initialState[2]);
          assert.equal(up, false);
          done();
        }
      }

      nock('http://poller.app')
        .get('/')
        .reply(502);

      const poller = new Poller([initialState], [new DummyReporter()]);
      poller.poll();
    });
  })
});

