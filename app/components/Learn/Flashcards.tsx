import React, { useEffect, useMemo, useState } from "react";
import { Box, Card, Typography, Button, Stack, Chip } from "@mui/material";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import NavigateBeforeIcon from "@mui/icons-material/NavigateBefore";
import { type LearnWord, shuffle, WORD_CLASSES } from "./helpers";

const faceSx = {
  position: "absolute",
  inset: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  gap: 1,
  p: 3,
  backfaceVisibility: "hidden",
  WebkitBackfaceVisibility: "hidden",
  overflow: "auto",
} as const;

export default function Flashcards({ words }: { words: LearnWord[] }) {
  const [category, setCategory] = useState<string>("all");
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const deck = useMemo(() => {
    const pool = category === "all" ? words : words.filter((w) => w.classifications.includes(category));
    return shuffle(pool);
  }, [category, words]);

  useEffect(() => {
    setIndex(0);
    setFlipped(false);
  }, [category]);

  if (deck.length === 0) {
    return <Typography color="text.secondary">No words in this category yet.</Typography>;
  }

  const safeIndex = index % deck.length;
  const card = deck[safeIndex];
  const next = () => {
    setFlipped(false);
    setIndex((safeIndex + 1) % deck.length);
  };
  const prev = () => {
    setFlipped(false);
    setIndex((safeIndex - 1 + deck.length) % deck.length);
  };

  return (
    <Box>
      <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1, mb: 3 }}>
        {WORD_CLASSES.map((c) => (
          <Chip
            key={c}
            label={c}
            onClick={() => setCategory(c)}
            color={category === c ? "primary" : "default"}
            variant={category === c ? "filled" : "outlined"}
            sx={{ textTransform: "capitalize", cursor: "pointer" }}
          />
        ))}
      </Stack>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 1, textAlign: "center" }}>
        Card {safeIndex + 1} of {deck.length} · tap the card to flip
      </Typography>

      <Box sx={{ perspective: "1200px", maxWidth: 480, mx: "auto" }}>
        <Box
          onClick={() => setFlipped((f) => !f)}
          sx={{
            position: "relative",
            width: "100%",
            minHeight: { xs: 220, sm: 260 },
            transformStyle: "preserve-3d",
            transition: "transform .5s",
            transform: flipped ? "rotateY(180deg)" : "none",
            cursor: "pointer",
          }}
        >
          <Card sx={faceSx}>
            <Typography variant="overline" color="text.secondary">
              Trigedasleng
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, wordBreak: "break-word" }}>
              {card.word}
            </Typography>
            {card.pronunciation && (
              <Typography color="text.secondary" sx={{ fontStyle: "italic" }}>
                [{card.pronunciation}]
              </Typography>
            )}
          </Card>
          <Card sx={{ ...faceSx, transform: "rotateY(180deg)" }}>
            <Typography variant="overline" color="text.secondary">
              English
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {card.translation}
            </Typography>
            {card.classifications.length > 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ textTransform: "capitalize" }}>
                {card.classifications.join(", ")}
              </Typography>
            )}
          </Card>
        </Box>
      </Box>

      <Stack direction="row" spacing={1.5} justifyContent="center" sx={{ mt: 3 }}>
        <Button variant="outlined" startIcon={<NavigateBeforeIcon />} onClick={prev}>
          Prev
        </Button>
        <Button variant="outlined" startIcon={<AutorenewIcon />} onClick={() => setFlipped((f) => !f)}>
          Flip
        </Button>
        <Button variant="contained" endIcon={<NavigateNextIcon />} onClick={next}>
          Next
        </Button>
      </Stack>
    </Box>
  );
}
