#!/bin/bash
# s.sh: drive Emma's simulator ONLY (fixed UDID, never "booted").
#   s.sh shot NAME            screenshot -> shots/NAME.png (+ NAME_s.png small)
#   s.sh tap X Y              tap points
#   s.sh label "Text"         tap element by accessibility label
#   s.sh swipe X1 Y1 X2 Y2 [dur]
#   s.sh ui                   dump accessibility tree
#   s.sh rec NAME             start HEVC recording -> takes/NAME.mov
#   s.sh stop                 stop the recording
#   s.sh bar                  clean status bar
C=/private/tmp/claude-501/-Users-saikumar-Desktop-Curate-curate-app/8dfb7189-122d-440a-a9c0-c4ad2cfe63b8/scratchpad/cap
U=B0202502-C8FB-4DAA-8E29-EAE4866B0C14
T=/Users/saikumar/Desktop/Curate/curate-motion/.cache/takes
mkdir -p "$C/shots" "$T"
case "$1" in
  shot) xcrun simctl io $U screenshot "$C/shots/$2.png" >/dev/null 2>&1 && sips -Z 600 "$C/shots/$2.png" --out "$C/shots/$2_s.png" >/dev/null && echo "$C/shots/$2_s.png" ;;
  tap) axe tap -x "$2" -y "$3" --udid $U >/dev/null ;;
  label) axe tap --label "$2" --wait-timeout ${3:-5} --udid $U >/dev/null && echo ok ;;
  swipe) axe swipe --start-x $2 --start-y $3 --end-x $4 --end-y $5 --duration ${6:-0.4} --udid $U >/dev/null ;;
  ui) python3 "$C/ui.py" ;;
  bar) xcrun simctl status_bar $U override --time "9:41" --batteryState discharging --batteryLevel 100 --cellularMode active --cellularBars 4 --wifiBars 3 --dataNetwork wifi ;;
  rec)
    xcrun simctl status_bar $U override --time "9:41" --batteryState discharging --batteryLevel 100 --cellularMode active --cellularBars 4 --wifiBars 3 --dataNetwork wifi
    nohup xcrun simctl io $U recordVideo --codec=hevc --force "$T/$2.mov" > "$C/rec.log" 2>&1 &
    echo $! > "$C/rec.pid"; echo "$2" > "$C/rec.name"
    for i in $(seq 1 40); do grep -q "Recording started" "$C/rec.log" && break; sleep 0.25; done
    date +%s.%N > "$C/rec.t0"; echo "rec $2 started" ;;
  stop)
    P=$(cat "$C/rec.pid"); kill -INT $P
    for i in $(seq 1 60); do kill -0 $P 2>/dev/null || break; sleep 0.5; done
    N=$(cat "$C/rec.name")
    ffmpeg -v error -y -i "$T/$N.mov" -an -vf fps=60 -c:v libx264 -preset medium -crf 12 -g 30 -pix_fmt yuv420p -colorspace bt709 -color_primaries smpte432 -color_trc iec61966-2-1 -movflags +faststart "$T/$N.cfr.mp4"
    echo "$T/$N.cfr.mp4 $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$T/$N.cfr.mp4")s" ;;
  term) xcrun simctl terminate $U com.curatefashions.curateApp ;;
  launch) xcrun simctl launch $U com.curatefashions.curateApp >/dev/null ;;
  type) axe type "$2" --udid $U ;;
esac
