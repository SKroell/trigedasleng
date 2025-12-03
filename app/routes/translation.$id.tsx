import React, { Suspense } from "react";
import { useLoaderData, Link } from "react-router";
import {
  Container,
  Typography,
  Box,
  Link as MuiLink,
  CircularProgress,
  Divider,
} from "@mui/material";
import { prisma } from "../db.server";
import Translation from "../components/Translation";

export async function loader({ params }: any) {
  const id = params.id;

  const sentence = await prisma.sentence.findUnique({
    where: { id },
    include: {
      episodes: {
        include: {
          episode: true,
        },
      },
      source: true,
    },
  });

  if (!sentence) {
    throw new Response("Translation not found", { status: 404 });
  }

  const ep = sentence.episodes[0]?.episode;
  const episodeKey = ep
    ? ep.seasonNumber.toString().padStart(2, "0") +
      ep.seriesNumber.toString().padStart(2, "0")
    : "other";

  const translation = {
    id: sentence.id,
    trigedasleng: sentence.value,
    translation: sentence.english,
    etymology: sentence.etymology || "",
    leipzig: sentence.leipzigGlossing || "",
    audio: sentence.audio || "",
    episode: episodeKey,
  };

  return {
    translation,
    source: sentence.source,
  };
}

export default function TranslationView() {
  const { translation, source } = useLoaderData<typeof loader>();

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
            {/* Translation */}
            <Translation translation={translation} />

            <Divider sx={{ my: 4 }} />

            {/* Source */}
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

