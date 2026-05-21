import { useMemo, useState } from "react";
import { LanguageItemData, ExerciseResult, randomItem, shuffle } from "../globals";

interface PropsExerciseMatchTranslation {
  inputData: LanguageItemData[];
  onCheck: (result: ExerciseResult) => void;
  skipped: boolean;
}

export default function ExerciseMatchTranslation({ inputData, onCheck, skipped }: PropsExerciseMatchTranslation) {
  const exercise = useMemo(() => {
    const item = randomItem(inputData);
    const toTurkish = Math.random() > 0.5;
    const question = toTurkish ? item.getLanguageEN() : item.getLanguageTR();
    const answer = item.getTranslation(question);
    const wrongGuesses = shuffle(inputData)
      .filter((i) => i.getType() !== "sentence")
      .filter((i) => i !== item)
      .slice(0, 3)
      .map((i) => (toTurkish ? i.getLanguageTR() : i.getLanguageEN()));

    return {
      question,
      answer,
      toTurkish,
      options: shuffle([answer, ...wrongGuesses]),
    };
  }, [inputData]);

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const disabled = skipped || isCorrect !== null;
  const showAnswer = isCorrect === false || skipped;

  const handleSelect = (option: string) => {
    if (disabled) return;
    const result = option === exercise.answer;
    setSelectedOption(option);
    setIsCorrect(result);
    onCheck(result ? ExerciseResult.CORRECT : ExerciseResult.FAILED);
  };

  const getButtonClass = (option: string) => {
    let cls = "btn-guess";
    if (showAnswer && option === exercise.answer) cls += " correct";
    if (isCorrect === false && option === selectedOption) cls += " wrong";
    return cls;
  };

  return (
    <div className="exercise-container">
      <h2 className="exercise-title">Match the translation</h2>
      <p className="exercise-question" lang={exercise.toTurkish ? "en" : "tr"}>
        {exercise.question}
      </p>
      <div className="exercise-answers">
        {exercise.options.map((option) => (
          <button
            key={option}
            type="button"
            className={getButtonClass(option)}
            disabled={disabled}
            onClick={() => handleSelect(option)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSelect(option);
            }}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
