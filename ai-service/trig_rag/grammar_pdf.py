#!/usr/bin/env python3
"""
grammar_pdf.py — parse the reference grammar PDF into clean, heading-aware
sections, replacing the coarse fixed-width chunking of the old grammar dump.

trigedasleng_v9.pdf has no usable bookmarks, but it IS structured:
  • numbered chapters       e.g. "1. Trigedasleng Language Description"
  • colon-terminated heads  e.g. "Pronouns:", "Romanization and Pronunciation:"
  • a running page header    "Trigedasleng Reference Grammar and Lexicon—DJP N"
  • bullet glyphs            "•" / "๏"

We strip the running header, normalize bullets, split on chapter/section
headings, and STOP at section 5 ("Trigedasleng to English Dictionary") — the
lexicon there just duplicates the DB dictionary, which we already index.

Output is grammar_sections.jsonl (one {doc_id,type,text,metadata} per line),
consumed by `build_corpus.py --grammar grammar_sections.jsonl`.

Usage (from ai-service/):
    python -m trig_rag.grammar_pdf --out grammar_sections.jsonl
"""
import argparse
import hashlib
import json
import os
import re

_AI_SERVICE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_REPO = os.path.dirname(_AI_SERVICE)

HEADER_RE = re.compile(r"^Trigedasleng Reference Grammar and Lexicon")
NUM_RE = re.compile(r"^(\d+(?:\.\d+)*)\.\s+([A-Z].{1,60})$")
COLON_RE = re.compile(r"^([A-Z][A-Za-z][A-Za-z ,/&'’\-]{1,45}):\s*$")
BULLET_RE = re.compile(r"^[•๏]\s*")
# The lexicon (sections 5+) duplicates the DB dictionary; stop grammar here.
LEX_START_RE = re.compile(r"^\d+\.\s+Trigedasleng to English Dictionary", re.I)


def _doc_id(*parts):
    h = hashlib.sha1("||".join(str(p) for p in parts).encode("utf-8")).hexdigest()[:10]
    return f"gram:{h}"


def _clean(raw):
    s = raw.replace("\t", " ").rstrip()
    s = BULLET_RE.sub("- ", s.strip())
    return s


def extract_lines(path, stop_at_lexicon=True):
    from pypdf import PdfReader

    reader = PdfReader(path)
    out = []
    for pageno, page in enumerate(reader.pages, 1):
        txt = page.extract_text() or ""
        for raw in txt.split("\n"):
            s = raw.strip()
            if not s or HEADER_RE.match(s):
                continue
            if stop_at_lexicon and LEX_START_RE.match(s):
                return out, pageno
            out.append((pageno, _clean(raw)))
    return out, len(reader.pages)


def parse_sections(lines):
    sections = []
    chapter, section, buf = "Grammar", None, []
    page_start = lines[0][0] if lines else 1

    def flush():
        body = "\n".join(buf).strip()
        if body:
            sections.append({"chapter": chapter, "section": section,
                             "page": page_start, "body": body})

    for pageno, s in lines:
        m = NUM_RE.match(s)
        if m and len(s) < 70:
            flush()
            buf, chapter, section, page_start = [], s, None, pageno
            continue
        mc = COLON_RE.match(s)
        if mc:
            flush()
            buf, section, page_start = [], mc.group(1), pageno
            continue
        buf.append(s)
    flush()
    return sections


def build_docs(sections, target_words=180):
    docs = []
    for sec in sections:
        head = sec["chapter"] if not sec["section"] else f"{sec['chapter']} > {sec['section']}"
        words = sec["body"].split()
        if not words:
            continue
        for i in range(0, len(words), target_words):
            piece = " ".join(words[i:i + target_words])
            docs.append({
                "doc_id": _doc_id(head, sec["page"], i),
                "type": "grammar",
                "text": f"[{head}] {piece}",
                "metadata": {
                    "section": head,
                    "chapter": sec["chapter"],
                    "page": sec["page"],
                    "status": "canon",
                    "source": "trigedasleng_v9.pdf (DJP reference grammar)",
                },
            })
    return docs


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pdf", default=os.path.join(_REPO, "trigedasleng_v9.pdf"))
    ap.add_argument("--out", default=os.path.join(_AI_SERVICE, "grammar_sections.jsonl"))
    ap.add_argument("--target-words", type=int, default=180)
    ap.add_argument("--no-stop-at-lexicon", action="store_true",
                    help="also parse the dictionary half (normally skipped)")
    args = ap.parse_args()

    lines, stopped_at = extract_lines(args.pdf, stop_at_lexicon=not args.no_stop_at_lexicon)
    sections = parse_sections(lines)
    docs = build_docs(sections, target_words=args.target_words)

    with open(args.out, "w", encoding="utf-8") as fh:
        for d in docs:
            fh.write(json.dumps(d, ensure_ascii=False) + "\n")

    print(f"PDF: {args.pdf}")
    print(f"grammar parsed through page {stopped_at - 1} (lexicon excluded)")
    print(f"sections: {len(sections)}  ->  grammar chunks: {len(docs)} -> {args.out}")
    print("\nchapters/headings found:")
    seen = []
    for s in sections:
        head = s["chapter"] if not s["section"] else f"  {s['chapter']} > {s['section']}"
        if head not in seen:
            seen.append(head)
            print(f"  p{s['page']:>3}  {head}")


if __name__ == "__main__":
    main()
