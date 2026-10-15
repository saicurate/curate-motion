#!/bin/bash
# preview.sh COMP NAME [fps]: quick draft render to frames/NAME.draft.mp4 + a contact sheet frames/NAME.png
set -e
R=/Users/saikumar/Desktop/Curate/marketing/videos/remotion; T=/Users/saikumar/Desktop/Curate/marketing/videos/tools
comp=$1; name=$2; f=${3:-2}
cd $R
npx remotion render $comp $T/frames/$name.draft.mp4 --codec=h264 --crf=30 --scale=0.5 --concurrency=3 > $T/frames/$name.draft.log 2>&1 || { tail -30 $T/frames/$name.draft.log; exit 1; }
n=$(ffprobe -v error -show_entries format=duration -of csv=p=0 $T/frames/$name.draft.mp4)
ffmpeg -v error -y -i $T/frames/$name.draft.mp4 -vf "fps=$f,scale=180:-1,tile=10x4" -frames:v 1 $T/frames/$name.png
echo "$name $n s"
