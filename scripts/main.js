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

    getTranslation(lang) {
        return lang === this.langEN ? this.langTR : this.langEN;
    }
}



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
        this.checkBtn = document.createElement("button");
        this.input = document.createElement("input");
        document.getElementById("title").textContent = "Translate";
        document.getElementById("question").textContent = this.question;

        this.checkBtn.textContent = "Check";
        this.checkBtn.classList.add("btn-check");
        this.checkBtn.disabled = true;
        this.checkBtn.onclick = () => this.checkResult(this.input.value.trim().toLowerCase());

        this.input.placeholder = "Type...";

        this.input.addEventListener("keydown", e => {
            if (e.key === "Enter")
                this.checkResult(this.input.value.trim().toLowerCase());
        });
        this.input.addEventListener("input", () => {
            this.checkBtn.disabled = this.input.value.trim() === "";
        });
        document.getElementById("answers").appendChild(this.input);
        document.getElementById("buttons").appendChild(this.checkBtn);
    }

    checkResult(input) {
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
        if (!(isCorrect || hasMinorTypo))
            saveMistake(this);
        addNextButton(isCorrect || hasMinorTypo);
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
    }

    do() {
        this.checkBtn = document.createElement("button");
        this.input = document.createElement("input");
        document.getElementById("title").textContent = "Match the translation";

        const options = shuffle([this.answer, ...this.wrongGuesses]);

        document.getElementById("question").textContent = this.question;

        const container = document.createElement("div");
        container.style.cssText = "display:flex;justify-content:space-between";

        const leftCol = this.makeColumn(options.slice(0, 2));
        const rightCol = this.makeColumn(options.slice(2));
        container.append(leftCol, rightCol);

        document.getElementById("answers").appendChild(container);
    }

    makeColumn(words) {
        const col = document.createElement("div");
        words.forEach(word => {
            const btn = document.createElement("button");
            btn.classList.add("btn-guess");
            btn.textContent = word;
            if (word === this.answer)
                this.correctOption = btn;
            btn.onclick = () => this.showResult(btn, word === this.answer);
            btn.addEventListener("keydown", e => {
                if (e.key === "Enter") this.showResult(btn, word === this.answer);
            });
            col.appendChild(btn);
        });
        return col;
    }

    showResult(element, isCorrect) {
        if (isCorrect) {
            element.classList.add("correct");
        } else {
            element.classList.add("wrong");
            this.showAnswer();
            saveMistake(this);
        }
        document.querySelectorAll(".btn-guess").forEach(b => b.disabled = true);
        addNextButton();
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
        document.getElementById("title").textContent = "Match the pairs";
        const answersDiv = document.getElementById("answers");

        const leftWords = this.sample.map(i => i["l-TR"]);
        const rightWords = shuffle(this.sample.map(i => i["l-EN"]));

        this.container.style.cssText = "display:flex;justify-content:space-between";

        this.leftCol = this.makeColumn(leftWords, "left");
        this.rightCol = this.makeColumn(rightWords, "right");

        this.container.append(this.leftCol, this.rightCol);
        answersDiv.appendChild(this.container);
    }

    makeColumn(words, side) {
        const col = document.createElement("div");
        col.classList.add("match-col");

        words.forEach(word => {
            const btn = document.createElement("button");
            btn.textContent = word;
            btn.className = "btn-match";

            btn.onclick = () => this.handleClick(word, side, btn, col);

            col.appendChild(btn);
        });

        return col;
    }

    handleClick(word, side, btn, col) {
        if (!this.selected || this.selected.side === side) {
            this.selected = { word, side };
            this.highlightSelection(btn, col);
            return;
        }

        // match
        const [left, right] = side === "left"
            ? [word, this.selected.word]
            : [this.selected.word, word];

        // remove previous conflicting matches
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

        if (correctCount === this.sample.length)
            addNextButton();
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

        // Randomly select 1 or 2 words to blank out (but less than total words)
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
        this.checkBtn.onclick = () => { this.checkResult() };
        this.checkBtn.disabled = true;
        buttonsDiv.appendChild(this.checkBtn);
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

    checkResult() {
        this.buttons.forEach(btn => {
            btn.disabled = true;
        });
        this.deleteBtn.remove();
        this.checkBtn.remove();
        const result = this.displaySentenceWords.join(" ");
        if (result !== this.answer) {
            this.showAnswer();
            saveMistake(this);
        }
        addNextButton(result === this.answer);
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
        document.getElementById("title").textContent = "Reorder the sentence";
        const answersDiv = document.getElementById("answers");
        answersDiv.style = "display: flex; gap: 8px;";
        this.hintParagraph.style.display = "";
        const buttonsDiv = document.getElementById("buttons");

        // Show English translation
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
        this.checkBtn.onclick = () => { this.checkResult() };
        this.checkBtn.disabled = true;
        buttonsDiv.appendChild(this.checkBtn);
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

    checkResult() {
        this.deleteBtn.remove();
        this.checkBtn.remove();
        const result = this.blanks.join(" ");
        if (result !== this.answer) {
            this.showAnswer();
            saveMistake(this);
        }
        addNextButton(result === this.answer);
    }
}


//////////////////////////////////////////////////
// UI FUNCTIONS
//////////////////////////////////////////////////

function addNextButton(correct=null) {
    const nextBtn = document.createElement("button");
    nextBtn.textContent = "Next";
    nextBtn.className = "btn-next";
    nextBtn.onclick = nextExercise;

    if (correct !== null)
        if (correct)
            nextBtn.classList.add("correct");
        else
            nextBtn.classList.add("wrong");

    document.getElementById("buttons").appendChild(nextBtn);
    document.querySelectorAll(".btn-delete").forEach(el => el.remove());
    document.querySelectorAll(".btn-check").forEach(el => el.remove());

    skipDisable();
}

function updateProgressBar() {
  const bar = document.getElementById("progress-bar");
  bar.style.width = ((numExercisesDone / NUM_EXERCISES_PER_LESSON) * 100) + "%";
}

function clearButtonsDiv() {
    const buttonsDiv = document.getElementById("buttons");
    const buttons = buttonsDiv.querySelectorAll("button");
    buttons.forEach(btn => btn.remove());
}

function showEndLessonScreen() {
    document.getElementById("title").textContent = "Lesson Completed!";
    document.getElementById("question").textContent = "You completed the lesson! You can start again now";
    document.getElementById("footer-content").style.display = "none";
    addNextButton();
}


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

function normalizeTurkish(str) {
    const map = { "ç": "c", "Ç": "C", "ğ": "g", "Ğ": "G", "ı": "i", "İ": "i", "ö": "o", "Ö": "O", "ş": "s", "Ş": "S", "ü": "u", "Ü": "U" };
    return str.split("").map(c => map[c] || c).join("").toLowerCase();
}

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


//////////////////////////////////////////////////
// MAIN FLOW
//////////////////////////////////////////////////

function startLesson() {
    numExercisesDone = 0;
    numFailedExercises = 0;
    failedExercises = [];
    nextExercise();
}

function endLesson() {
    numExercisesDone = 0;
    showEndLessonScreen();
}

function nextExercise() {
    document.getElementById("question").innerHTML = "";
    document.getElementById("hint").innerHTML = "";
    document.getElementById("hint").style.display = "none";
    document.getElementById("hint").style.fontWeight = "normal";
    document.getElementById("answers").innerHTML = "";
    document.getElementById("feedback").textContent = "";
    document.getElementById("footer-content").style.display = "";
    clearButtonsDiv();
    skipEnable();
    updateProgressBar();

    if (numExercisesDone > 0 && numExercisesDone % NUM_EXERCISES_PER_LESSON === 0) {
        if (numFailedExercises === 0)
            numFailedExercises = failedExercises.length;
        if (failedExercises.length == 0) {
            endLesson();
            return;
        }
        repeatMistake();
        return;
    }

    const types = [ExerciseTranslation, ExerciseTranslationWithGuesses, ExerciseMatching, ExerciseFillBlanks, ExerciseReorderSentence];
    const randomExercise = types[Math.floor(Math.random() * types.length)];
    EXERCISE = new randomExercise();
    EXERCISE.do();

    // EXERCISE = new ExerciseTranslation(); EXERCISE.do();
    // EXERCISE = new ExerciseTranslationWithGuesses(); EXERCISE.do();
    // EXERCISE = new ExerciseMatching(); EXERCISE.do();
    // EXERCISE = new ExerciseFillBlanks(); EXERCISE.do();
    // EXERCISE = new ExerciseReorderSentence(); EXERCISE.do();

    numExercisesDone++;
}

function skipExercise() {
    EXERCISE.showAnswer();
    addNextButton();
}

function skipEnable() {
    document.getElementById("btn-skip").disabled = false;
    setTimeout(() => { document.getElementById("btn-skip").blur(); }, 50);
}

function skipDisable() {
    document.getElementById("btn-skip").disabled = true;
}

function saveMistake(exercise) {
    if (failedExercises.length < MAX_FAILED_EXERCISES)
        failedExercises.push(exercise);
}

function repeatMistake() {
    EXERCISE = failedExercises.at(0);
    EXERCISE.do();
    failedExercises.shift();
}


const NUM_EXERCISES_PER_LESSON = 10;
const MAX_FAILED_EXERCISES = 10;
let INPUT_DATA = [];
let EXERCISE = null;

let numExercisesDone = 0;
let failedExercises = [];
let numFailedExercises = 0;

async function init() {
    const res = await fetch("data/language_data.json");
    INPUT_DATA = await res.json();
    startLesson();
}

init();
