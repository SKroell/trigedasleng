#!/usr/bin/env python3
"""
embedder.py — pluggable embedding backends.

  sentence-transformers : real semantic embeddings (default). On your HPC a
                          large model (BAAI/bge-large-en-v1.5) costs nothing per
                          query. Configure via EMBEDDER_MODEL.
  stub                  : deterministic hashing, no deps — for smoke-testing the
                          retrieval/indexing plumbing offline with no model.

Query vs. document asymmetry: retrieval models like bge/e5 expect the *query* to
carry an instruction prefix while passages do not. Both prefixes are env-tunable
so swapping model families doesn't require code changes.
"""
import hashlib
import os

import numpy as np

DEFAULT_MODEL = "BAAI/bge-large-en-v1.5"
DEFAULT_QUERY_PREFIX = "Represent this sentence for searching relevant passages:"


def _prefixed(texts, prefix):
    """Apply a retrieval instruction prefix (bge/e5 style) to each text."""
    if not prefix:
        return list(texts)
    sep = "" if prefix.endswith(" ") else " "
    return [f"{prefix}{sep}{t}" for t in texts]


class STEmbedder:
    def __init__(self, model_name=None):
        from sentence_transformers import SentenceTransformer

        self.model_name = model_name or os.environ.get("EMBEDDER_MODEL", DEFAULT_MODEL)
        self.query_prefix = os.environ.get("EMBEDDER_QUERY_PREFIX", DEFAULT_QUERY_PREFIX)
        self.doc_prefix = os.environ.get("EMBEDDER_DOC_PREFIX", "")
        self.model = SentenceTransformer(self.model_name)

    @property
    def name(self):
        return f"st:{self.model_name}"

    def _prep(self, texts, is_query):
        return _prefixed(texts, self.query_prefix if is_query else self.doc_prefix)

    def encode(self, texts, is_query=False):
        v = self.model.encode(
            self._prep(texts, is_query),
            normalize_embeddings=True,
            show_progress_bar=False,
            convert_to_numpy=True,
        )
        return v.astype("float32")


class FastEmbedEmbedder:
    """No-PyTorch embeddings via fastembed (ONNX runtime). Ideal for a CPU-only
    server: ~tens of MB instead of ~2 GB of torch/CUDA, no GPU, fast on CPU.
    Supports the bge models (default bge-small). Install: pip install fastembed
    Same query/doc prefix handling as STEmbedder, so retrieval behaves the same."""

    def __init__(self, model_name=None):
        from fastembed import TextEmbedding

        self.model_name = model_name or os.environ.get(
            "EMBEDDER_MODEL", "BAAI/bge-small-en-v1.5")
        self.query_prefix = os.environ.get("EMBEDDER_QUERY_PREFIX", DEFAULT_QUERY_PREFIX)
        self.doc_prefix = os.environ.get("EMBEDDER_DOC_PREFIX", "")
        self.model = TextEmbedding(model_name=self.model_name)

    @property
    def name(self):
        return f"fastembed:{self.model_name}"

    def encode(self, texts, is_query=False):
        prepped = _prefixed(texts, self.query_prefix if is_query else self.doc_prefix)
        v = np.array(list(self.model.embed(prepped)), dtype="float32")
        n = np.linalg.norm(v, axis=1, keepdims=True)
        n[n == 0] = 1
        return v / n


class StubEmbedder:
    """No semantics — only verifies indexing/retrieval runs end-to-end offline."""

    def __init__(self, dim=256):
        self.dim = dim

    @property
    def name(self):
        return f"stub:{self.dim}"

    def encode(self, texts, is_query=False):
        out = np.zeros((len(texts), self.dim), dtype="float32")
        for i, t in enumerate(texts):
            for tok in t.lower().split():
                h = int(hashlib.md5(tok.encode()).hexdigest(), 16)
                out[i, h % self.dim] += 1.0
        n = np.linalg.norm(out, axis=1, keepdims=True)
        n[n == 0] = 1
        return out / n


def make_embedder(name=None):
    name = name or os.environ.get("EMBEDDER", "sentence-transformers")
    if name == "stub":
        return StubEmbedder()
    if name == "fastembed":
        return FastEmbedEmbedder()
    return STEmbedder()
