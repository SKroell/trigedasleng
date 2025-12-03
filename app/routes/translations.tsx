import { useState, Suspense } from "react";
import { useLoaderData } from "react-router";
import {
  Container,
  Typography,
  Box,
  Chip,
  Stack,
  TextField,
  InputAdornment,
  CircularProgress,
  Divider,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import InfiniteScroll from "react-infinite-scroller";
import { prisma } from "../db.server";
import { seasonList, episodeList } from "../data";
import Translation from "../components/Translation";

export async function loader() {
  const sentences = await prisma.sentence.findMany({
    include: {
      episodes: {
        include: {
          episode: true,
        },
      },
    },
  });

  const translations = sentences.map((s) => {
    const ep = s.episodes[0]?.episode;
    const episodeKey = ep
      ? ep.seasonNumber.toString().padStart(2, "0") +
        ep.seriesNumber.toString().padStart(2, "0")
      : "other";

    return {
      id: s.id,
      trigedasleng: s.value,
      translation: s.english,
      etymology: s.etymology || "",
      leipzig: s.leipzigGlossing || "",
      audio: s.audio || "",
      episode: episodeKey,
    };
  });

  return { translations };
}

export default function Translations() {
  const { translations } = useLoaderData<typeof loader>();
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null);
  const [episodesLoaded, setEpisodesLoaded] = useState(2);
  const [search, setSearch] = useState("");

  const getEpisodeCount = (season: string | null) => {
    if (season === null) return Object.keys(episodeList).length;
    if (season === "other") return 1;

    let count = 0;
    Object.keys(episodeList).forEach((key) => {
      if (key.substring(0, 2) === season) count++;
    });

    return count;
  };

  const getSeasonOffset = (season: string) => {
    if (season === "other") {
      // Find the index of "other" in episodeList
      const episodeKeys = Object.keys(episodeList);
      return episodeKeys.indexOf("other");
    }
    let offset = 0;
    let seasonListKeys = Object.keys(seasonList);
    for (let index = 0; index < seasonListKeys.indexOf(season); index++) {
      offset += getEpisodeCount(seasonListKeys[index]);
    }
    return offset;
  };

  const getEpisode = (key: string) => {
    return translations.filter(function (entry: any) {
      return entry.episode === key;
    });
  };

  const renderTranslations = (key: string) => {
    let searchTerm = search.toLowerCase();
    let episodeTranslations = getEpisode(key);
    if (searchTerm !== "") {
      episodeTranslations = getEpisode(key).filter((translation: any) => {
        return (
          translation.trigedasleng.toLowerCase().includes(searchTerm) ||
          translation.translation.toLowerCase().includes(searchTerm)
        );
      });
    }

    if (episodeTranslations.length === 0) return null;

    return (
      <Box key={key} sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            mb: 2,
            fontWeight: 600,
            pt: 2,
            borderTop: "2px solid",
            borderColor: "divider",
          }}
        >
          {episodeList[key]}
        </Typography>
        {episodeTranslations.map((translation: any) => (
          <Box key={translation.id} sx={{ mb: 2 }}>
            <Suspense
              fallback={
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    p: 2,
                  }}
                >
                  <CircularProgress size={24} />
                </Box>
              }
            >
              <Translation translation={translation} />
            </Suspense>
          </Box>
        ))}
      </Box>
    );
  };

  const loadMoreEpisodes = () => {
    setEpisodesLoaded((prev) => prev + 2);
  };

  const renderSeason = (season: string) => {
    setSelectedSeason(season);
    setEpisodesLoaded(2);
  };

  const canLoadMoreEpisodes = () => {
    let loaded = episodesLoaded;
    let maxLoad = getEpisodeCount(selectedSeason);
    return loaded < maxLoad;
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: { xs: 2, sm: 3 } }}>
        <Typography variant="h3" component="h1" sx={{ mb: 3, fontWeight: 600 }}>
          Translations by Season
        </Typography>

        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Search translations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 3 }}
          />

          <Stack
            direction="row"
            spacing={1}
            sx={{
              flexWrap: "wrap",
              gap: 1,
              justifyContent: { xs: "center", sm: "flex-start" },
            }}
          >
            {Object.keys(seasonList).map((key) => (
              <Chip
                key={key}
                label={seasonList[key]}
                onClick={() => renderSeason(key)}
                color={selectedSeason === key ? "primary" : "default"}
                variant={selectedSeason === key ? "filled" : "outlined"}
                sx={{
                  cursor: "pointer",
                }}
              />
            ))}
          </Stack>
        </Box>

        <Box>
          <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
            {selectedSeason != null
              ? `${seasonList[selectedSeason]} Translations`
              : "All Translations"}
          </Typography>

          <InfiniteScroll
            pageStart={0}
            loadMore={loadMoreEpisodes}
            hasMore={canLoadMoreEpisodes()}
            loader={
              <Box
                key={0}
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  p: 2,
                }}
              >
                <CircularProgress />
              </Box>
            }
            initialLoad={true}
            useWindow={true}
          >
            {(() => {
              const episodeKeys = Object.keys(episodeList);
              let keysToRender: string[];
              
              if (selectedSeason === null) {
                // Show all episodes up to episodesLoaded
                keysToRender = episodeKeys.slice(0, episodesLoaded);
              } else if (selectedSeason === "other") {
                // Show only "other" episode
                keysToRender = episodeKeys.filter(key => key === "other");
              } else {
                // Show episodes for selected season
                const start = getSeasonOffset(selectedSeason);
                const end = start + episodesLoaded;
                keysToRender = episodeKeys.slice(start, end);
              }
              
              return keysToRender.map((key) => {
                return <Box key={key}>{renderTranslations(key)}</Box>;
              });
            })()}
          </InfiniteScroll>
        </Box>
      </Box>
    </Container>
  );
}
