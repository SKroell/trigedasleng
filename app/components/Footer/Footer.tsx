import React from 'react';
import { Link } from 'react-router';
import { Box, Container, Typography, Link as MuiLink, Stack, Divider } from '@mui/material';

const linkSx = {
  color: 'text.secondary',
  '&:hover': { color: 'text.primary' },
} as const;

export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: 'background.paper',
        borderTop: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Container maxWidth="lg">
        <Stack spacing={1.5} alignItems="center">
          <Stack
            direction="row"
            divider={<Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', sm: 'block' } }} />}
            spacing={{ xs: 1.5, sm: 2 }}
            justifyContent="center"
            flexWrap="wrap"
            useFlexGap
          >
            <MuiLink component={Link} to="/" underline="hover" sx={linkSx}>
              Home
            </MuiLink>
            <MuiLink
              href="https://github.com/projectarkadiateam/trigedasleng"
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
              sx={linkSx}
            >
              Github
            </MuiLink>
            <MuiLink
              href="https://www.buymeacoffee.com/skroell"
              target="_blank"
              rel="noopener noreferrer"
              underline="hover"
              sx={linkSx}
            >
              Buy me a coffee
            </MuiLink>
          </Stack>
          <Typography variant="caption" color="text.secondary" align="center">
            Unofficial Trigedasleng Dictionary · A fan project for the language of The 100
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}
