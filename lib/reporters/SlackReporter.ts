import IReporter = require("./IReporter");
import {PollState} from "../Types";
import SlackBot = require('slackbots');
import chunk = require('lodash.chunk');

class SlackReporter implements IReporter {
  bot: any;
  channel = 'status';

  emojiInstanceUp = ':pollos-up:';
  emojiInstanceWentUp = ':pollos-went-up:';
  emojiInstanceDown = ':pollos-down:';
  emojiInstanceWentDown = ':pollos-went-down:';

  emojiLevelDown = ':heart:';
  emojiLevelPending = ':yellow_heart:';
  emojiLevelUp = ':green_heart:';

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

  postChangeMessage(options) {
    this.bot.postMessageToChannel(this.channel, '', options);
  }

  notifyChanges(changes: Array<PollState>, state: Array<PollState>) {
    // get list of changed levels
    const changedLevels = changes.reduce((changedLevels, [level]) => {
      const hasLevel = changedLevels.find((l) => level === l);
      return hasLevel ? changedLevels : changedLevels.concat(level);
    }, []);

    // get list of all instances in level
    changedLevels.forEach((level) => {
      const levelInstances = changes.filter(([l]) => l === level);
      const levelState = state.filter(([l]) => l === level);

      const allDown = levelState.every(([level, instance, url, up]) => !up);
      const someDown = levelState.some(([level, instance, url, up]) => !up);
      const colorIcon = allDown ? this.emojiLevelDown : someDown ? this.emojiLevelPending : this.emojiLevelUp;

      // calulate padding length based on longest instance name
      const padLength = levelState.reduce((maxLength, [level, instance]) => Math.max(maxLength, instance.length), 0);
      const levelTexts = levelState.map(([level, instance, url, up]) => {
        const changed = levelInstances.find(([_, changedInstance]) => changedInstance === instance);
        let icon = up ? this.emojiInstanceUp : this.emojiInstanceDown;

        if (changed) {
          icon = changed[3] ? this.emojiInstanceWentUp : this.emojiInstanceWentDown;
        }

        return `${icon} \`${instance.padEnd(padLength, ' ')}\``;
      });

      const levelTextBlocks = chunk(levelTexts, 3)
        .map((_chunk) => _chunk.join(' '))
        .join('\n');

      this.postChangeMessage({
        as_user: true,
        text: `${colorIcon} *${level}*\n${levelTextBlocks}\n-`,
      });
    });
  }
}

export = SlackReporter;
