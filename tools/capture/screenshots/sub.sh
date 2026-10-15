#!/bin/bash
E=$(dirname $0)/e.sh
for p in "365 style-profile" "420 skin-tone" "475 body-measurements" "530 saved-items"; do
  set -- $p
  $E label Settings >/dev/null; sleep 2.5
  $E tap 220 $1; sleep 3.5; $E shot settings-$2; $E label Back >/dev/null; sleep 1.5; $E label Back >/dev/null; sleep 1.5
done
