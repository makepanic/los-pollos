import IReporter = require("./IReporter");
import {PollState} from "../Types";
import fs = require('fs');
import assert = require('assert');
import path = require('path');

class CsvReporter implements IReporter {
  dir: string;
  suffix = 'poll.log';

  constructor(dir: string) {
    const stat = fs.statSync(dir);
    assert(stat.isDirectory(), 'reporter directory is a directory');
    this.dir = dir;
  }

  logfileFor(level: string) {
    return path.join(this.dir, `${level}.${this.suffix}`);
  }

  setup(state: Array<PollState>){
    const levels = state
      .map(([level]) => level)
      .reduce((all, level) => all.indexOf(level) === -1 ? all.concat(level) : all, []);

    levels.forEach(level => {
      const logfile = this.logfileFor(level);
      let createFile = false;

      try{
        const stat = fs.statSync(logfile);
        createFile = !stat.isFile();
      } catch(e) {
        createFile = true;
      }

      if (createFile) {
        const instances = state
          .filter(([l]) => l === level)
          .map(([level, instance]) => instance);

        const csvHeader = `t;${instances.join(';')}\n`;

        fs.writeFileSync(logfile, csvHeader);
      }
    });
    return Promise.resolve();
  }

  notifyChanges(changes: Array<PollState>, state: Array<PollState>) {
    const timestamp = new Date().toISOString();
    const levels = state
      .map(([level]) => level)
      .reduce((all, level) => all.indexOf(level) === -1 ? all.concat(level) : all, []);

    levels.forEach(level => {
      const logfile = this.logfileFor(level);
      const levelInstances = changes.filter(([l]) => l === level);
      const instanceLines = levelInstances
        .map(([level, instance, url, down, latency]) => latency);
      const logline = `${timestamp};${instanceLines.join(';')}`;

      fs.appendFile(logfile, logline, e => e && console.error(e));
    });
  }
}

export = CsvReporter;
