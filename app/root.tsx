import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "react-router";

import type { Route } from "./+types/root";
import "./styles/sass/app.scss";
import Header from "./components/Header/Header";
import Sidebar from "./components/Sidebar/Sidebar";
import Footer from "./components/Footer/Footer";
import { prisma } from "./db.server";
import { getSession } from "./sessions";
import { ThemeProvider } from "./ThemeProvider";
import type { ColorMode } from "./theme";
import { MobileDrawerProvider } from "./contexts/MobileDrawerContext";
import { Box } from "@mui/material";
import { pageMeta, originFromMatches } from "./seo";
import { resolveOrigin } from "./seo.server";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  { rel: "manifest", href: "/manifest.webmanifest" },
  { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
  { rel: "apple-touch-icon", href: "/img/ios180x180.png" },
];

// Registers the service worker after load, production-only. Inlined so it runs
// before hydration without an extra request.
const SW_REGISTER = `
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js').catch(function () {});
  });
}`;

export async function loader({ request }: Route.LoaderArgs) {
  const cookieHeader = request.headers.get("Cookie") || "";
  const colorModeMatch = cookieHeader.match(/(?:^|;\s*)color-mode=(light|dark)/);
  const colorMode = colorModeMatch ? (colorModeMatch[1] as ColorMode) : null;

  const session = await getSession(cookieHeader);
  const userId = session.get("userId");
  let user = null;
  
  if (userId) {
    user = await prisma.user.findUnique({
      where: { id: userId },
      include: { group: true }
    });
  }

  // The header search index is fetched on demand (Header → /offline-data.json)
  // rather than inlined into every page, keeping each document small.
  return {
      user,
      colorMode,
      siteUrl: resolveOrigin(request),
  };
}

export function meta({ matches }: Route.MetaArgs) {
  // Site-wide defaults; content routes override with their own meta().
  return pageMeta({ origin: originFromMatches(matches) });
}

// Skip re-running the root loader on plain client navigations so the app keeps
// working offline (its data — user + the search dictionary — is stable for the
// session). Still revalidate after mutations like login/logout so auth is fresh.
export function shouldRevalidate({ formMethod }: { formMethod?: string }) {
  return formMethod != null && formMethod.toUpperCase() !== "GET";
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#f6f6f7" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Trigedasleng" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
        {import.meta.env.PROD && (
          <script dangerouslySetInnerHTML={{ __html: SW_REGISTER }} />
        )}
      </body>
    </html>
  );
}

export default function App() {
  const { user, colorMode } = useLoaderData<typeof loader>();
  const isAdmin = user?.group?.admin || false;

  return (
    <ThemeProvider initialMode={colorMode ?? "light"} explicit={colorMode != null}>
      <MobileDrawerProvider>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Header userIsLoggedIn={!!user} />
          <Box sx={{ display: 'flex', flex: 1, mt: '64px' }}>
            <Sidebar 
                user={user} 
                isLoggedIn={!!user} 
                isAdmin={isAdmin} 
            />
            <Box
              component="main"
              sx={{
                flexGrow: 1,
                p: { xs: 2, sm: 3 },
                width: { md: `calc(100% - 280px)` },
                backgroundColor: 'background.default',
                minHeight: 'calc(100vh - 64px)',
                maxWidth: '100%',
              }}
            >
              <Outlet />
            </Box>
          </Box>
          <Footer />
        </Box>
      </MobileDrawerProvider>
    </ThemeProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
