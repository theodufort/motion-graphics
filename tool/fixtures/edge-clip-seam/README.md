# edge clip seam
Fixture: a chip whose right half bleeds past the canvas edge ONLY near the
loop wrap (p -> 1). The wide-band edge-clip probe must flag it at the
seam-adjacent probes (0.005/0.995) and NOT at mid-loop probes. Text labels
are unreliable fixtures (inter-letter gaps break contiguous runs), so the
clipped element is a solid chip. A 160px-inset frame keeps the constant
content out of every edge band.
