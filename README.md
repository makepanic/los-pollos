# los-pollos

[![Build Status](https://travis-ci.org/makepanic/los-pollos.svg?branch=master)](https://travis-ci.org/makepanic/los-pollos)

Application that takes a list of endpoints, polls them and notifies pluggable reporters if something changes.

## example usage

```bash
SLACK_TOKEN='xoxb-12345-whatev'
POLL_TARGET='{"Production":{"Home":"https://www.archlinux.org/","Aur":"https://aur.archlinux.org/","Bugs":"https://bugs.archlinux.org/","Wiki":"https://wiki.archlinux.org/"}}'
node build/boot.js
```

## Reporters

- change the reporters array to include/exclude reporters

### Slack Reporter

- sends a message to a slack channel
- uses emojis to indicate server status. See `assets/pollos-*.png` images that can be used as custom emojis
- requires `SLACK_TOKEN` environment value

### HTML Reporter

- generates simple static html status page
- the default Dockerfile contains an nginx server that hosts the statuspage on port 80 

![example generated status page](https://i.imgur.com/6yZAjFg.png)
