import { type LoaderFunctionArgs } from "react-router";
import { Form, useLoaderData, useSearchParams } from "react-router";
import { prisma } from "../db.server";
import Word from "../components/Word";
import Translation from "../components/Translation";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q");

  if (!query || query.length < 2) {
    return { results: [], query: null };
  }

  // Search words
  const words = await prisma.word.findMany({
    where: {
      value: { contains: query }
    },
    include: { dictionary: true },
    take: 20
  });

  // Search translations/sentences
  const sentences = await prisma.sentence.findMany({
    where: {
        OR: [
            { value: { contains: query } },
            { english: { contains: query } }
        ]
    },
    include: { episodes: { include: { episode: true } } },
    take: 20
  });

  // Map to props
  const mappedWords = await Promise.all(words.map(async w => {
        const defs = await prisma.translation.findMany({
            where: { wordSourceId: w.id },
            include: { wordTarget: true }
        });
        const defString = defs.map(d => d.wordTarget.value).join("; ");
        
        return {
            id: w.id,
            word: w.value,
            translation: defString,
            etymology: "",
            filter: w.dictionary.value.toLowerCase(),
        };
  }));

  const mappedSentences = sentences.map(s => ({
      id: s.id,
      trigedasleng: s.value,
      translation: s.english,
      etymology: s.etymology || "",
      leipzig: s.leipzigGlossing || "",
      audio: s.audio || ""
  }));

  return { words: mappedWords, translations: mappedSentences, query };
}

export default function Search() {
  const { words, translations, query } = useLoaderData<typeof loader>();

  return (
    <div className="content">
        <div id="inner">
            <h1>Search Results for "{query}"</h1>
            
            {words.length > 0 && (
                <>
                    <h2>Dictionary Words</h2>
                    {words.map((w: any) => <Word key={w.id} word={w} />)}
                </>
            )}

            {translations.length > 0 && (
                <>
                    <h2>Translations</h2>
                    {translations.map((t: any) => <Translation key={t.id} translation={t} />)}
                </>
            )}

            {words.length === 0 && translations.length === 0 && (
                <p>No results found.</p>
            )}
        </div>
    </div>
  );
}
