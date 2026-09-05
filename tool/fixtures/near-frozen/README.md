# Near Frozen Fixture

A near-frozen motion graphic fixture for the validation tooling. It renders a bar whose width oscillates by a tiny fraction of a pixel-scale change (about 0.2% of the loop width), so the per-frame content pixel count barely moves. The frozen probe should classify this as near-frozen (a soft warning) rather than fully frozen (a hard fail), and every other check should pass.
