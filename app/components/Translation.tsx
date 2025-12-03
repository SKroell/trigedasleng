import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Link as MuiLink,
  Box,
  Table,
  TableBody,
  TableRow,
  TableCell,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import slugify from "slugify";

export default function Translation({ translation }: { translation: any }) {
  const trigedasleng = translation.trigedasleng || translation.wordSource?.value || "";
  const english = translation.translation || translation.wordTarget?.value || "";
  const etymology = translation.etymology || "";
  const leipzig = translation.leipzigGlossing || translation.leipzig || "";
  const audio = translation.audio || "";
  const id = translation.id;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const words = trigedasleng.split(' ').filter(w => w.trim() !== '');
  const etymologyWords = etymology && etymology !== "unknown" ? etymology.split(' ').filter(w => w.trim() !== '') : [];
  const leipzigWords = leipzig ? leipzig.split(' ').filter(w => w.trim() !== '') : [];
  
  // Determine the maximum number of words to align columns
  const maxWords = Math.max(words.length, etymologyWords.length, leipzigWords.length);

  return (
    <Card
      sx={{
        mb: 2,
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: 4,
        },
      }}
    >
      <CardContent>
        <Box sx={{ mb: 2 }}>
          <Typography
            variant="h6"
            component="div"
            sx={{
              mb: 1,
              fontWeight: 600,
            }}
          >
            <MuiLink
              href={`/translation/${id}/${slugify(trigedasleng, { lower: true, strict: true })}`}
              sx={{
                textDecoration: 'none',
                color: 'primary.main',
                '&:hover': {
                  textDecoration: 'underline',
                },
              }}
            >
              {trigedasleng}
            </MuiLink>
          </Typography>

          {maxWords > 0 && (
            <Box
              sx={{
                overflowX: 'auto',
                mb: 1,
                width: 'fit-content',
              }}
            >
              <Table
                size="small"
                sx={{
                  width: 'auto',
                  borderSpacing: '0 4px',
                  borderCollapse: 'separate',
                  '& .MuiTableCell-root': {
                    border: 'none',
                    padding: '6px 12px',
                    textAlign: 'left',
                    whiteSpace: 'nowrap',
                  },
                }}
              >
                <TableBody>
                  {/* Trigedasleng row */}
                  <TableRow>
                    {Array.from({ length: maxWords }).map((_, index) => (
                      <TableCell
                        key={`trig-${index}`}
                        sx={{
                          backgroundColor: words[index] ? 'primary.light' : 'transparent',
                          color: words[index] ? 'primary.contrastText' : 'transparent',
                          borderRadius: 1,
                          fontSize: '0.875rem',
                          fontWeight: 500,
                        }}
                      >
                        {words[index] || ''}
                      </TableCell>
                    ))}
                  </TableRow>

                  {/* Etymology row */}
                  {etymologyWords.length > 0 && (
                    <TableRow>
                      {Array.from({ length: maxWords }).map((_, index) => (
                        <TableCell
                          key={`etym-${index}`}
                          sx={{
                            backgroundColor: etymologyWords[index] ? 'secondary.light' : 'transparent',
                            color: etymologyWords[index] ? 'secondary.contrastText' : 'transparent',
                            borderRadius: 1,
                            fontSize: '0.875rem',
                            fontStyle: 'italic',
                          }}
                        >
                          {etymologyWords[index] || ''}
                        </TableCell>
                      ))}
                    </TableRow>
                  )}

                  {/* Leipzig row */}
                  {leipzigWords.length > 0 && (
                    <TableRow>
                      {Array.from({ length: maxWords }).map((_, index) => (
                        <TableCell
                          key={`leipzig-${index}`}
                          sx={{
                            backgroundColor: leipzigWords[index] ? 'info.light' : 'transparent',
                            color: leipzigWords[index] ? 'info.contrastText' : 'transparent',
                            borderRadius: 1,
                            fontSize: '0.875rem',
                          }}
                        >
                          {leipzigWords[index] || ''}
                        </TableCell>
                      ))}
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>
          )}

          <Typography
            variant="body1"
            sx={{
              color: 'text.primary',
              mt: 1,
            }}
          >
            {english}
          </Typography>
        </Box>

        {audio && (
          <Box sx={{ mt: 2 }}>
            <audio controls preload="none" style={{ width: '100%' }}>
              <source src={(audio.startsWith('/') ? '' : '/') + audio} type="audio/mpeg" />
            </audio>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
