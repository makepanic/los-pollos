"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Poller = require('../../lib/Poller');
const nock = require('nock');
const ava_1 = require("ava");
ava_1.default.beforeEach(() => {
    nock.cleanAll();
});
ava_1.default('resolves for successful requests', t => {
    t.plan(0);
    const poller = new Poller([], []);
    nock('http://poller.app')
        .get('/')
        .reply(200);
    return poller.request('http://poller.app/');
});
ava_1.default('resolves for error requests', t => {
    t.plan(0);
    const poller = new Poller([], []);
    nock('http://poller.app')
        .get('/')
        .reply(502);
    return poller.request('http://poller.app/');
});
ava_1.default('returns true for expected valid errors', t => {
    const poller = new Poller([], []);
    t.truthy(poller.isError({ statusCode: 502 }));
    t.truthy(poller.isError({ statusCode: 502 }));
    t.truthy(poller.isError({ statusCode: 504 }));
    t.truthy(poller.isError({ code: 'ECONNREFUSED' }));
});
ava_1.default('only allows to start once', t => {
    let didPoll = false;
    class NoopPoller extends Poller {
        constructor() {
            //@ts-ignore
            super([], []);
        }
        poll() {
            didPoll = true;
        }
    }
    const poller = new NoopPoller();
    poller.running = true;
    poller.start();
    t.is(didPoll, false);
});
ava_1.default('diffs two PollStates', t => {
    // [string, string, string, boolean, number]
    const initialState = ['foo', 'bar', 'http://poll.app', true];
    const newState = ['foo', 'bar', 'http://poll.app', false];
    const poller = new Poller([initialState], []);
    t.deepEqual(poller.diffState([]), []);
    t.deepEqual(poller.diffState([initialState]), []);
    t.deepEqual(poller.diffState([newState]), [newState]);
});
ava_1.default.cb('notifies reporters for changes', t => {
    const initialState = ['foo', 'bar', 'http://poller.app/'];
    class DummyReporter {
        setup() {
            return Promise.resolve();
        }
        notifyChanges([firstChange]) {
            const [level, instance, url, up] = firstChange;
            t.is(level, initialState[0]);
            t.is(instance, initialState[1]);
            t.is(url, initialState[2]);
            t.is(up, false);
            t.end();
        }
    }
    nock('http://poller.app')
        .get('/')
        .reply(502);
    const poller = new Poller([initialState], [new DummyReporter()]);
    poller.interval = 100;
    poller.poll();
});
