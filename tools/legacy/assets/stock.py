"""Step 4: ordinary phone photos from Unsplash (free, Unsplash License). Candidates read off unsplash.com search pages
(license=free filter, no Unsplash+). python3 stock.py fetch | python3 stock.py manifest <keep slugs...>"""
import io, json, os, sys
import requests
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common as C

SDIR = os.path.join(C.ASSETS, "stock")
CAND = os.path.join(SDIR, "_candidates")
LICENSE = "Unsplash License (free for commercial use, no attribution required): https://unsplash.com/license"

# slug, unsplash photo id, author, cdn id, what it shows
PHOTOS = [
    ("dog-golden-retriever-1", "Sg3XwuEpybU", "Richard Brutyo", "photo-1552053831-71594a27632d", "golden retriever puppy"),
    ("dog-golden-retriever-2", "yihlaRCCvd4", "Oscar Sutton", "photo-1530281700549-e82e7bf110d6", "golden retriever"),
    ("dog-3", "2s6ORaJY6gI", "Celine Sayuri Tagami", "photo-1510771463146-e89e6e86560e", "dog"),
    ("dog-4", "pgUbpDLJh3E", "Caleb Fisher", "photo-1422565096762-bdb997a56a84", "dog"),
    ("dog-5", "KFJuCzJiQYU", "Justin Aikin", "photo-1523480717984-24cba35ae1ef", "dog"),
    ("nyc-brooklyn-bridge", "_QdFx92MO2U", "Luca Bravo", "photo-1496588152823-86ff7695e68f", "Brooklyn Bridge panorama"),
    ("nyc-empire-state-night", "fT6-YkB0nfg", "Timo Wagner", "photo-1541336032412-2048a678540d", "Empire State Building at night"),
    ("nyc-skyline-east-river", "SVVTZtTGyaU", "Patrick Tomasso", "photo-1499092346589-b9b6be3e94b2", "Manhattan skyline and Brooklyn Bridge"),
    ("nyc-skyline-hoboken", "kZokA2VTKn4", "Mike Chavarri", "photo-1518235506717-e1ed3306a89b", "skyline from Hoboken at golden hour"),
    ("nyc-williamsburg-bridge", "dVCGpKZB_E8", "Matteo Catanese", "photo-1518391846015-55a9cc003b25", "Williamsburg Bridge at night"),
    ("nyc-manhattan-bridge-dumbo", "wOj5odhDOZ0", "Redd Francisco", "photo-1492666673288-3c4b4576ad9a", "Manhattan Bridge from DUMBO"),
    ("nyc-central-park", "A2CChTZvzTE", "Jermaine Ee", "photo-1568515387631-8b650bbcdb90", "Central Park"),
    ("nyc-taxi-street", "WTPp4wgourk", "Robert Bye", "photo-1500916434205-0c77489c6cf7", "yellow cab on a street"),
    ("sunset-sea-clouds", "-IMlv9Jlb24", "Sebastien Gabriel", "photo-1503803548695-c2a7b4a5b875", "sea at golden hour"),
    ("sunset-2", "GPPAjJicemU", "Jason Mavrommatis", "photo-1495567720989-cebdbdd97913", "sunset"),
    ("sunset-wave", "mOcdke2ZQoE", "Rachel Cook", "photo-1414609245224-afa02bfb3fda", "wave at golden hour"),
    ("sunset-shoreline", "4V8JxijgZ_c", "frank mckenna", "photo-1474524955719-b9f87c50ce47", "shoreline at golden hour"),
    ("sunset-trees-lake", "lsoogGC_5dg", "Dave Hoefler", "photo-1586348943529-beaae6c28db9", "trees by a lake at sunset"),
    ("coffee-latte-table", "ikU3J1nr52w", "Nathan Dumlao", "photo-1529892485617-25f63cd7b1e9", "latte from above"),
    ("coffee-heart-latte", "XOhI_kW_TaM", "Nathan Dumlao", "photo-1512568400610-62da28bc8a13", "heart latte art"),
    ("coffee-mug", "1tEkissU8dY", "Lex Sirikiat", "photo-1503240778100-fd245e17a273", "coffee in a white mug"),
    ("coffee-cafe-latte", "Nw8wbiDE3gU", "Phil Desforges", "photo-1559001724-fbad036dbc9e", "cafe latte"),
    ("coffee-in-hand", "TMkrYpWW7kc", "BENCE BOROS", "photo-1550731358-491ded4af838", "hand holding a cappuccino"),
    ("pizza-pepperoni", "OklpRh8-Sns", "Peter Bravo de los Rios", "photo-1544982503-9f984c14501a", "pepperoni pizza"),
    ("pizza-slice-hand", "jvWZYnxBDlQ", "Klara Kulikova", "photo-1600028068383-ea11a7a101f3", "hand holding a slice"),
    ("pizza-picking-slice", "22Vt7JIf7ZI", "Brenna Huff", "photo-1542834369-f10ebf06d3e0", "picking up a slice"),
    ("pizza-board", "MqT0asuoIcU", "Chad Montano", "photo-1565299624946-b28f40a0ae38", "pizza on a board"),
    ("brunch-waffles", "hrlvr2ZlUNk", "Rachel Park", "photo-1504754524776-8f4f37790ca0", "brunch spread with waffles"),
    ("brunch-blueberry-toast", "zcUgjyqEwe8", "Joseph Gonzalez", "photo-1484723091739-30a097e8f929", "toast with blueberries"),
    ("brunch-egg-toast", "FFqNATH27EM", "Ben Kolde", "photo-1525351484163-7529414344d8", "egg on toast"),
    ("brunch-table", "y3aP9oo9Pjc", "Ali Inay", "photo-1424847651672-bf20a4b0982b", "table of food"),
    ("brunch-bread-coffee", "pDC7vQrW-EM", "Joao Marcelo Martins", "photo-1528699633788-424224dc89b5", "bread with coffee"),
    ("hands-red-drink", "HT7jjypMceQ", "Cherrydeck", "photo-1643373975861-f1335411da61", "two hands with a drink"),
    ("hands-cheers-glasses", "wSLRa9MnFCg", "Cherrydeck", "photo-1643373976133-b7f7bf9445fd", "two hands clinking glasses"),
    ("hands-drinks", "AgJdd_HgFPw", "Kelly Sikkema", "photo-1558383409-ab7ef8db3e01", "hands holding drinks"),
    ("hands-mugs", "6PpLqUlCA0s", "Nani Williams", "photo-1508294277719-e10023cf88d3", "friends' hands holding mugs"),
    ("autumn-park-path", "AmPOUp61um4", "Adrian Eperjessy", "photo-1673434737111-193cfaa58f75", "park path with leaves"),
    ("autumn-orange-tree", "zrT1tjnxJKQ", "Lyndon Li", "photo-1507967669805-c23336beea5b", "orange autumn tree"),
    ("autumn-bench", "KXYRpHllhbI", "Rufinochka", "photo-1634199826678-c99bce5b5678", "bench under yellow leaves"),
    ("autumn-park-benches", "X614H7CvOAA", "Daniel J. Schwarz", "photo-1635193728400-98be5b62b3cf", "park benches in fall"),
    ("flowers-rose-bouquet", "QLuleNy8LMM", "jessie daniella", "photo-1523693916903-027d144a2b7d", "pink and white roses"),
    ("flowers-vase", "mNEpmNiFdXs", "Angelina Jollivet", "photo-1572454591674-2739f30d8c40", "flowers in a glass vase"),
    ("flowers-market", "0tSdTCEadTE", "Salah Darwish", "photo-1685613858397-64f79a0f3603", "flower market buckets"),
    ("flowers-poppies", "V_MV68oW3FE", "Zoe Richardson", "photo-1587317996237-eddd7e834d84", "white poppies in an amber vase"),
    ("beach-seashore", "L_hK813fu9k", "Clem Onojeghuo", "photo-1468879823303-35edd50416dc", "seashore"),
    ("beach-waves", "0ngILQtGZvs", "Meritt Thomas", "photo-1585551896871-fb3cac6df620", "waves on the shore"),
    ("beach-empty-highrise", "pXFETxj7lzg", "frank mckenna", "photo-1495899556065-23c001d0a1e3", "empty beach by high-rises"),
    ("beach-grey-sand", "rCVcMJqOuuM", "Memories on 35mm", "photo-1563212108-03d3b081f91e", "grey sandy beach"),
    ("street-plants-brownstone", "rdJXlCdRVaQ", "Josh Wilburne", "photo-1515112569565-1e4aef316db9", "plants by a brownstone street"),
    ("street-row-houses", "yfmkBgAQpzQ", "Sam Balye", "photo-1641217658611-5ffbcde46b61", "row houses"),
    ("street-brick-row", "Qwp3Ws7MCUk", "Gerda", "photo-1735963565471-eace7dfabdbe", "row of brick buildings"),
    ("street-sunset-skyline", "N3LaQcbarCc", "Julian Ostarek", "photo-1775996960051-4bd0e3112c5d", "skyline down a tree-lined street at sunset"),
    ("plant-window-1", "Y0dBD80odGw", "Vika Chartier", "photo-1595007456829-a2894b728e58", "potted plant by a window"),
    ("plant-window-2", "XRV5D7WYDj4", "Janelle Hiroshige", "photo-1590452224879-867e8012a828", "plant on a window sill"),
    ("plant-window-3", "Z4iKdIcK7bA", "Alex Harwood", "photo-1706816299523-c31b884b401c", "plant on a window sill"),
    ("plant-table-window", "1wCWsR-v5Ko", "Annie Spratt", "photo-1656274953298-90b59f917697", "table with a plant by a window"),
    ("food-bagels-cream-cheese", "UL-wDcEllAY", "Fernanda Martinez", "photo-1643049441000-3249ab096f2b", "bagels with cream cheese"),
    ("food-bagel-tray", "KraOGexu_Y0", "Claudio Schwarz", "photo-1687175452217-e4f8e523b5b5", "tray of bagels"),
    ("food-donut-box", "8GzmzEyLNyc", "Mae Mu", "photo-1558745010-d2a3c21762ab", "box of doughnuts"),
    ("coffee-mug-hand", "Vn_j28AxFL0", "No Revisions", "photo-1608048608495-e062fc7d0725", "hand holding a mug"),
]


def fetch():
    os.makedirs(CAND, exist_ok=True)
    for slug, pid, author, cdn, what in PHOTOS:
        out = os.path.join(CAND, slug + ".jpg")
        if os.path.exists(out): continue
        url = f"https://images.unsplash.com/{cdn}?w=1600&q=82&fm=jpg"
        try:
            r = requests.get(url, timeout=60)
            im = Image.open(io.BytesIO(r.content)).convert("RGB") if r.status_code == 200 else None
        except Exception as e:
            im = None
        if im is None:
            print("FAIL", slug, getattr(r, "status_code", "?")); continue
        im.save(out, "JPEG", quality=88)
        print("ok", slug, im.size)


def keep(slugs):
    by = {p[0]: p for p in PHOTOS}
    items = []
    for s in slugs:
        slug, pid, author, cdn, what = by[s]
        src = os.path.join(CAND, slug + ".jpg"); dst = os.path.join(SDIR, slug + ".jpg")
        if not os.path.exists(dst):
            os.link(src, dst) if not os.path.exists(dst) else None
        C.thumb(dst)
        items.append({"slug": slug, "file": slug + ".jpg", "shows": what, "author": author,
                      "url": f"https://unsplash.com/photos/{pid}", "image_url": f"https://images.unsplash.com/{cdn}",
                      "license": LICENSE, "source": "Unsplash"})
    tmp = os.path.join(SDIR, "manifest.json.tmp")
    json.dump({"updated": C.now(), "count": len(items),
               "rules": "Unsplash License only (no Unsplash+). No identifiable faces, no logos. Checked by eye.",
               "items": items}, open(tmp, "w"), indent=1)
    os.replace(tmp, os.path.join(SDIR, "manifest.json"))
    return items


if __name__ == "__main__":
    if sys.argv[1] == "fetch": fetch()
    else: print(len(keep(sys.argv[2:])))
