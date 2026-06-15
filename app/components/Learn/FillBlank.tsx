import React, { useState } from "react";
import { Box, Button, Stack, Typography, Chip } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import { type LearnWord, type LearnSentence, shuffle, sample, sampleDistinct } from "./helpers";

const clean = (t: string) => t.replace(/[^A-Za-z'’-]/g, "");

interface Question {
  sentence: LearnSentence;
  tokens: string[];
  blankIndex: number;
  answer: string;
  options: string[];
}

function makeQuestion(sentences: LearnSentence[], words: LearnWord[]): Question {
  const sentence = sample(sentences);
  const tokens = sentence.trig.trim().split(/\s+/);
  let candidates = tokens.map((t, i) => i).filter((i) => clean(tokens[i]).length >= 3);
  if (candidates.length === 0) candidates = tokens.map((_, i) => i).filter((i) => clean(tokens[i]).length >= 1);
  if (candidates.length === 0) candidates = [0];
  const blankIndex = sample(candidates);
  const answer = clean(tokens[blankIndex]);
  const distractors = sampleDistinct(words, 3, (w) => w.word.toLowerCase() === answer.toLowerCase()).map((w) => w.word);
  const options = shuffle([answer, ...distractors]);
  return { sentence, tokens, blankIndex, answer, options };
}

export default function FillBlank({ sentences, words }: { sentences: LearnSentence[]; words: LearnWord[] }) {
  const ready = sentences.length >= 1 && words.length >= 4;
  const [question, setQuestion] = useState<Question | null>(() => (ready ? makeQuestion(sentences, words) : null));
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [total, setTotal] = useState(0);

  if (!question) return <Typography color="text.secondary">Not enough sentences to play.</Typography>;

  const answered = picked !== null;
  const isRight = (opt: string) => opt.toLowerCase() === question.answer.toLowerCase();

  const onSelect = (opt: string) => {
    if (answered) return;
    setPicked(opt);
    setTotal((t) => t + 1);
    if (isRight(opt)) {
      setScore((s) => s + 1);
      setStreak((s) => s + 1);
    } else {
      setStreak(0);
    }
  };

  const next = () => {
    setPicked(null);
    setQuestion(makeQuestion(sentences, words));
  };

  return (
    <Box sx={{ maxWidth: 600, mx: "auto" }}>
      <Stack direction="row" justifyContent="flex-end" spacing={1} sx={{ mb: 2 }}>
        <Chip label={`Score ${score}/${total}`} size="small" />
        <Chip label={`Streak ${streak}`} size="small" color={streak > 0 ? "primary" : "default"} />
      </Stack>

      <Box sx={{ textAlign: "center", mb: 1 }}>
        <Typography variant="overline" color="text.secondary">
          Fill in the missing word
        </Typography>
      </Box>

      <Typography variant="h5" sx={{ textAlign: "center", lineHeight: 2, mb: 2 }}>
        {question.tokens.map((t, i) => (
          <React.Fragment key={i}>
            {i > 0 ? " " : ""}
            {i === question.blankIndex ? (
              <Box
                component="span"
                sx={{
                  px: 1,
                  borderRadius: 1,
                  fontWeight: 700,
                  bgcolor: answered ? "success.main" : "action.selected",
                  color: answered ? "success.contrastText" : "text.secondary",
                }}
              >
                {answered ? question.answer : "____"}
              </Box>
            ) : (
              t
            )}
          </React.Fragment>
        ))}
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", fontStyle: "italic", mb: 3 }}>
        “{question.sentence.english}”
      </Typography>

      <Stack spacing={1.5}>
        {question.options.map((opt, i) => {
          const right = isRight(opt);
          const isPicked = opt === picked;
          let color: "inherit" | "success" | "error" = "inherit";
          if (answered && right) color = "success";
          else if (answered && isPicked) color = "error";
          return (
            <Button
              key={opt + i}
              fullWidth
              size="large"
              variant={answered && (right || isPicked) ? "contained" : "outlined"}
              color={color}
              onClick={() => onSelect(opt)}
              endIcon={answered && right ? <CheckCircleIcon /> : answered && isPicked ? <CancelIcon /> : null}
              sx={{ justifyContent: "space-between", textTransform: "none", py: 1.25, fontSize: "1.05rem" }}
            >
              {opt}
            </Button>
          );
        })}
      </Stack>

      <Box sx={{ textAlign: "center", mt: 3, minHeight: 48 }}>
        {answered && (
          <Button variant="contained" size="large" onClick={next}>
            Next sentence
          </Button>
        )}
      </Box>
    </Box>
  );
}
