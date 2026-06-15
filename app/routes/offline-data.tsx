/*
 * Resource route: /offline-data.json
 *
 * Serves the full offline dataset (every non-English word, every sentence, and
 * the source list) as one cacheable JSON document. The service worker precaches
 * this so the dictionary works offline even for records the user never opened;
 * the client clientLoaders (see app/offline-data.client.ts) render from it when
 * the network/DB is unavailable.
 *
 * The mappings below intentionally mirror the server loaders of dictionary.tsx,
 * translations.tsx and translation.$id.tsx so offline content matches online.
 */
import { prisma } from "../db.server";

export async function loader() {
  const words = await prisma.word.findMany({
    where: { dictionary: { value: { not: "English" } } },
    include: {
      dictionary: true,
      classifications: { include: { classification: true } },
      translationsFrom: {
        include: { wordTarget: { include: { dictionary: true } } },
      },
    },
    orderBy: { value: "asc" },
  });

  const mappedWords = words.map((w) => {
    const englishTranslations = w.translationsFrom
      .filter((t) => t.wordTarget.dictionary.value === "English")
      .map((t) => t.wordTarget.value);
    const classifications = w.classifications.map((c) => c.classification.value);
    const classification = classifications.length > 0 ? classifications[0] : "";
    const translation = classification
      ? `${classification}: ${englishTranslations.join(", ")}`
      : englishTranslations.join(", ");
    const firstTranslation = w.translationsFrom.filter(
      (t) => t.wordTarget.dictionary.value === "English",
    )[0];
    const etymology =
      firstTranslation?.etymology && firstTranslation.etymology !== "unknown"
        ? firstTranslation.etymology
        : "";

    return {
      id: w.id,
      word: w.value,
      pronunciation: w.pronunciation,
      translation,
      etymology,
      filter: w.dictionary.value + " " + classifications.join(" ").toLowerCase(),
      dictionary: w.dictionary.value,
    };
  });

  const sentencesRaw = await prisma.sentence.findMany({
    include: {
      episodes: { include: { episode: true } },
      source: true,
    },
  });

  const sentences = sentencesRaw.map((s) => {
    const ep = s.episodes[0]?.episode;
    const episode = ep
      ? ep.seasonNumber.toString().padStart(2, "0") +
        ep.seriesNumber.toString().padStart(2, "0")
      : "other";
    return {
      id: s.id,
      trigedasleng: s.value,
      translation: s.english,
      etymology: s.etymology || "",
      leipzig: s.leipzigGlossing || "",
      audio: s.audio || "",
      episode,
      sourceTitle: s.source?.title || "",
      sourceUrl: s.source?.url || "",
    };
  });

  const sourcesRaw = await prisma.source.findMany({ orderBy: { date: "desc" } });
  const sources = sourcesRaw.map((s) => ({
    title: s.title,
    author: s.author,
    url: s.url,
    date: s.date ? s.date.toISOString().split("T")[0] : "",
  }));

  return Response.json(
    { version: 1, words: mappedWords, sentences, sources },
    { headers: { "Cache-Control": "public, max-age=3600" } },
  );
}
