# edge-label-top fixture
Fixture: a label at y=5 (hugging the top edge) + a second label at
y=300. The top label triggers the edge-clip warning but must NOT
trigger a collision with the edge-clip probe (which is a separate
pixel scan, not a rect). Acceptance: only the edge-clip warning fires.
