/*
 * Offline shell route.
 *
 * When the user hard-loads / refreshes a deep link that isn't in the cache while
 * offline, the service worker redirects here with `?to=<path>`. This route is
 * precached, so it always boots; it then client-navigates to the target, which
 * triggers that route's clientLoader to render from the precached dataset.
 * Without a `?to=`, it just shows a friendly offline message.
 */
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Box, Typography, Button, CircularProgress, Stack } from "@mui/material";
import { pageMeta, originFromMatches } from "../seo";

export function meta({ matches }: any) {
  return pageMeta({ title: "Offline", origin: originFromMatches(matches), noindex: true });
}

export default function Offline() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const to = params.get("to");
  const redirecting = !!to && to.startsWith("/") && !to.startsWith("/offline");

  useEffect(() => {
    if (redirecting) navigate(to!, { replace: true });
  }, [redirecting, to, navigate]);

  if (redirecting) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh", px: 2 }}>
      <Stack spacing={2} alignItems="center" sx={{ textAlign: "center" }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          You're offline
        </Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 440 }}>
          The dictionary, translations, grammar and search all work offline.
          Audio playback and the A.L.I.E. assistant need a connection.
        </Typography>
        <Button variant="contained" onClick={() => navigate("/")}>
          Go to home
        </Button>
      </Stack>
    </Box>
  );
}
