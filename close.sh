#!/usr/bin/env bash
# close.sh <unique-substring> [note-text...]
# Close exactly one open IMPROVEMENTS.md item containing the substring.
# Verifies the [x] line exists afterwards (exit 1 otherwise) and always
# preserves the trailing newline. Note text defaults to "done".
set -euo pipefail
cd "$(dirname "$0")"
[ $# -ge 1 ] || { echo "usage: close.sh <unique-substring> [note...]" >&2; exit 2; }
SUB="$1"; shift || true
NOTE="${*:-done}"
NOTE_ESCAPED=$(printf '%s' "$NOTE" | sed 's/\\/\\\\/g; s/"/\\"/g')
python3 - "$SUB" "$NOTE_ESCAPED" <<'PY'
import re, sys
sub, note = sys.argv[1], sys.argv[2]
s = open("IMPROVEMENTS.md").read()
i = s.find(sub)
if i == -1:
    print(f"close.sh: substring not found: {sub!r}", file=sys.stderr); sys.exit(1)
# expand to the whole item: back to "- [ ] ", forward to the next item start
start = s.rfind("- [ ] ", 0, i)
if start == -1:
    print("close.sh: substring is not inside an open item", file=sys.stderr); sys.exit(1)
# fused item: rfind may have hit a mid-line marker — walk back to line start
if start > 0 and s[start - 1] != "\n":
    start = s.rfind("\n", 0, start) + 1
nxt = s.find("\n- [", start + 1)
end = nxt if nxt != -1 else len(s)
item = s[start:end]
# fused with a following item (missing newline before next "- ["):
if not item.endswith("\n") and nxt != -1:
    end = nxt + 1
    item = s[start:end]
if not item.endswith("\n"):
    item = item + "\n"
# verify exactly one OPEN item matches the substring
if len(re.findall(r"^- \[ \][^\n]*" + re.escape(sub), s, re.M)) != 1:
    print(f"close.sh: substring not unique among OPEN items (found {s.count(sub)} in file)", file=sys.stderr); sys.exit(1)
# fused items contain two markers; close every marker in the item
closed = item.replace("- [ ] ", "- [x] ")
if "done" != note and "acceptance" not in note.lower():
    closed = closed.rstrip("\n") + f" ({note}).\n"
s2 = s[:start] + closed + s[end:]
open("IMPROVEMENTS.md", "w").write(s2)
ok = re.search(r"^- \[x\](?:[^\n]|\n(?!\- \[))*?" + re.escape(sub), s2, re.M) is not None
print(f"close.sh: item closed, [x] verified: {ok}")
sys.exit(0 if ok else 1)
PY
