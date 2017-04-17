import IReporter = require("./IReporter");
import {PollState} from "../Types";
import fs = require('fs');
import assert = require('assert');
import path = require('path');
import SlackBot = require('slackbots');

class SlackReporter implements IReporter {
  bot: any;
  channel = 'status';
  symbolWentDown = '↧';
  symbolWentUp = '↥';

  constructor(token) {
    this.bot = new SlackBot({token});
  }

  setup(state: Array<PollState>) {
    return new Promise((resolve) => {
      this.bot.on('start', function () {
        resolve();
      });
    });
  }

  titleForChanges(level, changes) {
    const changesList = changes
      .map(([level, instance, url, up]) => `${instance} ${up ? this.symbolWentUp : this.symbolWentDown}`).join(' ,');

    return `${level}: ${changesList}`;
  }

  postChangeMessage(options){
    this.bot.postMessageToChannel(this.channel, '', options);
  }

  notifyChanges(changes: Array<PollState>, state: Array<PollState>) {
    // get list of changed levels
    const changedLevels = changes.reduce((changedLevels, [level]) => {
      const hasLevel = changedLevels.find((l) => level === l);
      return hasLevel ? changedLevels : changedLevels.concat(level);
    }, []);

    changedLevels.forEach((level) => {
      // get list of all instances in level
      const levelInstances = changes.filter(([l]) => l === level);
      const levelState = state.filter(([l]) => l === level);

      const allDown = levelState.every(([level, instance, url, up]) => !up);
      const someDown = levelState.some(([level, instance, url, up]) => !up);
      const title = this.titleForChanges(level, levelInstances);
      const color = allDown ? 'danger' : someDown ? 'warning' : 'good';
      const fields = levelState.map(([level, instance, url, up]) => {
        return {
          title: instance,
          short: true,
          value: `is ${up ? 'up :sharkdance:' : 'down :unacceptable:'}`
        }
      });

      this.postChangeMessage({
        as_user: true,
        attachments: JSON.stringify([{
          color,
          title,
          fallback: title,
          fields
        }])
      });
    });
  }
}

export = SlackReporter;
