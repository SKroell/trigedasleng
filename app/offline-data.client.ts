/*
 * Client-only access to the precached offline dataset (/offline-data.json).
 *
 * The `.client.ts` suffix keeps this out of the server bundle. The route
 * clientLoaders call these helpers when the network/DB is unavailable so the
 * dictionary, translations, search and detail pages render fully offline.
 *
 * Each accessor returns data in exactly the shape the matching route component
 * already expects, so the offline path is a drop-in for the server loader.
 */

export interface OfflineWord {
  id: string;
  word: string;
  pronunciation: string | null;
  translation: string;
  etymology: string;
  filter: string;
  dictionary: string;
}

export interface OfflineSentence {
  id: string;
  trigedasleng: string;
  translation: string;
  etymology: string;
  leipzig: string;
  audio: string;
  episode: string;
  sourceTitle: string;
  sourceUrl: string;
}

export interface OfflineSource {
  title: string;
  author: string;
  url: string;
  date: string;
}

export interface OfflineDataset {
  version: number;
  words: OfflineWord[];
  sentences: OfflineSentence[];
  sources: OfflineSource[];
}

let datasetPromise: Promise<OfflineDataset> | null = null;

/** Fetch + memoize the dataset. Served from the SW cache when offline. */
export function loadDataset(): Promise<OfflineDataset> {
  if (!datasetPromise) {
    datasetPromise = fetch("/offline-data.json")
      .then((res) => {
        if (!res.ok) throw new Error("offline dataset unavailable");
        return res.json() as Promise<OfflineDataset>;
      })
      .catch((err) => {
        datasetPromise = null; // allow a later retry once back online
        throw err;
      });
  }
  return datasetPromise;
}

/** True when we should skip the server and go straight to the dataset. */
export function isOffline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

/**
 * Standard clientLoader behaviour for DB-backed routes:
 *   - online  → defer to the server loader (normal SSR data path)
 *   - offline → build the same shape from the precached dataset
 * A thrown Response (e.g. a 404) is a real result and is re-raised, not masked.
 */
export async function clientLoaderWithFallback<T>(
  serverLoader: () => Promise<T>,
  offline: (ds: OfflineDataset) => T | Promise<T>,
): Promise<T> {
  if (!isOffline()) {
    try {
      return await serverLoader();
    } catch (err) {
      if (err instanceof Response) throw err;
      // network failure → fall through to the offline dataset
    }
  }
  const ds = await loadDataset();
  return offline(ds);
}

function dictionaryValuesFor(dictParam?: string): string[] | null {
  switch ((dictParam || "").toLowerCase()) {
    case "canon":
      return ["Trigedasleng"];
    case "slakkru":
    case "slakgedasleng":
      return ["Slakgedasleng"];
    case "noncanon":
      return ["Noncanon Trigedasleng", "Slakgedasleng"];
    default:
      return null; // full dictionary (all non-English words)
  }
}

export function dictionaryWords(ds: OfflineDataset, dictParam?: string): OfflineWord[] {
  const allowed = dictionaryValuesFor(dictParam);
  if (!allowed) return ds.words;
  return ds.words.filter((w) => allowed.includes(w.dictionary));
}

export function wordByValue(ds: OfflineDataset, value: string): OfflineWord[] {
  return ds.words.filter((w) => w.word === value);
}

export function examplesForWord(ds: OfflineDataset, value: string, max = 3) {
  return ds.sentences.filter((s) => s.trigedasleng.includes(value)).slice(0, max);
}

export function sentenceById(ds: OfflineDataset, id: string): OfflineSentence | undefined {
  return ds.sentences.find((s) => s.id === id);
}

export function searchDataset(ds: OfflineDataset, query: string) {
  // Case-insensitive to match the server (sqlite LIKE).
  const q = query.toLowerCase();
  const words = ds.words
    .filter((w) => w.word.toLowerCase().includes(q))
    .slice(0, 20);
  const translations = ds.sentences
    .filter(
      (s) =>
        s.trigedasleng.toLowerCase().includes(q) ||
        s.translation.toLowerCase().includes(q),
    )
    .slice(0, 20);
  return { words, translations };
}

export function homeData(ds: OfflineDataset) {
  const recent = ds.words.slice(0, 10).map((w) => ({ value: w.word }));
  const word = ds.words.length
    ? ds.words[Math.floor(Math.random() * ds.words.length)]
    : null;
  const translation = ds.sentences.length
    ? ds.sentences[Math.floor(Math.random() * ds.sentences.length)]
    : null;
  return { recent, random: { word, translation } };
}
