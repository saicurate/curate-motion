#!/bin/bash
# render.sh ID VERSION LABEL... : renders motion test cID-mt to cuts/cID-motion-test-vN.mp4 and a frame sheet
set -e
R=/Users/saikumar/Desktop/Curate/marketing/videos/remotion; T=/Users/saikumar/Desktop/Curate/marketing/videos/tools
id=$1; v=$2
cd $R
python3 $T/status.py log "Rendering the motion test for concept ${id#c}."
npx remotion render $id-mt ../cuts/$id-motion-test-v$v.mp4 --codec=h264 --crf=24 --concurrency=3 > $T/frames/$id-v$v.render.log 2>&1
ffmpeg -v error -y -i ../cuts/$id-motion-test-v$v.mp4 -vf "fps=3,scale=150:-1,tile=12x3" -frames:v 1 $T/frames/$id-v$v.png
ls -la ../cuts/$id-motion-test-v$v.mp4
