#!/bin/bash
# tools/capture.sh: record one app moment from a persona's account on the iOS simulator and
# catalogue it as a footage asset.
#
#   tools/capture.sh <persona> <moment> <probe> <stop-marker|-> <max-seconds> [--dart-define=…]
#   e.g. tools/capture.sh emma two-taps-closet two_taps_probe PROBE_DONE 40
#
# Env:  CURATE_APP_DIR  curate-app checkout or worktree to run (default ../curate-app)
#       SIM_UDID        simulator to use (default: tools/sim-udid.txt)
#       APP_BUILD       build number of that checkout (default: read from pubspec.yaml)
#       CAPTURE_SIGNIN=1  fetch the persona's password from SSM into a 0600 temp file passed with
#                       --dart-define-from-file (never echoed, never logged, deleted on exit)
#
# Output: library/footage/<moment>/<persona>-b<build>.v<N>.mp4 + a draft footage manifest entry
# (id footage.<persona>.<moment>-b<build>.v<N>, uploaded to S3), clean status bar (9:41, full battery, full bars).
# Logs go to .cache/capture/ (gitignored), never into library/.
set -euo pipefail
[ $# -ge 5 ] || { sed -n '2,20p' "$0"; exit 1; }
PERSONA=$1; MOMENT=$2; PROBE=$3; STOP=$4; MAX=$5; shift 5
ROOT=$(cd "$(dirname "$0")/.." && pwd)
APP=${CURATE_APP_DIR:-$ROOT/../curate-app}
U=${SIM_UDID:-$(cat "$ROOT/tools/sim-udid.txt" 2>/dev/null || true)}
[ -n "$U" ] || { echo "Set SIM_UDID or write the simulator UDID to tools/sim-udid.txt"; exit 1; }
PUBSPEC_VERSION=$(grep -E '^version:' "$APP/pubspec.yaml" | awk '{print $2}')
VERSION=${PUBSPEC_VERSION%%+*}
BUILD=${APP_BUILD:-${PUBSPEC_VERSION##*+}}
COMMIT=$(git -C "$APP" rev-parse --short HEAD)
DEVICE=$(xcrun simctl list devices | grep "$U" | sed -E 's/^ *([^()]+) \(.*/\1/' | xargs)

DIR="$ROOT/library/footage/$MOMENT"; mkdir -p "$DIR" "$ROOT/.cache/capture"
N=1; while [ -e "$DIR/$PERSONA-b$BUILD.v$N.mp4" ]; do N=$((N+1)); done
NAME="$PERSONA-b$BUILD.v$N"; OUT="$DIR/$NAME.mp4"; ID="footage.$PERSONA.$MOMENT-b$BUILD.v$N"
LOG="$ROOT/.cache/capture/$MOMENT-$NAME.log"; : > "$LOG"

EXTRA=()
if [ "${CAPTURE_SIGNIN:-0}" = 1 ]; then
  SECRET=$(node -e "const a=require('$ROOT/library/people/$PERSONA/account.json');if(!a.secret)process.exit(2);console.log(a.secret.name)")
  TMP=$(mktemp); chmod 600 "$TMP"; trap 'rm -f "$TMP"' EXIT
  EMAIL=$(node -e "console.log(require('$ROOT/library/people/$PERSONA/account.json').email)")
  # the value goes straight from SSM into the 0600 file via env; it is never echoed
  CAPTURE_PW=$(aws ssm get-parameter --name "$SECRET" --with-decryption --query Parameter.Value --output text --region us-east-1) \
    CAPTURE_EMAIL="$EMAIL" OUTFILE="$TMP" node -e "require('fs').writeFileSync(process.env.OUTFILE, JSON.stringify({CAPTURE_EMAIL: process.env.CAPTURE_EMAIL, CAPTURE_PASSWORD: process.env.CAPTURE_PW}))"
  EXTRA+=("--dart-define-from-file=$TMP")
fi

xcrun simctl status_bar "$U" override --time "9:41" --batteryState charged --batteryLevel 100 --cellularMode active --cellularBars 4 --wifiBars 3 --dataNetwork wifi
cd "$APP"
flutter run -t "lib/dev/$PROBE.dart" -d "$U" "${EXTRA[@]}" "$@" > "$LOG" 2>&1 < /dev/null &
FP=$!
for _ in $(seq 1 1800); do # up to 15 min for a cold build
  grep -q "A Dart VM Service\|Flutter run key commands\|Syncing files" "$LOG" && break
  kill -0 $FP 2>/dev/null || { echo "FLUTTER_EXITED"; tail -30 "$LOG"; exit 1; }
  sleep 0.5
done
xcrun simctl io "$U" recordVideo --codec=h264 --force "$OUT" > "$LOG.rec" 2>&1 &
RP=$!; START=$(date +%s)
while true; do
  [ $(( $(date +%s) - START )) -ge "$MAX" ] && break
  [ "$STOP" != "-" ] && grep -q "$STOP" "$LOG" && { sleep 1.5; break; }
  sleep 0.5
done
kill -INT $RP; wait $RP 2>/dev/null || true
pkill -f "[f]lutter_tools.snapshot run -t lib/dev/$PROBE.dart -d $U" 2>/dev/null || true
kill $FP 2>/dev/null || true
xcrun simctl status_bar "$U" clear
cd "$ROOT"

# Marks: any "MARK <name>" lines the probe printed, as seconds from the recording start.
MARKS=$(node -e "
const fs=require('fs');const t0=$START;const m={};
for(const l of fs.readFileSync('$LOG','utf8').split('\n')){const r=/MARK ([a-z0-9-]+) ([0-9.]+)/.exec(l);if(r)m[r[1]]=Math.max(0,Number(r[2])-t0);}
console.log(JSON.stringify(m))")

tools/catalog add "library/footage/$MOMENT/$NAME.mp4" --kind footage --id "$ID" --licence curate --ai false \
  --title "$MOMENT, $PERSONA's account, build $BUILD" --source-tool tools/capture.sh \
  --tags "persona=$PERSONA,moment=$MOMENT" --by "${CAPTURE_BY:-agent}" \
  --set "moment=$MOMENT" --set "account=$PERSONA" --set "device=$DEVICE" --set cleanStatusBar=true \
  --set "app={\"build\":$BUILD,\"version\":\"$VERSION\",\"commit\":\"$COMMIT\",\"env\":\"prod\"}" \
  --set "marks=$MARKS"
echo "DONE $ID  ($OUT)"
