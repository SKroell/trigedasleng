import { useLoaderData } from "react-router";
import {
  Container,
  Box,
  Typography,
  Card,
  List,
  ListItem,
  ListItemText,
  Link as MuiLink,
  Divider,
} from "@mui/material";
import { prisma } from "../db.server";
import { clientLoaderWithFallback } from "../offline-data.client";
import { pageMeta, originFromMatches } from "../seo";

export function meta({ matches, location }: any) {
  return pageMeta({
    title: "Sources",
    description: "Citations and references behind the Trigedasleng dictionary entries and translations.",
    origin: originFromMatches(matches),
    path: location.pathname,
  });
}

export async function loader() {
  const sources = await prisma.source.findMany({
    orderBy: { date: 'desc' }
  });

  // Serialize date
  return {
      sources: sources.map(s => ({
          ...s,
          date: s.date ? s.date.toISOString().split('T')[0] : ""
      }))
  };
}

// Offline: list sources from the precached dataset.
export async function clientLoader({ serverLoader }: any) {
  return clientLoaderWithFallback<any>(serverLoader, (ds) => ({
    sources: ds.sources,
  }));
}

export default function Sources() {
    const { sources } = useLoaderData<typeof loader>();

    return (
        <Container maxWidth="md" sx={{ py: { xs: 2, sm: 3 } }}>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
                    Sources
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Citations and references behind the dictionary entries.
                </Typography>
            </Box>

            <Card>
                <List disablePadding>
                    {sources.map((source: any, index: number) => (
                        <Box key={index}>
                            {index > 0 && <Divider component="li" />}
                            <ListItem alignItems="flex-start" sx={{ py: 1.5 }}>
                                <ListItemText
                                    primary={
                                        source.url ? (
                                            <MuiLink
                                                href={source.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                sx={{ fontWeight: 600 }}
                                            >
                                                {source.title}
                                            </MuiLink>
                                        ) : (
                                            <Box component="span" sx={{ fontWeight: 600 }}>
                                                {source.title}
                                            </Box>
                                        )
                                    }
                                    secondary={[source.author, source.date].filter(Boolean).join(" · ")}
                                />
                            </ListItem>
                        </Box>
                    ))}
                </List>
            </Card>
        </Container>
    );
}
