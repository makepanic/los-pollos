import IReporter = require("./IReporter");
import {PollState} from "../Types";
import fs = require('fs');
import path = require('path');
import Handlebars = require('handlebars');

Handlebars.registerHelper('not', (a) => !a);
Handlebars.registerHelper('capitalize', function (text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
});

class HTMLReporter implements IReporter {
  templatePath: string = path.join(__dirname, 'html', 'html-report.hbs');
  logoPath: string = path.join(__dirname, '..', '..', 'assets', 'chicken.small.png');
  logoBase64: Buffer;

  outPath: string;
  compiledTemplate: any;

  constructor(outPath = path.normalize('/www/data/index.html')) {
    this.outPath = outPath;
    this.logoBase64 = fs.readFileSync(this.logoPath);
    this.compiledTemplate = Handlebars.compile(fs.readFileSync(this.templatePath, {encoding: 'utf8'}));
  }

  nestState(state: Array<PollState>) {
    const levels = {};

    state.forEach((state) => {
      const [level, instance, url, online, latency] = state;
      levels[level] = levels[level] || {name: level, instances: {}};
      levels[level].instances[instance] = levels[level].instances[instance] || {name: instance};

      levels[level].instances[instance] = {
        online
      }
    });

    return levels;
  }

  setup(state: Array<PollState>) {
    this.notifyChanges([], state);
    return Promise.resolve();
  }

  notifyChanges(changes: Array<PollState>, state: Array<PollState>) {
    const html = this.compiledTemplate({
      levels: this.nestState(state),
      updated: (new Date()).toISOString(),
      logoBase64: this.logoBase64.toString('base64')
    });

    fs.writeFile(this.outPath, html, {encoding: 'utf8'}, (err) => console.error('Error writing html file', err));
  }
}

export = HTMLReporter;
