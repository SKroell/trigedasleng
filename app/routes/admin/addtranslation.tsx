import { type ActionFunctionArgs, type LoaderFunctionArgs, redirect } from "react-router";
import { Form, useActionData, useLoaderData } from "react-router";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Paper,
  Stack,
} from "@mui/material";
import { prisma } from "../../db.server";
import { getSession } from "../../sessions";

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const userId = session.get("userId");
  
  if (!userId) {
    throw redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { group: true }
  });

  if (!user || !user.group.admin) {
    throw redirect("/");
  }

  return { user };
}

export async function action({ request }: ActionFunctionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const userId = session.get("userId");
  
  if (!userId) {
    return { error: "Not authenticated" };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { group: true }
  });

  if (!user || !user.group.admin) {
    return { error: "Unauthorized" };
  }

  const formData = await request.formData();
  const trig = formData.get("trig") as string;
  const translation = formData.get("translation") as string;
  const etymology = formData.get("etymology") as string;
  const leipzig = formData.get("leipzig") as string;
  const episode = formData.get("episode") as string || "other";
  const speaker = formData.get("speaker") as string;
  const audio = formData.get("audio") as string;
  const source = formData.get("source") as string;

  if (!trig || !translation) {
    return { error: "Trigedasleng and translation are required" };
  }

  // Find or create Trigedasleng dictionary
  let trigDict = await prisma.dictionary.findFirst({
    where: { value: "Trigedasleng" }
  });

  if (!trigDict) {
    trigDict = await prisma.dictionary.create({
      data: { value: "Trigedasleng" }
    });
  }

  // Find or create English dictionary
  let englishDict = await prisma.dictionary.findFirst({
    where: { value: "English" }
  });

  if (!englishDict) {
    englishDict = await prisma.dictionary.create({
      data: { value: "English" }
    });
  }

  // Find or create source word (Trigedasleng)
  let sourceWord = await prisma.word.findFirst({
    where: {
      value: trig,
      dictionaryId: trigDict.id
    }
  });

  if (!sourceWord) {
    sourceWord = await prisma.word.create({
      data: {
        value: trig,
        dictionaryId: trigDict.id
      }
    });
  }

  // Find or create target word (English)
  let targetWord = await prisma.word.findFirst({
    where: {
      value: translation,
      dictionaryId: englishDict.id
    }
  });

  if (!targetWord) {
    targetWord = await prisma.word.create({
      data: {
        value: translation,
        dictionaryId: englishDict.id
      }
    });
  }

  // Find or create source record
  let sourceRecord = null;
  if (source) {
    sourceRecord = await prisma.source.findFirst({
      where: { url: source }
    });

    if (!sourceRecord) {
      sourceRecord = await prisma.source.create({
        data: { url: source, title: "", author: "" }
      });
    }
  }

  // Create translation (word-to-word relationship)
  await prisma.translation.create({
    data: {
      wordSourceId: sourceWord.id,
      wordTargetId: targetWord.id,
      etymology: etymology,
      sourceId: sourceRecord?.id || null,
    }
  });

  // If episode/speaker/audio/leipzig provided, create a Sentence record
  if (episode !== "other" || speaker || audio || leipzig) {
    // Find or create Trigedasleng dictionary for sentence
    let trigDict = await prisma.dictionary.findFirst({
      where: { value: "Trigedasleng" }
    });

    if (!trigDict) {
      trigDict = await prisma.dictionary.create({
        data: { value: "Trigedasleng" }
      });
    }

    // Parse episode (e.g., "0602" => Season 6 Episode 2)
    let seasonNum = null;
    let episodeNum = null;
    if (episode && episode !== "other" && episode.length === 4) {
      seasonNum = parseInt(episode.substring(0, 2));
      episodeNum = parseInt(episode.substring(2, 4));
    }

    // Find or create series, season, episode
    let series = await prisma.series.findFirst({
      where: { value: "The 100" }
    });

    if (!series) {
      series = await prisma.series.create({
        data: { value: "The 100" }
      });
    }

    let seasonRecord = null;
    if (seasonNum) {
      seasonRecord = await prisma.season.findFirst({
        where: {
          seriesId: series.id,
          seasonNumber: seasonNum
        }
      });

      if (!seasonRecord) {
        seasonRecord = await prisma.season.create({
          data: {
            seriesId: series.id,
            seasonNumber: seasonNum
          }
        });
      }
    }

    let episodeRecord = null;
    if (seasonRecord && episodeNum) {
      episodeRecord = await prisma.episode.findFirst({
        where: {
          seasonId: seasonRecord.id,
          seriesNumber: episodeNum
        }
      });

      if (!episodeRecord) {
        episodeRecord = await prisma.episode.create({
          data: {
            seasonId: seasonRecord.id,
            value: `S${seasonNum}E${episodeNum}`,
            seasonNumber: seasonNum,
            seriesNumber: episodeNum
          }
        });
      }
    }

    // Find or create speaker
    let speakerRecord = null;
    if (speaker) {
      speakerRecord = await prisma.speaker.findFirst({
        where: { 
          value: speaker,
          seriesId: series.id
        }
      });

      if (!speakerRecord) {
        speakerRecord = await prisma.speaker.create({
          data: { 
            value: speaker,
            seriesId: series.id
          }
        });
      }
    }

    // Create sentence with episode/speaker/audio info
    const sentence = await prisma.sentence.create({
      data: {
        dictionaryId: trigDict.id,
        sourceId: sourceRecord?.id || null,
        value: trig,
        english: translation,
        etymology: etymology || null,
        leipzigGlossing: leipzig || null,
        audio: audio || null,
      }
    });

    // Link sentence to episode if provided
    if (episodeRecord) {
      await prisma.episodeSentence.create({
        data: {
          episodeId: episodeRecord.id,
          sentenceId: sentence.id,
          speakerId: speakerRecord?.id || null,
        }
      });
    }
  }

  return { success: "New Translation Inserted Successfully" };
}

export default function AddTranslation() {
  const actionData = useActionData<typeof action>();
  const { user } = useLoaderData<typeof loader>();

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" sx={{ mb: 4, fontWeight: 600 }}>
          Add new translation
        </Typography>

        <Paper elevation={3} sx={{ p: 4 }}>
          <Form method="post">
            <Stack spacing={3}>
              {actionData?.error && (
                <Alert severity="error">{actionData.error}</Alert>
              )}
              {actionData?.success && (
                <Alert severity="success">{actionData.success}</Alert>
              )}

              <TextField
                label="Trigedasleng"
                name="trig"
                required
                fullWidth
                variant="outlined"
                placeholder="Enter Trigedasleng"
              />

              <TextField
                label="Translation"
                name="translation"
                required
                fullWidth
                variant="outlined"
                placeholder="Enter Translation"
              />

              <TextField
                label="Etymology"
                name="etymology"
                fullWidth
                variant="outlined"
                placeholder="Enter Etymology"
              />

              <TextField
                label="Leipzig"
                name="leipzig"
                fullWidth
                variant="outlined"
                placeholder="Enter Leipzig"
              />

              <TextField
                label="Episode (blank if 'other')"
                name="episode"
                fullWidth
                variant="outlined"
                placeholder="0602 => Season 6 Episode 2"
                helperText="Format: SSYY (e.g., 0602 for Season 6 Episode 2)"
              />

              <TextField
                label="Speaker"
                name="speaker"
                fullWidth
                variant="outlined"
                placeholder="Octavia?"
              />

              <TextField
                label="Audio"
                name="audio"
                fullWidth
                variant="outlined"
                placeholder="audio/s2/<clipname>.mp3"
              />

              <TextField
                label="Source (URL)"
                name="source"
                fullWidth
                variant="outlined"
                placeholder="Enter URL"
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                sx={{ mt: 2 }}
              >
                Submit
              </Button>
            </Stack>
          </Form>
        </Paper>
      </Box>
    </Container>
  );
}

