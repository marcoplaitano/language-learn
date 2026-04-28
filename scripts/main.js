//////////////////////////////////////////////////
// UI FUNCTIONS
//////////////////////////////////////////////////

function addNextButton(resolve) {
    const nextBtn = document.createElement("button");
    nextBtn.textContent = "Next";
    nextBtn.className = "btn-next";
    nextBtn.onclick = () => {
        resolve();
    };

    if (THIS_RESULT === ExerciseResult.CORRECT)
        nextBtn.classList.add("correct");
    else if (THIS_RESULT === ExerciseResult.FAILED)
        nextBtn.classList.add("wrong");

    clearButtonsDiv();
    document.getElementById("buttons").appendChild(nextBtn);

    skipDisable();
}

function updateProgressBar() {
    const label = document.getElementById("progress-label");
    label.textContent = numExercisesDone + "/" + NUM_EXERCISES_PER_LESSON;

    if (THIS_RESULT === null) {
        const progressBarSegments = document.querySelectorAll(".progress-bar-segment");
        progressBarSegments.forEach(seg => seg.remove());
        return;
    }

    const bar = document.getElementById("progress-bar");
    const color = THIS_RESULT === ExerciseResult.CORRECT ? "var(--color-green)" : THIS_RESULT === ExerciseResult.FAILED ? "var(--color-red)" : "var(--color-text2)";
    const segWidth = (bar.clientWidth - PROGRESS_BAR_GAP) / NUM_EXERCISES_PER_LESSON;
    const seg = document.createElement("div");
    seg.className = "progress-bar-segment";
    seg.style.width = segWidth + "px";
    seg.style.minWidth = segWidth + "px";
    seg.style.background = color;
    bar.appendChild(seg);
}

function clearButtonsDiv() {
    const buttonsDiv = document.getElementById("buttons");
    const buttons = buttonsDiv.querySelectorAll("button");
    buttons.forEach(btn => btn.remove());
}

async function showReivisonScreen() {
    document.getElementById("title").textContent = "Mistakes revision";
    document.getElementById("question").textContent = "Let's fix the mistakes you made!";
    skipDisable();
    return new Promise((resolve) => {
        const startRevisionBtn = document.createElement("button");
        startRevisionBtn.textContent = "Start revision";
        startRevisionBtn.className = "btn-next";
        startRevisionBtn.onclick = () => resolve();
        document.getElementById("buttons").appendChild(startRevisionBtn);
    });
}

async function showEndLessonScreen() {
    document.getElementById("title").textContent = "Lesson Completed!";
    document.getElementById("question").textContent = getEndMessage(MESSAGES_DATA, numExercisesFailed, numExercisesSkipped, NUM_EXERCISES_PER_LESSON);
    skipDisable();
    return new Promise((resolve) => {
        const nextLessonBtn = document.createElement("button");
        nextLessonBtn.textContent = "Next lesson";
        nextLessonBtn.className = "btn-next";
        nextLessonBtn.onclick = () => resolve();
        document.getElementById("buttons").appendChild(nextLessonBtn);
    });
}


//////////////////////////////////////////////////
// STREAK AND SCORES GRAPHIC
//////////////////////////////////////////////////

let closeTimer;
function streakAnimationStart(streakNum) {
    if (sessionStorage.getItem("animationDone"))
        return;
    const overlayNum = document.getElementById("overlay-num");
    overlayNum.textContent = streakNum;
    const overlayLabel = document.getElementById("overlay-label");
    if (streakNum === 1)
        overlayLabel.textContent = "day streak";
    else
        overlayLabel.textContent = "days streak";
    const isFreezed = isFireFreezed();
    if (isFreezed)
        overlayLabel.textContent += " (freezed)";

    const overlay = document.getElementById("overlay-container");
    overlay.classList.add("show");
    document.body.classList.add("overlay-open");

    clearTimeout(closeTimer);
    closeTimer = setTimeout(streakAnimationEnd, 2400);

    setTimeout(() => {
        document.addEventListener("keydown", endAnimationESC);
        document.addEventListener("click", endAnimationClick);
        document.addEventListener("touchstart", endAnimationClick);
    }, 50);

    // If the animation was just showed because the user lost the streak, or because it got freezed,
    // then it can be shown again in the same session.
    if (streakNum > 0 && !isFreezed)
        sessionStorage.setItem("animationDone", true);
}

function streakAnimationEnd() {
    const overlay = document.getElementById("overlay-container");
    overlay.classList.remove("show");
    document.body.classList.remove("overlay-open");
    clearTimeout(closeTimer);

    document.removeEventListener("keydown", endAnimationESC);
    document.removeEventListener("click", endAnimationClick);
    document.removeEventListener("touchstart", endAnimationClick);
}
function endAnimationESC(e) { if (e.key === "Escape") streakAnimationEnd(); }
function endAnimationClick() { streakAnimationEnd(); }

function setFireFreezed(freezed) {
    document.querySelectorAll(".fire-icon").forEach(element => {
        if (freezed)
            element.classList.add("fire-freezed");
        else
            element.classList.remove("fire-freezed");
    });
}

function isFireFreezed() {
    return document.querySelector(".fire-freezed") !== null;
}


//////////////////////////////////////////////////
// STREAK AND SCORES
//////////////////////////////////////////////////

function showStreak() {
    // If last date is older than yesterday, reset streak.
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const streakLastDate = localStorage.getItem("streakLastDate");
    // First time the user opens the app, initialize streak.
    if (streakLastDate === null) {
        resetStreak();
    }
    // User missed streak. Either freeze it or loose it depending on number
    // of streak freezes left.
    if (streakLastDate < yesterdayStr) {
        if (getNumFreezes() > 0) {
            setFireFreezed(true);
            decreaseStreakFreezes();
        }
        else
            resetStreak();
        streakAnimationStart(getStreak());
    }

    const streakNum = getStreak();
    const streakDiv = document.getElementById("streak-num");
    streakDiv.textContent = `\u00A0${streakNum}`;
    streakDiv.style.display = "";
}

function saveLessonScore() {
    const MAX_LESSONS_SAVED = 50;
    let lessons = JSON.parse(localStorage.getItem("lessonScores")) || [];
    // Add to the beginning of the list.
    lessons.unshift(LESSON_RESULTS);
    if (lessons.length > MAX_LESSONS_SAVED)
        lessons.length = MAX_LESSONS_SAVED;
    localStorage.setItem("lessonScores", JSON.stringify(lessons));
    // If number of correct exercises is > 80% the user gets a streak
    if (LESSON_RESULTS.correct > NUM_EXERCISES_PER_LESSON * 0.8)
        increaseStreakFreezes();
}


//////////////////////////////////////////////////
// MAIN FLOW
//////////////////////////////////////////////////

function resetLessonProgress() {
    LESSON_RESULTS = {};
    LESSON_RESULTS.date = TODAY_DATE;
    LESSON_RESULTS.correct = 0;
    LESSON_RESULTS.failed = 0;
    LESSON_RESULTS.skipped = 0;
    THIS_RESULT = null;
    numExercisesDone = 0;
    numExercisesFailed = 0;
    failedExercises = [];
    numExercisesSkipped = 0;
    startedRevision = false;
    updateProgressBar();
}

async function startLesson() {
    resetLessonProgress();
    await cycleExercises();
}

async function endLesson() {
    await showEndLessonScreen();
    saveLessonScore();
    resetLessonProgress();
    updateStreak();
    showStreak();
}

async function cycleExercises() {
    while (true) {
        // Reset screen.
        THIS_RESULT = null;
        document.getElementById("question").innerHTML = "";
        document.getElementById("hint").innerHTML = "";
        document.getElementById("hint").style.display = "none";
        document.getElementById("hint").style.fontWeight = "normal";
        document.getElementById("answers").innerHTML = "";
        document.getElementById("feedback").textContent = "";
        document.getElementById("bottom-menu-container").style.display = "";
        clearButtonsDiv();
        skipEnable();

        // Lesson is completed.
        if (numExercisesDone === NUM_EXERCISES_PER_LESSON) {
            // If there are no more mistakes left either because the user made none or finished revision,
            // end current lesson.
            if (failedExercises.length === 0) {
                await endLesson();
                continue;
            }
            // If the lesson has ended just now with some mistakes...
            if (!startedRevision) {
                // Show screen prompting the user to revise their mistakes.
                await showReivisonScreen();
                skipEnable();
            }
            // Start/continue mistakes revision.
            startedRevision = true;
            clearButtonsDiv();
            await reviseMistake();
            continue;
        }

        // Choose random exercise and execute it.
        const types = [ExerciseTranslation, ExerciseMatchTranslation, ExerciseMatchPairs, ExerciseFillBlanks, ExerciseReorderSentence];
        const randomExercise = types[Math.floor(Math.random() * types.length)];
        EXERCISE = new randomExercise(INPUT_DATA);
        // EXERCISE = new ExerciseTranslation(INPUT_DATA);
        // EXERCISE = new ExerciseTranslationWithGuesses(INPUT_DATA);
        // EXERCISE = new ExerciseMatching(INPUT_DATA);
        // EXERCISE = new ExerciseFillBlanks(INPUT_DATA);
        // EXERCISE = new ExerciseReorderSentence(INPUT_DATA);
        await EXERCISE.do();

        numExercisesDone++;
        updateProgressBar();
    }
}

// Show answer of current exercise, save result as SKIPPED, and add next button.
async function skipExercise() {
    EXERCISE.showAnswer();
    saveResult(ExerciseResult.SKIPPED);
    await new Promise((resolve) => {
        addNextButton(resolve);
    });
    // Only update progress if the lesson is still going.
    // In other case it means the current exercise is a mistake being revised.
    if (numExercisesDone < NUM_EXERCISES_PER_LESSON) {
        numExercisesDone++;
        numExercisesSkipped++;
        updateProgressBar();
    }
    await cycleExercises();
}

function skipEnable() {
    document.getElementById("btn-skip").disabled = false;
    setTimeout(() => { document.getElementById("btn-skip").blur(); }, 50);
}

function skipDisable() {
    document.getElementById("btn-skip").disabled = true;
}

function saveMistake(exercise) {
    if (failedExercises.length < NUM_EXERCISES_PER_LESSON)
        if (failedExercises.indexOf(exercise) === -1)
            failedExercises.push(exercise);
}

// Run first mistake of the list and delete it from the list if done correctly.
async function reviseMistake() {
    EXERCISE = failedExercises.at(0);
    await EXERCISE.do();
    if (THIS_RESULT === ExerciseResult.CORRECT)
        failedExercises.shift();
}

function saveResult(result) {
    THIS_RESULT = result;
    if (!startedRevision) {
        LESSON_RESULTS.correct = (LESSON_RESULTS.correct || 0) + (result === ExerciseResult.CORRECT ? 1 : 0);
        LESSON_RESULTS.failed = (LESSON_RESULTS.failed || 0) + (result === ExerciseResult.FAILED ? 1 : 0);
        LESSON_RESULTS.skipped = (LESSON_RESULTS.skipped || 0) + (result === ExerciseResult.SKIPPED ? 1 : 0);
    }
    if (result === ExerciseResult.FAILED) {
        saveMistake(EXERCISE);
        numExercisesFailed++;
    }
}


const NUM_EXERCISES_PER_LESSON = 10;
const PROGRESS_BAR_GAP = 3 * (NUM_EXERCISES_PER_LESSON - 1);
let INPUT_DATA = [];
let MESSAGES_DATA = {};
// Exercise object with question and answer. Saved in case the user makes a mistake and this has to be run again.
let EXERCISE = null;
// Result of last exercise done by user.
let THIS_RESULT = null;
let LESSON_RESULTS = {};

let numExercisesDone = 0;
let numExercisesSkipped = 0;
let numExercisesFailed = 0;
let failedExercises = [];
let startedRevision = false;


async function init() {
    showStreak();
    const [langRes, endMsgRes] = await Promise.all([
        fetch("data/language_data.json"),
        fetch("data/messages.json"),
    ]);
    INPUT_DATA = await langRes.json();
    MESSAGES_DATA = await endMsgRes.json();
    await startLesson();
}

init();
