# Trigedasleng AI service

A **standalone, grounded RAG service** that translates between English and
Trigedasleng and answers questions about the language. It runs as its own
process — the ML stack never enters the Node/React-Router web app. The web app
talks to it over one HTTP endpoint.

It reads the **same database** as the site (`../prisma/dev.db`) **strictly
read-only** (opened with SQLite `mode=ro`), so the corpus always regenerates from
the source of truth: the dictionary, the parallel example sentences, and the
reference grammar.

## Architecture

```
                ┌──────────────── ai-service (Python) ────────────────┐
prisma/dev.db ─▶│ build_corpus.py ─▶ corpus.jsonl ─┐                   │
(READ-ONLY)     │ grammar_pdf.py  ─▶ grammar_sections.jsonl ┘          │
trigedasleng_   │                                  ▼                   │
  v9.pdf  ─────▶│   retrieval (type-aware quota) + grounding prompt    │
                │   embedder: sentence-transformers | stub            │
                │   llm: anthropic | openai-compatible (vLLM/TGI) | none│
                │                  ▼                                   │
                │            FastAPI  POST /chat   GET /health         │
                └──────────────────────┬──────────────────────────────┘
                                       │ AI_SERVICE_URL
   app/routes/api.chat.tsx  ◀──────────┘   (server-side proxy)
   app/routes/assistant.tsx  (chat UI, renders sources + audio players)
```

**Type-aware retrieval** pulls a quota from *each* document type (vocabulary +
attested sentences + grammar) per query instead of a flat top-k, so translations
get grounded in real examples, not just word lookups. Quotas are env-tunable.

**Hybrid (dense + lexical)** — `vector` mode also runs a lexical pass: any
dictionary entry whose headword or gloss exactly matches a query word is
force-included, and an idf-weighted lexical signal is blended into the dense
ranking (`RAG_LEX_WEIGHT`). Pure embeddings miss attested words a dictionary
lookup should always find — conlang headwords like `gonplei` are out-of-vocabulary
for an English embedder and rank poorly — so the lexical layer guarantees they
surface. (`full` mode sends everything, so it's unaffected.)

### Retrieval modes (`RETRIEVAL_MODE`)

| Mode | What it does | Needs | Cost/query |
|---|---|---|---|
| **`full`** | Sends the **entire corpus** (~114K tokens) to the model each query, prompt-cached. No embedder. | the Anthropic key only — **no `torch`/`sentence-transformers`** | ~114K input (cheap on cache reads) |
| **`vector`** | Embeds the corpus, retrieves a type-aware quota per query. | an embedder (`bge-small` local / `bge-large` HPC) | ~3–4K input |

`full` is the simplest to run and gives the strongest "never invent a word"
grounding (the model sees every attested word at once); even in `full` mode the
source panel + audio players are reconstructed from the ids the model cites.
`vector` is cheaper per query at scale. Switch with one env var. The corpus is
small enough (~114K tokens) that `full` fits Opus's 1M window ~9× over.

## Layout

```
trig_rag/
  db.py            read-only SQLite access (mode=ro) + queries
  build_corpus.py  DB  -> corpus.jsonl  (cleaning below)
  grammar_pdf.py   trigedasleng_v9.pdf -> grammar_sections.jsonl
  embedder.py      pluggable embeddings (fastembed/ONNX | sentence-transformers | stub)
  llm.py           pluggable LLM (anthropic | openai-compatible | none)
  retrieval.py     index + type-aware quota retrieval + citation formatting
  engine.py        retrieval -> prompt -> LLM (shared by service + CLI + eval)
  service.py       FastAPI app
  cli.py           command-line driver
  system_prompt.txt the grounding prompt (no fabrication, status-aware, cited)
eval/
  build_testset.py carve ~100 held-out canon pairs (stratified, seeded)
  evaluate.py      chrF / BLEU + coverage + human spot-check report
```

## Setup

```bash
cd ai-service
python -m venv .venv && . .venv/Scripts/activate    # Windows: .venv\Scripts\activate
cp .env.example .env                                 # then fill in keys/endpoints

# full mode (default) — key only, no ML stack:
pip install anthropic fastapi "uvicorn[standard]" pydantic python-dotenv

# vector mode — pick an embedder backend:
#   CPU-only server (no GPU, no PyTorch — recommended there):
pip install fastembed                       # then EMBEDDER=fastembed in .env
#   GPU / HPC:
pip install sentence-transformers           # EMBEDDER=sentence-transformers, bge-large
#   (on a CPU box using sentence-transformers, install the CPU torch wheel first:
#    pip install torch --index-url https://download.pytorch.org/whl/cpu)
```

`vector` mode runs fine **CPU-only**. `fastembed` (ONNX) needs no PyTorch and is
the lightest option for a small server; `sentence-transformers` is GPU-capable
and lets you run the larger `bge-large` on an HPC node. The embed model downloads
once and the corpus index is cached to `embeddings.npy`. `full` mode needs no
embedder at all.

## 1. Build the corpus (from the live DB)

```bash
python -m trig_rag.grammar_pdf   --out grammar_sections.jsonl   # parse the PDF
python -m trig_rag.build_corpus  --out corpus.jsonl --grammar grammar_sections.jsonl
```

Current output: **2,265 vocabulary + 860 sentence + 32 grammar = 3,157 docs.**

### Data cleaning applied (verified against the live DB)

| Step | What the live DB actually has |
|---|---|
| **status** → canon / noncanon / slakkru | `dictionaries.value` (`Trigedasleng`→canon, `Noncanon Trigedasleng`→noncanon, `Slakgedasleng`→slakkru). Clean 4-row table — the messy `"slakgedasleng noncanon"` strings were an export artifact; the heuristic fallback is kept defensively. |
| **POS split** (`"noun: future"`) | Already normalized into `classifications`; no string-splitting needed. |
| **etymology** strip `"from:"` | Present on `translations.etymology` (1,432 rows, incl. 2 doubled `from: from:`). Stripped; `"?"` dropped. |
| **doubled notes** | No notes column exists; helper retained and applied to glosses defensively. |
| **collapse duplicate sentences** | Grouped by `(trig, english)`; episodes/speakers unioned (883 → 860 docs). |
| **both glosses** | `sentences.etymology` = literal word-by-word; `sentences.leipzig_glossing` = Leipzig interlinear. Both kept. |
| **audio** | `sentences.audio` (294 docs) carried into metadata so the UI can play it. |

Sentence attestation: `canon` when episode-attested (694), else `uncited` (166 —
in the DB but with no episode citation).

## 2. Run the service

```bash
# offline smoke (no model download, no API key):
EMBEDDER=stub LLM_BACKEND=none uvicorn trig_rag.service:app --port 8000

# real: semantic retrieval + Anthropic (or your vLLM endpoint via LLM_BACKEND=openai)
uvicorn trig_rag.service:app --host 127.0.0.1 --port 8000
```

```
GET  /health -> { docs, embedder, llm_backend, quotas }
POST /chat   -> { message, canon_only?, history? }
             <- { answer, sources:[{doc_id,type,status,trigedasleng,english,episodes,audio,...}] }
```

CLI equivalents for quick checks:

```bash
python -m trig_rag.cli --embedder stub --llm none "how do you say my fight is over"
python -m trig_rag.cli --llm anthropic "what does 'gonplei' mean?"
```

### Wiring the website to it

The site calls the service through a server-side proxy at
[`app/routes/api.chat.tsx`](../app/routes/api.chat.tsx); the chat UI is
[`app/routes/assistant.tsx`](../app/routes/assistant.tsx) (linked in the sidebar).
Point the app at the service by setting, in the **web app's** `.env`:

```
AI_SERVICE_URL=http://127.0.0.1:8000
```

The proxy keeps the ML stack out of the Node build and lets the service live on a
different host (e.g. your HPC) in production.

**Run both together (no Docker)** — one Ctrl-C stops both, logs prefixed
`[web]`/`[service]` ([scripts/run-stack.mjs](../scripts/run-stack.mjs), zero
extra deps):

```bash
npm run dev:all      # dev: react-router dev server + uvicorn
npm run build        # then, for production:
npm run start:all    # prod: react-router-serve (built app) + uvicorn
```

`start:all` requires `npm run build` first (it checks for `build/server/index.js`).
The service binds `127.0.0.1` and stays private — only the Node app calls it via
`AI_SERVICE_URL`. Prod knobs: `RAG_WORKERS` (uvicorn workers), `PORT` (web).
Offline smoke with no model/key: `EMBEDDER=stub LLM_BACKEND=none npm run dev:all`.
Otherwise it uses whatever is in `ai-service/.env` (loaded automatically).

## 3. Evaluate before tuning

We measure before we tune. Carve a held-out set and baseline RAG-only:

```bash
python eval/build_testset.py --n 100        # -> eval/testset.jsonl (stratified, seeded)
python eval/evaluate.py --llm anthropic     # -> eval/report.json + eval/report.md
```

Held-out pairs are **excluded from retrieval** so the model must translate, not
echo the gold pair. Metrics: **chrF** (headline — right for a short,
morphologically dense conlang), **BLEU** (reference), and **coverage** (how often
the model attempted vs. honestly abstained). `report.md` is a sorted spot-check
table for human review.

## Principles

- **RAG-only first.** LoRA on the ~1,150 pairs (optionally with grammar-driven
  synthetic augmentation) is deferred until the eval set shows retrieval isn't
  fluent enough.
- **Never invent words.** An honest "no attested word for X" beats a plausible
  fake. The grounding prompt enforces this; `--canon-only` restricts to
  screen-attested sources.
- **Secrets via env vars only.** Endpoints and API keys come from `.env`; nothing
  is hardcoded. The DB is read-only.

## Known limitations / next steps

- **Grammar tables** (pronoun paradigms, derivation tables in §2) flatten under
  PDF text extraction — still semantically retrievable, but a `pdfplumber`
  table-aware pass would chunk them better.
- The **stub embedder has no semantics** (smoke-test only). Real retrieval needs
  `EMBEDDER=sentence-transformers`.
- LoRA fine-tuning harness is intentionally not built yet (see Principles).
