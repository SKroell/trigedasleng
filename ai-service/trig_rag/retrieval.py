#!/usr/bin/env python3
"""
retrieval.py — embed the corpus and retrieve TYPE-AWARE cited context.

The key design choice: retrieval pulls a quota from each document type
(dictionary / translation / grammar) rather than a flat top-k, so a translation
query gets grounded in BOTH vocabulary AND real example sentences instead of
whichever type happens to dominate the nearest neighbours.

Embeddings are cached to disk and invalidated automatically when the embedder
model or the corpus changes.
"""
import hashlib
import json
import math
import os
import re

import numpy as np

DEFAULT_QUOTAS = {"dictionary": 10, "translation": 8, "grammar": 4}

# How strongly the lexical (exact-word) signal is blended into the dense ranking.
LEX_WEIGHT = float(os.environ.get("RAG_LEX_WEIGHT", "0.35"))

_TOKEN_RE = re.compile(r"[a-z0-9'\-]+")
# Function words to drop from the query so we match on content words. Includes the
# usual English stop list plus phrasing common to these queries ("how do you say…",
# "what does … mean", "translate…").
_STOP = frozenset((
    "a an the to of in on at for and or but is are was were be been am "
    "do does did done how what which who whom whose when where why whether "
    "i you he she it we they me him her them us my your his hers its our their "
    "this that these those there here as if then than so such not no yes "
    "say said says saying mean means meaning word words name called "
    "translate translates translated translation translating "
    "trigedasleng english language please can could would should will shall "
    "may might with without from into about would like want need know "
).split())


def _content_tokens(text):
    return [t for t in _TOKEN_RE.findall((text or "").lower()) if len(t) > 1 and t not in _STOP]


def quotas_from_env():
    return {
        "dictionary": int(os.environ.get("RAG_QUOTA_DICTIONARY", 10)),
        "translation": int(os.environ.get("RAG_QUOTA_TRANSLATION", 8)),
        "grammar": int(os.environ.get("RAG_QUOTA_GRAMMAR", 4)),
    }


class Index:
    def __init__(self, corpus_path, embedder, cache="embeddings.npy", docs=None):
        if docs is not None:
            self.docs = docs
        else:
            with open(corpus_path, encoding="utf-8") as fh:
                self.docs = [json.loads(line) for line in fh if line.strip()]
        self.embedder = embedder
        self.cache = cache
        self.meta_path = cache.rsplit(".", 1)[0] + ".meta.json"
        self.vecs = None
        self._build_lexical()

    def _build_lexical(self):
        """A small in-memory lexical index for hybrid retrieval. Weighted per
        field so an exact headword match outranks an incidental gloss word:
          dictionary  headword 3.0 | gloss 1.5 | etymology 0.5
          translation trig form 2.0 | english 1.5 | literal/leipzig 0.5
        A term with weight >= 1.5 (headword or gloss) is a 'trigger' — a query
        word hitting it force-includes that dictionary entry, so words that are
        literally in the dictionary can never be missed by semantic ranking alone.
        """
        self._doc_terms = []   # idx -> {term: weight}
        df = {}
        for d in self.docs:
            m = d["metadata"]
            weights = {}

            def add(text, w):
                for t in _content_tokens(text):
                    if weights.get(t, 0) < w:
                        weights[t] = w

            if d["type"] == "dictionary":
                for t in _content_tokens(m.get("word")):
                    weights[t] = 3.0
                for g in (m.get("glosses") or []):
                    add(g, 1.5)
                for e in (m.get("etymology") or []):
                    add(e, 0.5)
            elif d["type"] == "translation":
                for t in _content_tokens(m.get("trigedasleng")):
                    if weights.get(t, 0) < 2.0:
                        weights[t] = 2.0
                add(m.get("english"), 1.5)
                add(m.get("literal"), 0.5)
                add(m.get("leipzig"), 0.5)
            else:  # grammar
                add(m.get("section"), 1.0)
                add(d.get("text"), 0.3)

            self._doc_terms.append(weights)
            for t in weights:
                df[t] = df.get(t, 0) + 1

        n = max(1, len(self.docs))
        self._idf = {t: math.log(1 + n / (1 + c)) for t, c in df.items()}
        self._postings = {}
        for i, weights in enumerate(self._doc_terms):
            for t in weights:
                self._postings.setdefault(t, []).append(i)

    def _signature(self):
        h = hashlib.sha1()
        h.update(self.embedder.name.encode())
        for d in self.docs:
            h.update(d["text"].encode("utf-8"))
        return {"embedder": self.embedder.name, "n": len(self.docs),
                "hash": h.hexdigest()}

    def build(self, force=False):
        sig = self._signature()
        if not force and os.path.exists(self.cache) and os.path.exists(self.meta_path):
            try:
                cached = json.load(open(self.meta_path, encoding="utf-8"))
                if cached == sig:
                    self.vecs = np.load(self.cache)
                    if self.vecs.shape[0] == len(self.docs):
                        return
            except Exception:
                pass
        self.vecs = self.embedder.encode([d["text"] for d in self.docs], is_query=False)
        np.save(self.cache, self.vecs)
        json.dump(sig, open(self.meta_path, "w", encoding="utf-8"))

    def retrieve(self, query, quotas=None, status_filter=None, exclude_ids=None, hybrid=True):
        quotas = quotas or DEFAULT_QUOTAS
        exclude_ids = exclude_ids or set()
        q = self.embedder.encode([query], is_query=True)[0]
        sims = self.vecs @ q  # cosine; all vectors are L2-normalized

        def allowed(idx):
            d = self.docs[idx]
            if d["doc_id"] in exclude_ids:  # held-out eval items
                return False
            if status_filter and d["metadata"].get("status") not in status_filter:
                return False
            return True

        # --- lexical pass: idf-weighted exact-word overlap with the query --------
        lex = {}
        forced_dict = []
        if hybrid:
            q_terms = set(_content_tokens(query))
            candidates = set()
            for t in q_terms:
                candidates.update(self._postings.get(t, ()))
            for i in candidates:
                terms = self._doc_terms[i]
                lex[i] = sum(self._idf.get(t, 0.0) * terms[t] for t in q_terms if t in terms)
            # dictionary entries whose headword/gloss literally matches a query
            # word are force-included (ranked by lexical score), so an attested
            # word is never dropped just because it embeds poorly.
            forced_dict = [
                i for i in candidates
                if self.docs[i]["type"] == "dictionary" and allowed(i)
                and any(self._doc_terms[i].get(t, 0) >= 1.5 for t in q_terms)
            ]
            forced_dict.sort(key=lambda i: -lex.get(i, 0.0))

        max_lex = max(lex.values()) if lex else 0.0

        def combined(idx):
            base = float(sims[idx])
            if max_lex > 0 and idx in lex:
                base += LEX_WEIGHT * (lex[idx] / max_lex)
            return base

        picked, counts, seen = [], {k: 0 for k in quotas}, set()

        # 1) guaranteed exact dictionary matches (capped at the dictionary quota)
        for i in forced_dict:
            if counts.get("dictionary", 0) >= quotas.get("dictionary", 0):
                break
            picked.append((float(sims[i]), self.docs[i]))
            seen.add(i)
            counts["dictionary"] += 1

        # 2) fill remaining per-type quotas by the blended (dense + lexical) rank
        order = sorted(range(len(self.docs)), key=combined, reverse=True)
        for idx in order:
            if idx in seen:
                continue
            t = self.docs[idx]["type"]
            if t not in counts or counts[t] >= quotas[t]:
                continue
            if not allowed(idx):
                continue
            picked.append((float(sims[idx]), self.docs[idx]))
            seen.add(idx)
            counts[t] += 1
            if all(counts[k] >= quotas[k] for k in quotas):
                break
        return picked


def _format_doc(d):
    m = d["metadata"]
    tag = d["doc_id"]
    if d["type"] == "translation" and m.get("episodes"):
        tag += " | episode " + ", ".join(m["episodes"])
    if d["type"] == "translation" and m.get("audio"):
        tag += " | audio"
    return f"[{tag} | {m.get('status', '?')}]\n{d['text']}"


def format_context(hits):
    """Human/LLM-readable cited context block from retrieved hits."""
    return "\n\n".join(_format_doc(d) for _score, d in hits)


# Stable ordering for full-context mode (also for grammar) so the block is
# byte-identical across queries and prompt-caches cleanly.
_TYPE_ORDER = ["dictionary", "translation", "grammar"]
_TYPE_HEADER = {
    "dictionary": "VOCABULARY",
    "translation": "ATTESTED EXAMPLE SENTENCES",
    "grammar": "REFERENCE GRAMMAR",
}


def format_full(docs, status_filter=None):
    """The ENTIRE corpus as one grouped, cited block (full-context mode)."""
    groups = {t: [] for t in _TYPE_ORDER}
    for d in docs:
        if status_filter and d["metadata"].get("status") not in status_filter:
            continue
        if d["type"] in groups:
            groups[d["type"]].append(d)
    parts = []
    for t in _TYPE_ORDER:
        ds = groups[t]
        if not ds:
            continue
        parts.append(f"=== {_TYPE_HEADER[t]} ({len(ds)}) ===")
        parts.append("\n\n".join(_format_doc(d) for d in ds))
    return "\n\n".join(parts)


def sources_from_docs(docs):
    """Build the source payload from a plain doc list (no scores)."""
    return sources_payload([(None, d) for d in docs])


def sources_payload(hits):
    """Structured citations for the HTTP API / UI (so the site can render audio
    players and episode links next to the answer)."""
    out = []
    for score, d in hits:
        m = d["metadata"]
        out.append({
            "doc_id": d["doc_id"],
            "type": d["type"],
            "status": m.get("status"),
            "score": round(score, 4) if score is not None else None,
            "text": d["text"],
            # type-specific extras
            "word": m.get("word"),
            "trigedasleng": m.get("trigedasleng"),
            "english": m.get("english"),
            "episodes": m.get("episodes"),
            "audio": m.get("audio"),
            "section": m.get("section"),
        })
    return out
