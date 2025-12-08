import React from "react";
import { Link, useLoaderData } from "react-router";
import {
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  Link as MuiLink,
  Divider,
  Stack,
} from "@mui/material";
import { prisma } from "../db.server";
import Word from "../components/Word";
import Translation from "../components/Translation";
import BuyMeACoffee from "../components/Misc/BuyMeACoffee";

export async function loader() {
  // Get Trigedasleng dictionary
  const trigDict = await prisma.dictionary.findFirst({
    where: { value: "Trigedasleng" },
  });

  if (!trigDict) {
    return {
      recent: [],
      random: {
        word: null,
        translation: null,
      },
    };
  }

  // Get recent Trigedasleng words only
  const recent = await prisma.word.findMany({
    where: {
      dictionaryId: trigDict.id,
    },
    take: 10,
    orderBy: { createdAt: "desc" },
  });

  // Get random Trigedasleng word only
  const countWords = await prisma.word.count({
    where: {
      dictionaryId: trigDict.id,
    },
  });
  const skipWord = Math.floor(Math.random() * countWords);
  const randomWord = await prisma.word.findFirst({
    where: {
      dictionaryId: trigDict.id,
    },
    skip: skipWord,
  });

  const countTranslations = await prisma.translation.count();
  const skipTranslation = Math.floor(Math.random() * countTranslations);
  const randomTranslation = await prisma.translation.findFirst({
    skip: skipTranslation,
    include: { wordSource: true, wordTarget: true },
  });

  return {
    recent,
    random: {
      word: randomWord,
      translation: randomTranslation,
    },
  };
}

export default function Home() {
  const { recent, random } = useLoaderData<typeof loader>();

  const resources = [
    {
      label: "Trigedasleng on Wikipedia",
      href: "//en.wikipedia.org/wiki/Trigedasleng",
    },
    {
      label: "Dedalvs Tumblr",
      href: "//dedalvs.tumblr.com/tagged/Trigedasleng",
    },
    {
      label: "Transcripts of Trig lines in the show",
      href: "//dedalvs.com/work/the-100/trigedasleng_master_dialogue.pdf",
    },
    {
      label: "Memrise course",
      href: "//www.memrise.com/course/957902/trigedasleng/",
    },
    {
      label: "Slakkru's Learn Trigedasleng videos",
      href: "//www.youtube.com/watch?v=JCoxlcHn7SQ&list=PLrk1St_BRZTFrhOYsz2KRS_fZ9ZzTavrq",
    },
    {
      label: "Slakgedakru",
      href: "//slakgedakru.tumblr.com/",
    },
    {
      label: "Slakgedakru Discord Server",
      href: "//discord.gg/MFnCpEB",
    },
  ];

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ py: { xs: 2, sm: 3 }, px: { xs: 2, sm: 3 } }}>
        {/* Single row: Recently Added | About this website | Random Translation | Random Word | Resources */}
        <Grid container spacing={4} sx={{ width: '100%', margin: 0 }}>
          <Grid size={{ xs: 12, md: 2 }}>
            <Card>
              <CardContent>
                <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                  Recently Added
                </Typography>
                <List>
                  {recent.map((word: any, index: number) => (
                    <ListItem key={index} disablePadding>
                      <MuiLink
                        component={Link}
                        to={"/word/" + word.value}
                        sx={{
                          textDecoration: "none",
                          color: "primary.main",
                          "&:hover": {
                            textDecoration: "underline",
                          },
                        }}
                      >
                        {word.value}
                      </MuiLink>
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 7 }}>
            <Stack spacing={2}>
              <Card>
                <CardContent>
                  <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                    About this website
                  </Typography>
                  <Typography variant="body1" paragraph>
                    Welcome to the Unofficial Trigedasleng Dictionary.
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Trigedasleng is a constructed language (conlang) developed by David J. Peterson
                    for use on the CW show The 100. The Woods Clan (Trigedakru/Trikru) and Sand
                    Nomads (Sanskavakru) have been heard using this language, but other groups of
                    grounders (that is, earth-born people not born inside Mt. Weather) may also
                    speak the language. Some of the Sky People (Skaikru; those from the Ark)
                    began to learn Trigedasleng after repeated contact with the Trigedakru.
                  </Typography>
                </CardContent>
              </Card>
              {random.translation && (
                <Card>
                  <CardContent>
                    <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                      Random Translation
                    </Typography>
                    <Translation translation={random.translation} />
                  </CardContent>
                </Card>
              )}
              {random.word && (
                <Card>
                  <CardContent>
                    <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                      Random Word
                    </Typography>
                    <Word word={random.word} />
                  </CardContent>
                </Card>
              )}
            </Stack>
          </Grid>

          

          <Grid size={{ xs: 12, md: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                  Resources
                </Typography>
                <List>
                  {resources.map((resource, index) => (
                    <React.Fragment key={index}>
                      <ListItem disablePadding>
                        <MuiLink
                          href={resource.href}
                          target="_blank"
                          rel="noreferrer"
                          sx={{
                            textDecoration: "none",
                            color: "primary.main",
                            "&:hover": {
                              textDecoration: "underline",
                            },
                          }}
                        >
                          {resource.label}
                        </MuiLink>
                      </ListItem>
                      {index < resources.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
      <BuyMeACoffee />
    </Box>
  );
}