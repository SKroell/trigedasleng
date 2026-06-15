#!/usr/bin/env python3
"""
build_testset.py — carve a held-out test set of ~100 attested translation pairs.

We measure BEFORE we tune. These pairs are screen-attested (canon) sentences,
stratified across seasons for coverage, sampled deterministically (fixed seed)
so the set is reproducible. The evaluator excludes these doc_ids from retrieval
so the model can't simply regurgitate the gold pair — it has to translate.

Usage (from ai-service/):
    python eval/build_testset.py --n 100
"""
import argparse
import json
import os
import random
import sys
from collections import defaultdict

AI_SERVICE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EVAL_DIR = os.path.join(AI_SERVICE, "eval")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--corpus", default=os.path.join(AI_SERVICE, "corpus.jsonl"))
    ap.add_argument("--out", default=os.path.join(EVAL_DIR, "testset.jsonl"))
    ap.add_argument("--n", type=int, default=100)
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--min-words", type=int, default=2)
    ap.add_argument("--max-words", type=int, default=20)
    args = ap.parse_args()

    # Gather canon, episode-attested sentence pairs of a sensible length.
    by_season = defaultdict(list)
    with open(args.corpus, encoding="utf-8") as fh:
        for line in fh:
            d = json.loads(line)
            if d["type"] != "translation":
                continue
            m = d["metadata"]
            if m.get("status") != "canon" or not m.get("episodes"):
                continue
            wc = len(m["english"].split())
            if not (args.min_words <= wc <= args.max_words):
                continue
            season = m["episodes"][0][:2]
            by_season[season].append({
                "doc_id": d["doc_id"],
                "trigedasleng": m["trigedasleng"],
                "english": m["english"],
                "literal": m["literal"],
                "leipzig": m["leipzig"],
                "episodes": m["episodes"],
                "season": season,
            })

    rng = random.Random(args.seed)
    for season in by_season:
        by_season[season].sort(key=lambda x: x["doc_id"])  # stable base order
        rng.shuffle(by_season[season])

    total = sum(len(v) for v in by_season.values())
    n = min(args.n, total)

    # Proportional allocation per season, then round-robin to fill any remainder.
    picked, cursors = [], {s: 0 for s in by_season}
    alloc = {s: max(1, round(n * len(v) / total)) for s, v in by_season.items()}
    for s in sorted(by_season):
        take = min(alloc[s], len(by_season[s]))
        picked.extend(by_season[s][:take])
        cursors[s] = take
    seasons_cycle = sorted(by_season)
    i = 0
    while len(picked) < n:
        s = seasons_cycle[i % len(seasons_cycle)]
        if cursors[s] < len(by_season[s]):
            picked.append(by_season[s][cursors[s]])
            cursors[s] += 1
        i += 1
        if i > 10000:
            break
    picked = picked[:n]

    os.makedirs(os.path.dirname(args.out), exist_ok=True)
    with open(args.out, "w", encoding="utf-8") as fh:
        for item in picked:
            fh.write(json.dumps(item, ensure_ascii=False) + "\n")

    dist = {s: sum(1 for p in picked if p["season"] == s) for s in sorted(by_season)}
    print(f"candidate canon pairs : {total}")
    print(f"held-out test set     : {len(picked)} -> {args.out}")
    print(f"by season             : {dist}")


if __name__ == "__main__":
    main()
