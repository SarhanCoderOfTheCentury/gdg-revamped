"""Prepare compact local fonts and appropriately sized image derivatives."""
from pathlib import Path
from fontTools import subset
from fontTools.ttLib import TTFont
from PIL import Image, ImageOps
from lxml import html
from concurrent.futures import ThreadPoolExecutor
import json, re

root = Path(__file__).resolve().parents[1] / 'dist'
assets = root / 'assets'
data = json.loads((assets / 'data.js').read_text().removeprefix('window.SITE_DATA = ').rstrip(';\n'))
characters = set()
for p in list(root.rglob('*.html')) + [assets/'data.js', assets/'app.js']:
    characters.update(ord(c) for c in p.read_text())
characters.update(range(0x20, 0x250))
characters.update(range(0x2000, 0x2070))
characters.update(range(0x2190, 0x2200))
before_fonts = sum(p.stat().st_size for p in assets.glob('google-sans-*.woff'))
for p in assets.glob('google-sans-*.woff'):
    font = TTFont(p)
    options = subset.Options()
    options.flavor = 'woff'
    options.layout_features = ['*']
    options.name_IDs = [0, 1, 2, 3, 4, 5, 6, 13, 14, 16, 17]
    sub = subset.Subsetter(options=options)
    sub.populate(unicodes=characters)
    sub.subset(font)
    font.flavor = 'woff'
    font.save(p)
after_fonts = sum(p.stat().st_size for p in assets.glob('google-sans-*.woff'))
print(f'Fonts: {before_fonts:,} → {after_fonts:,} bytes', flush=True)

thumbs = {u for e in data['events'] for u in e['photos']}
display = {s['image'] for s in data['speakers'] if s['image']}
display.update(e.get('image') or next(iter(e['photos']), None) for e in data['events'])
for f in root.rglob('*.html'):
    t = html.fromstring(f.read_text())
    display.update(t.xpath('//img/@src'))
display.discard(None)
paths = (thumbs | display)
media = {}

def variants(url):
    if not url.startswith('/assets/') or not url.endswith('.webp'):
        return url, None
    source = root / url.lstrip('/')
    if not source.exists(): return url, None
    with Image.open(source) as raw:
        im = ImageOps.exif_transpose(raw).copy()
    result = {'width': im.width, 'height': im.height}
    sizes = {'thumb':128} if url in thumbs else {}
    if url in display: sizes.update({'small':480, 'medium':960})
    for key, width in sizes.items():
        if im.width <= width:
            result[key] = url
            continue
        target = assets / (source.stem + f'-{width}.webp')
        resized = im.copy()
        resized.thumbnail((width, round(im.height * width / im.width)), Image.Resampling.LANCZOS)
        resized.save(target, 'WEBP', quality=76 if key=='thumb' else 81, method=4)
        result[key] = '/assets/' + target.name
    return url, result

with ThreadPoolExecutor(max_workers=4) as pool:
    for u, result in pool.map(variants, sorted(paths)):
        if result: media[u] = result
(assets / 'media.js').write_text('window.SITE_IMAGES = ' + json.dumps(media, separators=(',',':')) + ';\n')
print(f'Prepared responsive images for {len(media)} originals.', flush=True)
