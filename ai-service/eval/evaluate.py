#!/usr/bin/env python3
"""
evaluate.py — score RAG translation quality on the held-out test set.

Metrics (sacrebleu):
  * chrF  — character-n-gram F-score. The HEADLINE metric: it's the right choice
            for a short, morphologically dense conlang where word-level BLEU is
            brittle.
  * BLEU  — reported alongside for reference.
  * coverage — fraction of items the model actually attempted (didn't abstain
            with "no attested word"). Abstention is a feature, not a bug, so we
            report it instead of forcing a guess.

It also writes a human spot-check report (report.md) — automatic metrics never
replace eyeballing the output for a conlang.

Held-out items are excluded from retrieval so the model can't echo the gold pair.

Usage (from ai-service/):
    # baseline, RAG-only, via Anthropic:
    python eval/evaluate.py --llm anthropic
    # against your self-hosted endpoint:
    OPENAI_BASE_URL=... OPENAI_MODEL=... python eval/evaluate.py --llm openai
"""
import argparse
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))  # ai-service/
from trig_rag.config import load_env  # noqa: E402

load_env()

from trig_rag import embedder as emb_mod  # noqa: E402
from trig_rag.engine import Engine  # noqa: E402

AI_SERVICE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EVAL_DIR = os.path.join(AI_SERVICE, "eval")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--testset", default=os.path.join(EVAL_DIR, "testset.jsonl"))
    ap.add_argument("--corpus", default=os.path.join(AI_SERVICE, "corpus.jsonl"))
    ap.add_argument("--llm", required=True, choices=["anthropic", "openai"],
                    help="a real backend is required to produce translations")
    ap.add_argument("--embedder", default=None,
                    choices=[None, "sentence-transformers", "fastembed", "stub"])
    ap.add_argument("--mode", default=None, choices=[None, "vector", "full"])
    ap.add_argument("--direction", default="en2trig", choices=["en2trig", "trig2en"])
    ap.add_argument("--canon-only", action="store_true")
    ap.add_argument("--limit", type=int, default=0, help="0 = all")
    ap.add_argument("--out", default=os.path.join(EVAL_DIR, "report"))
    args = ap.parse_args()

    import sacrebleu

    testset = [json.loads(l) for l in open(args.testset, encoding="utf-8") if l.strip()]
    if args.limit:
        testset = testset[: args.limit]
    exclude_ids = {t["doc_id"] for t in testset}

    mode = args.mode or os.environ.get("RETRIEVAL_MODE", "vector")
    embedder = emb_mod.make_embedder(args.embedder) if (args.embedder and mode != "full") else None
    eng = Engine(corpus_path=args.corpus, embedder=embedder, mode=args.mode)

    rows, refs, hyps = [], [], []
    for i, item in enumerate(testset, 1):
        if args.direction == "en2trig":
            src, ref = item["english"], item["trigedasleng"]
        else:
            src, ref = item["trigedasleng"], item["english"]
        out = eng.translate(src, direction=args.direction, llm_backend=args.llm,
                           canon_only=args.canon_only, exclude_ids=exclude_ids)
        hyp = out["candidate"]
        chrf = sacrebleu.sentence_chrf(hyp, [ref]).score if hyp else 0.0
        rows.append({
            "src": src, "ref": ref, "hyp": hyp,
            "abstained": hyp == "", "chrf": round(chrf, 2),
            "episodes": item.get("episodes"),
            "answer": out["answer"],
        })
        refs.append(ref)
        hyps.append(hyp)
        print(f"[{i}/{len(testset)}] chrF={chrf:5.1f}  {src[:40]!r} -> {hyp[:40]!r}")

    attempted = [(h, r) for h, r in zip(hyps, refs) if h]
    corpus_chrf = sacrebleu.corpus_chrf([h for h, _ in attempted],
                                        [[r for _, r in attempted]]).score if attempted else 0.0
    corpus_bleu = sacrebleu.corpus_bleu([h for h, _ in attempted],
                                        [[r for _, r in attempted]]).score if attempted else 0.0
    coverage = len(attempted) / len(testset) if testset else 0.0

    summary = {
        "n": len(testset),
        "direction": args.direction,
        "llm": args.llm,
        "embedder": eng.embedder_name,
        "canon_only": args.canon_only,
        "coverage": round(coverage, 4),
        "chrF_attempted": round(corpus_chrf, 2),
        "BLEU_attempted": round(corpus_bleu, 2),
        "mean_sentence_chrF_all": round(sum(r["chrf"] for r in rows) / len(rows), 2) if rows else 0,
    }

    with open(args.out + ".json", "w", encoding="utf-8") as fh:
        json.dump({"summary": summary, "rows": rows}, fh, ensure_ascii=False, indent=2)

    with open(args.out + ".md", "w", encoding="utf-8") as fh:
        fh.write(f"# RAG eval — {args.direction}\n\n")
        for k, v in summary.items():
            fh.write(f"- **{k}**: {v}\n")
        fh.write("\n| chrF | source | reference | hypothesis |\n|---:|---|---|---|\n")
        for r in sorted(rows, key=lambda x: x["chrf"]):
            esc = lambda s: (s or "").replace("|", "\\|")
            hyp = esc(r["hyp"]) if r["hyp"] else "_(abstained)_"
            fh.write(f"| {r['chrf']:.0f} | {esc(r['src'])} | {esc(r['ref'])} | {hyp} |\n")

    print("\n=== SUMMARY ===")
    print(json.dumps(summary, indent=2))
    print(f"\nwrote {args.out}.json and {args.out}.md")


if __name__ == "__main__":
    main()
