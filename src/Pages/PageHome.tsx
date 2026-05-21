import '../style/PageHome.css'

import { useState, useEffect, useCallback, useMemo } from "react";
import { DB_CLIENT, DB_TABLE_NAME, getStreak, increaseStreakFreezes, LanguageItemData, NUM_EXERCISES_PER_LESSON, updateStreak, initStreak } from "../globals.tsx";
import type { RawItem } from "../globals.tsx";
import { ExerciseResult } from "../globals.tsx";
import { useToast } from "../Elements/Toast.tsx";

import ExerciseTranslation from '../Exercises/ExerciseTranslation.tsx';
import ExerciseMatchPairs from '../Exercises/ExerciseMatchPairs.tsx';
import ExerciseMatchTranslation from '../Exercises/ExerciseMatchTranslation.tsx';
import ExerciseFillBlanks from '../Exercises/ExerciseFillBlanks.tsx';
import ExerciseReorderSentence from '../Exercises/ExerciseReorderSentence.tsx';
import ButtonNext from '../Elements/ButtonNext.tsx';
import ButtonSkip from '../Elements/ButtonSkip.tsx';
import ProgressBar from '../Elements/ProgressBar.tsx';
import EndOfLesson from '../Elements/EndOfLesson.tsx';

interface PropsPageHome {
  setStreakTitle: any;
}

export default function PageHome({ setStreakTitle }: PropsPageHome) {
  const toast = useToast();
  const [data, setData] = useState<LanguageItemData[]>();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [result, setResult] = useState<ExerciseResult | null>(null);
  const [skipped, setSkipped] = useState<boolean>(false);
  const [progress, setProgress] = useState<ExerciseResult | null>(null);
  const [exerciseNum, setExerciseNum] = useState<number>(0);
  const [numExercisesCorrect, setNumExercisesCorrect] = useState<number>(0);
  const [numExercisesSkipped, setNumExercisesSkipped] = useState<number>(0);
  const [lessonEnded, setLessonEnded] = useState<boolean>(false);

  // ── Exercise selection ───────────────────────────────────────────────────
  const exercises = [
    ExerciseTranslation,
    ExerciseMatchPairs,
    // ExerciseMatchTranslation,
    // ExerciseFillBlanks,
    // ExerciseReorderSentence
  ];

  // Pick once when the component mounts, re-pick when exerciseNum changes
  const ExerciseComponent = useMemo(() => {
    return exercises[Math.floor(Math.random() * exercises.length)];
  }, [exerciseNum]);

  // ── Data loading ──────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setStreakTitle(getStreak());
    setLoading(true);
    setLoadError(null);
    try {
      const res = await DB_CLIENT.from(DB_TABLE_NAME).select("*");
      if (res.status !== 200)
        throw new Error(res.error?.message ?? "DB error");
      setData((res.data as RawItem[]).map((r) => new LanguageItemData(r)));
    } catch (err) {
      setLoadError(String(err));
    } finally {
      setLoading(false);
    }
  }, [DB_CLIENT]);

  useEffect(() => {
    const { streakNum, wasFreezed } = initStreak();
    if (wasFreezed)
      toast(`Your streak is frozen!`, "noicon");
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (exerciseNum === NUM_EXERCISES_PER_LESSON) {
      if (numExercisesCorrect / NUM_EXERCISES_PER_LESSON >= 0.7) {
        increaseStreakFreezes();
      }
      if (numExercisesSkipped < NUM_EXERCISES_PER_LESSON) {
        const updated = updateStreak();
        if (updated) {
          const newStreakNum = getStreak();
          setStreakTitle(newStreakNum);
          toast(`You increased your streak to 🔥${newStreakNum} days!`, "noicon");
        }
      }
      setLessonEnded(true);
    }
  }, [exerciseNum]);

  useEffect(() => {
    if (lessonEnded === false) {
      setExerciseNum(0);
      setNumExercisesCorrect(0);
      setNumExercisesSkipped(0);
      setLessonEnded(false);
    }
  }, [lessonEnded]);


  function skipExercise() {
    setSkipped(true);
    setNumExercisesSkipped((k) => k + 1);
    setResult(ExerciseResult.SKIPPED);
  }

  function nextExercise() {
    setSkipped(false);
    setProgress(result);
    setResult(null);
    setExerciseNum((k) => k + 1);
    if (result === ExerciseResult.CORRECT)
      setNumExercisesCorrect((k) => k + 1);
  }

  if (loadError) {
    return (
      <>
        <p className="p-error">{loadError}</p>
      </>
    );
  }
  else if (loading) {
    return (
      <>
        <p className="p-loading">Loading...</p>
      </>
    );
  }
  else if (lessonEnded) {
    return (
      <>
        <main>
          <div className="app">
            <EndOfLesson numExercisesCorrect={numExercisesCorrect} numExercisesSkipped={numExercisesSkipped} onDone={setLessonEnded} />
          </div>
        </main>
      </>
    );
  }
  else {
    return (
      <>
        <main>
          <div className="app">
            {data?.length > 0 && <ExerciseComponent key={exerciseNum} inputData={data} onCheck={setResult} skipped={skipped} />}

            {result !== null && <ButtonNext status={result} onNext={nextExercise} />}
          </div>
        </main>

        <div id="bottom-menu-container">
          <div id="progress-and-skip-container">
            <ProgressBar exerciseNum={exerciseNum} status={progress} />
            <ButtonSkip enabled={result === null} onSkip={skipExercise} />
          </div>
        </div>
      </>
    );
  }
}
