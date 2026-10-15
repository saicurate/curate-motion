// Written by the account agent; the tracker should load this file too.
// Shape: window.CURATE_ACCOUNT = { updated, phase, sections:[{title,items:[{path,label}]}], log:[{t,text}] }
window.CURATE_ACCOUNT = {
 "updated": "2026-10-15T18:50:00Z",
 "phase": "Emma's account is live with 49 pieces",
 "sections": [
  {
   "title": "Her finished Wardrobe tab",
   "items": [
    {
     "path": "../footage/emma/screens/wardrobe-01-top.png",
     "label": "Wardrobe tab, top"
    },
    {
     "path": "../footage/emma/screens/wardrobe-02.png",
     "label": "Wardrobe, scrolled"
    },
    {
     "path": "../footage/emma/screens/wardrobe-03.png",
     "label": "Wardrobe, scrolled"
    },
    {
     "path": "../footage/emma/screens/wardrobe-04.png",
     "label": "Wardrobe, scrolled"
    },
    {
     "path": "../footage/emma/screens/wardrobe-05.png",
     "label": "Wardrobe, bottom"
    },
    {
     "path": "../footage/emma/screens/piece-midi-skirt.png",
     "label": "One piece: the midi skirt"
    },
    {
     "path": "../footage/emma/screens/chat-empty.png",
     "label": "Chat with Zee, before her first message"
    }
   ]
  },
  {
   "title": "The photo scan (recorded as footage)",
   "items": [
    {
     "path": "../footage/emma/screens/scan-1-privacy.png",
     "label": "Your photos stay yours"
    },
    {
     "path": "../footage/emma/screens/scan-2-photos-prompt.png",
     "label": "The Photos prompt"
    },
    {
     "path": "../footage/emma/screens/scan-3-roll.png",
     "label": "Looking through her camera roll"
    },
    {
     "path": "../footage/emma/screens/scan-4-your-pieces.png",
     "label": "Picking out her pieces"
    },
    {
     "path": "../footage/emma/screens/scan-5-ready.png",
     "label": "Your wardrobe is ready: 41 pieces"
    },
    {
     "path": "../footage/emma/screens/scan-6-review.png",
     "label": "Review before adding"
    }
   ]
  },
  {
   "title": "Onboarding",
   "items": [
    {
     "path": "../footage/emma/screens/onboarding-styles.png",
     "label": "Her styles: Minimalist, Workwear, Classic"
    },
    {
     "path": "../footage/emma/screens/onboarding-body.png",
     "label": "Her body: 5'6\", 135 lb, inseam 30\""
    }
   ]
  }
 ],
 "log": [
  {
   "t": "2026-10-15T18:05:00Z",
   "text": "Made a new iPhone 17 Pro Max simulator just for Emma, with the clock at 9:41 and a full battery."
  },
  {
   "t": "2026-10-15T18:10:00Z",
   "text": "Put 73 photos in her Photos app: her 30 photos, 42 everyday photos mixed in between them, and her selfie last."
  },
  {
   "t": "2026-10-15T18:17:00Z",
   "text": "Signed Emma up in the real app with emma.nyc@test123.com. The password is kept only in AWS (SSM), never in a file. Recorded as signup-v1.mov."
  },
  {
   "t": "2026-10-15T18:24:00Z",
   "text": "Finished onboarding as Emma Russo, @emma.nyc: Minimalist, Workwear and Classic styles, $50 to $150, skin tone from her selfie, 5'6\" and 135 lb. Recorded as onboarding-v1.mov."
  },
  {
   "t": "2026-10-15T18:29:00Z",
   "text": "The photo scan worked on the simulator. It found Emma in all 30 of her photos and skipped every everyday photo. 41 pieces were ready in about 3 minutes."
  },
  {
   "t": "2026-10-15T18:31:00Z",
   "text": "In the review she removed a second copy of the navy hoodie, then added 40 pieces. The whole scan is recorded as photo-scan-v1.mov."
  },
  {
   "t": "2026-10-15T18:35:00Z",
   "text": "Added 11 more pieces from the garment library that never showed in her photos. 9 went in. The gold hoops and the gold necklace were turned down as \"not clothes\", so they are not in her wardrobe."
  },
  {
   "t": "2026-10-15T18:40:00Z",
   "text": "She marked two possible duplicates as different pieces (the light and dark jeans, and the turtleneck and the tank). Her wardrobe now has 49 pieces."
  },
  {
   "t": "2026-10-15T18:45:00Z",
   "text": "Server spend was about $1.95 of the $4 allowed: about $1.07 for the scan, about $0.68 for the 9 added pieces, and about $0.2 for the selfie read."
  },
  {
   "t": "2026-10-15T18:50:00Z",
   "text": "Wrote which library garment each app piece came from to curate-motion/library/people/emma/account-state.json. The simulator stays on, with Emma signed in, for more filming."
  }
 ]
};
