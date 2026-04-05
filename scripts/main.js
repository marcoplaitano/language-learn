//////////////////////////////////////////////////
// UTILITY FUNCTIONS
//////////////////////////////////////////////////

function randomItem() {
    return INPUT_DATA[Math.floor(Math.random() * INPUT_DATA.length)];
}

function randomWordOrPhrase() {
    const samples = INPUT_DATA.filter(item => item.type !== "sentence");
    return samples[Math.floor(Math.random() * samples.length)];
}

function randomSentence() {
    const samples = INPUT_DATA.filter(item => item.type === "sentence");
    return samples[Math.floor(Math.random() * samples.length)];
}

function shuffle(arr) {
    return arr.sort(() => Math.random() - 0.5);
}

// Substitute "strange" turkish alphabet letters with QWERTY ones.
function normalizeTurkish(str) {
    const map = { "ç": "c", "Ç": "C", "ğ": "g", "Ğ": "G", "ı": "i", "İ": "i", "ö": "o", "Ö": "O", "ş": "s", "Ş": "S", "ü": "u", "Ü": "U" };
    return str.split("").map(c => map[c] || c).join("").toLowerCase();
}

// Calculate levenshtein distance between 2 words.
function levenshtein(a, b) {
    const matrix = Array(b.length + 1).fill().map(() => Array(a.length + 1).fill(0));
    for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= b.length; j++) matrix[j][0] = j;
    for (let j = 1; j <= b.length; j++) {
        for (let i = 1; i <= a.length; i++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[j][i] = Math.min(matrix[j][i - 1] + 1, matrix[j - 1][i] + 1, matrix[j - 1][i - 1] + cost);
        }
    }
    return matrix[b.length][a.length];
}

// Choose which end-of-lesson message to display based on number of failed and skipped exercises.
function getEndMessage(mistakes, skips, total) {
    const ratioMistake = mistakes / total;
    const ratioSkip = skips / total;
    const pick = arr => arr[Math.floor(Math.random() * arr.length)];

    if (ratioSkip >= 0.5) return pick(END_LESSON_MESSAGES.skipped_most);
    if (ratioSkip >= 0.2) return pick(END_LESSON_MESSAGES.skipped_some);
    if (ratioMistake === 0)  return pick(END_LESSON_MESSAGES.perfect);
    if (ratioMistake <= 0.1) return pick(END_LESSON_MESSAGES.excellent);
    if (ratioMistake <= 0.3) return pick(END_LESSON_MESSAGES.great);
    if (ratioMistake <= 0.5) return pick(END_LESSON_MESSAGES.okay);
    if (ratioMistake <= 0.7) return pick(END_LESSON_MESSAGES.poor);
    else return pick(END_LESSON_MESSAGES.terrible);
}


class ExerciseData {
    constructor(data) {
        this.data = data;
        this.langEN = data["l-EN"];
        this.langTR = data["l-TR"];
        this.type = data["type"];
    }

    getLanguageTR() {
        return this.langTR;
    }

    getLanguageEN() {
        return this.langEN;
    }

    getType() {
        return this.type;
    }

    getTranslation(phrase) {
        return phrase === this.langEN ? this.langTR : this.langEN;
    }
}


// Just need this as an Enum.
const ExerciseResult = {
    CORRECT: "correct",
    FAILED: "failed",
    SKIPPED: "skipped"
};



//////////////////////////////////////////////////
// 1. TRANSLATION
//////////////////////////////////////////////////

class ExerciseTranslation {
    constructor() {
        this.data = new ExerciseData(randomItem());
        this.question = Math.random() > 0.5 ? this.data.getLanguageEN() : this.data.getLanguageTR();
        this.answer = this.data.getTranslation(this.question).trim().toLowerCase();
    }

    showAnswer() {
        this.input.disabled = true;
        document.getElementById("feedback").textContent = this.answer;
    }

    do() {
        return new Promise((resolve) => {
            this.checkBtn = document.createElement("button");
            this.input = document.createElement("input");
            document.getElementById("title").textContent = "Translate";
            document.getElementById("question").textContent = this.question;

            this.checkBtn.textContent = "Check";
            this.checkBtn.classList.add("btn-check");
            this.checkBtn.disabled = true;
            this.checkBtn.onclick = () => {
                this.checkResult(this.input.value.trim().toLowerCase(), resolve);
            };

            this.input.placeholder = "Type...";

            this.input.addEventListener("keydown", e => {
                if (e.key === "Enter") {
                    this.checkResult(this.input.value.trim().toLowerCase(), resolve);
                }
            });
            this.input.addEventListener("input", () => {
                this.checkBtn.disabled = this.input.value.trim() === "";
            });
            document.getElementById("answers").appendChild(this.input);
            document.getElementById("buttons").appendChild(this.checkBtn);
        });
    }

    checkResult(input, resolve) {
        if (input === "") return;

        this.checkBtn.remove();
        this.input.disabled = true;

        const normalizedInput = normalizeTurkish(input);
        const normalizedAnswer = normalizeTurkish(this.answer);
        const distance = levenshtein(normalizedInput, normalizedAnswer);
        const isCorrect = distance === 0;
        const hasMinorTypo = distance > 0 && distance <= 1;

        if (input !== this.answer) {
            this.showAnswer();
        }
        saveResult((isCorrect || hasMinorTypo) ? ExerciseResult.CORRECT : ExerciseResult.FAILED);
        addNextButton(resolve);
    }
}


//////////////////////////////////////////////////
// 2. TRANSLATION WITH GUESSES
//////////////////////////////////////////////////

class ExerciseTranslationWithGuesses {
    constructor() {
        const item = randomItem();
        this.data = new ExerciseData(item);
        this.toTurkish = Math.random() > 0.5;
        this.question = this.toTurkish ? this.data.getLanguageEN() : this.data.getLanguageTR();
        this.answer = this.data.getTranslation(this.question);
        this.wrongGuesses = shuffle(INPUT_DATA)
            .filter(i => i.type !== "sentence")
            .filter(i => i !== item)
            .slice(0, 3)
            .map(i => this.toTurkish ? i["l-TR"] : i["l-EN"]);
        this.correctOption = null;
    }

    showAnswer() {
        this.correctOption.classList.add("correct");
        document.querySelectorAll(".btn-guess").forEach(b => b.disabled = true);
    }

    do() {
        return new Promise((resolve) => {
            this.checkBtn = document.createElement("button");
            this.input = document.createElement("input");
            document.getElementById("title").textContent = "Match the translation";

            const options = shuffle([this.answer, ...this.wrongGuesses]);

            document.getElementById("question").textContent = this.question;

            const container = document.createElement("div");
            container.style.cssText = "display:flex;justify-content:space-between";

            const leftCol = this.makeColumn(options.slice(0, 2), resolve);
            const rightCol = this.makeColumn(options.slice(2), resolve);
            container.append(leftCol, rightCol);

            document.getElementById("answers").appendChild(container);
        });
    }

    makeColumn(words, resolve) {
        const col = document.createElement("div");
        words.forEach(word => {
            const btn = document.createElement("button");
            btn.classList.add("btn-guess");
            btn.textContent = word;
            if (word === this.answer)
                this.correctOption = btn;
            btn.onclick = () => this.showResult(btn, word === this.answer, resolve);
            btn.addEventListener("keydown", e => {
                if (e.key === "Enter")
                    this.showResult(btn, word === this.answer, resolve);
            });
            col.appendChild(btn);
        });
        return col;
    }

    showResult(element, isCorrect, resolve) {
        if (isCorrect) {
            element.classList.add("correct");
        } else {
            element.classList.add("wrong");
            this.showAnswer();
        }
        document.querySelectorAll(".btn-guess").forEach(b => b.disabled = true);
        saveResult(isCorrect ? ExerciseResult.CORRECT : ExerciseResult.FAILED);
        addNextButton(resolve);
    }
}


//////////////////////////////////////////////////
// 3. MATCHING
//////////////////////////////////////////////////

class ExerciseMatching {
    constructor() {
        const item = randomItem();
        this.data = new ExerciseData(item);
        this.toTurkish = Math.random() > 0.5;
        this.question = this.toTurkish ? this.data.getLanguageEN() : this.data.getLanguageTR();
        this.answer = this.data.getTranslation(this.question);
        this.wrongGuesses = shuffle(INPUT_DATA)
            .filter(i => i.type !== "sentence")
            .filter(i => i !== item)
            .slice(0, 3)
            .map(i => this.toTurkish ? i["l-TR"] : i["l-EN"]);
        this.sample = shuffle([...INPUT_DATA])
            .filter(i => i.type !== "sentence")
            .slice(0, 4);
        this.correctOption = null;
        this.selected = null; // { word, side }
        this.leftCol = null;
        this.rightCol = null;
        this.pairs = {};
        this.container = document.createElement("div");
    }

    showAnswer() {}

    do() {
        return new Promise((resolve) => {
            document.getElementById("title").textContent = "Match the pairs";
            const answersDiv = document.getElementById("answers");

            const leftWords = this.sample.map(i => i["l-TR"]);
            const rightWords = shuffle(this.sample.map(i => i["l-EN"]));

            this.container.style.cssText = "display:flex;justify-content:space-between";

            this.leftCol = this.makeColumn(leftWords, "left", resolve);
            this.rightCol = this.makeColumn(rightWords, "right", resolve);

            this.container.append(this.leftCol, this.rightCol);
            answersDiv.appendChild(this.container);
        });
    }

    makeColumn(words, side, resolve) {
        const col = document.createElement("div");
        col.classList.add("match-col");

        words.forEach(word => {
            const btn = document.createElement("button");
            btn.textContent = word;
            btn.className = "btn-match";

            btn.onclick = () => this.handleClick(word, side, btn, col, resolve);

            col.appendChild(btn);
        });

        return col;
    }

    handleClick(word, side, btn, col, resolve) {
        if (!this.selected || this.selected.side === side) {
            this.selected = { word, side };
            this.highlightSelection(btn, col);
            return;
        }

        const [left, right] = side === "left"
            ? [word, this.selected.word]
            : [this.selected.word, word];

        Object.keys(this.pairs).forEach(k => {
            if (this.pairs[k] === right) delete this.pairs[k];
        });

        this.pairs[left] = right;

        this.selected = null;

        [this.leftCol, this.rightCol].forEach(col =>
            col.querySelectorAll("button")
                .forEach(b => b.classList.remove("correct", "wrong"))
        );

        let correctCount = 0;

        for (const [turk, eng] of Object.entries(this.pairs)) {
            const correct = this.sample.find(i => i["l-TR"] === turk)["l-EN"];

            const leftBtn = [...this.leftCol.children].find(b => b.textContent === turk);
            const rightBtn = [...this.rightCol.children].find(b => b.textContent === eng);

            const isCorrect = eng === correct;

            leftBtn.classList.add(isCorrect ? "correct" : "wrong");
            rightBtn.classList.add(isCorrect ? "correct" : "wrong");
            this.container.querySelectorAll("button").forEach(btn => {
                btn.classList.remove("selected");
                setTimeout(() => btn.blur(), 0);
            });

            if (isCorrect) {
                leftBtn.disabled = true;
                rightBtn.disabled = true;
                correctCount++;
            }
        }

        if (correctCount === this.sample.length) {
            saveResult(ExerciseResult.CORRECT);
            addNextButton(resolve);
        }
    }

    highlightSelection(selectedBtn) {
        this.container.querySelectorAll("button").forEach(btn => btn.classList.remove("selected"));
        selectedBtn.classList.add("selected");
    }
}


//////////////////////////////////////////////////
// 4. FILL IN THE BLANK
//////////////////////////////////////////////////

class ExerciseFillBlanks {
    constructor() {
        this.item = randomSentence();
        this.data = new ExerciseData(this.item);
        this.question = this.data.getLanguageEN();
        this.answer = this.data.getLanguageTR();
        this.words = this.answer.split(" ");

        this.numBlanks = Math.min(Math.floor(Math.random() * 2) + 1, Math.max(1, this.words.length - 1))
        this.numBlanksCovered = 0;
        this.blankIndices = [];
        this.correctGuesses = [];
        this.displaySentenceWords = [];
        this.blankStr = "______";

        // Randomly select 1 or 2 words to blank out (but less than total words).
        while (this.blankIndices.length < this.numBlanks) {
            const idx = Math.floor(Math.random() * this.words.length);
            if (!this.blankIndices.includes(idx)) {
                this.blankIndices.push(idx);
            }
        }
        this.blankIndices.sort((a, b) => a - b);

        this.hintParagraph = document.getElementById("hint");
        this.hintParagraph.innerHTML = "";
        this.deleteBtn = document.createElement("button");
        this.checkBtn = document.createElement("button");
        this.buttons = [];
    }

    showAnswer() {
        this.buttons.forEach(btn => {
            btn.disabled = true;
        });
        this.hintParagraph.textContent = this.answer;
        this.hintParagraph.style.fontWeight = "bold";
    }

    do() {
        return new Promise((resolve) => {
            document.getElementById("title").textContent = "Fill in the blanks";
            document.getElementById("question").innerHTML = this.question;
            const answersDiv = document.getElementById("answers");
            answersDiv.style = "display: flex; gap: 8px;";
            this.hintParagraph.style.display = "";
            const buttonsDiv = document.getElementById("buttons");

            this.numBlanksCovered = 0;
            this.correctGuesses = [];
            this.displaySentenceWords = [];
            for (let i = 0; i < this.words.length; i++) {
                if (this.blankIndices.includes(i)) {
                    this.correctGuesses.push(this.words[i]);
                    this.displaySentenceWords.push(this.blankStr);
                } else {
                    this.displaySentenceWords.push(this.words[i]);
                }
            }

            this.hintParagraph.innerHTML = this.displaySentenceWords.join(" ");

            const wrongGuesses = shuffle(INPUT_DATA)
                .filter(i => i["type"] === "word")
                .filter(i => i !== this.item)
                .slice(0, 3)
                .map(i => i["l-TR"]);

            const options = shuffle([...this.correctGuesses, ...wrongGuesses]);

            options.forEach(word => {
                const btn = document.createElement("button");
                btn.textContent = word;
                btn.onclick = () => { this.addWordToSentence(btn, word) };
                this.buttons.push(btn);
                answersDiv.appendChild(btn);
            });

            this.deleteBtn.textContent = "Delete";
            this.deleteBtn.classList.add("btn-delete");
            this.deleteBtn.onclick = () => { this.deleteWord() };
            this.deleteBtn.disabled = true;
            buttonsDiv.appendChild(this.deleteBtn);

            this.checkBtn.textContent = "Check";
            this.checkBtn.classList.add("btn-check");
            this.checkBtn.onclick = () => {
                this.checkResult(resolve);
            };
            this.checkBtn.disabled = true;
            buttonsDiv.appendChild(this.checkBtn);
        });
    }

    addWordToSentence(btn, word) {
        const firstBlankIndex = this.displaySentenceWords.findIndex(str => str === this.blankStr);
        if (firstBlankIndex !== -1) {
            this.displaySentenceWords[firstBlankIndex] = word;
            this.hintParagraph.innerHTML = this.displaySentenceWords.join(" ");
            this.deleteBtn.disabled = false;
            btn.disabled = true;
            this.numBlanksCovered++;
        }
        if (this.numBlanksCovered === this.numBlanks) {
            this.checkBtn.disabled = false;
        }
    }

    deleteWord() {
        let lastWordIndex = this.blankIndices[this.numBlanksCovered - 1];
        this.buttons.forEach(btn => {
            if (btn.textContent === this.displaySentenceWords[lastWordIndex])
                btn.disabled = false;
        });
        this.displaySentenceWords[lastWordIndex] = this.blankStr;
        this.hintParagraph.innerHTML = this.displaySentenceWords.join(" ");
        this.numBlanksCovered--;
        if (this.numBlanksCovered === 0)
            this.deleteBtn.disabled = true;
        this.checkBtn.disabled = true;
    }

    checkResult(resolve) {
        this.buttons.forEach(btn => {
            btn.disabled = true;
        });
        this.deleteBtn.remove();
        this.checkBtn.remove();
        const result = this.displaySentenceWords.join(" ");
        if (result !== this.answer) {
            this.showAnswer();
        }
        saveResult(result !== this.answer ? ExerciseResult.FAILED : ExerciseResult.CORRECT);
        addNextButton(resolve);
    }
}


//////////////////////////////////////////////////
// 5. REORDER THE SENTENCE
//////////////////////////////////////////////////

class ExerciseReorderSentence {
    constructor() {
        this.item = randomSentence();
        this.data = new ExerciseData(this.item);
        this.question = this.data.getLanguageEN();
        this.answer = this.data.getLanguageTR();
        this.words = this.answer.split(" ");
        this.shuffledWords = shuffle(this.words);

        this.numBlanks = Math.min(Math.floor(Math.random() * 2) + 1, Math.max(1, this.words.length - 1))
        this.blanks = [];
        this.blankStr = "______";

        this.hintParagraph = document.getElementById("hint");
        this.hintParagraph.innerHTML = "";
        this.deleteBtn = document.createElement("button");
        this.checkBtn = document.createElement("button");
        this.buttons = [];
    }

    showAnswer() {
        this.buttons.forEach(btn => {
            btn.disabled = true;
        });
        this.hintParagraph.textContent = this.answer;
        this.hintParagraph.style.fontWeight = "bold";
    }

    do() {
        return new Promise((resolve) => {
            document.getElementById("title").textContent = "Reorder the sentence";
            const answersDiv = document.getElementById("answers");
            answersDiv.style = "display: flex; gap: 8px;";
            this.hintParagraph.style.display = "";
            const buttonsDiv = document.getElementById("buttons");

            document.getElementById("question").innerHTML = this.question;

            this.blanks = [];
            for (let i = 0; i < this.words.length; i++) {
                this.blanks.push(this.blankStr);
            }
            this.hintParagraph.innerHTML = this.blanks.join(" ");

            this.shuffledWords.forEach(word => {
                const btn = document.createElement("button");
                btn.textContent = word;
                btn.onclick = () => { this.addWordToSentence(btn, word) };
                this.buttons.push(btn);
                answersDiv.appendChild(btn);
            });

            this.deleteBtn.textContent = "Delete";
            this.deleteBtn.classList.add("btn-delete");
            this.deleteBtn.onclick = () => { this.deleteWord() };
            this.deleteBtn.disabled = true;
            buttonsDiv.appendChild(this.deleteBtn);

            this.checkBtn.textContent = "Check";
            this.checkBtn.classList.add("btn-check");
            this.checkBtn.onclick = () => {
                this.checkResult(resolve);
            };
            this.checkBtn.disabled = true;
            buttonsDiv.appendChild(this.checkBtn);
        });
    }

    addWordToSentence(btn, word) {
        const firstBlankIndex = this.blanks.findIndex(str => str === this.blankStr);
        if (firstBlankIndex !== -1) {
            this.blanks[firstBlankIndex] = word;
            this.hintParagraph.innerHTML = this.blanks.join(" ");
            this.deleteBtn.disabled = false;
            btn.disabled = true;
        }
        if (firstBlankIndex == this.blanks.length - 1)
            this.checkBtn.disabled = false;
    }

    deleteWord() {
        const firstBlankIndex = this.blanks.findIndex(str => str === this.blankStr);
        let lastWordIndex = 0;
        if (firstBlankIndex === -1)
            lastWordIndex = this.blanks.length - 1;
        else
            lastWordIndex = firstBlankIndex - 1;
        this.buttons.forEach(btn => {
            if (btn.textContent === this.blanks[lastWordIndex])
                btn.disabled = false;
        });
        this.blanks[lastWordIndex] = this.blankStr;
        this.hintParagraph.innerHTML = this.blanks.join(" ");
        if (lastWordIndex === 0)
            this.deleteBtn.disabled = true;
        this.checkBtn.disabled = true;
    }

    checkResult(resolve) {
        this.deleteBtn.remove();
        this.checkBtn.remove();
        const result = this.blanks.join(" ");
        if (result !== this.answer) {
            this.showAnswer();
        }
        saveResult(result !== this.answer ? ExerciseResult.FAILED : ExerciseResult.CORRECT);
        addNextButton(resolve);
    }
}


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

async function showEndLessonScreen(offerRevise = false) {
    document.getElementById("title").textContent = "Lesson Completed!";
    document.getElementById("question").textContent = getEndMessage(numExercisesFailed, numExercisesSkipped, NUM_EXERCISES_PER_LESSON);
    skipDisable();
    // If function called with offerRevise=true then show 2 buttons to choose whether to revise mistakes or
    // go to next lesson.
    // Otherwise, only show the Next lesson button.
    return new Promise((resolve) => {
        if (offerRevise) {
            const reviseBtn = document.createElement("button");
            reviseBtn.textContent = "Revise mistakes";
            reviseBtn.className = "btn-next";
            reviseBtn.onclick = () => resolve("revise");
            document.getElementById("buttons").appendChild(reviseBtn);
        }
        const nextLessonBtn = document.createElement("button");
        nextLessonBtn.textContent = "Next lesson";
        nextLessonBtn.className = "btn-next";
        nextLessonBtn.onclick = () => resolve("next");
        document.getElementById("buttons").appendChild(nextLessonBtn);
    });
}


//////////////////////////////////////////////////
// MAIN FLOW
//////////////////////////////////////////////////

function resetLessonProgress() {
    THIS_RESULT = null;
    numExercisesDone = 0;
    numExercisesFailed = 0;
    failedExercises = [];
    numExercisesSkipped = 0;
    lessonEndedWithReviseChoice = false;
    updateProgressBar();
}

async function startLesson() {
    resetLessonProgress();
    await cycleExercises();
}

async function endLesson() {
    await showEndLessonScreen();
    resetLessonProgress();
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
            // If there are no more mistakes left...
            if (failedExercises.length === 0) {
                // If the lesson has already ended in a previous iteration and the user chose to revise all mistakes,
                // just reset everything and start new lesson.
                if (lessonEndedWithReviseChoice) {
                    resetLessonProgress();
                }
                // The lesson ended now with 0 mistakes. Show end-of-lesson screen.
                else {
                    await endLesson();
                }
                continue;
            }
            // If the lesson has just ended now with some mistakes...
            if (!lessonEndedWithReviseChoice) {
                // Ask whether to revise the mistakes or jump to next lesson directly.
                const choice = await showEndLessonScreen(true);
                if (choice === "next") {
                    resetLessonProgress();
                    continue;
                }
            }
            // The lesson has just ended now and the user chose to revise the mistakes.
            lessonEndedWithReviseChoice = true;
            clearButtonsDiv();
            await reviseMistake();
            continue;
        }

        // Choose random exercise and execute it.
        const types = [ExerciseTranslation, ExerciseTranslationWithGuesses, ExerciseMatching, ExerciseFillBlanks, ExerciseReorderSentence];
        const randomExercise = types[Math.floor(Math.random() * types.length)];
        EXERCISE = new randomExercise();
        // EXERCISE = new ExerciseTranslation();
        // EXERCISE = new ExerciseTranslationWithGuesses();
        // EXERCISE = new ExerciseMatching();
        // EXERCISE = new ExerciseFillBlanks();
        // EXERCISE = new ExerciseReorderSentence();
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
        failedExercises.push(exercise);
}

// Run first mistake of the list and delete it from the list.
// If the user guesses wrong again, the exercise is added back to the list when saving the result.
async function reviseMistake() {
    EXERCISE = failedExercises.at(0);
    await EXERCISE.do();
    failedExercises.shift();
}

function saveResult(result) {
    THIS_RESULT = result;
    if (result === ExerciseResult.FAILED) {
        saveMistake(EXERCISE);
        numExercisesFailed++;
    }
}


const NUM_EXERCISES_PER_LESSON = 10;
const PROGRESS_BAR_GAP = 3 * (NUM_EXERCISES_PER_LESSON - 1);
let INPUT_DATA = [];
let END_LESSON_MESSAGES = {};
// Exercise object with question and answer. Saved in case the user makes a mistake and this has to be run again.
let EXERCISE = null;
// Result of last exercise done by user.
let THIS_RESULT = null;

let numExercisesDone = 0;
let numExercisesSkipped = 0;
let numExercisesFailed = 0;
let failedExercises = [];
let lessonEndedWithReviseChoice = false;


async function init() {
    const [langRes, endMsgRes] = await Promise.all([
        fetch("data/language_data.json"),
        fetch("data/end_lesson_messages.json"),
    ]);
    INPUT_DATA = await langRes.json();
    END_LESSON_MESSAGES = await endMsgRes.json();
    await startLesson();
}

init();
