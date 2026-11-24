"""Fetch public LeetCode solve counts and write leetcode.json.

Exits non-zero (leaving the existing file untouched) if the data looks wrong,
so a LeetCode outage never overwrites good numbers with bad ones.
"""
import json, sys, datetime, urllib.request

USER = "fouzanm"
OUT = "leetcode.json"
QUERY = """query($u:String!){matchedUser(username:$u){submitStatsGlobal{acSubmissionNum{difficulty count}}}}"""

req = urllib.request.Request(
    "https://leetcode.com/graphql",
    data=json.dumps({"query": QUERY, "variables": {"u": USER}}).encode(),
    headers={"Content-Type": "application/json", "Referer": "https://leetcode.com", "User-Agent": "Mozilla/5.0"},
)
with urllib.request.urlopen(req, timeout=30) as r:
    data = json.load(r)

rows = data["data"]["matchedUser"]["submitStatsGlobal"]["acSubmissionNum"]
c = {x["difficulty"].lower(): int(x["count"]) for x in rows}
new = {"username": USER, "total": c["all"], "easy": c["easy"], "medium": c["medium"], "hard": c["hard"]}

if new["total"] <= 0 or new["easy"] + new["medium"] + new["hard"] != new["total"]:
    sys.exit(f"Unexpected data, not writing: {new}")

try:
    old = json.load(open(OUT))
except Exception:
    old = {}

changed = any(old.get(k) != new[k] for k in new)
if changed or "--force" in sys.argv:
    new["updated"] = datetime.date.today().isoformat()
    with open(OUT, "w") as f:
        json.dump(new, f, indent=2); f.write("\n")
    print("Updated:", new)
else:
    print("No change:", new)
