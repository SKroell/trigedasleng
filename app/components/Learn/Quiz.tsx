import React, { useState } from "react";
import { Box, Button, Stack, Typography, Chip, ToggleButton, ToggleButtonGroup } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import { type LearnWord, shuffle, sample, sampleDistinct, primaryMeaning } from "./helpers";

type Direction = "t2e" | "e2t";

interface Question {
  correct: LearnWord;
  options: LearnWord[];
}

function labelFor(w: LearnWord, dir: Direction) {
  return dir === "t2e" ? primaryMeaning(w.translation) : w.word;
}
function promptFor(w: LearnWord, dir: Direction) {
  return dir === "t2e" ? w.word : primaryMeaning(w.translation);
}

function makeQuestion(words: LearnWord[], dir: Direction): Question {
  const correct = sample(words);
  const correctLabel = labelFor(correct, dir);
  const distractors = sampleDistinct(
    words,
    3,
    (w) => w.id === correct.id || labelFor(w, dir) === correctLabel,
  );
  return { correct, options: shuffle([correct, ...distractors]) };
}

export default function Quiz({ words }: { words: LearnWord[] }) {
  const [direction, setDirection] = useState<Direction>("t2e");
  const [question, setQuestion] = useState<Question | null>(() =>
    words.length >= 4 ? makeQuestion(words, "t2e") : null,
  );
  const [answeredId, setAnsweredId] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [total, setTotal] = useState(0);

  if (!question) return <Typography color="text.secondary">Not enough words to build a quiz.</Typography>;

  const answered = answeredId !== null;

  const onSelect = (w: LearnWord) => {
    if (answered) return;
    setAnsweredId(w.id);
    setTotal((t) => t + 1);
    if (w.id === question.correct.id) {
      setScore((s) => s + 1);
      setStreak((s) => s + 1);
    } else {
      setStreak(0);
    }
  };

  const next = () => {
    setAnsweredId(null);
    setQuestion(makeQuestion(words, direction));
  };

  const changeDirection = (_: unknown, dir: Direction | null) => {
    if (!dir) return;
    setDirection(dir);
    setAnsweredId(null);
    setQuestion(makeQuestion(words, dir));
  };

  return (
    <Box sx={{ maxWidth: 560, mx: "auto" }}>
      <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center" sx={{ mb: 2, flexWrap: "wrap", gap: 1 }}>
        <ToggleButtonGroup size="small" exclusive value={direction} onChange={changeDirection}>
          <ToggleButton value="t2e">Trig → English</ToggleButton>
          <ToggleButton value="e2t">English → Trig</ToggleButton>
        </ToggleButtonGroup>
        <Stack direction="row" spacing={1}>
          <Chip label={`Score ${score}/${total}`} size="small" />
          <Chip label={`Streak ${streak}`} size="small" color={streak > 0 ? "primary" : "default"} />
        </Stack>
      </Stack>

      <Box sx={{ textAlign: "center", py: { xs: 3, sm: 4 } }}>
        <Typography variant="overline" color="text.secondary">
          What does this mean?
        </Typography>
        <Typography variant="h3" sx={{ fontWeight: 700, wordBreak: "break-word" }}>
          {promptFor(question.correct, direction)}
        </Typography>
      </Box>

      <Stack spacing={1.5}>
        {question.options.map((opt) => {
          const isCorrect = opt.id === question.correct.id;
          const isPicked = opt.id === answeredId;
          let color: "inherit" | "success" | "error" = "inherit";
          if (answered && isCorrect) color = "success";
          else if (answered && isPicked) color = "error";
          return (
            <Button
              key={opt.id}
              fullWidth
              size="large"
              variant={answered && (isCorrect || isPicked) ? "contained" : "outlined"}
              color={color}
              onClick={() => onSelect(opt)}
              endIcon={answered && isCorrect ? <CheckCircleIcon /> : answered && isPicked ? <CancelIcon /> : null}
              sx={{ justifyContent: "space-between", textTransform: "none", py: 1.25, fontSize: "1.05rem" }}
            >
              {labelFor(opt, direction)}
            </Button>
          );
        })}
      </Stack>

      <Box sx={{ textAlign: "center", mt: 3, minHeight: 48 }}>
        {answered && (
          <Button variant="contained" size="large" onClick={next}>
            Next question
          </Button>
        )}
      </Box>
    </Box>
  );
}
