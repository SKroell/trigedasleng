import React from 'react';
import { Link } from 'react-router';
import { Box, Container, Typography, Link as MuiLink } from '@mui/material';

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
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'center',
            alignItems: 'center',
            gap: { xs: 1, sm: 2 },
            flexWrap: 'wrap',
          }}
        >
          <MuiLink
            component={Link}
            to="/"
            sx={{
              textDecoration: 'none',
              color: 'text.secondary',
              '&:hover': { color: 'primary.main' },
            }}
          >
            Home
          </MuiLink>
          <Typography component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
            |
          </Typography>
          <MuiLink
            href="https://github.com/projectarkadiateam/trigedasleng"
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              textDecoration: 'none',
              color: 'text.secondary',
              '&:hover': { color: 'primary.main' },
            }}
          >
            Github
          </MuiLink>
          <Typography component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
            |
          </Typography>
          <MuiLink
            href="https://www.buymeacoffee.com/skroell"
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              textDecoration: 'none',
              color: 'text.secondary',
              '&:hover': { color: 'primary.main' },
            }}
          >
            Buy me a coffee
          </MuiLink>
        </Box>
      </Container>
    </Box>
  );
}
