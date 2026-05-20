import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://scclxzppjhmznnyvfsdv.supabase.co"; //import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = "sb_publishable_GVkXjWkNi-yZTN-FSzytXQ_9tXTcoyn"; // import.meta.env.VITE_SUPABASE_ANON_KEY as string;
export const DB_TABLE_NAME = "languageData"; // import.meta.env.VITE_DB_TABLE_NAME as string ?? "";

export const DB_CLIENT = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const MAX_STREAK_FREEZES = 3;

export const TODAY_DATE = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"

export const NUM_EXERCISES_PER_LESSON = 10;



//////////////////////////////////////////////////
// TYPES
//////////////////////////////////////////////////

export type ItemType = "word" | "phrase" | "sentence";

export const ExerciseResult = {
  CORRECT: "correct",
  FAILED: "failed",
  SKIPPED: "skipped"
} as const;
// Create a type from the object values
export type ExerciseResult = typeof ExerciseResult[keyof typeof ExerciseResult];
export const ExerciseResultID = {
  [ExerciseResult.CORRECT]: "correct",
  [ExerciseResult.FAILED]: "failed",
  [ExerciseResult.SKIPPED]: "skipped"
};

export interface RawItem {
  id: number;
  "l-EN": string;
  "l-TR": string;
  type: ItemType;
}

export class LanguageItemData {
  private raw: RawItem;
  constructor(raw: RawItem) {
    this.raw = raw;
  }
  getType(): ItemType { return this.raw.type; }
  getLanguageEN(): string { return this.raw["l-EN"]; }
  getLanguageTR(): string { return this.raw["l-TR"]; }
  getTranslation(str: string): string { return str === this.getLanguageEN() ? this.getLanguageTR() : this.getLanguageEN(); }
}



//////////////////////////////////////////////////
// UTIL FUNCTIONS
//////////////////////////////////////////////////

export function normalizeTurkish(s: string): string {
  return s
    .replace(/ğ/g, "g").replace(/Ğ/g, "G")
    .replace(/ü/g, "u").replace(/Ü/g, "U")
    .replace(/ş/g, "s").replace(/Ş/g, "S")
    .replace(/ı/g, "i").replace(/İ/g, "I")
    .replace(/ö/g, "o").replace(/Ö/g, "O")
    .replace(/ç/g, "c").replace(/Ç/g, "C");
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function randomItem(data: LanguageItemData[]): LanguageItemData {
  return data[Math.floor(Math.random() * data.length)];
}

export function randomSentence(data: LanguageItemData[]): LanguageItemData {
  const sentences = data.filter((i) => i.getType() === "sentence");
  return randomItem(sentences.length > 0 ? sentences : data);
}

export function levenshtein(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

export function pickRandomMessage<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

// Choose which end-of-lesson message to display based on number of failed and skipped exercises.
export function getEndMessage(
  messages: any,
  failed: number,
  skipped: number,
  total: number
): string {
  const ratioMistake = failed / total;
  const ratioSkip = skipped / total;

  if (ratioSkip >= 0.5) return pickRandomMessage(messages.skipped_most);
  if (ratioSkip >= 0.2) return pickRandomMessage(messages.skipped_some);
  if (ratioMistake === 0) return pickRandomMessage(messages.lesson_perfect);
  if (ratioMistake <= 0.1) return pickRandomMessage(messages.lesson_excellent);
  if (ratioMistake <= 0.3) return pickRandomMessage(messages.lesson_great);
  if (ratioMistake <= 0.5) return pickRandomMessage(messages.lesson_okay);
  if (ratioMistake <= 0.7) return pickRandomMessage(messages.lesson_poor);
  else return pickRandomMessage(messages.lesson_terrible);
}



//////////////////////////////////////////////////
// STREAK FUNCTIONS
//////////////////////////////////////////////////

export function updateStreak(): boolean {
  if (getStreakDate() === TODAY_DATE)
    return false;
  const streakNum = getStreak() + 1;
  setStreak(streakNum);
  setStreakDate(TODAY_DATE);
  setStreakFreezed(false);
  return true;
}

export function setStreak(num: number): void {
  localStorage.setItem("streakNum", String(num));
}

export function setStreakDate(date: string): void {
  localStorage.setItem("streakLastDate", date);
}

export function getStreak(): number {
  return parseInt(localStorage.getItem("streakNum") ?? "0") || 0;
}

export function getStreakDate(): string | null {
  return localStorage.getItem("streakLastDate");
}

export function resetStreak(): void {
  localStorage.setItem("streakNum", "0");
  localStorage.removeItem("streakLastDate");
}

export function getNumFreezes(): number {
  return parseInt(localStorage.getItem("streakFreezes") ?? "0") || 0;
}

export function increaseStreakFreezes(): void {
  const curr = getNumFreezes();
  if (curr < MAX_STREAK_FREEZES)
    localStorage.setItem("streakFreezes", String(curr + 1));
}

export function decreaseStreakFreezes(): void {
  const curr = getNumFreezes();
  if (curr > 0)
    localStorage.setItem("streakFreezes", String(curr - 1));
}

export function isStreakFreezed(): boolean {
  return sessionStorage.getItem("freezed") === "true";
}

export function setStreakFreezed(freezed: boolean): void {
  sessionStorage.setItem("freezed", String(freezed));
  document.querySelectorAll(".fire-icon").forEach(element => {
    if (freezed)
      element.classList.add("fire-freezed");
    else
      element.classList.remove("fire-freezed");
  });
}

export function useStreakFreeze(): void {
  setStreakFreezed(true);
  decreaseStreakFreezes();
}

export function initStreak(): { streakNum: number; wasFreezed: boolean } {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];
  const lastDate = getStreakDate();

  if (lastDate === null) {
    resetStreak();
  } else if (lastDate < yesterdayStr) {
    if (getNumFreezes() > 0)
      useStreakFreeze();
    else if (!isStreakFreezed())
      resetStreak();
  }

  return { streakNum: getStreak(), wasFreezed: isStreakFreezed() };
}
