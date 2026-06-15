import { type LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { Container, Box, Typography, Stack, Chip } from "@mui/material";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import { prisma } from "../db.server";
import Word from "../components/Word";
import Translation from "../components/Translation";
import { clientLoaderWithFallback, searchDataset } from "../offline-data.client";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q");

  if (!query || query.length < 2) {
    return { words: [], translations: [], query: null };
  }

  // Search words
  const words = await prisma.word.findMany({
    where: {
      value: { contains: query }
    },
    include: { dictionary: true },
    take: 20
  });

  // Search translations/sentences
  const sentences = await prisma.sentence.findMany({
    where: {
        OR: [
            { value: { contains: query } },
            { english: { contains: query } }
        ]
    },
    include: { episodes: { include: { episode: true } } },
    take: 20
  });

  // Map to props
  const mappedWords = await Promise.all(words.map(async w => {
        const defs = await prisma.translation.findMany({
            where: { wordSourceId: w.id },
            include: { wordTarget: true }
        });
        const defString = defs.map(d => d.wordTarget.value).join("; ");

        return {
            id: w.id,
            word: w.value,
            pronunciation: w.pronunciation,
            translation: defString,
            etymology: "",
            filter: w.dictionary.value.toLowerCase(),
        };
  }));

  const mappedSentences = sentences.map(s => ({
      id: s.id,
      trigedasleng: s.value,
      translation: s.english,
      etymology: s.etymology || "",
      leipzig: s.leipzigGlossing || "",
      audio: s.audio || ""
  }));

  return { words: mappedWords, translations: mappedSentences, query };
}

// Offline: search the precached dataset (words + translations).
export async function clientLoader({ request, serverLoader }: any) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q");
  return clientLoaderWithFallback<any>(serverLoader, (ds) => {
    if (!query || query.length < 2) return { words: [], translations: [], query: null };
    const { words, translations } = searchDataset(ds, query);
    return { words, translations, query };
  });
}

export default function Search() {
  const { words, translations, query } = useLoaderData<typeof loader>();
  const total = words.length + translations.length;

  return (
    <Container maxWidth="md" sx={{ py: { xs: 2, sm: 3 } }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
          {query ? <>Results for <Box component="span" sx={{ color: 'text.secondary' }}>“{query}”</Box></> : "Search"}
        </Typography>
        {query && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {total} {total === 1 ? "result" : "results"}
          </Typography>
        )}
      </Box>

      {!query && (
        <Typography color="text.secondary">
          Type at least two characters in the search bar to look up words and translations.
        </Typography>
      )}

      {query && total === 0 && (
        <Stack alignItems="center" spacing={1} sx={{ py: 8, color: 'text.secondary' }}>
          <SearchOffIcon sx={{ fontSize: 48 }} />
          <Typography>No results found for “{query}”.</Typography>
        </Stack>
      )}

      {words.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Dictionary words</Typography>
            <Chip label={words.length} size="small" />
          </Stack>
          {words.map((w: any) => <Word key={w.id} word={w} />)}
        </Box>
      )}

      {translations.length > 0 && (
        <Box>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>Translations</Typography>
            <Chip label={translations.length} size="small" />
          </Stack>
          {translations.map((t: any) => <Translation key={t.id} translation={t} />)}
        </Box>
      )}
    </Container>
  );
}
