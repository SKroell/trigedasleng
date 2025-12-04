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
import { MobileDrawerProvider } from "./contexts/MobileDrawerContext";
import { Box } from "@mui/material";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
];

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  const userId = session.get("userId");
  let user = null;
  
  if (userId) {
    user = await prisma.user.findUnique({
      where: { id: userId },
      include: { group: true }
    });
  }

  // Fetch dictionary and translations for search autocomplete
  // In a real production app at scale, we might want to optimize this 
  // (e.g. not fetch ALL words, or cache heavily), but for "exact behavior"
  // matching the old app which fetched everything on mount, we do this.
  const dictionary = await prisma.word.findMany({
      select: { id: true, value: true, pronunciation: true }
  });
  
  const translations = await prisma.translation.findMany({
      include: { wordSource: true, wordTarget: true },
      take: 1000 // Limit to prevent blowing up payload too much if DB grows huge
  });

  const formattedTranslations = translations.map(t => ({
      ...t,
      trigedasleng: t.wordSource.value,
      english: t.wordTarget.value
  }));

  return { 
      user, 
      dictionary, 
      translations: formattedTranslations 
  };
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const { user, dictionary, translations } = useLoaderData<typeof loader>();
  const isAdmin = user?.group?.admin || false;

  return (
    <ThemeProvider>
      <MobileDrawerProvider>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Header 
              userIsLoggedIn={!!user} 
              dictionary={dictionary} 
              translations={translations} 
          />
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
