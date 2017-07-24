import IReporter = require("./IReporter");
import {PollState} from "../Types";
import fs = require('fs');
import path = require('path');
import Handlebars = require('handlebars');

Handlebars.registerHelper('not', (a) => !a);
Handlebars.registerHelper('capitalize', function (text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
});

interface Images {
  logoUp?: string;
  logoDown?: string;
  faviconUp?: string;
  faviconDown?: string;
}

class HTMLReporter implements IReporter {
  templatePath: string = path.join(__dirname, 'html', 'html-report.hbs');

  imagePaths: Images = {
    logoUp: path.join(__dirname, '..', '..', 'assets', 'chicken.up.small.png'),
    logoDown: path.join(__dirname, '..', '..', 'assets', 'chicken.down.small.png'),
    faviconUp: path.join(__dirname, '..', '..', 'assets', 'favicon.up.png'),
    faviconDown: path.join(__dirname, '..', '..', 'assets', 'favicon.down.png'),
  };

  base64Images: Images = {};

  outPath: string;
  compiledTemplate: any;

  constructor(outPath = path.normalize('/www/data/index.html')) {
    this.outPath = outPath;

    this.base64Images = Object.entries(this.imagePaths)
      .reduce((images, [name, path]) => {
        images[name] = fs.readFileSync(path).toString('base64');
        return images;
      }, {});

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
    const someDown = state.some(([level, instance, url, online, latency]) => !online);

    const html = this.compiledTemplate({
      levels: this.nestState(state),
      updated: (new Date()).toISOString(),
      favicon: someDown ? this.base64Images.faviconDown : this.base64Images.faviconUp,
      logo: someDown ? this.base64Images.logoDown : this.base64Images.logoUp,
    });

    fs.writeFile(this.outPath, html, {encoding: 'utf8'}, (err) => {
      if (err) {
        console.error('Error writing html file', err);
      }
    });
  }
}

export = HTMLReporter;
