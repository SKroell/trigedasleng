#!/usr/bin/env python3
"""
db.py — READ-ONLY access to the production Trigedasleng SQLite database.

This is the same `prisma/dev.db` the web app uses. We open it with SQLite's
`mode=ro` URI so the connection is physically incapable of writing — no
migrations, no inserts, no updates. The corpus builder and the retrieval
service both read through here.

Path resolution (first match wins):
    1. explicit `path=` argument
    2. $TRIG_DB_PATH
    3. $DATABASE_URL  (Prisma form "file:./dev.db", resolved against prisma/)
    4. <repo>/prisma/dev.db  (default for the in-repo layout)
"""
import os
import sqlite3

# ai-service/trig_rag/db.py -> ai-service/ -> <repo>/
_THIS_DIR = os.path.dirname(os.path.abspath(__file__))
_AI_SERVICE_DIR = os.path.dirname(_THIS_DIR)
_REPO_DIR = os.path.dirname(_AI_SERVICE_DIR)

# The three dictionaries that hold actual Trigedasleng headwords, mapped to the
# attestation status the community cares about. "English" is the reverse-lookup
# side and is not emitted as its own vocabulary doc.
DICT_STATUS = {
    "Trigedasleng": "canon",
    "Slakgedasleng": "slakkru",
    "Noncanon Trigedasleng": "noncanon",
}


def resolve_db_path(path=None):
    if path:
        return os.path.abspath(path)
    env = os.environ.get("TRIG_DB_PATH")
    if env:
        return os.path.abspath(env)
    url = os.environ.get("DATABASE_URL")
    if url and url.startswith("file:"):
        p = url[len("file:"):]
        if not os.path.isabs(p):
            # Prisma resolves file: URLs relative to the schema dir (prisma/)
            p = os.path.join(_REPO_DIR, "prisma", p)
        return os.path.abspath(p)
    return os.path.join(_REPO_DIR, "prisma", "dev.db")


def connect(path=None):
    """Open the DB strictly read-only. Raises if the file is missing."""
    resolved = resolve_db_path(path)
    if not os.path.exists(resolved):
        raise FileNotFoundError(
            f"Trigedasleng DB not found at {resolved}. "
            f"Set TRIG_DB_PATH or DATABASE_URL."
        )
    con = sqlite3.connect(f"file:{resolved}?mode=ro", uri=True)
    con.row_factory = sqlite3.Row
    return con


# --------------------------------------------------------------------- queries
# Each returns plain sqlite3.Row lists; shaping/cleaning happens in build_corpus.

def fetch_words(con):
    """Trig-side headwords (canon / noncanon / slakkru), with pronunciation."""
    return con.execute(
        """
        SELECT w.id, w.value, w.pronunciation, d.value AS dictionary
        FROM words w
        JOIN dictionaries d ON d.id = w.dictionary_id
        WHERE d.value IN ('Trigedasleng', 'Slakgedasleng', 'Noncanon Trigedasleng')
        ORDER BY w.value
        """
    ).fetchall()


def fetch_translations(con):
    """Senses: each Trig word (source) -> an English headword (target).

    `etymology` is the word's etymology (often prefixed 'from: ') and is cleaned
    downstream. Direction is always Trig -> English in this DB.
    """
    return con.execute(
        """
        SELECT t.word_source_id AS word_id,
               wt.value         AS english,
               t.etymology      AS etymology,
               t.is_approved    AS is_approved
        FROM translations t
        JOIN words wt ON wt.id = t.word_target_id
        """
    ).fetchall()


def fetch_classifications(con):
    """Part-of-speech links (already normalized in the DB). 'none' is dropped."""
    return con.execute(
        """
        SELECT wc.word_id AS word_id, c.value AS pos
        FROM word_classification wc
        JOIN classifications c ON c.id = wc.classification_id
        WHERE c.value != 'none'
        """
    ).fetchall()


def fetch_sentences(con):
    """Parallel example sentences. `etymology` here is the literal word-by-word
    gloss (NOT a 'from:' etymology); `leipzig_glossing` is the interlinear."""
    return con.execute(
        """
        SELECT s.id,
               s.value           AS trig,
               s.english         AS english,
               s.etymology       AS literal,
               s.leipzig_glossing AS leipzig,
               s.audio           AS audio
        FROM sentences s
        """
    ).fetchall()


def fetch_episode_links(con):
    """sentence -> episode (+ speaker). One sentence row may have 0..1 here, and
    identical sentences recur across rows; the builder unions episodes per
    (trig, english) pair. Episode code is f'{season:02d}{series:02d}' (e.g. 0201).
    """
    return con.execute(
        """
        SELECT es.sentence_id  AS sentence_id,
               e.season_number AS season,
               e.series_number AS series,
               e.value         AS ep_value,
               sp.value        AS speaker
        FROM episode_sentence es
        JOIN episodes e ON e.id = es.episode_id
        LEFT JOIN speakers sp ON sp.id = es.speaker_id
        """
    ).fetchall()
