#!/bin/bash
# reg.sh ID MOMENT SCREEN SOURCE(app|probe) FILE "TITLE" [extra tags] [--no-push]
# registers a footage clip as draft with the curate licence preset.
set -e
ID=$1; MOMENT=$2; SCREEN=$3; SRC=$4; FILE=$5; TITLE=$6; EXTRA=${7:-}; NP=${8:---no-push}
cd /Users/saikumar/Desktop/Curate/curate-motion
TAGS="persona=emma,moment=$MOMENT,screen=$SCREEN,appBuild=262,source=$SRC"
[ -n "$EXTRA" ] && TAGS="$TAGS,$EXTRA"
DEV="Emma Marketing 17PM (iPhone 17 Pro Max simulator, iOS 26.5)"
TOOL="xcrun simctl io recordVideo + ffmpeg trim (app-footage capture agent)"
[ "$SRC" = probe ] && TOOL="lib/dev probe with Emma's real assets; xcrun simctl io recordVideo + ffmpeg trim"
tools/catalog add "$FILE" --kind footage --id "$ID" --licence curate --ai false \
  --title "$TITLE" --source-tool "$TOOL" --tags "$TAGS" --by claude-code-capture-agent \
  --set "moment=$MOMENT" --set "account=emma" --set "device=$DEV" --set cleanStatusBar=true \
  --set 'app={"build":262,"version":"1.5.0","commit":"5aff9592","env":"prod"}' $NP 2>&1 | tail -3
