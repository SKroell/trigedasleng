#!/usr/bin/env python3
"""
llm.py — pluggable LLM backends behind one `generate(system, user, history)` call.

  anthropic : Anthropic API (managed). Set ANTHROPIC_API_KEY; ANTHROPIC_MODEL
              defaults to claude-opus-4-8. Uses adaptive thinking; sampling
              params (temperature/top_p) are NOT sent — they 400 on Opus 4.7+.
  openai    : OpenAI-compatible endpoint — your self-hosted vLLM / TGI on HPC.
              Set OPENAI_BASE_URL (+ OPENAI_API_KEY, OPENAI_MODEL).
  none      : retrieval-only; echoes the context block, calls no model.

No secrets are hardcoded — everything comes from env vars.
"""
import os

# Most capable current model. Override with ANTHROPIC_MODEL (e.g. claude-sonnet-4-6
# for lower cost on a high-volume public chatbot). Must be a 4.6+ model for
# adaptive thinking.
DEFAULT_ANTHROPIC_MODEL = "claude-opus-4-8"
DEFAULT_MAX_TOKENS = 4096


def _to_messages(user, history):
    """history is a list of {role: 'user'|'assistant', content: str}."""
    msgs = list(history or [])
    msgs.append({"role": "user", "content": user})
    return msgs


def _usage_dict(u):
    return {
        "input_tokens": getattr(u, "input_tokens", None),
        "output_tokens": getattr(u, "output_tokens", None),
        "cache_read_input_tokens": getattr(u, "cache_read_input_tokens", None),
        "cache_creation_input_tokens": getattr(u, "cache_creation_input_tokens", None),
    }


def call_anthropic(system, user, history=None, cached_context=None):
    import anthropic

    client = anthropic.Anthropic()  # reads ANTHROPIC_API_KEY
    model = os.environ.get("ANTHROPIC_MODEL", DEFAULT_ANTHROPIC_MODEL)
    max_tokens = int(os.environ.get("ANTHROPIC_MAX_TOKENS", DEFAULT_MAX_TOKENS))

    # In full-context mode the whole corpus arrives as `cached_context`. Pin it in
    # the system block with cache_control so the big, byte-stable prefix is cached
    # (~0.1x cost) on repeat queries instead of re-billed in full each time.
    # Default to the 1-hour TTL so the corpus stays warm across a testing session
    # (write once, cheap reads for an hour) instead of re-writing every 5 minutes.
    system_param = system
    if cached_context:
        ttl = os.environ.get("ANTHROPIC_CACHE_TTL", "1h")
        cache_control = {"type": "ephemeral"}
        if ttl and ttl not in ("5m", "5min", "default"):
            cache_control["ttl"] = ttl
        system_param = [
            {"type": "text", "text": system},
            {"type": "text", "text": cached_context, "cache_control": cache_control},
        ]

    # No temperature/top_p: removed on Opus 4.7+ (400 if sent). Adaptive thinking
    # is OFF by default here — over a ~114K-token corpus it adds output tokens
    # (billed at the output rate) without much grounding benefit for lookups and
    # translation. Opt in with ANTHROPIC_THINKING=adaptive.
    kwargs = dict(
        model=model,
        max_tokens=max_tokens,
        system=system_param,
        messages=_to_messages(user, history),
    )
    if os.environ.get("ANTHROPIC_THINKING", "off").lower() in ("adaptive", "on", "1", "true"):
        kwargs["thinking"] = {"type": "adaptive"}

    resp = client.messages.create(**kwargs)
    text = "".join(b.text for b in resp.content if b.type == "text")
    return {"text": text, "usage": _usage_dict(resp.usage)}


def call_openai(system, user, history=None, cached_context=None):
    from openai import OpenAI

    client = OpenAI(
        base_url=os.environ.get("OPENAI_BASE_URL"),
        api_key=os.environ.get("OPENAI_API_KEY", "EMPTY"),
    )
    model = os.environ.get("OPENAI_MODEL", "local-model")
    max_tokens = int(os.environ.get("OPENAI_MAX_TOKENS", DEFAULT_MAX_TOKENS))
    # vLLM/TGI do automatic prefix caching, so a stable system prefix is reused.
    sys_text = system if not cached_context else f"{system}\n\n{cached_context}"
    messages = [{"role": "system", "content": sys_text}] + _to_messages(user, history)
    # temperature is fine here — this path targets self-hosted Llama/Mistral/etc.,
    # not Claude.
    resp = client.chat.completions.create(
        model=model, messages=messages, max_tokens=max_tokens, temperature=0.2,
    )
    u = getattr(resp, "usage", None)
    usage = {
        "input_tokens": getattr(u, "prompt_tokens", None),
        "output_tokens": getattr(u, "completion_tokens", None),
    } if u else None
    return {"text": resp.choices[0].message.content, "usage": usage}


def generate(backend, system, user, history=None, cached_context=None):
    """Returns {"text": str|None, "usage": dict|None}. text is None for backend
    'none' (caller falls back to the retrieval context)."""
    backend = backend or os.environ.get("LLM_BACKEND", "anthropic")
    if backend == "none":
        return {"text": None, "usage": None}
    if backend == "anthropic":
        return call_anthropic(system, user, history, cached_context)
    if backend == "openai":
        return call_openai(system, user, history, cached_context)
    raise ValueError(f"unknown LLM backend: {backend}")
