#!/bin/bash
# capture.sh NAME PROBE STOP_MARKER MAX_SECONDS [--dart-define=... ...]
# Launches a dev probe from the video-262 worktree on our own simulator, records
# the screen from app launch until STOP_MARKER shows in the log (or MAX_SECONDS
# pass), then stops the probe. Raw recordings land in footage/raw/NAME.mp4.
set -u
NAME=$1; PROBE=$2; STOP=$3; MAX=$4; shift 4
HERE=/Users/saikumar/Desktop/Curate/marketing/videos
U=$(cat $HERE/tools/sim-udid.txt)
WT=/Users/saikumar/Desktop/Curate/curate-app/.worktrees/video-262
mkdir -p $HERE/footage/raw $HERE/footage/logs
LOG=$HERE/footage/logs/$NAME.log
OUT=$HERE/footage/raw/$NAME.mp4
: > $LOG
xcrun simctl status_bar $U override --time "9:41" --batteryState charged --batteryLevel 100 --cellularMode active --cellularBars 4 --wifiBars 3 --dataNetwork wifi
cd $WT
flutter run -t lib/dev/$PROBE.dart -d $U "$@" > $LOG 2>&1 < /dev/null &
FP=$!
# wait (up to 15 min for the first build) for the app to come up
for i in $(seq 1 1800); do
  grep -q "A Dart VM Service\|Flutter run key commands\|Syncing files" $LOG && break
  if ! kill -0 $FP 2>/dev/null; then echo "FLUTTER_EXITED"; tail -30 $LOG; exit 1; fi
  sleep 0.5
done
# the probe's own clock started a moment ago at launch; record now
xcrun simctl io $U recordVideo --codec=h264 --force $OUT > $HERE/footage/logs/$NAME.rec.log 2>&1 &
RP=$!
START=$(date +%s)
echo "REC_START $(date +%s.%N)" >> $LOG.marks
while true; do
  NOW=$(date +%s)
  [ $((NOW-START)) -ge $MAX ] && break
  [ "$STOP" != "-" ] && grep -q "$STOP" $LOG && { sleep 1.5; break; }
  sleep 0.5
done
kill -INT $RP; wait $RP 2>/dev/null
pkill -f "[f]lutter_tools.snapshot run -t lib/dev/$PROBE.dart -d $U" 2>/dev/null
kill $FP 2>/dev/null
sleep 1
echo "DONE $OUT $(ffprobe -v error -show_entries format=duration -of csv=p=0 $OUT)"
grep -E "PROBE_|SELFIE_|SHIELD_|PHOTOS_|ZEE_|flutter:" $LOG | head -40
