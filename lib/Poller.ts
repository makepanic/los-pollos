import got = require('got');
import Reporter = require("./reporters/IReporter");
import {PollState, PollInstance} from "./Types";
import StateManager = require("./StateManager/StateManager");

class Poller {
  state: Array<PollState> = [];
  reporters: Array<Reporter> = [];
  running: boolean = false;
  interval: number = 15 * 1000;
  timeout: number = 10 * 1000;
  retries: number = 0;
  stateManager: StateManager = new StateManager();

  constructor(checks: PollInstance[], reporters: Reporter[]) {
    this.reporters = reporters;

    this.state = checks.map(([level, instance, url]) =>
      <PollState>[level, instance, url, true, 0]);
  }

  request(url: string) {
    const before = Date.now();
    return got(url, {
      timeout: this.timeout,
      retries: this.retries,
    }).then((response: any) => {
      response._duration = Date.now() - before;
      return response;
    }).catch((error: Error) => {
      (error as any)._duration = 0;
      return error;
    });
  }

  isError(result: any) {
    const errorCodes = [502, 503, 504, 404, 400];

    return errorCodes.includes(result.statusCode) ||
      result.code === 'ECONNREFUSED' ||
      result.code === 'ENOTFOUND' ||
      result.code === 'ETIMEDOUT';
  }

  diffState(newState: Array<PollState>): Array<PollState> {
    return newState.filter(([newLevel, newInstance, newUrl, newUp]) =>
      this.state.find(([oldLevel, oldInstance, oldUrl, oldUp]) => newLevel === oldLevel && newInstance === oldInstance && newUrl === oldUrl && newUp !== oldUp))
  }

  poll(): Promise<any> {
    const promises = this.state.map(([level, instance, url]) => {
      return this.request(url)
        .then((result: any) => [level, instance, url, !this.isError(result), result._duration]);
    });

    return Promise.all(promises)
      .then(newState =>
        newState.map((state: PollState) => this.stateManager.update(state)))
      .then(newState => {
        const changes = this.diffState(newState);

        if (changes.length) {
          this.reporters
            .forEach(reporter => reporter.notifyChanges(changes, newState));
        }

        this.state = this.stateManager.stableStateFor(newState);
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
