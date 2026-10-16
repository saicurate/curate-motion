# Review page

`ads-phone.html` is the template for the phone-sized ad review page (https://claude.ai/artifact/EwVYnHsfAWgSiyjdAXVyzy).
Every video sits in a ~330 px phone (classes: phone, feed = 4:5, sq = 1:1; add `black` for the black finish), tap to play, one at a time.
The phone is Apple's real iPhone 18 Pro Max Product Bezel drawn over the video (CSS only, no markup change; see the comment in the CSS). It needs a `b/` folder next to the page with `iphone-18-pro-max-silver.png` and `iphone-18-pro-max-black.png`: 960 px wide copies of `device.apple.iphone-18-pro-max-{silver,black}.v1` (`ffmpeg -i library/devices/apple/iphone-18-pro-max-silver.v1.png -vf scale=960:-2:flags=lanczos b/iphone-18-pro-max-silver.png`). Never post the bezel files on their own (Apple's licence); they ride along only as part of the review page.
To update it: copy small 720 px copies of the renders into a `v/` folder next to it, with poster JPEGs, then republish with the Artifact tool (root = that folder, files = every v/ and b/ file).
