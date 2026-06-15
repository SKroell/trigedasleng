#!/usr/bin/env python3
"""
build_corpus.py — turn the live Trigedasleng database into one clean,
retrieval-ready corpus.jsonl.

This replaces the old JSON-dump loaders: it reads the source of truth
(prisma/dev.db, READ-ONLY) so the corpus regenerates whenever the dictionary,
translations, or grammar change.

Each output line is a "document": the text that gets embedded plus the metadata
that lets the chatbot cite and filter (attestation status, episode, gloss,
audio, etc.).

Data cleaning applied (verified against the live DB):
  * status     — dictionaries.value -> canon | noncanon | slakkru
  * etymology  — strip the "from: " prefix on word etymologies; drop "?"
  * sentences  — collapse identical (trig, english) into one doc with an episode
                 list; keep BOTH the literal and the Leipzig interlinear gloss
  * POS        — already normalized in the DB (classifications); no string split
  * notes      — no notes column exists in the live DB; the doubled-note dedupe
                 helper is retained defensively and applied to glosses

Usage (from ai-service/):
    python -m trig_rag.build_corpus --out corpus.jsonl
    python -m trig_rag.build_corpus --out corpus.jsonl --grammar grammar_sections.jsonl
"""
import argparse
import hashlib
import json
import os
import re
import sys
from collections import Counter, defaultdict

# Allow running both as a module (`python -m trig_rag.build_corpus`) and as a
# bare script; db.py is a sibling in this package directory.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import db  # noqa: E402

STATUS_ORDER = {"canon": 4, "noncanon": 3, "slakkru": 2, "uncited": 1, "unknown": 0}

# ---------------------------------------------------------------- helpers


def norm_status(raw):
    """dictionaries.value -> canon | noncanon | slakkru. Falls back to the old
    messy-string heuristics so stale exports still normalize sanely."""
    if raw in db.DICT_STATUS:
        return db.DICT_STATUS[raw]
    s = (raw or "").strip().lower()
    if not s:
        return "unknown"
    if "slakgedasleng" in s or "slakkru" in s:
        return "slakkru"
    if "noncanon" in s:
        return "noncanon"
    if "canon" in s or "trigedasleng" in s:
        return "canon"
    return "unknown"


def clean_etym(etym):
    """'from: ban out' -> 'ban out'; 'from: ?' / '?' -> '' (no real etymology)."""
    e = (etym or "").strip()
    e = re.sub(r"^(from:\s*)+", "", e, flags=re.I).strip()  # handles doubled 'from: from:'
    if e in {"?", "unknown", "-"}:
        return ""
    return e


def dedupe_doubled(text):
    """'foo bar foo bar' -> 'foo bar' (the doubled-field bug seen in old dumps)."""
    t = (text or "").strip()
    if not t:
        return ""
    n = len(t)
    if n % 2 == 0:
        half = n // 2
        a, b = t[:half].strip(), t[half:].strip()
        if a and a == b:
            return a
    words = t.split()
    if len(words) % 2 == 0:
        half = len(words) // 2
        if words[:half] == words[half:]:
            return " ".join(words[:half])
    return t


def doc_id(prefix, *parts):
    h = hashlib.sha1("||".join(str(p) for p in parts).encode("utf-8")).hexdigest()[:10]
    return f"{prefix}:{h}"


# ---------------------------------------------------------------- vocabulary


def build_vocab_docs(con):
    """One document per Trig headword, aggregating all of its senses."""
    words = db.fetch_words(con)

    senses = defaultdict(list)
    for r in db.fetch_translations(con):
        senses[r["word_id"]].append(r)

    pos_map = defaultdict(list)
    for r in db.fetch_classifications(con):
        if r["pos"] not in pos_map[r["word_id"]]:
            pos_map[r["word_id"]].append(r["pos"])

    docs = []
    for w in words:
        wid = w["id"]
        word = (w["value"] or "").strip()
        if not word:
            continue
        status = norm_status(w["dictionary"])
        pos = pos_map.get(wid, [])
        pronunciation = (w["pronunciation"] or "").strip()

        glosses, etyms = [], []
        any_approved = False
        for s in senses.get(wid, []):
            g = dedupe_doubled((s["english"] or "").strip())
            if g and g not in glosses:
                glosses.append(g)
            e = clean_etym(s["etymology"])
            if e and e not in etyms:
                etyms.append(e)
            if s["is_approved"]:
                any_approved = True
        definition = "; ".join(glosses)

        parts = [word]
        if pos:
            parts.append(f"({', '.join(pos)})")
        if definition:
            parts.append(f"— {definition}")
        line = " ".join(parts)
        if etyms:
            line += f". Etymology: {'; '.join(etyms)}"
        if pronunciation:
            line += f". Pronunciation: {pronunciation}"
        line += f". [{status}]"

        docs.append({
            "doc_id": doc_id("dict", word, status),
            "type": "dictionary",
            "text": line,
            "metadata": {
                "word": word,
                "pos": pos,
                "definition": definition,
                "glosses": glosses,
                "etymology": etyms,
                "pronunciation": pronunciation,
                "status": status,
                "approved": any_approved,
            },
        })
    return docs


# ---------------------------------------------------------------- sentences


def build_sentence_docs(con):
    """Collapse identical (trig, english) sentences into one doc with the union
    of episodes/speakers, keeping both glosses and any audio path."""
    eps = defaultdict(list)
    for r in db.fetch_episode_links(con):
        try:
            code = f"{int(r['season']):02d}{int(r['series']):02d}"
        except (TypeError, ValueError):
            code = "other"
        eps[r["sentence_id"]].append({
            "code": code,
            "episode": (r["ep_value"] or "").strip(),
            "speaker": (r["speaker"] or "").strip(),
        })

    merged = {}
    for s in db.fetch_sentences(con):
        trig = (s["trig"] or "").strip()
        eng = (s["english"] or "").strip()
        if not trig or not eng:
            continue
        key = (trig.lower(), eng.lower())
        literal = dedupe_doubled((s["literal"] or "").strip())
        leipzig = dedupe_doubled((s["leipzig"] or "").strip())
        audio = (s["audio"] or "").strip()
        ep_list = eps.get(s["id"], [])

        rec = merged.get(key)
        if rec is None:
            merged[key] = {
                "trig": trig, "english": eng,
                "literal": literal, "leipzig": leipzig,
                "audio": audio, "episodes": list(ep_list),
            }
        else:
            # keep the longer/non-empty gloss, prefer any audio, union episodes
            if len(literal) > len(rec["literal"]):
                rec["literal"] = literal
            if len(leipzig) > len(rec["leipzig"]):
                rec["leipzig"] = leipzig
            if audio and not rec["audio"]:
                rec["audio"] = audio
            rec["episodes"].extend(ep_list)

    docs = []
    for rec in merged.values():
        # dedupe episode entries by (code, speaker)
        seen, episodes = set(), []
        for e in rec["episodes"]:
            k = (e["code"], e["speaker"])
            if k not in seen:
                seen.add(k)
                episodes.append(e)
        codes = sorted({e["code"] for e in episodes})
        speakers = sorted({e["speaker"] for e in episodes if e["speaker"]})
        status = "canon" if episodes else "uncited"

        text = f"Trigedasleng: {rec['trig']}\nEnglish: {rec['english']}"
        if rec["literal"]:
            text += f"\nLiteral: {rec['literal']}"
        if rec["leipzig"]:
            text += f"\nGloss: {rec['leipzig']}"

        docs.append({
            "doc_id": doc_id("trans", rec["trig"], rec["english"]),
            "type": "translation",
            "text": text,
            "metadata": {
                "trigedasleng": rec["trig"],
                "english": rec["english"],
                "literal": rec["literal"],
                "leipzig": rec["leipzig"],
                "episodes": codes,
                "episode_detail": episodes,
                "speakers": speakers,
                "audio": rec["audio"],
                "status": status,
            },
        })
    return docs


# ---------------------------------------------------------------- grammar


def load_grammar_docs(path):
    """Grammar docs are produced separately by grammar_pdf.py (one JSON object
    per line, already shaped as {doc_id,type,text,metadata}). Optional."""
    if not path or not os.path.exists(path):
        return []
    docs = []
    with open(path, encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if line:
                docs.append(json.loads(line))
    return docs


# ---------------------------------------------------------------- main


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--db", default=None, help="override DB path (else env/default)")
    ap.add_argument("--out", default="corpus.jsonl")
    ap.add_argument("--grammar", default=None,
                    help="optional grammar_sections.jsonl from grammar_pdf.py")
    args = ap.parse_args()

    con = db.connect(args.db)
    try:
        vocab = build_vocab_docs(con)
        sents = build_sentence_docs(con)
    finally:
        con.close()
    grammar = load_grammar_docs(args.grammar)

    all_docs = vocab + sents + grammar
    with open(args.out, "w", encoding="utf-8") as fh:
        for d in all_docs:
            fh.write(json.dumps(d, ensure_ascii=False) + "\n")

    print(f"DB: {db.resolve_db_path(args.db)}")
    print(f"vocabulary docs : {len(vocab)}")
    print(f"  by status     : {dict(Counter(d['metadata']['status'] for d in vocab))}")
    print(f"  with etymology: {sum(1 for d in vocab if d['metadata']['etymology'])}")
    print(f"sentence docs   : {len(sents)}")
    print(f"  by status     : {dict(Counter(d['metadata']['status'] for d in sents))}")
    print(f"  with leipzig  : {sum(1 for d in sents if d['metadata']['leipzig'])}")
    print(f"  with audio    : {sum(1 for d in sents if d['metadata']['audio'])}")
    print(f"  multi-episode : {sum(1 for d in sents if len(d['metadata']['episodes']) > 1)}")
    print(f"grammar docs    : {len(grammar)}")
    print(f"TOTAL -> {args.out}: {len(all_docs)}")
    if vocab:
        print("\n--- sample vocabulary doc ---")
        print(json.dumps(vocab[0], ensure_ascii=False, indent=2))
    if sents:
        multi = next((d for d in sents if len(d["metadata"]["episodes"]) > 1), sents[0])
        print("\n--- sample sentence doc (collapsed across episodes) ---")
        print(json.dumps(multi, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
