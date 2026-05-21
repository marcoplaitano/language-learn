import { useMemo, useState } from "react";
import { LanguageItemData, ExerciseResult, randomSentence, shuffle, BLANK_STR } from "../globals";

interface PropsExerciseReorderSentence {
  inputData: LanguageItemData[];
  onCheck: (result: ExerciseResult) => void;
  skipped: boolean;
}


export default function ExerciseReorderSentence({ inputData, onCheck, skipped }: PropsExerciseReorderSentence) {
  const exercise = useMemo(() => {
    const item = randomSentence(inputData);
    const question = item.getLanguageEN();
    const answer = item.getLanguageTR();
    const words = answer.split(" ");
    const shuffledWords = shuffle(words);

    return {
      question,
      answer,
      words,
      shuffledWords,
    };
  }, [inputData]);

  const [blanks, setBlanks] = useState<string[]>(
    Array(exercise.words.length).fill(BLANK_STR)
  );
  const [disabledWords, setDisabledWords] = useState<Set<string>>(new Set());
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const filledCount = blanks.filter((word) => word !== BLANK_STR).length;
  const disabled = skipped || checked;
  const answerRevealed = (checked && isCorrect === false) || skipped;

  const handleAddWord = (word: string) => {
    if (disabled || disabledWords.has(word)) return;
    const firstBlankIndex = blanks.findIndex((word) => word === BLANK_STR);
    if (firstBlankIndex === -1) return;

    const nextBlanks = [...blanks];
    nextBlanks[firstBlankIndex] = word;
    setBlanks(nextBlanks);
    setDisabledWords((current) => new Set(current).add(word));
  };

  const handleDelete = () => {
    if (disabled || filledCount === 0) return;
    const firstBlankIndex = blanks.findIndex((word) => word === BLANK_STR);
    const lastFilledIndex = firstBlankIndex === -1 ? blanks.length - 1 : firstBlankIndex - 1;
    if (lastFilledIndex < 0) return;

    const removedWord = blanks[lastFilledIndex];
    const nextBlanks = [...blanks];
    nextBlanks[lastFilledIndex] = BLANK_STR;
    setBlanks(nextBlanks);
    setDisabledWords((current) => {
      const nextSet = new Set(current);
      nextSet.delete(removedWord);
      return nextSet;
    });
  };

  const handleCheck = () => {
    if (disabled || filledCount !== blanks.length) return;
    const result = blanks.join(" ") === exercise.answer;
    setChecked(true);
    setIsCorrect(result);
    onCheck(result ? ExerciseResult.CORRECT : ExerciseResult.FAILED);
  };

  return (
    <div className="exercise-container">
      <h2 className="exercise-title">Reorder the sentence</h2>
      <p className="exercise-question">{exercise.question}</p>

        {answerRevealed
        && (
          <p className="exercise-feedback">{exercise.answer}</p>
        )
        || (
          <p className="exercise-hint">{blanks.join(" ")}</p>
        )}

      <div className="exercise-answers flexed">
        {exercise.shuffledWords.map((word, index) => (
          <button
            key={`${word}-${index}`}
            type="button"
            disabled={disabled || disabledWords.has(word)}
            onClick={() => handleAddWord(word)}
          >
            {word}
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
          disabled={disabled || filledCount !== blanks.length}
          onClick={handleCheck}
        >
          Check
        </button>
      </div>
    </div>
  );
}
