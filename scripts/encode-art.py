"""Format conversion only. No crop, paint, compositing, or image generation."""
import argparse
from pathlib import Path
from PIL import Image

parser = argparse.ArgumentParser()
parser.add_argument('source')
parser.add_argument('destination')
args = parser.parse_args()
target = Path(args.destination).resolve()
allowed = (Path(__file__).resolve().parent.parent / 'web' / 'assets').resolve()
if not target.is_relative_to(allowed):
    raise SystemExit('Destination must remain inside this project web/assets')
if target.exists():
    raise SystemExit('Existing asset preserved; choose a new versioned filename')
target.parent.mkdir(parents=True, exist_ok=True)
with Image.open(args.source) as source:
    source.save(target, 'WEBP', quality=91, method=6)
    print(f'{source.width}x{source.height}; {target.stat().st_size} bytes; {target.name}')
