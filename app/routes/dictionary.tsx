import React, { useState, useEffect, Suspense } from "react";
import { useLoaderData, useParams, useSearchParams, Link } from "react-router";
import {
  Box,
  Typography,
  Chip,
  Stack,
  Button,
  Collapse,
  useMediaQuery,
  useTheme,
  Container,
  CircularProgress,
  Grid,
} from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import { prisma } from "../db.server";
import Word from "../components/Word";

export async function loader({ params, request }: any) {
  const dictParam = params.dictionary?.toLowerCase();
  
  // Build where clause based on dictionary parameter
  let dictionaryFilter: any = {
    value: {
      not: "English",
    },
  };
  
  // If a specific dictionary is requested, filter by it
  if (dictParam === "canon") {
    dictionaryFilter.value = "Trigedasleng";
  } else if (dictParam === "slakkru" || dictParam === "slakgedasleng") {
    dictionaryFilter.value = "Slakgedasleng";
  } else if (dictParam === "noncanon") {
    // Noncanon includes both "Noncanon Trigedasleng" and "Slakgedasleng"
    dictionaryFilter.value = {
      in: ["Noncanon Trigedasleng", "Slakgedasleng"],
    };
  }
  
  // Fetch words excluding English dictionary
  const words = await prisma.word.findMany({
    where: {
      dictionary: dictionaryFilter,
    },
    include: {
      dictionary: true,
      classifications: {
        include: {
          classification: true,
        },
      },
      translationsFrom: {
        include: { 
          wordTarget: {
            include: {
              dictionary: true, // Include dictionary to filter English translations
            },
          },
        },
      },
    },
    orderBy: { value: "asc" },
  });

  const mappedWords = words.map((w) => {
    // Only get translations that target English words
    const englishTranslations = w.translationsFrom
      .filter((t) => t.wordTarget.dictionary.value === "English")
      .map((t) => t.wordTarget.value);
    
    // Get classifications
    const classifications = w.classifications.map((c) => c.classification.value);
    const classification = classifications.length > 0 ? classifications[0] : "";
    
    // Format translation with classification
    const translation = classification 
      ? `${classification}: ${englishTranslations.join(", ")}`
      : englishTranslations.join(", ");
    
    // Get etymology from first translation
    const firstTranslation = w.translationsFrom
      .filter((t) => t.wordTarget.dictionary.value === "English")[0];
    const etymology = firstTranslation?.etymology && firstTranslation.etymology !== "unknown"
      ? firstTranslation.etymology
      : "";
    
    return {
      id: w.id,
      word: w.value,
      translation: translation,
      etymology: etymology,
      filter:
        w.dictionary.value +
        " " +
        classifications.join(" ").toLowerCase(),
      dictionary: w.dictionary.value,
    };
  });

  return { words: mappedWords };
}

const wordClasses = [
  "all",
  "noun",
  "pronoun",
  "verb",
  "adverb",
  "adjective",
  "conjunction",
  "preposition",
  "interjection",
  "auxiliary",
];

export default function Dictionary() {
  const { words } = useLoaderData<typeof loader>();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const search = searchParams.get("q") || "";
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [classFilter, setClassFilter] = useState("all");
  const [showFilterButtons, setShowFilterButtons] = useState(!isMobile);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [params.dictionary]);

  const getDictionary = () => {
    let dict = params.dictionary;

    const applySearch = (entry: any) => {
      if (search.length < 2) return true;

      let word = entry.word.toLowerCase();
      let translation = entry.translation.toLowerCase();

      if (search.length < 3)
        return word === search || translation === search;
      else return word.includes(search) || translation.includes(search);
    };

    const applyClassFilter = (entry: any) => {
      return classFilter === "all" || entry.filter.includes(classFilter);
    };

    if (!dict)
      return words.filter(function (entry: any) {
        // Exclude English dictionary entries
        return (
          entry.dictionary.toLowerCase() !== "english" &&
          applySearch(entry) &&
          applyClassFilter(entry)
        );
      });

    // Dictionary filtering is already done at database level in loader
    // Just apply search and class filters here
    return words.filter(function (entry: any) {
      return applySearch(entry) && applyClassFilter(entry);
    });
  };

  const renderWords = () => {
    const filtered = getDictionary();
    
    // Sort case-insensitively
    const sorted = [...filtered].sort((a: any, b: any) => {
      return a.word.toLowerCase().localeCompare(b.word.toLowerCase());
    });
    
    let lastChar: string | null = null;
    const elements: React.ReactNode[] = [];

    sorted.forEach((word: any, index: number) => {
      const curChar = word.word.charAt(0).toUpperCase();
      
      // Add character divider if needed
      if (curChar !== lastChar) {
        elements.push(
          <Grid key={curChar + "div"} size={{ xs: 12 }}>
            <Typography
              variant="h4"
              id={curChar}
              sx={{
                mt: 4,
                mb: 2,
                pt: 2,
                borderTop: "2px solid",
                borderColor: "divider",
                scrollMarginTop: "80px",
              }}
            >
              {curChar}
            </Typography>
          </Grid>
        );
        lastChar = curChar;
      }

      // Add word in grid
      elements.push(
        <Grid key={word.id} size={{ xs: 12, sm: 6, md: 4 }}>
          <Word word={word} />
        </Grid>
      );
    });

    return (
      <Grid container spacing={2}>
        {elements}
      </Grid>
    );
  };

  const DictionaryName = () => {
    let { dictionary } = useParams();
    return (
      <Typography
        variant="h3"
        component="h1"
        sx={{
          textTransform: "capitalize",
          mb: 3,
          fontWeight: 600,
        }}
      >
        {dictionary || "Full"} Dictionary
      </Typography>
    );
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: { xs: 2, sm: 3 } }}>
        {isMobile && (
          <Box sx={{ mb: 2 }}>
            <Button
              variant="outlined"
              startIcon={<FilterListIcon />}
              onClick={() => setShowFilterButtons(!showFilterButtons)}
              fullWidth
            >
              {showFilterButtons ? "Hide Filters" : "Show Filters"}
            </Button>
          </Box>
        )}

        <Collapse in={showFilterButtons}>
          <Box sx={{ mb: 3 }}>
            <Stack
              direction="row"
              spacing={1}
              sx={{
                flexWrap: "wrap",
                gap: 1,
                justifyContent: { xs: "center", sm: "flex-start" },
              }}
            >
              {wordClasses.map((wordClass) => (
                <Chip
                  key={wordClass}
                  label={wordClass}
                  onClick={() => setClassFilter(wordClass)}
                  color={classFilter === wordClass ? "primary" : "default"}
                  variant={classFilter === wordClass ? "filled" : "outlined"}
                  sx={{
                    cursor: "pointer",
                    textTransform: "capitalize",
                  }}
                />
              ))}
            </Stack>
          </Box>
        </Collapse>

        <DictionaryName />
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
          {renderWords()}
        </Suspense>
      </Box>
    </Container>
  );
}
