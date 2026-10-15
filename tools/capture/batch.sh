#!/bin/bash
C=/private/tmp/claude-501/-Users-saikumar-Desktop-Curate-curate-app/8dfb7189-122d-440a-a9c0-c4ad2cfe63b8/scratchpad/cap
P=CE85B987-DEDA-4652-BC2F-B48F3A48968B
# Apple's real notification prompt: tap Allow when it shows (probe simulator only)
( axe tap --label "Allow" --wait-timeout 150 --pre-delay 1.5 --udid $P >/dev/null 2>&1 ) &
$C/pr.sh pieces_wait_probe p03-pieces-wait 80 PROBE_DONE --dart-define=PROBE_ASK=real
$C/pr.sh photos_off_probe p04-photos-off 45 - --dart-define=PROBE_MODE=flow
$C/pr.sh photos_off_probe p05-photos-off 45 - --dart-define=PROBE_MODE=flow
$C/pr.sh wardrobe_leave_probe p06-wardrobe-leave 30 PROBE_DONE
for m in beach kept idea wait night morning pet back peek empty; do
  D=25; [ $m = beach ] && D=55; [ $m = wait ] && D=40
  $C/pr.sh zee_extras_probe p07-zee-$m $D - --dart-define=PROBE_MOMENT=$m
done
$C/pr.sh first_minute_probe p08-required-update 15 - --dart-define=PROBE_STAGE=update
echo BATCH_DONE
