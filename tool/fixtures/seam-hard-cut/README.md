# seam-hard-cut fixture
Fixture: dense content (20 circles + label) for beat 0..0.9, a single
tiny dot for beat 0.9..1.0. At the seam (t=LOOP-300, beat 0.96) the
canvas is sparse; at t=300 (beat 0.04) it's dense. The total contentPx
drops >90% at the wrap with NO individual label popping (the label
fades out with the beat). Acceptance: a "seam: content hard-cut"
warning fires.
