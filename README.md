# los-pollos
Application that takes a list of endpoints, polls them and notifies pluggable reporters if something changes.

## example usage

```bash
SLACK_TOKEN='xoxb-12345-whatev'
POLL_TARGET='{"Production":{"Home":"https://www.archlinux.org/","Aur":"https://aur.archlinux.org/","Bugs":"https://bugs.archlinux.org/","Wiki":"https://wiki.archlinux.org/"}}'
node build/boot.js
```
