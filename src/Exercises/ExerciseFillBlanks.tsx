import { useMemo, useState } from "react";
import { LanguageItemData, ExerciseResult, randomSentence, shuffle, BLANK_STR } from "../globals";

interface PropsExerciseFillBlanks {
  inputData: LanguageItemData[];
  onCheck: (result: ExerciseResult) => void;
  skipped: boolean;
}

export default function ExerciseFillBlanks({ inputData, onCheck, skipped }: PropsExerciseFillBlanks) {
  const exercise = useMemo(() => {
    const item = randomSentence(inputData);
    const question = item.getLanguageEN();
    const answer = item.getLanguageTR();
    const words = answer.split(" ");
    const maxBlanks = Math.max(1, Math.min(2, words.length - 1));
    const numBlanks = Math.min(Math.floor(Math.random() * 2) + 1, maxBlanks);
    const blankIndices: number[] = [];

    while (blankIndices.length < numBlanks) {
      const idx = Math.floor(Math.random() * words.length);
      if (!blankIndices.includes(idx)) {
        blankIndices.push(idx);
      }
    }
    blankIndices.sort((a, b) => a - b);

    const correctGuesses = blankIndices.map((index) => words[index]);
    const wrongGuesses = shuffle(inputData)
      .filter((item) => item.getType() === "word")
      .filter((item) => item.getLanguageTR() !== answer)
      .slice(0, 3)
      .map((item) => item.getLanguageTR());

    return {
      question,
      answer,
      words,
      blankIndices,
      options: shuffle([...correctGuesses, ...wrongGuesses]),
    };
  }, [inputData]);

  const [displayWords, setDisplayWords] = useState<string[]>(
    exercise.words.map((word, index) => (exercise.blankIndices.includes(index) ? BLANK_STR : word))
  );
  const [filledCount, setFilledCount] = useState(0);
  const [disabledWords, setDisabledWords] = useState<Set<string>>(new Set());
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const blanksRemaining = exercise.blankIndices.length - filledCount;
  const disabled = skipped || checked;
  const answerRevealed = (checked && isCorrect === false) || skipped;

  const handleOptionClick = (word: string) => {
    if (disabled || disabledWords.has(word) || blanksRemaining === 0) return;

    const nextBlankIndex = displayWords.findIndex((w) => w === BLANK_STR);
    if (nextBlankIndex === -1) return;

    const nextDisplayWords = [...displayWords];
    nextDisplayWords[nextBlankIndex] = word;
    setDisplayWords(nextDisplayWords);
    setFilledCount((count) => count + 1);
    setDisabledWords((set) => new Set(set).add(word));
  };

  const handleDelete = () => {
    if (disabled || filledCount === 0) return;

    const filledBlankIndex = exercise.blankIndices[filledCount - 1];
    const removedWord = displayWords[filledBlankIndex];
    const nextDisplayWords = [...displayWords];
    nextDisplayWords[filledBlankIndex] = BLANK_STR;
    setDisplayWords(nextDisplayWords);
    setFilledCount((count) => count - 1);
    setDisabledWords((set) => {
      const updated = new Set(set);
      updated.delete(removedWord);
      return updated;
    });
  };

  const handleCheck = () => {
    if (disabled || filledCount !== exercise.blankIndices.length) return;
    const result = displayWords.join(" ") === exercise.answer;
    setChecked(true);
    setIsCorrect(result);
    onCheck(result ? ExerciseResult.CORRECT : ExerciseResult.FAILED);
  };

  return (
    <div className="exercise-container">
      <h2 className="exercise-title">Fill in the blanks</h2>
      <p className="exercise-question">{exercise.question}</p>

      {(answerRevealed) 
      && (
        <p className="exercise-feedback">{exercise.answer}</p>
      )
      || (
        <p className="exercise-hint">
          {displayWords.join(" ")}
        </p>
      )}

      <div className="exercise-answers flexed">
        {exercise.options.map((option) => (
          <button
            key={option}
            type="button"
            disabled={disabled || disabledWords.has(option)}
            onClick={() => handleOptionClick(option)}
          >
            {option}
          </button>
        ))}
      </div>

      <div className="exercise-buttons">
        <button
          type="button"
          className="btn btn-delete"
          disabled={disabled || filledCount === 0}
          onClick={handleDelete}
        >
          Delete
        </button>
        <button
          type="button"
          className="btn btn-check"
          disabled={disabled || filledCount !== exercise.blankIndices.length}
          onClick={handleCheck}
        >
          Check
        </button>
      </div>
    </div>
  );
}
