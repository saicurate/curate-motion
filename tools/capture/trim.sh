#!/bin/bash
# trim.sh SRC START END OUT.mp4   (START/END = animation start/end in s; adds 0.5 s handles)
# High-quality H.264, CFR 60 fps, colour tags kept. Also writes a small preview mp4 + jpg poster.
set -e
SRC=$1; A=$2; B=$3; OUT=$4; H=${5:-0.5}
S=$(python3 -c "print(max(0,$A-$H))"); D=$(python3 -c "print(($B+$H)-max(0,$A-$H))")
mkdir -p "$(dirname "$OUT")"
ffmpeg -v error -y -ss "$S" -i "$SRC" -t "$D" -an -vf "fps=60" -c:v libx264 -preset slow -crf 14 -pix_fmt yuv420p \
  -colorspace bt709 -color_primaries smpte432 -color_trc iec61966-2-1 -movflags +faststart "$OUT"
P=/Users/saikumar/Desktop/Curate/marketing/videos/footage/_previews
mkdir -p "$P"; N=$(basename "$OUT" .mp4)
ffmpeg -v error -y -i "$OUT" -an -vf "fps=30,scale=300:-2" -c:v libx264 -preset slow -crf 30 -pix_fmt yuv420p -movflags +faststart "$P/$N.mp4"
ffmpeg -v error -y -ss $(python3 -c "print(min($D*0.5, $D-0.1))") -i "$OUT" -frames:v 1 -vf "scale=300:-2" -q:v 4 "$P/$N.jpg"
echo "$OUT $(du -h "$OUT" | cut -f1) preview $(du -h "$P/$N.mp4" | cut -f1)"
