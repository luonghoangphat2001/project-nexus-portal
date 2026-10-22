from pathlib import Path
from PIL import Image, ImageDraw

render = Path(__file__).parent / "render"
files = sorted(render.glob("guide-*.png"))
for start in range(0, len(files), 8):
    sheet = Image.new("RGB", (1600, 1150), "white")
    subset = files[start:start + 8]
    for i, path in enumerate(subset):
        image = Image.open(path).convert("RGB")
        image.thumbnail((380, 530))
        x = (i % 4) * 400 + (400 - image.width) // 2
        y = (i // 4) * 575 + 16
        sheet.paste(image, (x, y))
        ImageDraw.Draw(sheet).text(((i % 4) * 400 + 12, (i // 4) * 575 + 550), path.stem, fill="#223344")
    sheet.save(render / f"contact-{start + 1:02d}.png")
