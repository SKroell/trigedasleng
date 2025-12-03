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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
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
  const classification = formData.get("class") as string;
  const etymology = formData.get("etymology") as string;
  const dictionary = formData.get("dictionary") as string;
  const source = formData.get("source") as string;

  if (!trig || !translation || !classification || !dictionary) {
    return { error: "Word, translation, classification, and dictionary are required" };
  }

  // Map dictionary value to database dictionary
  let dictionaryValue = "Trigedasleng";
  if (dictionary === "slakgedasleng") {
    dictionaryValue = "Slakgedasleng";
  } else if (dictionary === "noncanon") {
    dictionaryValue = "Noncanon Trigedasleng";
  }

  // Find or create dictionary
  let dict = await prisma.dictionary.findFirst({
    where: { value: dictionaryValue }
  });

  if (!dict) {
    dict = await prisma.dictionary.create({
      data: { value: dictionaryValue }
    });
  }

  // Find or create classification
  let wordClass = await prisma.classification.findFirst({
    where: { value: classification }
  });

  if (!wordClass && classification !== "none") {
    wordClass = await prisma.classification.create({
      data: { value: classification }
    });
  }

  // Create word
  const word = await prisma.word.create({
    data: {
      value: trig,
      dictionaryId: dict.id,
      classifications: wordClass ? {
        create: {
          classificationId: wordClass.id
        }
      } : undefined,
    }
  });

  // Create translation to English word
  // First, find or create English dictionary
  let englishDict = await prisma.dictionary.findFirst({
    where: { value: "English" }
  });

  if (!englishDict) {
    englishDict = await prisma.dictionary.create({
      data: { value: "English" }
    });
  }

  // Find or create English word
  let englishWord = await prisma.word.findFirst({
    where: {
      value: translation,
      dictionaryId: englishDict.id
    }
  });

  if (!englishWord) {
    englishWord = await prisma.word.create({
      data: {
        value: translation,
        dictionaryId: englishDict.id
      }
    });
  }

  // Create translation
  await prisma.translation.create({
    data: {
      wordSourceId: word.id,
      wordTargetId: englishWord.id,
      etymology: etymology ? `from: ${etymology}` : null,
    }
  });

  // Handle source if provided
  if (source) {
    let sourceRecord = await prisma.source.findFirst({
      where: { url: source }
    });

    if (!sourceRecord) {
      sourceRecord = await prisma.source.create({
        data: { url: source, title: "", author: "" }
      });
    }
  }

  return { success: "New Word Inserted Successfully" };
}

export default function AddWord() {
  const actionData = useActionData<typeof action>();
  const { user } = useLoaderData<typeof loader>();

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" sx={{ mb: 4, fontWeight: 600 }}>
          Add new word
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
                label="Word (in Trigedasleng)"
                name="trig"
                required
                fullWidth
                variant="outlined"
                placeholder="Enter Word (in trig)"
              />

              <TextField
                label="Translation"
                name="translation"
                required
                fullWidth
                variant="outlined"
                placeholder="Enter Translation"
              />

              <FormControl fullWidth>
                <InputLabel>Classification</InputLabel>
                <Select
                  name="class"
                  label="Classification"
                  defaultValue="none"
                  required
                >
                  <MenuItem value="none">none</MenuItem>
                  <MenuItem value="noun">noun</MenuItem>
                  <MenuItem value="pronoun">pronoun</MenuItem>
                  <MenuItem value="verb">verb</MenuItem>
                  <MenuItem value="adjective">adjective</MenuItem>
                  <MenuItem value="adverb">adverb</MenuItem>
                  <MenuItem value="conjunction">conjunction</MenuItem>
                  <MenuItem value="preposition">preposition</MenuItem>
                  <MenuItem value="interjection">interjection</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Etymology"
                name="etymology"
                fullWidth
                variant="outlined"
                placeholder="Enter Etymology"
              />

              <FormControl fullWidth>
                <InputLabel>Dictionary</InputLabel>
                <Select
                  name="dictionary"
                  label="Dictionary"
                  defaultValue="canon"
                  required
                >
                  <MenuItem value="canon">Canon</MenuItem>
                  <MenuItem value="slakgedasleng">Slakgedasleng</MenuItem>
                  <MenuItem value="noncanon">Noncanon</MenuItem>
                </Select>
              </FormControl>

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

