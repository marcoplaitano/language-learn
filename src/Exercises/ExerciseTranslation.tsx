import { useState, useRef, useEffect } from "react";
import { LanguageItemData, randomItem, normalizeTurkish, levenshtein, ExerciseResult } from "../globals";

interface PropsExerciseTranslation {
  inputData: LanguageItemData[];
  onCheck: (result: ExerciseResult) => void;
  skipped: boolean;
}

export default function ExerciseTranslation({ inputData, onCheck, skipped }: PropsExerciseTranslation) {
  const [checked, setChecked] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [userInput, setUserInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const exerciseRef = useRef<{
    question: string;
    answer: string;
    toTurkish: boolean;
  } | null>(null);

  if (!exerciseRef.current) {
    const data = randomItem(inputData);
    const toTurkish = Math.random() > 0.5;
    const question = toTurkish ? data.getLanguageEN() : data.getLanguageTR();
    const answer = data.getTranslation(question).trim().toLowerCase();
    exerciseRef.current = { question, answer, toTurkish };
  }
  const { question, answer, toTurkish } = exerciseRef.current;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Disable input and buttons if skipped
  useEffect(() => {
    if (inputRef.current)
      inputRef.current.disabled = skipped;
  }, [skipped]);

  function check() {
    if (userInput.trim() === "" || checked)
      return;
    const norm = normalizeTurkish(userInput.trim().toLowerCase());
    const normAns = normalizeTurkish(answer);
    const dist = levenshtein(norm, normAns);
    const isCorrect = dist === 0;
    const hasMinorTypo = dist > 0 && dist <= 2;
    setCorrect(isCorrect);
    setChecked(true);
    onCheck((isCorrect || hasMinorTypo) && ExerciseResult.CORRECT || ExerciseResult.FAILED);
  };

  return (
    <div className="exercise-container">
      <h2 className="exercise-title">Translate</h2>
      <p className="exercise-question">{question}</p>
      <div className="exercise-answers">
        <input
          ref={inputRef}
          className={`translation-input ${checked ? (normalizeTurkish(userInput.trim().toLowerCase()) === normalizeTurkish(answer) || levenshtein(normalizeTurkish(userInput.trim().toLowerCase()), normalizeTurkish(answer)) === 1 ? "input-correct" : "input-wrong") : ""}`}
          placeholder="Type..."
          lang={toTurkish ? "tr" : "en"}
          value={userInput}
          disabled={checked}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") check(); }}
        />
      </div>
      {!checked && !skipped && (
        <div className="exercise-buttons">
          <button
            className="btn btn-check"
            disabled={userInput.trim() === ""}
            onClick={check}
          >
            Check
          </button>
        </div>
      )}
      {((checked && !correct) || skipped) && (
        <p className="exercise-feedback">
          {answer}
        </p>
      )}
    </div>
  );
}
