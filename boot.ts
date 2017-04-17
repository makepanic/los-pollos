import Poller = require("./lib/Poller");
import CsvReporter = require("./lib/reporters/CsvReporter");
import path = require('path');
import assert = require('assert');
import {PollInstance} from "./lib/Types";
import SlackReporter = require("./lib/reporters/SlackReporter");

assert(typeof process.env.SLACK_TOKEN === 'string', 'Provided slack token via environment variable SLACK_TOKEN');
assert(typeof process.env.POLL_TARGET === 'string', 'Requires poll target JSON object');

const SLACK_TOKEN = process.env.SLACK_TOKEN;
const POLL_TARGET = JSON.parse(process.env.POLL_TARGET);

// transform nested object {Level: {Instance: url}} to [[Level, Instance, Url]]
const checks: Array<PollInstance> = <Array<PollInstance>>Object
  .keys(POLL_TARGET)
  .map(level => Object
    .keys(POLL_TARGET[level])
    .map(instance => [level, instance, POLL_TARGET[level][instance]]))
  .reduce((all, item) => all.concat(item), []);

const reporters = [
  new SlackReporter(SLACK_TOKEN)
];

const poller = new Poller(checks, reporters);
poller.setup()
  .then(() => poller.start());
