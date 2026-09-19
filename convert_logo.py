import pymupdf
from PIL import Image
import os

pdf_path = r"d:\External Project\Winner Sport\Logo\LOGO WINNER SPORT.pdf"
out_dir = r"d:\External Project\Winner Sport\frontend\public"
os.makedirs(out_dir, exist_ok=True)

# 1. Open PDF
doc = pymupdf.open(pdf_path)
page = doc[0]

# 2. Render high-res image (zoom 4x for crystal clear quality)
mat = pymupdf.Matrix(4.0, 4.0)
pix = page.get_pixmap(matrix=mat, alpha=False)
raw_png_path = os.path.join(out_dir, "logo-raw.png")
pix.save(raw_png_path)
print(f"Saved raw PNG: {pix.width}x{pix.height}")

# 3. Process with Pillow for transparency
img = Image.open(raw_png_path).convert("RGBA")
datas = img.getdata()

new_data = []
for item in datas:
    # Change white/near-white to transparent
    if item[0] > 240 and item[1] > 240 and item[2] > 240:
        new_data.append((255, 255, 255, 0))
    else:
        new_data.append(item)

img.putdata(new_data)

# Trim transparent borders to get exact bounding box
bbox = img.getbbox()
if bbox:
    cropped_img = img.crop(bbox)
else:
    cropped_img = img

# Save full transparent logo
logo_transparent_path = os.path.join(out_dir, "logo.png")
cropped_img.save(logo_transparent_path, "PNG")
print(f"Saved cropped transparent logo: {cropped_img.width}x{cropped_img.height} at {logo_transparent_path}")

# Also copy to Logo/ folder
cropped_img.save(r"d:\External Project\Winner Sport\Logo\logo-winner-sport.png", "PNG")

# Also save an emblem-only version (the top hexagon with W)
w, h = cropped_img.size
# Emblem is approximately the top 75% before "THE WINNER"
emblem_box = (0, 0, w, int(h * 0.76))
emblem_img = cropped_img.crop(emblem_box)
emblem_bbox = emblem_img.getbbox()
if emblem_bbox:
    emblem_img = emblem_img.crop(emblem_bbox)
emblem_img.save(os.path.join(out_dir, "logo-emblem.png"), "PNG")
print(f"Saved emblem: {emblem_img.width}x{emblem_img.height}")

# Clean up temporary raw
if os.path.exists(raw_png_path):
    os.remove(raw_png_path)

print("ALL LOGO CONVERSIONS COMPLETED SUCCESSFULLY!")
