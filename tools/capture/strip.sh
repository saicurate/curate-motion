#!/bin/bash
# strip.sh SRC START DUR FPS OUT.png [cols]  -> contact sheet; frame i = START + i/FPS
C=${6:-10}
ffmpeg -v error -y -ss $2 -t $3 -i "$1" -vf "fps=$4,scale=110:-1,tile=${C}x$(python3 -c "import math;print(math.ceil($3*$4/$C))")" -frames:v 1 "$5"
