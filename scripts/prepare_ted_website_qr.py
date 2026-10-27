"""Build the static QR asset from its authored RDF target (optional segno==1.6.6)."""
import segno
import generate_canonical_runtime as R

dataset = R.assemble_dataset()
target = str(R.one(dataset, R.iri(R.EX, "ted-talks-website"), R.iri(R.SCHEMA, "url")))
qr = segno.make(target, error="M", micro=False, boost_error=False)
border = 4
size = len(qr.matrix) + border * 2
cells = " ".join(f"M{x+border} {y+border}h1v1h-1z"
                 for y, row in enumerate(qr.matrix) for x, dark in enumerate(row) if dark)
svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}">\n'
       f' <rect width="{size}" height="{size}" fill="#ffffff"/>\n'
       f' <path d="{cells}" fill="#000000"/>\n</svg>\n')
output = R.ROOT / "apps/pitch/public/talks-media/talks-website-qr.svg"
output.write_text(svg, encoding="utf-8")
print(f"Generated {output.relative_to(R.ROOT)}: {target}")
