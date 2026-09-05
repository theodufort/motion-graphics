# crossfade-minor fixture
Fixture: two labels at nearly the same position, crossfading (alpha
fades in as beta fades out). At t=LOOP/2 both are at 0.5 alpha and
overlap by ~10px. Acceptance: the minor-overlap warning does NOT
fire (the crossfade is intentional, and both alphas are < 0.6 at
the overlap point).
