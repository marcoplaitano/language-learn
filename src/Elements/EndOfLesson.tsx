import messages from "../data/messages.json";

import { NUM_EXERCISES_PER_LESSON } from "../globals";

import { useState, useEffect } from "react";


function pickRandomMessage<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

// Choose which end-of-lesson message to display based on number of failed and skipped exercises.
function getEndMessage(
  correct: number,
  skipped: number
): string {
  const ratioMistake = 1 - correct / NUM_EXERCISES_PER_LESSON;
  const ratioSkip = skipped / NUM_EXERCISES_PER_LESSON;
  console.log("skipped:", skipped);
  console.log("correct:", correct);
  if (ratioSkip == 1) return pickRandomMessage(messages.skipped_all);
  if (ratioSkip >= 0.5) return pickRandomMessage(messages.skipped_most);
  if (ratioSkip >= 0.2) return pickRandomMessage(messages.skipped_some);
  if (ratioMistake === 0) return pickRandomMessage(messages.lesson_perfect);
  if (ratioMistake <= 0.1) return pickRandomMessage(messages.lesson_excellent);
  if (ratioMistake <= 0.3) return pickRandomMessage(messages.lesson_great);
  if (ratioMistake <= 0.5) return pickRandomMessage(messages.lesson_okay);
  if (ratioMistake <= 0.7) return pickRandomMessage(messages.lesson_poor);
  else return pickRandomMessage(messages.lesson_terrible);
}


interface PropsEndOfLesson {
  numExercisesCorrect: number;
  numExercisesSkipped: number;
  onDone: (done: boolean) => void;
}

export default function EndOfLesson({ numExercisesCorrect, numExercisesSkipped, onDone }: PropsEndOfLesson) {
  return (
    <>
      <h2 className="exercise-title">Lesson completed!</h2>
      <p className="exercise-question">{getEndMessage(numExercisesCorrect, numExercisesSkipped)}</p>
      <div className="exercise-buttons">
        <button
          className="btn btn-next"
          onClick={() => onDone(false)}
        >
          Next lesson
        </button>
      </div>
    </>
  );
}
