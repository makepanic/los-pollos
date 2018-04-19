import {PollState} from "../Types";

function deepClone<T>(object: T): T {
  return JSON.parse(JSON.stringify(object));
}

interface StateBuffer {
  stableState: PollState;
  buffer: PollState[];
}

class StateManager {
  /**
   * Amount of times before a instable state changes to its opposite
   * @type {number}
   */
  public bufferSize = 4;

  constructor(bufferSize: number = 4) {
    this.bufferSize = bufferSize;
  }

  private store: Map<string, StateBuffer> = new Map();

  private keyFor(state: PollState) {
    const [level, instance, url] = state;

    return `${level}.${instance}.${url}`;
  }

  // turn a nextState into a new state
  // by buffering state until it's always the same
  // [1,1,1] -> previous state
  // [1,1,0]
  // [1,0,0]
  // [0,0,0] -> state changed
  update(nextState: PollState): PollState {
    const key = this.keyFor(nextState);

    this.ensureStoreState(nextState);

    const stateBuffer = this.store.get(key);

    stateBuffer.buffer.push(nextState);

    if (stateBuffer.buffer.length > this.bufferSize) {
      stateBuffer.buffer.shift();
    }

    this.store.set(key, this.stabilize(stateBuffer));
    return this.store.get(key).stableState;
  }

  stableStateFor(states: PollState[]) {
    return states
      .map(state => this.ensureStoreState(state))
      .map(state => this.store.get(this.keyFor(state)).stableState)
  }

  ensureStoreState(state) {
    const key = this.keyFor(state);

    if (!this.store.has(key)) {
      this.store.set(key, {
        stableState: state,
        buffer: [],
      });
    }

    return state;
  }

  /**
   * Takes a stateBuffer and stabilizes it.
   * Returns the new stateBuffer afterwards.
   * @param {StateBuffer} stateBuffer
   * @return {StateBuffer}
   */
  stabilize(stateBuffer: StateBuffer): StateBuffer {
    if (stateBuffer.buffer.length) {
      const [, , , online] = stateBuffer.stableState;
      // we want to figure out if all in buffer are different than stable
      const oppositeState = !online;
      const allChanged = stateBuffer.buffer
        .every(([, , , online]) => online === oppositeState);

      if (allChanged) {
        const clone = deepClone(stateBuffer);
        clone.stableState[3] = oppositeState;
        return clone;
      }
    }
    return stateBuffer;
  }
}

export = StateManager;
