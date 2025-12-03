import React, { Suspense } from "react";
import { useLoaderData, Link } from "react-router";
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  Link as MuiLink,
  CircularProgress,
  Divider,
} from "@mui/material";
import WarningIcon from "@mui/icons-material/Warning";
import { prisma } from "../db.server";
import Translation from "../components/Translation";

export async function loader({ params }: any) {
  const wordValue = params.word;

  const wordInfo = await prisma.word.findMany({
    where: { value: wordValue },
    include: { 
      dictionary: true,
      classifications: {
        include: {
          classification: true
        }
      }
    },
  });

  const examples = await prisma.sentence.findMany({
    where: {
      value: { contains: wordValue },
    },
    take: 3,
    include: {
      episodes: { include: { episode: true } },
    },
  });

  const mappedExamples = examples.map((s) => ({
    id: s.id,
    trigedasleng: s.value,
    translation: s.english,
    etymology: s.etymology || "",
    leipzig: s.leipzigGlossing || "",
    audio: s.audio || "",
  }));

  const fullWordInfo = await Promise.all(
    wordInfo.map(async (w) => {
      const defs = await prisma.translation.findMany({
        where: { wordSourceId: w.id },
        include: { wordTarget: true },
      });
      const defString = defs.map((d) => d.wordTarget.value).join(", ");
      
      // Get classifications
      const classifications = w.classifications.map(wc => wc.classification.value);
      const classification = classifications.length > 0 ? classifications[0] : "";
      
      // Format translation with classification
      const translation = classification 
        ? `${classification}: ${defString}`
        : defString;

      // Get etymology from translations
      const etymology = defs.length > 0 && defs[0].etymology && defs[0].etymology !== "unknown"
        ? defs[0].etymology
        : "";

      return {
        id: w.id,
        word: w.value,
        translation: translation,
        etymology: etymology,
        filter: w.dictionary.value.toLowerCase(),
        note: "",
      };
    })
  );

  return {
    word: fullWordInfo,
    examples: mappedExamples,
    source: null,
  };
}

export default function WordView() {
  const { word, examples, source } = useLoaderData<typeof loader>();

  if (!word || word.length === 0) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 4, textAlign: "center" }}>
          <Typography variant="h4">Word not found</Typography>
        </Box>
      </Container>
    );
  }

  const primaryWord = word[0];

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: { xs: 2, sm: 3 } }}>
        <Suspense
          fallback={
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "200px",
              }}
            >
              <CircularProgress />
            </Box>
          }
        >
          <Box sx={{ mb: 4 }}>
            {/* Word with dotted underline */}
            <Typography
              variant="h3"
              component="h1"
              sx={{
                fontWeight: 600,
                mb: 2,
                borderBottom: '1px dotted',
                borderColor: 'text.primary',
                pb: 1,
                display: 'inline-block',
              }}
            >
              <MuiLink
                component={Link}
                to={"/word/" + primaryWord.word}
                sx={{
                  textDecoration: "none",
                  color: "text.primary",
                  "&:hover": {
                    textDecoration: "underline",
                  },
                }}
              >
                {primaryWord.word}
              </MuiLink>
            </Typography>

            {word.map((w: any, index: number) => {
              const isNoncanon = (w.filter || "").includes("noncanon");
              
              // Parse translation to extract classification and definition
              let classification = "";
              let definition = w.translation || "";
              
              if (w.translation && w.translation.includes(":")) {
                const parts = w.translation.split(":");
                classification = parts[0].trim();
                definition = parts.slice(1).join(":").trim();
              }

              return (
                <Card key={w.id} sx={{ mb: 3 }}>
                  <CardContent>
                    {word.length > 1 && (
                      <Typography variant="h5" sx={{ mb: 2, fontWeight: 500 }}>
                        Etymology {index + 1}
                      </Typography>
                    )}
                    
                    {/* Classification and definition */}
                    {definition && (
                      <Typography
                        variant="body1"
                        sx={{
                          mb: w.etymology ? 1 : 0,
                          color: "text.secondary",
                          fontSize: "1rem",
                        }}
                      >
                        {classification && (
                          <Box component="span" sx={{ fontWeight: 500 }}>
                            {classification}:
                          </Box>
                        )}{' '}
                        {definition}
                      </Typography>
                    )}
                    
                    {/* Etymology */}
                    {w.etymology && (
                      <Typography
                        variant="body2"
                        sx={{
                          color: "text.secondary",
                          mb: w.note || isNoncanon ? 1 : 0,
                        }}
                      >
                        {w.etymology.startsWith('from:') ? w.etymology : `from: ${w.etymology}`}
                      </Typography>
                    )}
                    
                    {/* Non-canon warning */}
                    {isNoncanon && (
                      <Typography
                        variant="body2"
                        sx={{
                          color: "error.main",
                          fontStyle: "italic",
                          fontWeight: 500,
                          mb: w.note ? 1 : 0,
                        }}
                      >
                        !!Not a canon word
                      </Typography>
                    )}
                    
                    {w.note && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                          Notes:
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {w.note}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              );
            })}

            {examples.length > 0 && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
                  Examples
                </Typography>
                <Box>
                  {examples.map((translation: any) => (
                    <Translation translation={translation} key={translation.id} />
                  ))}
                </Box>
              </Box>
            )}

            <Divider sx={{ my: 4 }} />

            <Box>
              <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                Source
              </Typography>
              {source ? (
                <MuiLink
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    textDecoration: "none",
                    color: "primary.main",
                    "&:hover": {
                      textDecoration: "underline",
                    },
                  }}
                >
                  {source.title}
                </MuiLink>
              ) : (
                <Typography variant="body1" color="text.secondary">
                  None
                </Typography>
              )}
            </Box>
          </Box>
        </Suspense>
      </Box>
    </Container>
  );
}
