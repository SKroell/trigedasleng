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
import slugify from "slugify";
import { prisma } from "../db.server";
import Translation from "../components/Translation";
import { clientLoaderWithFallback, sentenceById } from "../offline-data.client";
import { pageMeta, originFromMatches, clampDescription } from "../seo";

export function meta({ data, matches }: any) {
  const origin = originFromMatches(matches);
  if (!data || !data.translation) {
    return pageMeta({ title: "Translation not found", origin, noindex: true });
  }
  const t = data.translation;
  const slug = slugify(t.trigedasleng, { lower: true, strict: true });
  const title = `“${t.trigedasleng}” — Trigedasleng translation`;
  const description = clampDescription(
    `${t.trigedasleng} — “${t.translation}”. A Trigedasleng line from The 100 with its English translation${t.leipzig ? " and glossing" : ""}.`,
  );
  // Canonical always points at the slugged URL, even when accessed without the slug.
  return pageMeta({ title, description, origin, path: `/translation/${t.id}/${slug}` });
}

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

// Offline: render this translation from the precached dataset.
export async function clientLoader({ params, serverLoader }: any) {
  return clientLoaderWithFallback<any>(serverLoader, (ds) => {
    const s = sentenceById(ds, params.id);
    if (!s) throw new Response("Translation not found", { status: 404 });
    return {
      translation: {
        id: s.id,
        trigedasleng: s.trigedasleng,
        translation: s.translation,
        etymology: s.etymology,
        leipzig: s.leipzig,
        audio: s.audio,
        episode: s.episode,
      },
      source: s.sourceUrl ? { title: s.sourceTitle, url: s.sourceUrl } : null,
    };
  });
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

