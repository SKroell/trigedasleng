import React, { useState } from "react";
import { useLoaderData } from "react-router";
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardActionArea,
  CardContent,
  Button,
  Avatar,
} from "@mui/material";
import StyleIcon from "@mui/icons-material/Style";
import QuizIcon from "@mui/icons-material/Quiz";
import ExtensionIcon from "@mui/icons-material/Extension";
import HeadphonesIcon from "@mui/icons-material/Headphones";
import EditNoteIcon from "@mui/icons-material/EditNote";
import GridOnIcon from "@mui/icons-material/GridOn";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { prisma } from "../db.server";
import type { LearnWord, LearnSentence } from "../components/Learn/helpers";
import Flashcards from "../components/Learn/Flashcards";
import Quiz from "../components/Learn/Quiz";
import Match from "../components/Learn/Match";
import Listen from "../components/Learn/Listen";
import FillBlank from "../components/Learn/FillBlank";
import Wordle from "../components/Learn/Wordle";

export async function loader() {
  // Trig-side words with at least one English meaning → the practice pool.
  const words = await prisma.word.findMany({
    where: { dictionary: { value: { not: "English" } } },
    include: {
      dictionary: true,
      classifications: { include: { classification: true } },
      translationsFrom: { include: { wordTarget: true } },
    },
  });

  const mappedWords: LearnWord[] = words
    .map((w) => ({
      id: w.id,
      word: w.value,
      pronunciation: w.pronunciation,
      translation: w.translationsFrom.map((t) => t.wordTarget.value).filter(Boolean).join(", "),
      classifications: w.classifications.map((c) => c.classification.value),
    }))
    .filter((w) => w.translation.length > 0);

  const sentences = await prisma.sentence.findMany({
    select: { id: true, value: true, english: true, audio: true },
  });

  // Fill-in-the-blank needs sentences with enough words to hide one.
  const fillSentences: LearnSentence[] = sentences
    .filter((s) => s.english && s.value.trim().split(/\s+/).length >= 4)
    .map((s) => ({ id: s.id, trig: s.value, english: s.english }));

  // Listening needs sentences that have an audio clip.
  const audioSentences: LearnSentence[] = sentences
    .filter((s) => s.audio && s.english)
    .map((s) => ({ id: s.id, trig: s.value, english: s.english, audio: s.audio || "" }));

  // Daily Wordle: canon 5-letter words are eligible answers; every distinct
  // 5-letter word (any dictionary) is an accepted guess.
  const fiveLetter = words.filter((w) => /^[a-z]{5}$/i.test(w.value));
  const guesses = Array.from(new Set(fiveLetter.map((w) => w.value.toLowerCase()))).sort();
  const answerMap = new Map<string, string>();
  for (const w of fiveLetter) {
    if (w.dictionary.value !== "Trigedasleng") continue;
    const key = w.value.toLowerCase();
    if (answerMap.has(key)) continue;
    const meaning = w.translationsFrom.map((t) => t.wordTarget.value).filter(Boolean).join(", ");
    if (meaning) answerMap.set(key, meaning);
  }
  const answers = [...answerMap.entries()]
    .map(([word, meaning]) => ({ word, meaning }))
    .sort((a, b) => a.word.localeCompare(b.word));
  const wordle = { answers, guesses };

  return { words: mappedWords, fillSentences, audioSentences, wordle };
}

type ModeKey = "wordle" | "flashcards" | "quiz" | "match" | "listen" | "fill";

const MODES: { key: ModeKey; title: string; desc: string; icon: React.ReactNode }[] = [
  { key: "wordle", title: "Daily Wordle", desc: "Guess today's 5-letter Trigedasleng word.", icon: <GridOnIcon /> },
  { key: "flashcards", title: "Flashcards", desc: "Flip cards to learn words at your own pace.", icon: <StyleIcon /> },
  { key: "quiz", title: "Multiple Choice", desc: "Pick the right meaning. Build a streak.", icon: <QuizIcon /> },
  { key: "match", title: "Matching Pairs", desc: "Match words to meanings against the clock.", icon: <ExtensionIcon /> },
  { key: "listen", title: "Listening", desc: "Identify real lines from the show by ear.", icon: <HeadphonesIcon /> },
  { key: "fill", title: "Fill in the Blank", desc: "Complete real Trigedasleng sentences.", icon: <EditNoteIcon /> },
];

export default function Learn() {
  const { words, fillSentences, audioSentences, wordle } = useLoaderData<typeof loader>();
  const [mode, setMode] = useState<ModeKey | null>(null);

  const renderMode = () => {
    switch (mode) {
      case "wordle":
        return <Wordle answers={wordle.answers} guesses={wordle.guesses} />;
      case "flashcards":
        return <Flashcards words={words} />;
      case "quiz":
        return <Quiz words={words} />;
      case "match":
        return <Match words={words} />;
      case "listen":
        return <Listen sentences={audioSentences} />;
      case "fill":
        return <FillBlank sentences={fillSentences} words={words} />;
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: { xs: 2, sm: 3 } }}>
        {mode === null ? (
          <>
            <Typography variant="h3" component="h1" sx={{ mb: 1, fontWeight: 700 }}>
              Learn Trigedasleng
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 4 }}>
              Pick a way to practice — {words.length} words and {audioSentences.length} voiced lines to play with.
            </Typography>
            <Grid container spacing={2}>
              {MODES.map((m) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={m.key}>
                  <Card sx={{ height: "100%" }}>
                    <CardActionArea
                      onClick={() => setMode(m.key)}
                      sx={{ height: "100%", p: 1 }}
                    >
                      <CardContent sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                        <Avatar
                          variant="rounded"
                          sx={{ bgcolor: "primary.main", color: "primary.contrastText", width: 48, height: 48 }}
                        >
                          {m.icon}
                        </Avatar>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          {m.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {m.desc}
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </>
        ) : (
          <>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => setMode(null)}
              sx={{ mb: 2 }}
              color="inherit"
            >
              All modes
            </Button>
            <Typography variant="h4" component="h1" sx={{ mb: 3, fontWeight: 700 }}>
              {MODES.find((m) => m.key === mode)?.title}
            </Typography>
            {renderMode()}
          </>
        )}
      </Box>
    </Container>
  );
}
