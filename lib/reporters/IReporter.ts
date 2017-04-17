import {PollState} from "../Types";

interface IReporter {
  setup(state: Array<PollState>): Promise<any>;
  notifyChanges(changes: Array<PollState>, state: Array<PollState>);
}

export = IReporter;
