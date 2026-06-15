#!/usr/bin/env python3
"""
config.py — load ai-service/.env so endpoints and API keys come from one place.

Only the entry points that need secrets/endpoints call load_env() (service, cli,
evaluate). build_corpus.py and grammar_pdf.py stay stdlib-only and never import
this, so the corpus can be built with no extra dependencies.
"""
import os

_AI_SERVICE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def load_env():
    """Populate os.environ from ai-service/.env if python-dotenv is available.
    A no-op (not an error) when dotenv isn't installed — shell env still works."""
    env_path = os.path.join(_AI_SERVICE, ".env")
    try:
        from dotenv import load_dotenv
    except ImportError:
        return
    load_dotenv(env_path)
