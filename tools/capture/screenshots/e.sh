#!/bin/bash
# e.sh: drive Emma's simulator ONLY (fixed UDID; SIMU overrides for the probe sim).  shot NAME -> raw/NAME.png + v/NAME.jpg
D=/private/tmp/claude-501/-Users-saikumar-Desktop-Curate-curate-app/8dfb7189-122d-440a-a9c0-c4ad2cfe63b8/scratchpad/ss
U=${SIMU:-B0202502-C8FB-4DAA-8E29-EAE4866B0C14}
case "$1" in
  bar) xcrun simctl status_bar $U clear; xcrun simctl status_bar $U override --time "9:41" --batteryState discharging --batteryLevel 100 --cellularMode active --cellularBars 4 --wifiMode active --wifiBars 3 --dataNetwork wifi --operatorName "" ;;
  shot) SIMU=$U python3 $D/shot.py "$2" ;;
  tap) axe tap -x "$2" -y "$3" --udid $U >/dev/null ;;
  label) axe tap --label "$2" --wait-timeout ${3:-5} --udid $U >/dev/null && echo ok ;;
  swipe) axe swipe --start-x $2 --start-y $3 --end-x $4 --end-y $5 --duration ${6:-0.4} --udid $U >/dev/null ;;
  ui) SIMU=$U python3 $D/ui.py ;;
  type) axe type "$2" --udid $U ;;
  term) xcrun simctl terminate $U com.curatefashions.curateApp ;;
  launch) xcrun simctl launch $U com.curatefashions.curateApp >/dev/null ;;
esac
