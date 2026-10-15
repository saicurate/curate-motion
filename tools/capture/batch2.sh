#!/bin/bash
C=/private/tmp/claude-501/-Users-saikumar-Desktop-Curate-curate-app/8dfb7189-122d-440a-a9c0-c4ad2cfe63b8/scratchpad/cap
P=CE85B987-DEDA-4652-BC2F-B48F3A48968B
clear_alert() { axe tap --label "Allow Full Access" --udid $P >/dev/null 2>&1; axe tap --label "Allow" --udid $P >/dev/null 2>&1; true; }
clear_alert
$C/pr.sh wardrobe_leave_probe p06-wardrobe-leave-b 30 PROBE_DONE; clear_alert
for m in beach kept idea wait night morning pet back peek empty; do
  D=25; [ $m = beach ] && D=55; [ $m = wait ] && D=40
  $C/pr.sh zee_extras_probe p07-zee-$m-b $D - --dart-define=PROBE_MOMENT=$m; clear_alert
done
$C/pr.sh first_minute_probe p08-required-update 15 - --dart-define=PROBE_STAGE=update; clear_alert
$C/pr.sh photos_off_probe p05-photos-off-b 30 - --dart-define=PROBE_MODE=flow; clear_alert
echo BATCH_DONE
