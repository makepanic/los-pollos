import IReporter = require("./IReporter");
import {PollState} from "../Types";

class StdoutReporter implements IReporter {
  notifyChanges(changes: Array<PollState>, state: Array<PollState>) {
    changes.forEach(change => console.log('State changed:', change));
  }

  setup(state: Array<PollState>): Promise<any> {
    return undefined;
  }
}

export = StdoutReporter;
