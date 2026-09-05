# edge-clip fixture

**Negative** fixture for the canvas-edge clip check: a label drawn with
`textAlign: right` at `W + 60` so its right half is truncated off-canvas,
plus a small animated dot to stay healthy on motion checks. Should produce the
`edge-clip` warning (contiguous content along canvas edge — verify no label is clipped).
