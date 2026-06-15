import React, { useEffect, useMemo, useState } from "react";
import { Box, Button, Stack, Typography, Chip, Snackbar } from "@mui/material";
import BackspaceOutlinedIcon from "@mui/icons-material/BackspaceOutlined";
import ShareIcon from "@mui/icons-material/Share";

type Cell = "correct" | "present" | "absent";
type Status = "playing" | "won" | "lost";

interface Answer {
  word: string;
  meaning: string;
}

const MS_DAY = 86_400_000;
// Days since the Unix epoch for 2026-06-15 → that day is puzzle #1. The raw
// epoch day-count (~20619) still drives the daily word; this just makes the
// displayed/shared puzzle number start at 1 and count up.
const LAUNCH_DAY = 20619;
const ROWS = 6;
const LEN = 5;
const STATE_KEY = "tg-wordle-state";
const STATS_KEY = "tg-wordle-stats";

function localDayNumber(d = new Date()): number {
  return Math.floor((d.getTime() - d.getTimezoneOffset() * 60_000) / MS_DAY);
}

function evaluate(guess: string, answer: string): Cell[] {
  const res: Cell[] = Array(LEN).fill("absent");
  const pool: (string | null)[] = answer.split("");
  for (let i = 0; i < LEN; i++) {
    if (guess[i] === pool[i]) {
      res[i] = "correct";
      pool[i] = null;
    }
  }
  for (let i = 0; i < LEN; i++) {
    if (res[i] === "correct") continue;
    const j = pool.indexOf(guess[i]);
    if (j !== -1) {
      res[i] = "present";
      pool[j] = null;
    }
  }
  return res;
}

function loadState(day: number): { rows: string[]; status: Status } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (s.day !== day) return null;
    return { rows: Array.isArray(s.rows) ? s.rows : [], status: s.status || "playing" };
  } catch {
    return null;
  }
}

interface Stats {
  streak: number;
  max: number;
  lastDay: number;
  lastResult: Status;
}
function loadStats(): Stats {
  if (typeof window === "undefined") return { streak: 0, max: 0, lastDay: -1, lastResult: "playing" };
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* ignore */
  }
  return { streak: 0, max: 0, lastDay: -1, lastResult: "playing" };
}

const cellSx = (state: Cell | "empty" | "filled") => {
  switch (state) {
    case "correct":
      return { bgcolor: "success.main", color: "#fff", borderColor: "success.main" };
    case "present":
      return { bgcolor: "warning.main", color: "#fff", borderColor: "warning.main" };
    case "absent":
      return { bgcolor: "text.disabled", color: "#fff", borderColor: "text.disabled" };
    case "filled":
      return { bgcolor: "transparent", color: "text.primary", borderColor: "text.secondary" };
    default:
      return { bgcolor: "transparent", color: "text.primary", borderColor: "divider" };
  }
};

export default function Wordle({ answers, guesses }: { answers: Answer[]; guesses: string[] }) {
  const guessSet = useMemo(() => new Set(guesses), [guesses]);
  const today = useMemo(() => localDayNumber(), []);
  const puzzleNumber = today - LAUNCH_DAY + 1;
  const answer = useMemo<Answer | null>(
    () => (answers.length ? answers[today % answers.length] : null),
    [answers, today],
  );

  const [rows, setRows] = useState<string[]>(() => loadState(today)?.rows ?? []);
  const [status, setStatus] = useState<Status>(() => loadState(today)?.status ?? "playing");
  const [current, setCurrent] = useState("");
  const [stats, setStats] = useState<Stats>(() => loadStats());
  const [toast, setToast] = useState("");

  // Persist game state per day.
  useEffect(() => {
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify({ day: today, rows, status }));
    } catch {
      /* ignore */
    }
  }, [today, rows, status]);

  const flash = (msg: string) => setToast(msg);

  const resolveStats = (result: Status) => {
    const s = loadStats();
    if (s.lastDay === today) return; // already counted today
    let streak: number;
    if (result === "won") {
      streak = s.lastDay === today - 1 && s.lastResult === "won" ? s.streak + 1 : 1;
    } else {
      streak = 0;
    }
    const next: Stats = { streak, max: Math.max(s.max, streak), lastDay: today, lastResult: result };
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    setStats(next);
  };

  const submit = () => {
    if (status !== "playing" || !answer) return;
    const g = current.toLowerCase();
    if (g.length < LEN) return flash("Not enough letters");
    if (!guessSet.has(g)) return flash("Not in word list");
    const newRows = [...rows, g];
    setRows(newRows);
    setCurrent("");
    let next: Status = "playing";
    if (g === answer.word) next = "won";
    else if (newRows.length >= ROWS) next = "lost";
    if (next !== "playing") {
      setStatus(next);
      resolveStats(next);
    }
  };

  // Physical keyboard support.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
      if (status !== "playing") return;
      if (e.key === "Enter") submit();
      else if (e.key === "Backspace") setCurrent((c) => c.slice(0, -1));
      else if (/^[a-z]$/i.test(e.key)) setCurrent((c) => (c.length < LEN ? c + e.key.toLowerCase() : c));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [status, current, rows, answer]);

  const letterStates = useMemo(() => {
    const m: Record<string, Cell> = {};
    const rank: Record<Cell, number> = { absent: 1, present: 2, correct: 3 };
    if (!answer) return m;
    for (const g of rows) {
      const ev = evaluate(g, answer.word);
      for (let i = 0; i < LEN; i++) {
        const l = g[i];
        if (!m[l] || rank[ev[i]] > rank[m[l]]) m[l] = ev[i];
      }
    }
    return m;
  }, [rows, answer]);

  // On-screen keyboard letters derived from the real word list.
  const kbLetters = useMemo(
    () => Array.from(new Set(guesses.join("").split(""))).filter((c) => /[a-z]/.test(c)).sort(),
    [guesses],
  );

  if (!answer) return <Typography color="text.secondary">No words available for today.</Typography>;

  const onKeyTap = (l: string) => {
    if (status !== "playing") return;
    setCurrent((c) => (c.length < LEN ? c + l : c));
  };

  const share = () => {
    const head = `Trigedasleng Wordle #${puzzleNumber} ${status === "won" ? rows.length : "X"}/${ROWS}`;
    const grid = rows
      .map((g) => evaluate(g, answer.word).map((c) => (c === "correct" ? "🟩" : c === "present" ? "🟨" : "⬛")).join(""))
      .join("\n");
    const text = `${head}\n\n${grid}`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => flash("Results copied!")).catch(() => flash("Couldn't copy"));
    } else {
      flash("Clipboard unavailable");
    }
  };

  const per = Math.ceil(kbLetters.length / 3) || 1;
  const kbRows = [kbLetters.slice(0, per), kbLetters.slice(per, per * 2), kbLetters.slice(per * 2)];

  return (
    <Box sx={{ maxWidth: 380, mx: "auto" }}>
      <Stack direction="row" justifyContent="center" spacing={1} sx={{ mb: 2 }}>
        <Chip size="small" label={`#${puzzleNumber}`} variant="outlined" />
        <Chip size="small" label={`Streak ${stats.streak}`} color={stats.streak > 0 ? "primary" : "default"} />
        <Chip size="small" label={`Best ${stats.max}`} />
      </Stack>

      {/* board */}
      <Box sx={{ display: "grid", gridTemplateRows: `repeat(${ROWS}, 1fr)`, gap: 0.75, mb: 2 }}>
        {Array.from({ length: ROWS }).map((_, r) => {
          const submitted = r < rows.length;
          const isCurrent = r === rows.length && status === "playing";
          const guess = submitted ? rows[r] : isCurrent ? current : "";
          const ev = submitted ? evaluate(rows[r], answer.word) : null;
          return (
            <Box key={r} sx={{ display: "grid", gridTemplateColumns: `repeat(${LEN}, 1fr)`, gap: 0.75 }}>
              {Array.from({ length: LEN }).map((__, c) => {
                const letter = guess[c] || "";
                const state: Cell | "empty" | "filled" = ev ? ev[c] : letter ? "filled" : "empty";
                return (
                  <Box
                    key={c}
                    sx={{
                      aspectRatio: "1 / 1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "2px solid",
                      borderRadius: 1,
                      fontSize: { xs: "1.6rem", sm: "1.9rem" },
                      fontWeight: 700,
                      textTransform: "uppercase",
                      transition: "background-color .2s",
                      ...cellSx(state),
                    }}
                  >
                    {letter}
                  </Box>
                );
              })}
            </Box>
          );
        })}
      </Box>

      {/* end-of-game panel */}
      {status !== "playing" && (
        <Box sx={{ textAlign: "center", mb: 2, p: 2, borderRadius: 2, bgcolor: "action.hover" }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {status === "won" ? "Solved! 🎉" : "Out of guesses"}
          </Typography>
          <Typography sx={{ mt: 0.5 }}>
            <b>{answer.word}</b> — {answer.meaning}
          </Typography>
          <Button startIcon={<ShareIcon />} variant="contained" sx={{ mt: 1.5 }} onClick={share}>
            Share
          </Button>
          <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
            Come back tomorrow for a new word.
          </Typography>
        </Box>
      )}

      {/* keyboard */}
      {status === "playing" && (
        <Stack spacing={0.75}>
          {kbRows.map((row, ri) => (
            <Stack key={ri} direction="row" spacing={0.5} justifyContent="center">
              {ri === kbRows.length - 1 && (
                <Button onClick={submit} variant="outlined" sx={{ minWidth: 56, px: 1, fontSize: "0.7rem" }}>
                  Enter
                </Button>
              )}
              {row.map((l) => {
                const st = letterStates[l];
                return (
                  <Button
                    key={l}
                    onClick={() => onKeyTap(l)}
                    variant="contained"
                    sx={{
                      minWidth: 0,
                      flex: 1,
                      maxWidth: 40,
                      px: 0,
                      height: 48,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      ...(st
                        ? cellSx(st)
                        : { bgcolor: "action.selected", color: "text.primary", "&:hover": { bgcolor: "action.disabledBackground" } }),
                    }}
                  >
                    {l}
                  </Button>
                );
              })}
              {ri === kbRows.length - 1 && (
                <Button
                  onClick={() => setCurrent((c) => c.slice(0, -1))}
                  variant="outlined"
                  sx={{ minWidth: 56, px: 1 }}
                  aria-label="backspace"
                >
                  <BackspaceOutlinedIcon fontSize="small" />
                </Button>
              )}
            </Stack>
          ))}
        </Stack>
      )}

      <Snackbar
        open={!!toast}
        autoHideDuration={1500}
        onClose={() => setToast("")}
        message={toast}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Box>
  );
}
