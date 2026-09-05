# same-color fixture
Fixture: two labels with the SAME fill color (#3ecf8e), overlapping by
~40px (simulates a multi-line label drawn as two fillText calls).
Acceptance: the collision error does NOT fire (same-color labels are
visually one element). A different-color pair at the same position
WOULD fire.
