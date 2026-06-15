#!/usr/bin/env python3
"""
cli.py — command-line driver for the RAG engine (smoke tests + manual checks).

    # offline, no model, no network — verifies retrieval plumbing:
    python -m trig_rag.cli --embedder stub --llm none "how do you say my fight is over"

    # real semantic retrieval only (downloads the embedding model once):
    python -m trig_rag.cli --llm none "translate: blood must have blood"

    # full grounded answer via Anthropic:
    python -m trig_rag.cli --llm anthropic "what does 'gonplei' mean?"

    # ...or your self-hosted vLLM/TGI:
    OPENAI_BASE_URL=http://hpc-node:8000/v1 OPENAI_MODEL=... \
        python -m trig_rag.cli --llm openai --canon-only "translate: we are grounders"
"""
import argparse
import os
import sys

from .config import load_env

load_env()

from . import embedder as emb_mod
from .engine import Engine


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--corpus", default=None)
    ap.add_argument("--mode", default=None, choices=[None, "vector", "full"],
                    help="vector = retrieval (needs embedder); full = whole corpus, key-only")
    ap.add_argument("--embedder", default=None,
                    choices=[None, "sentence-transformers", "fastembed", "stub"])
    ap.add_argument("--llm", default=None, choices=[None, "none", "anthropic", "openai"])
    ap.add_argument("--canon-only", action="store_true")
    ap.add_argument("--rebuild", action="store_true")
    ap.add_argument("question", nargs="*")
    args = ap.parse_args()

    # Only build an embedder for vector mode.
    mode = args.mode or os.environ.get("RETRIEVAL_MODE", "vector")
    embedder = emb_mod.make_embedder(args.embedder) if (args.embedder and mode != "full") else None
    eng = Engine(corpus_path=args.corpus, embedder=embedder, mode=args.mode,
                 force_rebuild=args.rebuild)

    def run(q):
        result = eng.answer(q, llm_backend=args.llm, canon_only=args.canon_only)
        print(result["answer"])
        u = result.get("usage")
        if u:  # show cache hits so token reuse is visible
            print(f"\n[usage] input={u.get('input_tokens')} "
                  f"output={u.get('output_tokens')} "
                  f"cache_read={u.get('cache_read_input_tokens')} "
                  f"cache_write={u.get('cache_creation_input_tokens')}",
                  file=sys.stderr)

    if args.question:
        run(" ".join(args.question))
    else:
        print(f"Trigedasleng RAG ready ({eng.n_docs} docs, {eng.embedder_name}). "
              f"Type a question (Ctrl-D to quit).")
        for line in sys.stdin:
            line = line.strip()
            if line:
                print()
                run(line)
                print()


if __name__ == "__main__":
    main()
