import { useEffect, useRef, useState } from "react";
import {
  Container,
  Typography,
  Box,
  TextField,
  IconButton,
  Paper,
  Stack,
  Chip,
  Switch,
  FormControlLabel,
  CircularProgress,
  Alert,
  Button,
  Collapse,
  Link as MuiLink,
  ThemeProvider,
  createTheme,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import AllInclusiveIcon from "@mui/icons-material/AllInclusive";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { Link } from "react-router";
import { keyframes } from "@emotion/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { episodeList } from "../data";

export function meta() {
  return [
    { title: "A.L.I.E. — Trigedasleng" },
    { name: "description", content: "A.L.I.E. — a grounded Trigedasleng translator and language guide." },
  ];
}

// A.L.I.E.: City-of-Light aesthetic — near-black, crimson (her red dress), the
// infinity key as her mark. Scoped to this page via a nested ThemeProvider so the
// rest of the site keeps its light theme.
const alieTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#ff1f3d", light: "#ff5d72", dark: "#c2001f", contrastText: "#ffffff" },
    secondary: { main: "#ff6b6b" },
    background: { default: "#08080c", paper: "#14141d" },
    text: { primary: "#ececf1", secondary: "#9292a3" },
    divider: "rgba(255,31,61,0.22)",
    success: { main: "#36d399" },
    warning: { main: "#fbbf24" },
    info: { main: "#60a5fa" },
  },
  shape: { borderRadius: 8 },
});

const pulse = keyframes`
  0%, 100% { opacity: 0.85; filter: drop-shadow(0 0 6px rgba(255,31,61,0.55)); }
  50%      { opacity: 1;    filter: drop-shadow(0 0 18px rgba(255,31,61,0.95)); }
`;

type Source = {
  doc_id: string;
  type: "dictionary" | "translation" | "grammar";
  status: string;
  score: number;
  text: string;
  word?: string | null;
  trigedasleng?: string | null;
  english?: string | null;
  episodes?: string[] | null;
  audio?: string | null;
  section?: string | null;
};

type Message = {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  error?: boolean;
};

const STATUS_COLOR: Record<string, "success" | "warning" | "info" | "default"> = {
  canon: "success",
  noncanon: "warning",
  slakkru: "info",
  uncited: "default",
};

function StatusChip({ status }: { status: string }) {
  return (
    <Chip size="small" label={status} color={STATUS_COLOR[status] ?? "default"} variant="outlined" />
  );
}

const anchorId = (docId: string) => "src-" + docId.replace(/:/g, "-");

// The model cites sources inline as [dict:…], [trans:…, episode 0201], [gram:…].
// Turn those into in-page links that scroll to the matching source card below.
const CITE_RE = /\[((?:dict|trans|gram):[0-9a-f]{6,12})([^\]]*)\]/g;
function linkifyCitations(text: string): string {
  return text.replace(
    CITE_RE,
    (_full, id: string, rest: string) => `[\\[${id}${rest}\\]](#${anchorId(id)})`
  );
}

function MarkdownLink({ href, children }: any) {
  if (typeof href === "string" && href.startsWith("#src-")) {
    return (
      <MuiLink
        href={href}
        onClick={(e) => {
          e.preventDefault();
          const id = href.slice(1);
          const highlight = () => {
            const el = document.getElementById(id);
            if (!el) return;
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            const prev = el.style.boxShadow;
            el.style.transition = "box-shadow 0.3s";
            el.style.boxShadow = "0 0 0 2px rgba(255,31,61,0.75)";
            setTimeout(() => {
              el.style.boxShadow = prev;
            }, 1200);
          };
          if (document.getElementById(id)) {
            highlight();
          } else {
            // sources are collapsed — reveal the owning panel, then scroll
            window.dispatchEvent(new CustomEvent("alie-reveal-sources", { detail: id }));
            setTimeout(highlight, 140);
          }
        }}
        sx={{ cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap" }}
      >
        {children}
      </MuiLink>
    );
  }
  return (
    <MuiLink href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </MuiLink>
  );
}

const MD_SX = {
  color: "text.primary",
  "& > :first-of-type": { mt: 0 },
  "& > :last-child": { mb: 0 },
  "& p": { my: 1, lineHeight: 1.6 },
  "& ul, & ol": { my: 1, pl: 3 },
  "& li": { mb: 0.5 },
  "& a": { color: "primary.light" },
  "& code": {
    px: 0.5,
    py: "1px",
    borderRadius: 0.5,
    bgcolor: "rgba(255,255,255,0.08)",
    fontFamily: "monospace",
    fontSize: "0.85em",
  },
  "& pre": {
    p: 1.5,
    my: 1,
    borderRadius: 1,
    bgcolor: "rgba(255,255,255,0.06)",
    overflowX: "auto",
  },
  "& pre code": { bgcolor: "transparent", p: 0, fontSize: "0.85em" },
  "& blockquote": {
    borderLeft: "3px solid",
    borderColor: "primary.main",
    pl: 1.5,
    ml: 0,
    my: 1,
    color: "text.secondary",
  },
  "& table": {
    borderCollapse: "collapse",
    my: 1,
    display: "block",
    width: "max-content",
    maxWidth: "100%",
    overflowX: "auto",
  },
  "& th, & td": { border: "1px solid", borderColor: "divider", px: 1, py: 0.5, textAlign: "left" },
  "& h1, & h2, & h3, & h4, & h5, & h6": {
    mt: 1.5,
    mb: 0.5,
    fontWeight: 600,
    lineHeight: 1.3,
    color: "text.primary",
    fontFamily: "inherit",
  },
  "& h1": { fontSize: "1.35rem" },
  "& h2": { fontSize: "1.2rem" },
  "& h3": { fontSize: "1.05rem" },
  "& hr": { border: 0, borderTop: "1px solid", borderColor: "divider", my: 1.5 },
};

function MessageContent({ text }: { text: string }) {
  return (
    <Box sx={MD_SX}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ a: MarkdownLink }}>
        {linkifyCitations(text)}
      </ReactMarkdown>
    </Box>
  );
}

function SourceCard({ s }: { s: Source }) {
  const audioSrc = s.audio ? (s.audio.startsWith("/") ? s.audio : `/${s.audio}`) : "";
  return (
    <Paper
      id={anchorId(s.doc_id)}
      variant="outlined"
      sx={{ p: 1.5, mb: 1, bgcolor: "background.default", borderColor: "divider", scrollMarginTop: 80 }}
    >
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5, flexWrap: "wrap" }}>
        <Chip size="small" label={s.type} variant="outlined" />
        <StatusChip status={s.status} />
        {s.episodes?.map((code) => (
          <Chip key={code} size="small" variant="outlined" label={episodeList[code] ?? `Episode ${code}`} />
        ))}
        <Typography variant="caption" color="text.secondary" sx={{ ml: "auto", fontFamily: "monospace" }}>
          {s.doc_id}
        </Typography>
      </Stack>

      {s.type === "dictionary" && s.word ? (
        <Typography variant="body2">
          <MuiLink component={Link} to={`/word/${encodeURIComponent(s.word)}`}>
            {s.word}
          </MuiLink>{" "}
          — {s.text.replace(/^\S+\s*/, "")}
        </Typography>
      ) : (
        <Typography variant="body2" component="pre" sx={{ whiteSpace: "pre-wrap", m: 0, fontFamily: "inherit" }}>
          {s.text}
        </Typography>
      )}

      {audioSrc && (
        <Box sx={{ mt: 1 }}>
          <audio controls preload="none" style={{ width: "100%", height: 32 }}>
            <source src={audioSrc} type="audio/mpeg" />
          </audio>
        </Box>
      )}
    </Paper>
  );
}

function MessageSources({ sources }: { sources: Source[] }) {
  const [open, setOpen] = useState(false);

  // Clicking an inline citation when sources are collapsed reveals the owning panel.
  useEffect(() => {
    const reveal = (e: Event) => {
      const id = (e as CustomEvent).detail as string;
      if (sources.some((s) => anchorId(s.doc_id) === id)) setOpen(true);
    };
    window.addEventListener("alie-reveal-sources", reveal);
    return () => window.removeEventListener("alie-reveal-sources", reveal);
  }, [sources]);

  return (
    <Box sx={{ mt: 1 }}>
      <Button
        size="small"
        onClick={() => setOpen((v) => !v)}
        endIcon={open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        sx={{
          textTransform: "none",
          letterSpacing: "0.04em",
          color: "text.secondary",
          px: 1,
          "&:hover": { color: "primary.light", bgcolor: "transparent" },
        }}
      >
        {open ? "Hide sources" : `View ${sources.length} source${sources.length === 1 ? "" : "s"}`}
      </Button>
      <Collapse in={open} unmountOnExit>
        <Box sx={{ mt: 1 }}>
          {sources.map((s) => (
            <SourceCard key={s.doc_id} s={s} />
          ))}
        </Box>
      </Collapse>
    </Box>
  );
}

const EXAMPLES = [
  "How do you say 'my fight is over'?",
  "What does 'gonplei' mean?",
  "Translate: blood must have blood",
  "How is 'natblida' pronounced?",
];

export default function Assistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [canonOnly, setCanonOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const scrollToEnd = () =>
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 50);

  async function send() {
    const message = input.trim();
    if (!message || loading) return;

    const history = messages
      .filter((m) => !m.error)
      .map((m) => ({ role: m.role, content: m.content }));

    const next: Message[] = [...messages, { role: "user", content: message }];
    setMessages(next);
    setInput("");
    setLoading(true);
    scrollToEnd();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, canon_only: canonOnly, history }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessages([
          ...next,
          {
            role: "assistant",
            content: data.hint ? `${data.error}. ${data.hint}` : data.error || "Something went wrong.",
            error: true,
          },
        ]);
      } else {
        setMessages([...next, { role: "assistant", content: data.answer, sources: data.sources }]);
      }
    } catch (e: any) {
      setMessages([
        ...next,
        { role: "assistant", content: `Request failed: ${e?.message ?? e}`, error: true },
      ]);
    } finally {
      setLoading(false);
      scrollToEnd();
    }
  }

  return (
    <ThemeProvider theme={alieTheme}>
      <Box sx={{ py: { xs: 2, sm: 3 }, px: { xs: 1, sm: 2 } }}>
        <Container maxWidth="md" disableGutters>
          <Box
            sx={{
              bgcolor: "background.default",
              color: "text.primary",
              borderRadius: { xs: 3, sm: 4 },
              border: "1px solid",
              borderColor: "divider",
              boxShadow: "0 12px 48px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,31,61,0.10)",
              p: { xs: 1.75, sm: 3 },
              overflow: "hidden",
              backgroundImage:
                "radial-gradient(900px 320px at 50% -10%, rgba(255,31,61,0.12), transparent 70%)",
            }}
          >
          {/* Header */}
          <Stack direction="row" spacing={{ xs: 1.5, sm: 2 }} alignItems="center" sx={{ mb: 1.5 }}>
            <AllInclusiveIcon
              sx={{
                fontSize: { xs: 36, sm: 46 },
                color: "primary.main",
                flexShrink: 0,
                animation: `${pulse} 3.2s ease-in-out infinite`,
              }}
            />
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="h3"
                component="h1"
                sx={{
                  color: "text.primary",
                  fontWeight: 700,
                  letterSpacing: { xs: "0.16em", sm: "0.22em" },
                  lineHeight: 1,
                  fontSize: { xs: "1.6rem", sm: "2rem" },
                }}
              >
                A.L.I.E.
              </Typography>
              <Typography
                variant="caption"
                component="div"
                sx={{
                  color: "text.secondary",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  fontSize: { xs: "0.58rem", sm: "0.7rem" },
                  lineHeight: 1.4,
                  mt: 0.25,
                }}
              >
                Applied Lucent Intelligence Emulator · Trigedasleng
              </Typography>
            </Box>
          </Stack>

          <Typography variant="body2" sx={{ color: "text.secondary", mb: 2, maxWidth: 640 }}>
            I translate between English and Trigedasleng, grounded only in the attested corpus —
            the dictionary, the recorded sentences, and the reference grammar. I do not invent
            words. Where there is no attested form, I will tell you.
          </Typography>

          <FormControlLabel
            control={<Switch checked={canonOnly} onChange={(e) => setCanonOnly(e.target.checked)} color="primary" />}
            label={
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Canon only — screen-attested sources
              </Typography>
            }
            sx={{ mb: 2 }}
          />

          {/* Thread */}
          <Paper
            variant="outlined"
            sx={{
              p: { xs: 1.25, sm: 2 },
              minHeight: 340,
              mb: 2,
              bgcolor: "background.paper",
              borderColor: "divider",
              position: "relative",
              overflow: "hidden",
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 2,
                background: "linear-gradient(90deg, transparent, #ff1f3d, transparent)",
                opacity: 0.55,
              },
            }}
          >
            {messages.length === 0 && (
              <Stack spacing={1} sx={{ color: "text.secondary" }}>
                <Typography variant="body2" sx={{ letterSpacing: "0.06em" }}>
                  State your query.
                </Typography>
                {EXAMPLES.map((ex) => (
                  <Chip
                    key={ex}
                    label={ex}
                    variant="outlined"
                    onClick={() => setInput(ex)}
                    sx={{
                      alignSelf: "flex-start",
                      cursor: "pointer",
                      borderColor: "divider",
                      "&:hover": { borderColor: "primary.main", color: "text.primary" },
                    }}
                  />
                ))}
              </Stack>
            )}

            {messages.map((m, i) => (
              <Box key={i} sx={{ mb: 2 }}>
                {m.role === "assistant" && !m.error && (
                  <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.5 }}>
                    <AllInclusiveIcon sx={{ fontSize: 16, color: "primary.main" }} />
                    <Typography variant="caption" sx={{ color: "primary.light", letterSpacing: "0.14em" }}>
                      A.L.I.E.
                    </Typography>
                  </Stack>
                )}
                <Box
                  sx={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}
                >
                  <Paper
                    elevation={0}
                    variant="outlined"
                    sx={{
                      px: 1.75,
                      py: m.role === "user" ? 1.25 : 0.25,
                      maxWidth: m.role === "user" ? "85%" : "94%",
                      minWidth: 0,
                      overflowWrap: "break-word",
                      bgcolor: m.role === "user" ? "primary.main" : "background.default",
                      color: m.role === "user" ? "primary.contrastText" : "text.primary",
                      borderColor: m.role === "user" ? "primary.main" : "divider",
                      borderLeft: m.role === "user" ? undefined : "2px solid",
                      borderLeftColor: m.role === "user" ? undefined : "primary.main",
                      borderRadius: 2,
                    }}
                  >
                    {m.error ? (
                      <Alert severity="warning" variant="outlined" sx={{ m: 0 }}>
                        {m.content}
                      </Alert>
                    ) : m.role === "user" ? (
                      <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                        {m.content}
                      </Typography>
                    ) : (
                      <MessageContent text={m.content} />
                    )}
                  </Paper>
                </Box>

                {m.sources && m.sources.length > 0 && (
                  <MessageSources sources={m.sources} />
                )}
              </Box>
            ))}

            {loading && (
              <Stack direction="row" spacing={1} alignItems="center" sx={{ p: 1, color: "text.secondary" }}>
                <CircularProgress size={16} color="primary" />
                <Typography variant="caption" sx={{ letterSpacing: "0.14em" }}>
                  Processing…
                </Typography>
              </Stack>
            )}
            <div ref={endRef} />
          </Paper>

          {/* Input */}
          <Stack direction="row" spacing={1}>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              placeholder="Enter your query…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              disabled={loading}
            />
            <IconButton color="primary" onClick={send} disabled={loading || !input.trim()}>
              <SendIcon />
            </IconButton>
          </Stack>
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
