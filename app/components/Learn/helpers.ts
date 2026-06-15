/* Shared helpers for the Learn modes. */

export interface LearnWord {
  id: string;
  word: string;
  pronunciation: string | null;
  translation: string; // English meaning(s), comma-joined
  classifications: string[];
}

export interface LearnSentence {
  id: string;
  trig: string;
  english: string;
  audio?: string;
}

/** Fisher–Yates shuffle (returns a new array). */
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function sample<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** n distinct random items, optionally excluding some. */
export function sampleDistinct<T>(
  arr: T[],
  n: number,
  exclude: (x: T) => boolean = () => false,
): T[] {
  return shuffle(arr.filter((x) => !exclude(x))).slice(0, n);
}

/** First English meaning only (before the first comma), for compact display. */
export function primaryMeaning(translation: string): string {
  return (translation.split(",")[0] || translation).trim();
}

/** Resolve a DB audio path to a public URL (mirrors components/Translation.tsx). */
export function audioSrc(audio: string): string {
  return (audio.startsWith("/") ? "" : "/") + audio;
}

export const WORD_CLASSES = [
  "all",
  "noun",
  "pronoun",
  "verb",
  "adverb",
  "adjective",
  "conjunction",
  "preposition",
  "interjection",
  "auxiliary",
] as const;
