import React, { useState } from "react";
import { Box, Button, Stack, Typography, Chip } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import { type LearnSentence, shuffle, sample, sampleDistinct, audioSrc } from "./helpers";

interface Question {
  correct: LearnSentence;
  options: LearnSentence[];
}

function makeQuestion(sentences: LearnSentence[]): Question {
  const correct = sample(sentences);
  const distractors = sampleDistinct(
    sentences,
    3,
    (s) => s.id === correct.id || s.english === correct.english,
  );
  return { correct, options: shuffle([correct, ...distractors]) };
}

export default function Listen({ sentences }: { sentences: LearnSentence[] }) {
  const [question, setQuestion] = useState<Question | null>(() =>
    sentences.length >= 4 ? makeQuestion(sentences) : null,
  );
  const [answeredId, setAnsweredId] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [total, setTotal] = useState(0);

  if (!question) return <Typography color="text.secondary">Not enough voiced lines available.</Typography>;

  const answered = answeredId !== null;

  const onSelect = (opt: LearnSentence) => {
    if (answered) return;
    setAnsweredId(opt.id);
    setTotal((t) => t + 1);
    if (opt.id === question.correct.id) {
      setScore((s) => s + 1);
      setStreak((s) => s + 1);
    } else {
      setStreak(0);
    }
  };

  const next = () => {
    setAnsweredId(null);
    setQuestion(makeQuestion(sentences));
  };

  return (
    <Box sx={{ maxWidth: 560, mx: "auto" }}>
      <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ mb: 2 }}>
        <Chip label={`Score ${score}/${total}`} size="small" />
        <Chip label={`Streak ${streak}`} size="small" color={streak > 0 ? "primary" : "default"} />
      </Stack>

      <Box sx={{ textAlign: "center", mb: 3 }}>
        <Typography variant="overline" color="text.secondary">
          Listen, then pick the translation
        </Typography>
        <Box sx={{ mt: 1 }}>
          <audio
            key={question.correct.id}
            controls
            autoPlay
            preload="auto"
            style={{ width: "100%" }}
            src={audioSrc(question.correct.audio || "")}
          />
        </Box>
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
              sx={{ justifyContent: "space-between", textTransform: "none", py: 1.25, textAlign: "left" }}
            >
              {opt.english}
            </Button>
          );
        })}
      </Stack>

      {answered && (
        <Box sx={{ textAlign: "center", mt: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Line: <b>{question.correct.trig}</b>
          </Typography>
          <Button variant="contained" onClick={next}>
            Next clip
          </Button>
        </Box>
      )}
    </Box>
  );
}
