#!/bin/bash
# pr.sh PROBE TAKE MAXSEC [STOPMARK|-] [--dart-define=...]  — run a lib/dev probe on MY probe simulator and record it.
# Probe simulator: "Emma Probe 17PM" CE85B987 (created by this agent; same device type and runtime as Emma's).
set -u
PROBE=$1; TAKE=$2; MAX=$3; STOP=${4:--}; shift 4
C=/private/tmp/claude-501/-Users-saikumar-Desktop-Curate-curate-app/8dfb7189-122d-440a-a9c0-c4ad2cfe63b8/scratchpad/cap
U=CE85B987-DEDA-4652-BC2F-B48F3A48968B
T=/Users/saikumar/Desktop/Curate/curate-motion/.cache/takes
APP=/Users/saikumar/Desktop/Curate/.worktrees/app-capture-262
LOG=$C/logs/$TAKE.log; mkdir -p $C/logs; : > $LOG
xcrun simctl status_bar $U override --time "9:41" --batteryState discharging --batteryLevel 100 --cellularMode active --cellularBars 4 --wifiBars 3 --dataNetwork wifi
cd $APP
flutter run -t lib/dev/$PROBE.dart -d $U "$@" > $LOG 2>&1 < /dev/null &
FP=$!
for _ in $(seq 1 2400); do
  grep -q "A Dart VM Service\|Flutter run key commands\|Syncing files" $LOG && break
  kill -0 $FP 2>/dev/null || { echo FLUTTER_EXITED; tail -25 $LOG; exit 1; }
  sleep 0.5
done
xcrun simctl io $U recordVideo --codec=hevc --force "$T/$TAKE.mov" > $LOG.rec 2>&1 &
RP=$!; START=$(date +%s)
for _ in $(seq 1 40); do grep -q "Recording started" $LOG.rec && break; sleep 0.25; done
echo "rec started at $(date +%s.%N)" >> $LOG
while true; do
  [ $(( $(date +%s) - START )) -ge "$MAX" ] && break
  [ "$STOP" != "-" ] && grep -q "$STOP" $LOG && { sleep 2; break; }
  sleep 0.5
done
kill -INT $RP; wait $RP 2>/dev/null
pkill -f "[f]lutter_tools.snapshot run -t lib/dev/$PROBE.dart -d $U" 2>/dev/null
kill $FP 2>/dev/null
ffmpeg -v error -y -i "$T/$TAKE.mov" -an -vf fps=60 -c:v libx264 -preset medium -crf 12 -g 30 -pix_fmt yuv420p -colorspace bt709 -color_primaries smpte432 -color_trc iec61966-2-1 -movflags +faststart "$T/$TAKE.cfr.mp4"
echo "$T/$TAKE.cfr.mp4 $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$T/$TAKE.cfr.mp4")s"
grep -E "SELFIE_|PHOTOS_|SHIELD_|PROBE_|MARK|COLD_" $LOG | head -40
