#!/usr/bin/env python3
"""
service.py — FastAPI HTTP endpoint the website calls.

Run:
    uvicorn trig_rag.service:app --host 127.0.0.1 --port 8000
    # offline smoke (no model download, no API key):
    EMBEDDER=stub LLM_BACKEND=none uvicorn trig_rag.service:app

Endpoints:
    GET  /health  -> readiness + index stats
    POST /chat    -> { message, canon_only?, history? } -> { answer, sources }
"""
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .config import load_env

load_env()  # read ai-service/.env before anything inspects the environment

from .engine import Engine

app = FastAPI(title="Trigedasleng RAG", version="0.1.0")

# The website (a separate origin in dev) calls this directly from the loader/
# action, but allow browser calls too if the UI ever talks to it directly.
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get("RAG_CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

_engine = None


def get_engine():
    global _engine
    if _engine is None:
        _engine = Engine()
    return _engine


class Turn(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    canon_only: bool = False
    history: list[Turn] = []


@app.on_event("startup")
def _warmup():
    get_engine()  # build/load embeddings once at startup


@app.get("/health")
def health():
    eng = get_engine()
    backend = os.environ.get("LLM_BACKEND", "anthropic")
    model = (
        os.environ.get("ANTHROPIC_MODEL", "claude-opus-4-8")
        if backend == "anthropic"
        else os.environ.get("OPENAI_MODEL", "local-model")
        if backend == "openai"
        else None
    )
    return {
        "status": "ok",
        "docs": eng.n_docs,
        "mode": eng.mode,
        "embedder": eng.embedder_name,
        "llm_backend": backend,
        "model": model,
        "quotas": eng.quotas,
    }


@app.post("/chat")
def chat(req: ChatRequest):
    eng = get_engine()
    history = [t.model_dump() for t in req.history]
    result = eng.answer(req.message, canon_only=req.canon_only, history=history)
    return result
