#!/bin/bash
# fr.sh SRC OUT.png t1 t2 ...   single accurate frames side by side (300px wide each)
S=$1; O=$2; shift 2; ARGS=(); F=""; i=0
for t in "$@"; do ARGS+=(-ss $t -i "$S"); F="$F[$i:v]scale=200:-1[v$i];"; i=$((i+1)); done
L=""; for j in $(seq 0 $((i-1))); do L="$L[v$j]"; done
ffmpeg -v error -y "${ARGS[@]}" -filter_complex "${F}${L}hstack=$i" -frames:v 1 "$O"
