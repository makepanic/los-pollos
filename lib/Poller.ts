import got = require('got');
import Reporter = require("./reporters/IReporter");
import {PollState, PollInstance} from "./Types";

class Poller {
  state: Array<PollState> = [];
  reporters: Array<Reporter> = [];
  running: boolean = false;
  interval: number = 15 * 1000;

  constructor(checks: Array<PollInstance>, reporters: Array<Reporter>) {
    this.reporters = reporters;

    this.state = checks.map(([level, instance, url]) =>
      <PollState>[level, instance, url, true, 0]);
  }

  request(url) {
    const before = Date.now();
    return got(url).then((response) => {
      response._duration = Date.now() - before;
      return response;
    }).catch(error => {
      error._duration = 0;
      return error;
    });
  }

  isError(result) {
    const errorCodes = [502, 503, 504];

    return errorCodes.includes(result.statusCode) ||
      result.code === 'ECONNREFUSED';
  }

  diffState(newState: Array<PollState>): Array<PollState> {
    return newState.filter(([newLevel, newInstance, newUrl, newUp]) =>
      this.state.find(([oldLevel, oldInstance, oldUrl, oldUp]) => newLevel === oldLevel && newInstance === oldInstance && newUrl === oldUrl && newUp !== oldUp))
  }

  poll() {
    const promises = this.state.map(([level, instance, url]) => {
      return this.request(url)
        .then((result) => [level, instance, url, !this.isError(result), result._duration]);
    });

    return Promise.all(promises).then(newState => {
      const changes = this.diffState(newState);

      if (changes.length) {
        this.reporters
          .forEach(reporter => reporter.notifyChanges(changes, newState));
      }

      this.state = newState;
    }).then(() =>
      setTimeout(() => this.running && this.poll(), this.interval));
  }

  setup() {
    return Promise.all(this.reporters.map(r =>
      r.setup(this.state)));
  }

  start() {
    if (!this.running) {
      this.running = true;
      this.poll();
    }
  }

  stop() {
    this.running = false;
  }
}

export = Poller;
