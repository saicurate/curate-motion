# App animation inventory: Curate 1.5.0 (262)

Every animation and motion moment in build 262 (release/1.5.0-262 @5aff9592), read from the code, with the footage
clip(s) that show it. Code paths are relative to `lib/` in curate-app. Generated 2026-10-15 by the
app-footage capture agent (scratchpad `inventory.py`); regenerate rather than hand-edit.

**131 moments: 90 captured from Emma's real account, 27 captured through a lib/dev probe with her real
assets, 14 not possible, 0 not captured yet.**

Sources: `app` = recorded on simulator "Emma Marketing 17PM" from her live account (or cut from the earlier
clean takes photo-scan-v1, onboarding-v1, signup-v1). `probe` = `lib/dev/*_probe.dart` from build 262 run on a
separate probe simulator, with her selfie, camera-roll photos and real wardrobe pieces swapped in for the probe's
stand-ins and Zee pack zee-sharp-v1 (the pack her phone has cached). Every clip id below is a draft footage asset.


## Splash

| Moment | Code | What moves | Status | Clips | Note |
|---|---|---|---|---|---|
| `cold-launch-splash` | `lib/features/splash/presentation/splash_screen.dart:33` | Mark + "curate" fade 0.4↔1, 1100 ms, repeating | captured (her account) | `footage.emma.cold-launch-splash.v1`, `footage.emma.cold-launch-splash.v2` |  |

## Front door

| Moment | Code | What moves | Status | Clips | Note |
|---|---|---|---|---|---|
| `front-door-type-reel` | `lib/features/auth/presentation/front_door_screen.dart:661 (_ReelWord), :438` | Try it. / Style it. / Wear it. letters rise 620 ms, 34 ms stagger; older lines climb and grey | captured (her account) | `footage.emma.front-door-type-reel.v1` | from signup-v1 (only clean stretch of that take) |
| `front-door-chrome-rise` | `lib/features/auth/presentation/front_door_screen.dart:414, :480` | Wordmark, hairline, Get started rise in | captured (her account) | `footage.emma.front-door-type-reel.v1` | inside the type-reel clip |
| `front-door-doors-open` | `lib/features/auth/presentation/front_door_screen.dart:277, :527, :604` | Reel rolls to "Sign in.", Apple/Google/Email rows slide in | captured (her account) | `footage.emma.front-door-doors-open.v1` |  |

## Sign up

| Moment | Code | What moves | Status | Clips | Note |
|---|---|---|---|---|---|
| `email-signup-push` | `lib/features/auth/presentation/email_auth_screen.dart:508` | Create your account page pushes in; field focus border 300 ms | captured (her account) | `footage.emma.email-signup-push.v1` |  |
| `verify-code-boxes` | `lib/features/auth/presentation/widgets/code_field.dart:100` | Code boxes fill per digit, 140 ms | not possible | – | Emma's test123.com domain skips the code; screen flashes for 1 s only |

## Sign in

| Moment | Code | What moves | Status | Clips | Note |
|---|---|---|---|---|---|
| `forgot-password-steps` | `lib/features/auth/presentation/forgot_password_screen.dart:264` | Email → code → password, 220 ms switcher | not possible | – | would need a reset email to her account; not an ad moment |

## Onboarding

| Moment | Code | What moves | Status | Clips | Note |
|---|---|---|---|---|---|
| `ob-screen-change` | `lib/features/onboarding/presentation/onboarding_screen.dart:196` | New step fades in and rises 14 pt, 420 ms | captured (her account) | `footage.emma.ob-handle-stamp-fly.v1` | seen between every step |

## Onboarding 01 About

| Moment | Code | What moves | Status | Clips | Note |
|---|---|---|---|---|---|
| `ob-about-name-birthday` | `lib/features/onboarding/presentation/stages/form_stage.dart:223` | Name typed in, birthday wheel unfolds 420 ms, Next enables | captured (her account) | `footage.emma.ob-about-name-birthday.v1` |  |

## Onboarding 02 Username

| Moment | Code | What moves | Status | Clips | Note |
|---|---|---|---|---|---|
| `ob-username-check` | `lib/features/onboarding/presentation/stages/username_stage.dart:264-284` | Rows rise, spinners → ticks 1320+300·i ms | captured (her account) | `footage.emma.ob-username-check.v1` | clip starts after a red Flutter error frame in the take; error excluded |
| `ob-handle-stamp-fly` | `lib/features/onboarding/presentation/stages/username_stage.dart:1375` | Stamp, @handle flies into the name chip, landing pulse | captured (her account) | `footage.emma.ob-handle-stamp-fly.v1` |  |

## Onboarding 03 This or that

| Moment | Code | What moves | Status | Clips | Note |
|---|---|---|---|---|---|
| `ob-pairs-bracket-fold` | `lib/features/onboarding/presentation/stages/pairs_stage.dart:348, :407` | Pairs in 440 ms, knockouts grey, bracket folds into ranked rows | captured (her account) | `footage.emma.ob-pairs-bracket-fold.v1` |  |

## Onboarding 04 Budget

| Moment | Code | What moves | Status | Clips | Note |
|---|---|---|---|---|---|
| `ob-budget-card-flip` | `lib/features/onboarding/presentation/stages/shopping_habits_stage.dart:135-168` | Slider glide, card flips 440 ms, price counts up | captured (her account) | `footage.emma.ob-budget-card-flip.v1` |  |

## Onboarding 05 Mirror

| Moment | Code | What moves | Status | Clips | Note |
|---|---|---|---|---|---|
| `ob-mirror-reading` | `lib/features/onboarding/presentation/stages/skin_tone_stage.dart:241, :251; widgets/mesh_follow.dart:377` | Selfie flies in, reading sweep and counter, readouts tick | captured (her account) | `footage.emma.ob-mirror-reading.v1` | simulator has no camera: her selfie came from Photos (the real "Choose a photo" path) |
| `ob-mirror-payoff` | `lib/features/onboarding/presentation/stages/skin_tone_stage.dart:305-311` | Colour dots fill, Deep Autumn, ring hand-off | captured (her account) | `footage.emma.ob-mirror-payoff.v1` |  |
| `ob-mirror-live-mesh` | `lib/features/onboarding/presentation/widgets/mesh_follow.dart:377` | Live camera: mesh dots search, lock, follow the head; aperture blades close 900 ms | not possible | – | needs a live camera feed; onboarding_mirror_probe only takes its bundled face, no image path |

## Onboarding 06 Body

| Moment | Code | What moves | Status | Clips | Note |
|---|---|---|---|---|---|
| `ob-body-3d` | `lib/features/onboarding/presentation/stages/measurements_stage.dart:698; widgets/body_avatar.dart` | 3D SMPL body loads in | captured (her account) | `footage.emma.ob-body-3d.v1` |  |
| `ob-body-3d-tapes` | `lib/features/onboarding/presentation/stages/measurements_stage.dart:759, :863; shared/widgets/window_ruler.dart:82` | Body morphs, one tape lit at a time, ruler window 220 ms | captured (her account) | `footage.emma.ob-body-3d-tapes.v1` |  |

## Onboarding

| Moment | Code | What moves | Status | Clips | Note |
|---|---|---|---|---|---|
| `ob-resume-line` | `lib/features/onboarding/presentation/widgets/resume_line.dart:49` | Resume line grows 600 ms, holds 4.2 s, folds | not possible | – | only on a run reopened part-way; her onboarding is done |

## Wardrobe (empty)

| Moment | Code | What moves | Status | Clips | Note |
|---|---|---|---|---|---|
| `zee-asks-empty-wardrobe` | `lib/features/wardrobe_tab/presentation/zee_asks.dart:204, :68-100` | Zee at 0.3 s, bubbles 1.0/1.75 s, answers 3.0 s | captured (her account) | `footage.emma.zee-asks-empty-wardrobe.v1` | from photo-scan-v1, recorded when she had 0 pieces |
| `zee-asks-on-it` | `lib/features/wardrobe_tab/presentation/zee_asks.dart:68-100` | Tap → her bubble → "On it." | captured (her account) | `footage.emma.zee-asks-on-it.v1` |  |
| `zee-asks-working` | `lib/features/wardrobe_tab/presentation/zee_asks.dart:250-260` | Back mid-scan: words rise, wardrobe.working | captured (probe) | `footage.emma.photos-off-two-taps.v1` | 0 pieces only; seen at the start of the photos-off probe take |

## Privacy shield

| Moment | Code | What moves | Status | Clips | Note |
|---|---|---|---|---|---|
| `privacy-shield-zee-peek` | `lib/features/gallery_import/presentation/privacy_shield_screen.dart:165, :574, :627, :722` | Shield draws, fills, tick; Zee rises and hops; ticked lines; consent | captured (her account) | `footage.emma.privacy-shield-zee-peek.v1` |  |

## Selfie step

| Moment | Code | What moves | Status | Clips | Note |
|---|---|---|---|---|---|
| `selfie-ring-zee-peek` | `lib/features/gallery_import/presentation/selfie_step_screen.dart:355, :412` | Ring in, Zee peeks 0.5 s, words 1.2 s, dashed ring turns | captured (probe) | `footage.emma.selfie-ring-zee-peek.v1`, `footage.emma.selfie-ring-zee-peek.v2` | her selfie is stored, so the real step is skipped on her account |

## Selfie camera

| Moment | Code | What moves | Status | Clips | Note |
|---|---|---|---|---|---|
| `selfie-ring-opens` | `lib/features/gallery_import/presentation/selfie_step_screen.dart:576, :593` | Ring grows into the camera circle 0.9 s, Zee rides its edge | captured (probe) | `footage.emma.selfie-ring-opens.v1`, `footage.emma.selfie-ring-opens.v2` | stand-in feed = her selfie (curate-motion/library/people/emma/selfie) |
| `selfie-live-hints` | `lib/features/gallery_import/presentation/selfie_step_screen.dart:553; domain/selfie_hints.dart` | Come closer · Into the circle · More light · Perfect, Zee reacts | captured (probe) | `footage.emma.selfie-live-hints.v1`, `footage.emma.selfie-live-hints.v2` |  |
| `selfie-shutter-thats-you` | `lib/features/gallery_import/presentation/selfie_step_screen.dart:624, :610, :978` | Blink, ring closes, Zee jumps, "That's you! ✨" | captured (probe) | `footage.emma.selfie-shutter-thats-you.v1`, `footage.emma.selfie-shutter-thats-you.v2` |  |
| `selfie-hand-back` | `lib/features/gallery_import/presentation/selfie_step_screen.dart:740, :706` | Circle shrinks back into the ring, "There you are" | captured (probe) | `footage.emma.selfie-hand-back.v1`, `footage.emma.selfie-hand-back.v2` |  |

## Photos access

| Moment | Code | What moves | Status | Clips | Note |
|---|---|---|---|---|---|
| `photo-access-consent` | `lib/features/gallery_import/presentation/photo_access_screen.dart` | No motion (static consent page) | not possible | – | static: no animation to clip (seen in take t16) |

## Photos off

| Moment | Code | What moves | Status | Clips | Note |
|---|---|---|---|---|---|
| `photos-off-two-taps` | `lib/features/gallery_import/presentation/photos_off_screen.dart:248, :344, :81-106` | Card, Zee peeks 0.6 s, words 1.3 s, rows light 2.0/2.85 s, tick | captured (probe) | `footage.emma.photos-off-two-taps.v1` | Settings round trip cannot be driven on her sim (revoking Photos sends Add item to Apple's picker) |
| `photos-off-yay` | `lib/features/gallery_import/presentation/photos_off_screen.dart:304, :351, :861` | Pieces pop up in the card, "Yay! 🎉", hand-off to the scan | captured (probe) | `footage.emma.photos-off-yay.v1` |  |

## Scan

| Moment | Code | What moves | Status | Clips | Note |
|---|---|---|---|---|---|
| `scan-stage-rise-deck` | `lib/features/gallery_import/presentation/import_transitions.dart:98; scan_opening.dart:13, :339` | Stage rises 600 ms; deck riffles and deals 55 ms apart | captured (her account) | `footage.emma.scan-stage-rise-deck.v1` |  |
| `scan-roll` | `lib/features/gallery_import/presentation/import_stage_screen.dart:403, :833` | The roll at the scan's real speed | captured (her account) | `footage.emma.scan-roll.v1` |  |
| `scan-lens` | `lib/features/gallery_import/presentation/scan_touches.dart:81; import_stage_screen.dart:632-670` | Zee's magnifier steps over the photos | captured (her account) | `footage.emma.scan-roll.v1` | inside scan-roll |
| `scan-lift-to-picked` | `lib/features/gallery_import/presentation/scan_touches.dart:67; import_stage_screen.dart:331, :1431` | Photo of her grows, flips, flies into Picked | captured (her account) | `footage.emma.scan-roll.v1` | inside scan-roll |
| `scan-found-end` | `lib/features/gallery_import/presentation/scan_touches.dart:181` | Fan of 3, "Found 30 photos of you", Zee | captured (her account) | `footage.emma.scan-found-end.v1` |  |
| `wardrobe-tab-ring` | `lib/features/wardrobe_tab/presentation/wardrobe_first_minute.dart:218` | Ring fills on the Wardrobe icon during a run | captured (probe) | `footage.emma.tell-me-notification-ask.v1` | visible on the tab bar at the end of the clip |

## Pieces wait

| Moment | Code | What moves | Status | Clips | Note |
|---|---|---|---|---|---|
| `pieces-photo-up-big` | `lib/features/gallery_import/presentation/pieces_wait.dart:154, :130-149; pieces_stage.dart:1126` | Her photo up big with a light sweep, next every 3.4 s | captured (her account) | `footage.emma.pieces-photo-up-big.v1` |  |
| `pieces-zee-lines` | `lib/features/gallery_import/presentation/pieces_wait.dart:24, :245, :292` | Zee's lines: bubble in 450 / out 300 ms | captured (her account) | `footage.emma.pieces-photo-up-big.v1`, `footage.emma.style-fact-pill.v1` |  |
| `style-fact-pill` | `lib/features/gallery_import/presentation/style_fact_pill.dart:99` | Server style lines word by word | captured (her account) | `footage.emma.style-fact-pill.v1` |  |
| `first-piece-lift` | `lib/features/gallery_import/presentation/pieces_stage.dart:723` | Piece grows from 55 %, out of a 7 pt blur | captured (her account) | `footage.emma.first-piece-lift.v1`, `footage.emma.first-piece-lift.v2` | v2 is a probe take |
| `pieces-up-and-tuck` | `lib/features/gallery_import/presentation/pieces_stage.dart:715-726` | Piece rises, breathes, tucks into the row; named | captured (her account) | `footage.emma.pieces-up-and-tuck.v1` |  |
| `tell-me-pill` | `lib/features/gallery_import/presentation/pieces_wait.dart:363` | Pill rises 14 pt over 600 ms at 3.9 s | captured (her account) | `footage.emma.pieces-photo-up-big.v1` |  |
| `tell-me-notification-ask` | `lib/features/gallery_import/data/ready_notice.dart; pieces_stage.dart:600` | Apple's notification prompt, then down to the Wardrobe | captured (probe) | `footage.emma.tell-me-notification-ask.v1` | her phone already granted notifications |
| `wardrobe-ready-cheer` | `lib/features/gallery_import/presentation/pieces_stage.dart:318, :538, :902` | Zee walks up and cheers, two 260 pt rings | captured (her account) | `footage.emma.wardrobe-ready-cheer.v1` |  |

## Wardrobe

| Moment | Code | What moves | Status | Clips | Note |
|---|---|---|---|---|---|
| `at-work-pill-rise` | `lib/features/wardrobe_tab/presentation/wardrobe_at_work.dart:124-126, :194` | Curate at work pill rises 14 pt / 500 ms, Zee's face | captured (her account) | `footage.emma.at-work-pill-rise.v1`, `footage.emma.tell-me-notification-ask.v1` | real run of 1 new photo; ends in "taking longer" card |
| `ready-pill-change` | `lib/features/wardrobe_tab/presentation/wardrobe_at_work.dart:126, :160-168` | "Curate at work" → "Your wardrobe is ready ›" 450 ms | captured (probe) | `footage.emma.ready-pill-change.v1` | needs a run that finishes while she is on the tab; wardrobe_leave_probe |
| `ready-pill-to-cheer` | `lib/features/wardrobe_tab/presentation/wardrobe_at_work.dart:327` | Tap the pill: stage rises back onto the cheer | captured (probe) | `footage.emma.ready-pill-to-cheer.v1` | wardrobe_leave_probe; real cheer also in wardrobe-ready-cheer.v1 |

## Import review

| Moment | Code | What moves | Status | Clips | Note |
|---|---|---|---|---|---|
| `review-count-up` | `lib/features/gallery_import/presentation/import_review_screen.dart:42` | Count-up 1500 ms, tiles fade/scale | captured (her account) | `footage.emma.review-count-up.v1` |  |
| `review-remove-undo` | `lib/features/gallery_import/presentation/import_review_screen.dart:42` | Grid closes up 480 ms, undo bar slides 250 ms | captured (her account) | `footage.emma.review-remove-undo.v1` |  |
| `review-add-to-wardrobe` | `lib/features/gallery_import/presentation/import_review_screen.dart:42` | Add: spinner, pop, Wardrobe with New · 40 | captured (her account) | `footage.emma.review-add-to-wardrobe.v1` |  |

## Wardrobe

| Moment | Code | What moves | Status | Clips | Note |
|---|---|---|---|---|---|
| `new-piece-land` | `lib/features/gallery_import/presentation/gi_style.dart:345` | New pieces land 520 ms (overshoot) | captured (her account) | `footage.emma.review-add-to-wardrobe.v1` | end of the clip |
| `grid-rise-in` | `shared/widgets/states/rise_in.dart; wardrobe_tab_screen.dart:473` | First 12 rise 6 pt / 420 ms, 160 ms stagger | captured (her account) | `footage.emma.cold-launch-splash.v1` | end of the cold-launch clip |
| `pure-float-pieces` | `shared/garment/garment_float.dart:436` | Pure-float pieces fade in 180 ms as they load | captured (her account) | `footage.emma.wardrobe-scroll-float.v1` |  |
| `wardrobe-chip-filter` | `lib/features/wardrobe_tab/presentation/wardrobe_tab_screen.dart:1156, :1548` | Chips AnimatedContainer 160-180 ms | captured (her account) | `footage.emma.wardrobe-chip-filter.v1` |  |
| `wardrobe-scroll-float` | `lib/features/shell/presentation/app_shell.dart:313` | Scroll; the glass bar hides 220 ms and returns | captured (her account) | `footage.emma.wardrobe-scroll-float.v1` |  |
| `grid-skeleton-shimmer` | `shared/widgets/states/shimmer.dart:26` | 1150 ms band (on-brand loading) | captured (her account) | `footage.emma.cold-launch-splash.v2` | seen for a frame or two on launch |

## Wardrobe item

| Moment | Code | What moves | Status | Clips | Note |
|---|---|---|---|---|---|
| `item-detail-open` | `lib/features/wardrobe_tab/presentation/wardrobe_tab_screen.dart:369` | iOS push | captured (her account) | `footage.emma.item-detail-open.v1` |  |
| `item-edit-sheet` | `lib/features/wardrobe_tab/presentation/wardrobe_item_screen.dart:185` | Modal sheet | captured (her account) | `footage.emma.item-edit-sheet.v1` |  |
| `item-detail-back` | `lib/features/wardrobe_tab/presentation/wardrobe_tab_screen.dart:369` | Sheet down, pop | captured (her account) | `footage.emma.item-detail-back.v1` |  |

## Wardrobe

| Moment | Code | What moves | Status | Clips | Note |
|---|---|---|---|---|---|
| `favourite-heart` | `lib/features/wardrobe_tab/presentation/wardrobe_tab_screen.dart:743` | Haptic only, no motion | not possible | – | no animation (haptic only) |
| `add-item-sheet` | `lib/features/wardrobe_tab/presentation/wardrobe_photo_sheet.dart:62, :385` | Sheet, ShimmerBlock thumbs 1150 ms | captured (her account) | `footage.emma.add-item-sheet.v1` |  |

## Extraction

| Moment | Code | What moves | Status | Clips | Note |
|---|---|---|---|---|---|
| `extraction-wait` | `lib/features/wardrobe_tab/presentation/extraction_lit.dart:991, :1032, :24-40` | Light band, dots and tags, ring, done bar | captured (her account) | `footage.emma.extraction-wait.v1` | real Add item of one packshot (navy cap) |
| `extraction-found-tag` | `lib/features/wardrobe_tab/presentation/extraction_lit.dart:24-40` | Dot → tag pop | captured (her account) | `footage.emma.extraction-found-tag.v1` |  |

## Duplicate review

| Moment | Code | What moves | Status | Clips | Note |
|---|---|---|---|---|---|
| `duplicate-review-sheet` | `lib/features/wardrobe_tab/presentation/duplicate_review.dart:84, :111` | Sheet enter 450 ms | captured (her account) | `footage.emma.duplicate-review-sheet.v1` |  |
| `duplicate-review-pick` | `lib/features/wardrobe_tab/presentation/duplicate_review.dart:212-227` | Ring and check AnimatedScale 350 ms | captured (her account) | `footage.emma.duplicate-review-pick.v1` |  |
| `duplicate-review-keep` | `lib/features/wardrobe_tab/presentation/duplicate_review.dart:258, :923` | Fold 500 ms, leave 350 ms, undo bar | captured (her account) | `footage.emma.duplicate-review-keep.v1` | kept her existing cap: wardrobe stays 49 |

## Wardrobe

| Moment | Code | What moves | Status | Clips | Note |
|---|---|---|---|---|---|
| `tab-peek` | `lib/features/muse/presentation/muse_peek.dart:57` | Zee peeks from behind the bar | captured (probe) | `footage.emma.zee-b11-peek.v1` | server rule off for her |

## Tab bar

| Moment | Code | What moves | Status | Clips | Note |
|---|---|---|---|---|---|
| `tab-switch` | `lib/features/shell/presentation/widgets/swipeable_branches.dart:117, :176; liquid_glass_nav_bar.dart:90` | Pager 260 ms; glass capsule 460 ms; no haptic | captured (her account) | `footage.emma.tab-switch.v1` | haptic-free transitions |
| `reselect-nudge` | `lib/features/shell/presentation/widgets/liquid_glass_nav_bar.dart:96, :416` | Spring nudge on Home re-tap | not possible | – | Home tab is off in 262 |

## Chat

| Moment | Code | What moves | Status | Clips | Note |
|---|---|---|---|---|---|
| `chat-mist-skin` | `lib/features/ask/presentation/ask_main_thread.dart:1512; wardrobe_tab/presentation/chat/chat_mist.dart` | Mist ground #F6F7F7 (always on in 262) | captured (her account) | `footage.emma.chat-open-starters.v1` | confirmed on her phone: chat ground is #F6F7F7 |
| `chat-open-starters` | `lib/features/ask/presentation/ask_today_block.dart:88` | Zee hero, greeting, starters dealt in | captured (her account) | `footage.emma.chat-open-starters.v1`, `footage.emma.chat-new-from-drawer.v1` |  |
| `zee-clip-player` | `lib/features/muse/presentation/muse_sequence.dart:73; muse_slot.dart:40` | Zee WebP intro/loop/outro, 200 ms cross-fades (pack zee-sharp-v1) | captured (her account) | `footage.emma.zee-pet.v1` | her phone's cache matches zee-sharp-v1 (52/52 clips) |
| `zee-pet` | `lib/features/ask/presentation/ask_muse_hero.dart:68, :150, :190` | Hop, squish, tap ring (b7) | captured (her account) | `footage.emma.zee-pet.v1` |  |
| `composer-type-send` | `lib/features/wardrobe_tab/presentation/chat/chat_result_view.dart:6002, :4825, :2235` | Send circle inks; her bubble grows in 0.42 s | captured (her account) | `footage.emma.composer-type-send.v1`, `footage.emma.composer-type-send.v2` |  |
| `chat-pending-dots` | `lib/features/wardrobe_tab/presentation/chat/chat_result_view.dart:6140, :4185, :4218` | Zee thinking + "Putting it together", dots | captured (her account) | `footage.emma.question-card-arrive.v1`, `footage.emma.dates-card-arrive.v1` |  |
| `question-card-arrive` | `lib/features/ask/presentation/thread/ask_question.dart:347` | v1 single-choice card arrives | captured (her account) | `footage.emma.question-card-arrive.v1` | "What's tonight?" |
| `question-card-answer` | `lib/features/ask/presentation/thread/ask_question.dart:441, :372` | Card folds 320 ms after a 1.1 s linger | captured (her account) | `footage.emma.question-card-answer.v1` |  |
| `dates-card-arrive` | `lib/features/ask/presentation/thread/ask_question_cards.dart:342` | v2 dates card: band 400 ms, month grid | captured (her account) | `footage.emma.dates-card-arrive.v1` |  |
| `dates-card-pick` | `lib/features/ask/presentation/thread/ask_question_cards.dart:342, :589` | Range dots 420 ms, Done folds it | captured (her account) | `footage.emma.dates-card-pick.v1` |  |
| `steps-card` | `lib/features/ask/presentation/thread/ask_question_cards.dart:785, :1001` | Fill-in-the-blanks steps card | not possible | – | the brain answered "work tomorrow" with a look, not a steps card; no budget left to fish for it |
| `memory-pill-flight` | `lib/features/ask/presentation/thread/ask_memory.dart:167` | "Saved to your notebook" pill flies into ☰ | not possible | – | needs the steps card answer |
| `location-ask-foggy-window` | `lib/features/ask/presentation/thread/ask_location.dart:346, :370; AskLocationRow :779` | Fogged window card springs in, Zee's paw | captured (her account) | `footage.emma.location-ask-foggy-window.v1` |  |
| `location-ask-alert` | `ask_main_thread.dart:1062 (_showSky)` | Apple's location alert | captured (her account) | `footage.emma.location-ask-alert.v1` |  |
| `location-ask-sky-wipe` | `lib/features/ask/presentation/thread/ask_location.dart:430+ (SkyWindowPainter :146)` | Four-stroke wipe, fog fades, "There's your sky", weather | captured (her account) | `footage.emma.location-ask-sky-wipe.v1` | one-off on her phone (permission now granted) |
| `chat-orbit-wait` | `lib/features/ask/presentation/thread/ask_styling_wait.dart:59, :106; wardrobe_tab/presentation/chat/thread_orbit.dart:86` | Her closet orbits on the white card | captured (her account) | `footage.emma.chat-thinking-lines.v1`, `footage.emma.chat-thinking-lines.v2`, `footage.emma.chat-thinking-lines.v3` |  |
| `chat-thinking-lines` | `lib/features/ask/presentation/thread/ask_styling_wait.dart:233, :348` | Zee's real thinking lines cross-fade 300 ms, held ≥2 s | captured (her account) | `footage.emma.chat-thinking-lines.v1`, `footage.emma.chat-thinking-lines.v2`, `footage.emma.chat-thinking-lines.v3` | live for her: "Going through your 49 pieces…" |
| `look-card-landing` | `lib/features/ask/presentation/ask_main_thread.dart:2233; thread/thread_parts.dart:37; chat_board.dart:38, :62` | Card cross-fades in, pieces settle, head streams 55 ms/word, chips | captured (her account) | `footage.emma.look-card-landing.v1`, `footage.emma.look-card-landing.v2`, `footage.emma.look-card-landing.v3` |  |
| `zee-landed-avatar` | `lib/features/wardrobe_tab/presentation/chat/chat_mist.dart:456` | Zee excited beside the newest reply | captured (her account) | `footage.emma.look-card-landing.v1` |  |
| `multiple-looks` | `lib/features/wardrobe_tab/presentation/chat/look_set.dart:162, :261; chat_result_view.dart:2430` | Dots breathe, card narrows, swipe between looks | captured (her account) | `footage.emma.multiple-looks-swipe.v1` |  |
| `look-piece-lift` | `lib/features/wardrobe_tab/presentation/chat/chat_result_view.dart:3208` | Piece lifts (spring 460 ms), others dim, swap choices | captured (her account) | `footage.emma.look-piece-lift.v1` |  |
| `look-piece-keep` | `lib/features/wardrobe_tab/presentation/chat/chat_result_view.dart:3208` | Settles back | captured (her account) | `footage.emma.look-piece-keep.v1` |  |
| `look-love-it` | `lib/features/wardrobe_tab/presentation/chat/chat_board.dart:433` | Heart, "Me too." (a3 chat.loved) | captured (her account) | `footage.emma.look-love-it.v1` |  |

## Adjust

| Moment | Code | What moves | Status | Clips | Note |
|---|---|---|---|---|---|
| `adjust-pill-open` | `lib/features/wardrobe_tab/presentation/chat/look_card.dart:349; priorities_sheet.dart:98` | Adjust pill → priorities sheet snaps 320 ms | captured (her account) | `footage.emma.adjust-pill-open.v1`, `footage.emma.adjust-from-notes.v1` |  |
| `adjust-slider-toast` | `lib/features/wardrobe_tab/presentation/chat/priorities_sheet.dart:98, :276` | Slider, hint folds in (AnimatedContainer 240) | captured (her account) | `footage.emma.adjust-slider-toast.v1` | not applied (Apply = paid refine) |
| `adjust-sheet-dismiss` | `lib/features/wardrobe_tab/presentation/chat/priorities_sheet.dart:98` | Sheet down | captured (her account) | `footage.emma.adjust-sheet-dismiss.v1` |  |

## Style notes

| Moment | Code | What moves | Status | Clips | Note |
|---|---|---|---|---|---|
| `style-notes-row` | `lib/features/wardrobe_tab/presentation/chat/chat_result_view.dart:3120-3145` | Row grows in at the card foot | captured (her account) | `footage.emma.look-card-landing.v1` |  |
| `style-notes-open` | `lib/features/wardrobe_tab/presentation/chat/style_notes_sheet.dart:52, :347` | Notebook sheet snaps up 280 ms | captured (her account) | `footage.emma.style-notes-open.v1` |  |
| `style-notes-scroll` | `lib/features/wardrobe_tab/presentation/chat/style_notes_sheet.dart:389, :510, :716` | Strip pins, outlines 200 ms, close-ups float | captured (her account) | `footage.emma.style-notes-scroll.v1` |  |

## Chat drawer

| Moment | Code | What moves | Status | Clips | Note |
|---|---|---|---|---|---|
| `chat-drawer-open` | `lib/features/ask/presentation/ask_chat_drawer.dart:167-168, :335-360` | Chat slides left, corner rounds, drawer fades up 500 ms | captured (her account) | `footage.emma.chat-drawer-open.v1` | Zee asleep in the empty list |
| `chat-drawer-search` | `lib/features/ask/presentation/ask_chat_drawer.dart:170, :449` | Search swap 300 ms | captured (her account) | `footage.emma.chat-drawer-search.v1` |  |
| `chat-drawer-close` | `lib/features/ask/presentation/ask_chat_drawer.dart:303-334` | Close | captured (her account) | `footage.emma.chat-drawer-close.v1` |  |
| `chat-drawer-reopen` | `lib/features/ask/presentation/ask_chat_drawer.dart:577` | Recents list, reopen a chat | captured (her account) | `footage.emma.chat-drawer-reopen.v1` |  |
| `chat-new-from-drawer` | `lib/features/ask/presentation/ask_chat_drawer.dart` | New chat → empty chat, starters | captured (her account) | `footage.emma.chat-new-from-drawer.v1` |  |
| `notebook-sheet` | `lib/features/ask/presentation/thread/ask_memory.dart:297` | What Zee remembers sheet | captured (her account) | `footage.emma.notebook-sheet.v1` | sheet title reads "What Curate knows" |

## Chat

| Moment | Code | What moves | Status | Clips | Note |
|---|---|---|---|---|---|
| `tryon-from-look-card` | `lib/features/wardrobe_tab/presentation/chat/tryon_results.dart:126` | Try on from the card, renders fold under it | not possible | – | try-on budget used on the Try-ons tab |
| `versions-row` | `lib/features/wardrobe_tab/presentation/chat/chat_result_view.dart:3338` | Version pill slides | not possible | – | needs a paid swap/refine |

## Zee extras (ob83)

| Moment | Code | What moves | Status | Clips | Note |
|---|---|---|---|---|---|
| `zee-a1-refine` | `lib/features/muse/domain/muse_moments.dart; chat_result_view.dart ~:4158` | Make it dressier: listens, then thinks | captured (probe) | `footage.emma.zee-a1-refine.v1` | a paid refine on her account; zee_extras_probe with her pieces, her name and pack zee-sharp-v1 |
| `zee-a2-look-changed` | `lib/features/muse/domain/muse_moments.dart; ask_main_thread.dart:778` | Look 2 lands: happy | captured (probe) | `footage.emma.zee-a2-look-changed.v1` | needs a refine; zee_extras_probe with her pieces, her name and pack zee-sharp-v1 |
| `zee-a3-loved` | `lib/features/muse/domain/muse_moments.dart; chat_result_view.dart museChipMoment` | Love it: heart and love | captured (probe) | `footage.emma.zee-a3-loved.v1` | also real: look-love-it.v1; zee_extras_probe with her pieces, her name and pack zee-sharp-v1 |
| `zee-a4-typing` | `lib/features/muse/domain/muse_moments.dart; ask_main_thread.dart:801` | Listening while she types | captured (probe) | `footage.emma.zee-a4-typing.v1`, `footage.emma.zee-a4-typing.v2` | also real: composer-type-send.v1; zee_extras_probe with her pieces, her name and pack zee-sharp-v1 |
| `zee-b5-night` | `lib/features/muse/domain/muse_moments.dart; ask_muse_hero.dart:63` | Empty chat at 11:48 pm | captured (probe) | `footage.emma.zee-b5-night.v1` | time of day; zee_extras_probe with her pieces, her name and pack zee-sharp-v1 |
| `zee-b6-morning` | `lib/features/muse/domain/muse_moments.dart; ask_muse_hero.dart:63` | First open of the day | captured (probe) | `footage.emma.zee-b6-morning.v1` | once a day; zee_extras_probe with her pieces, her name and pack zee-sharp-v1 |
| `zee-b7-pet` | `lib/features/muse/domain/muse_moments.dart; ask_muse_hero.dart:68` | Three taps on her | captured (probe) | `footage.emma.zee-b7-pet.v1` | also real: zee-pet.v1; zee_extras_probe with her pieces, her name and pack zee-sharp-v1 |
| `zee-b8-saved` | `lib/features/muse/domain/muse_moments.dart; ask_main_thread.dart:1663; muse_saved_toast.dart` | Kept toast, cheering | captured (probe) | `footage.emma.zee-b8-saved.v1` | server rule; zee_extras_probe with her pieces, her name and pack zee-sharp-v1 |
| `zee-b9-idea` | `lib/features/muse/domain/muse_moments.dart; ask_main_thread.dart:787` | A reply that offers something | captured (probe) | `footage.emma.zee-b9-idea.v1` | depends on the brain; zee_extras_probe with her pieces, her name and pack zee-sharp-v1 |
| `zee-b10-long-wait` | `lib/features/muse/domain/muse_moments.dart; muse_long_wait.dart:42` | Wait past 20 s: "Still looking…" | captured (probe) | `footage.emma.zee-b10-long-wait.v1` | her waits ended before 20 s of silence; zee_extras_probe with her pieces, her name and pack zee-sharp-v1 |
| `zee-b11-peek` | `lib/features/muse/domain/muse_moments.dart; muse_peek.dart:146` | Peeks from behind the Wardrobe bar | captured (probe) | `footage.emma.zee-b11-peek.v1` | server rule off for her; zee_extras_probe with her pieces, her name and pack zee-sharp-v1 |
| `zee-b12-empty` | `lib/features/muse/domain/muse_moments.dart; wardrobe_tab_screen.dart:553` | Empty wardrobe | captured (probe) | `footage.emma.zee-b12-empty.v1` | also real: zee-asks-empty-wardrobe.v1; zee_extras_probe with her pieces, her name and pack zee-sharp-v1 |
| `zee-b13-welcome-back` | `lib/features/muse/domain/muse_moments.dart; ask_muse_hero.dart:63` | Back after 7+ days | captured (probe) | `footage.emma.zee-b13-welcome-back.v1` | needs a week away; zee_extras_probe with her pieces, her name and pack zee-sharp-v1 |

## Try-ons

| Moment | Code | What moves | Status | Clips | Note |
|---|---|---|---|---|---|
| `tryon-add-item-sheet` | `lib/features/tryons/presentation/tryons_sheets.dart:54` | Add an item sheet | captured (her account) | `footage.emma.tryon-add-item-sheet.v1` |  |
| `tryon-item-lands` | `lib/features/tryons/presentation/tryons_screen.dart:137, :666` | Item lands in its spot 250 ms easeOutBack | captured (her account) | `footage.emma.tryon-item-lands.v1` |  |
| `tryon-hint-ring` | `lib/features/tryons/presentation/tryons_screen.dart:76, :229-240, :792` | First-item hint ring pulses, Zee tryons.hint | captured (her account) | `footage.emma.tryon-item-lands.v1` | once per phone; shown here |
| `tryon-avatar-photo-swap` | `lib/features/tryons/presentation/tryons_screen.dart:1044, :1140, :532` | Photo swap 500 ms, avatar 200 ms | captured (her account) | `footage.emma.tryon-curtain-reveal.v1` |  |
| `tryon-curtain` | `home/presentation/widgets/fitting_room.dart:91-101` | Curtain draws 750 ms, sways 2600 ms, opens 1100 ms | captured (her account) | `footage.emma.tryon-curtain-reveal.v1`, `footage.emma.tryon-curtain-reveal.v2` |  |
| `tryon-wait-sweep` | `lib/features/tryons/presentation/tryons_widgets.dart:561` | Sweep across "Trying on your…" 1700 ms | captured (her account) | `footage.emma.tryon-curtain-reveal.v2` |  |
| `tryon-reveal` | `lib/features/tryons/presentation/tryons_screen.dart:83, :333-345` | Reveal 700 ms after the curtain | captured (her account) | `footage.emma.tryon-curtain-reveal.v1`, `footage.emma.tryon-curtain-reveal.v2` |  |
| `tryon-result-to-clock` | `lib/features/tryons/presentation/tryons_screen.dart:88, :893` | Result flies into the clock 1300 ms | not possible | – | played as New try-on was tapped; not separated (seen at start of take t13) |

## App update

| Moment | Code | What moves | Status | Clips | Note |
|---|---|---|---|---|---|
| `update-sheet` | `lib/features/app_update/update_sheet.dart:28; update_check.dart:24` | Plain modal bottom sheet (no custom motion) | not possible | – | server-offered only; its probe draws it over the hidden Home feed, which would show an old screen |
| `required-update` | `lib/features/first_minute/presentation/required_update.dart:109` | Blocking screen, 1200 ms entrance | captured (probe) | `footage.emma.required-update.v1` | server-marked only; first_minute_probe PROBE_STAGE=update |

## Home (hidden in 262)

| Moment | Code | What moves | Status | Clips | Note |
|---|---|---|---|---|---|
| `home-feed-and-first-minute` | `lib/features/home, lib/features/first_minute/presentation/*` | Feed skeleton, reveal, start-here card, while-away strip, ask cards… | not possible | – | kHomeTab = false: not in the app today |
