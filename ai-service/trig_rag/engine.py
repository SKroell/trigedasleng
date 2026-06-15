#!/usr/bin/env python3
"""
engine.py — ties the pieces together: index -> type-aware retrieval -> grounding
prompt -> LLM. Shared by both the HTTP service and the CLI so they behave
identically.
"""
import json
import os
import re

from . import embedder as emb_mod
from . import llm, retrieval

_SYSTEM_PATH = os.path.join(os.path.dirname(__file__), "system_prompt.txt")
SYSTEM_PROMPT = open(_SYSTEM_PATH, encoding="utf-8").read()

_FULL_HEADER = (
    "SOURCES — the complete attested corpus (every dictionary entry, example "
    "sentence, and grammar section). Ground your answer ONLY in these and cite "
    "the bracketed ids:\n\n"
)


class Engine:
    """Two retrieval modes (RETRIEVAL_MODE env, or `mode=`):
      vector : embed the corpus, retrieve a type-aware quota per query (needs an
               embedder; few-K tokens/query).
      full   : send the ENTIRE corpus to the model each query — no embedder, no
               sentence-transformers/torch. Best grounding; prompt-cached so the
               big stable corpus is cheap on repeat queries. Fine here because the
               whole corpus is small (~88K tokens).
    """

    def __init__(self, corpus_path=None, embedder=None, cache="embeddings.npy",
                 mode=None, force_rebuild=False):
        corpus_path = corpus_path or os.environ.get("RAG_CORPUS", "corpus.jsonl")
        self.mode = (mode or os.environ.get("RETRIEVAL_MODE", "vector")).lower()
        with open(corpus_path, encoding="utf-8") as fh:
            self.docs = [json.loads(line) for line in fh if line.strip()]
        self.by_id = {d["doc_id"]: d for d in self.docs}
        self.n_docs = len(self.docs)

        if self.mode == "full":
            self.embedder_name = "none (full-context)"
            self.index = None
            self.quotas = None
            self._full_all = retrieval.format_full(self.docs)
            self._full_canon = retrieval.format_full(self.docs, status_filter={"canon"})
        else:
            embedder = embedder or emb_mod.make_embedder()
            self.embedder_name = embedder.name
            self.index = retrieval.Index(corpus_path, embedder, cache, docs=self.docs)
            self.index.build(force=force_rebuild)
            self.quotas = retrieval.quotas_from_env()

    _CITE_RE = re.compile(r"\b((?:dict|trans|gram):[0-9a-f]{10})\b")

    def _cited_sources(self, text):
        """In full mode every doc is in context, so we reconstruct the 'sources'
        panel from the ids the model actually cited (keeps audio/episode UI)."""
        out, seen = [], set()
        for did in self._CITE_RE.findall(text or ""):
            if did in self.by_id and did not in seen:
                seen.add(did)
                out.append(self.by_id[did])
        return retrieval.sources_from_docs(out)

    def _full_context(self, canon_only, exclude_ids):
        if exclude_ids:  # eval hold-out: drop the gold docs from context
            docs = [d for d in self.docs if d["doc_id"] not in exclude_ids]
            return retrieval.format_full(docs, status_filter={"canon"} if canon_only else None)
        return self._full_canon if canon_only else self._full_all

    def answer(self, question, llm_backend=None, canon_only=False, history=None,
               exclude_ids=None):
        if self.mode == "full":
            context = self._full_context(canon_only, exclude_ids)
            res = llm.generate(llm_backend, SYSTEM_PROMPT, f"QUESTION: {question}",
                               history, cached_context=_FULL_HEADER + context)
            text = res["text"]
            if text is None:  # backend == "none"
                text = (f"[full-context mode] would send {self.n_docs} docs "
                        f"(~{len(context) // 4:,} tokens) to the model. No LLM configured.")
                return {"answer": text, "sources": [], "context": context, "usage": None}
            return {"answer": text, "sources": self._cited_sources(text),
                    "context": context, "usage": res["usage"]}

        # vector mode
        status_filter = {"canon"} if canon_only else None
        hits = self.index.retrieve(question, quotas=self.quotas,
                                   status_filter=status_filter,
                                   exclude_ids=exclude_ids)
        context = retrieval.format_context(hits)
        user_msg = f"SOURCES:\n{context}\n\nQUESTION: {question}"
        res = llm.generate(llm_backend, SYSTEM_PROMPT, user_msg, history)
        text = res["text"]
        if text is None:  # backend == "none": retrieval-only
            text = f"--- retrieved context (no LLM) ---\n{context}"
        return {
            "answer": text,
            "sources": retrieval.sources_payload(hits),
            "context": context,
            "usage": res["usage"],
        }

    _TRANSLATION_RE = re.compile(r"TRANSLATION:\s*(.+)", re.I)

    def translate(self, text, direction="en2trig", llm_backend=None,
                  canon_only=False, exclude_ids=None):
        """Focused translation used by the eval harness. The model still answers
        with a full grounded explanation, but is asked to put the bare
        translation on a parseable first line so we can score it."""
        if direction == "en2trig":
            instruction = (
                "Translate the following English into Trigedasleng.\n"
                "On the FIRST line output exactly: TRANSLATION: <trigedasleng "
                "romanization only, no gloss>\n"
                "Then give your grounded explanation (word-by-word gloss, "
                "attestation status, citations). If you cannot build it from "
                "attested words, output 'TRANSLATION: (none)' and say why.\n\n"
                f"English: {text}"
            )
        else:
            instruction = (
                "Translate the following Trigedasleng into English.\n"
                "On the FIRST line output exactly: TRANSLATION: <english>\n"
                "Then give your grounded explanation and citations.\n\n"
                f"Trigedasleng: {text}"
            )
        result = self.answer(instruction, llm_backend=llm_backend,
                             canon_only=canon_only, exclude_ids=exclude_ids)
        m = self._TRANSLATION_RE.search(result["answer"])
        candidate = (m.group(1).strip() if m else "").strip()
        if candidate.lower() in {"(none)", "none", "(no attested translation)"}:
            candidate = ""
        result["candidate"] = candidate
        return result
