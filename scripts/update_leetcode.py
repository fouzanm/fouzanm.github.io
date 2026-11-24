"""Fetch public LeetCode solve counts and badges and write leetcode.json.

Exits non-zero (leaving the existing file untouched) if the data looks wrong,
so a LeetCode outage never overwrites good numbers with bad ones.
"""
import json, sys, datetime, urllib.request

USER = "fouzanm"
OUT = "leetcode.json"
QUERY = """query($u:String!){matchedUser(username:$u){
  submitStatsGlobal{acSubmissionNum{difficulty count}}
  badges{displayName icon creationDate}}}"""

req = urllib.request.Request(
    "https://leetcode.com/graphql",
    data=json.dumps({"query": QUERY, "variables": {"u": USER}}).encode(),
    headers={"Content-Type": "application/json", "Referer": "https://leetcode.com", "User-Agent": "Mozilla/5.0"},
)
with urllib.request.urlopen(req, timeout=30) as r:
    data = json.load(r)

user = data["data"]["matchedUser"]
rows = user["submitStatsGlobal"]["acSubmissionNum"]
c = {x["difficulty"].lower(): int(x["count"]) for x in rows}


def abs_icon(url):
    return url if url.startswith("http") else "https://leetcode.com" + url


badges = [
    {"name": b["displayName"], "icon": abs_icon(b["icon"]), "date": b["creationDate"]}
    for b in user.get("badges") or []
]

new = {
    "username": USER,
    "total": c["all"],
    "easy": c["easy"],
    "medium": c["medium"],
    "hard": c["hard"],
    "badgeCount": len(badges),
    "badges": badges,
}

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
        json.dump(new, f, indent=2)
        f.write("\n")
    print("Updated:", {k: v for k, v in new.items() if k != "badges"}, f"({len(badges)} badges)")
else:
    print("No change.")
