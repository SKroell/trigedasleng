import React, { useEffect, useState } from "react";
import { Box, Card, Typography, Button, Stack, Chip } from "@mui/material";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import { type LearnWord, shuffle, sampleDistinct, primaryMeaning } from "./helpers";

interface MatchCard {
  uid: string;
  pairId: string;
  label: string;
  kind: "trig" | "eng";
  matched: boolean;
}

const PAIRS = 6;

function buildDeck(words: LearnWord[]): MatchCard[] {
  const chosen = sampleDistinct(words, PAIRS, (w) => primaryMeaning(w.translation).length === 0);
  const cards: MatchCard[] = [];
  chosen.forEach((w) => {
    cards.push({ uid: w.id + ":t", pairId: w.id, label: w.word, kind: "trig", matched: false });
    cards.push({ uid: w.id + ":e", pairId: w.id, label: primaryMeaning(w.translation), kind: "eng", matched: false });
  });
  return shuffle(cards);
}

export default function Match({ words }: { words: LearnWord[] }) {
  const [cards, setCards] = useState<MatchCard[]>(() => buildDeck(words));
  const [flipped, setFlipped] = useState<string[]>([]);
  const [locked, setLocked] = useState(false);
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);

  const won = cards.length > 0 && cards.every((c) => c.matched);

  useEffect(() => {
    if (won) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [won]);

  if (cards.length === 0) return <Typography color="text.secondary">Not enough words to play.</Typography>;

  const restart = () => {
    setCards(buildDeck(words));
    setFlipped([]);
    setLocked(false);
    setMoves(0);
    setSeconds(0);
  };

  const onCard = (c: MatchCard) => {
    if (locked || c.matched || flipped.includes(c.uid)) return;
    const nf = [...flipped, c.uid];
    setFlipped(nf);
    if (nf.length === 2) {
      setMoves((m) => m + 1);
      const a = cards.find((x) => x.uid === nf[0])!;
      const b = cards.find((x) => x.uid === nf[1])!;
      if (a.pairId === b.pairId) {
        setCards((prev) => prev.map((x) => (x.pairId === a.pairId ? { ...x, matched: true } : x)));
        setFlipped([]);
      } else {
        setLocked(true);
        setTimeout(() => {
          setFlipped([]);
          setLocked(false);
        }, 900);
      }
    }
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <Box sx={{ maxWidth: 560, mx: "auto" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Stack direction="row" spacing={1}>
          <Chip label={`Moves ${moves}`} size="small" />
          <Chip label={`Time ${fmt(seconds)}`} size="small" />
        </Stack>
        <Button size="small" startIcon={<RestartAltIcon />} onClick={restart}>
          Restart
        </Button>
      </Stack>

      {won && (
        <Box sx={{ textAlign: "center", mb: 2, p: 2, borderRadius: 2, bgcolor: "action.hover" }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Solved in {moves} moves · {fmt(seconds)}
          </Typography>
          <Button variant="contained" sx={{ mt: 1 }} onClick={restart}>
            Play again
          </Button>
        </Box>
      )}

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(3, 1fr)", sm: "repeat(4, 1fr)" }, gap: 1.25 }}>
        {cards.map((c) => {
          const faceUp = c.matched || flipped.includes(c.uid);
          return (
            <Card
              key={c.uid}
              onClick={() => onCard(c)}
              sx={{
                aspectRatio: "3 / 4",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                p: 1,
                cursor: faceUp ? "default" : "pointer",
                userSelect: "none",
                bgcolor: c.matched ? "success.main" : faceUp ? "background.paper" : "primary.main",
                color: c.matched ? "success.contrastText" : faceUp ? "text.primary" : "primary.contrastText",
                transition: "background-color .2s",
              }}
            >
              <Typography
                sx={{
                  fontSize: { xs: "0.8rem", sm: "0.95rem" },
                  fontWeight: 600,
                  lineHeight: 1.2,
                  wordBreak: "break-word",
                  fontStyle: c.kind === "eng" && faceUp ? "italic" : "normal",
                }}
              >
                {faceUp ? c.label : "?"}
              </Typography>
            </Card>
          );
        })}
      </Box>
    </Box>
  );
}
