# hardcoded-coords fixture
Fixture: a graphic with NO resize handler and all coordinates hardcoded
in pixels (not fractions of W/H). At the default 960x540 it looks fine,
but after the viewport resize to 1366x768 the content stays in the
top-left corner instead of scaling proportionally. Acceptance: the
resize check triggers a "non-proportional" warning (canvas CSS size
does not match the viewport aspect).
