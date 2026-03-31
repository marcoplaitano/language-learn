class ExerciseData {
    constructor(data) {
        this.data = data;
        this.langEN = data["l-eng"];
        this.langTR = data["l-turk"];
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
        console.log("ANSWER:", this.answer);
    }

    do() {
        this.checkBtn = document.createElement("button");
        this.input = document.createElement("input");
        document.getElementById("title").textContent = "Translate";
        document.getElementById("question").textContent = this.question;

        this.checkBtn.textContent = "Check";
        this.checkBtn.classList.add("btn-check");
        this.checkBtn.disabled = true;
        this.checkBtn.onclick = () => this.checkResult(this.input.value.trim().toLowerCase(), this.answer);

        this.input.placeholder = "Type...";

        this.input.addEventListener("keydown", e => {
            if (e.key === "Enter")
                this.checkResult(this.input.value.trim().toLowerCase(), this.answer);
        });
        this.input.addEventListener("input", () => {
            this.checkBtn.disabled = this.input.value.trim() === "";
        });
        document.getElementById("answers").appendChild(this.input);
        document.getElementById("buttons").appendChild(this.checkBtn);
    }

    checkResult(input, answer) {
        if (input === "") return;

        this.checkBtn.remove();
        this.input.disabled = true;

        const normalizedInput = normalizeTurkish(input);
        const normalizedAnswer = normalizeTurkish(answer);
        const distance = levenshtein(normalizedInput, normalizedAnswer);
        const isCorrect = distance === 0;
        const hasMinorTypo = distance > 0 && distance <= 1;

        if (input !== answer) {
            document.getElementById("feedback").textContent = answer;
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
        console.log("ANSWER:", this.answer);
        this.wrongGuesses = shuffle(INPUT_DATA)
            .filter(i => i.type !== "sentence")
            .filter(i => i !== item)
            .slice(0, 3)
            .map(i => this.toTurkish ? i["l-turk"] : i["l-eng"]);
        this.correctOption = null;
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
            this.correctOption.classList.add("correct");
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
        console.log("ANSWER:", this.answer);
        this.wrongGuesses = shuffle(INPUT_DATA)
            .filter(i => i.type !== "sentence")
            .filter(i => i !== item)
            .slice(0, 3)
            .map(i => this.toTurkish ? i["l-turk"] : i["l-eng"]);
        this.correctOption = null;
    }

    do() {
        document.getElementById("title").textContent = "Match the pairs";
        const answersDiv = document.getElementById("answers");

        const sample = shuffle([...INPUT_DATA])
            .filter(i => i.type !== "sentence")
            .slice(0, 4);
        const leftWords = sample.map(i => i["l-turk"]);
        const rightWords = shuffle(sample.map(i => i["l-eng"]));

        let selected = null; // { word, side }
        const pairs = {};

        const container = document.createElement("div");
        container.style.cssText = "display:flex;justify-content:space-between";

        const makeColumn = (words, side) => {
            const col = document.createElement("div");
            col.classList.add("match-col");

            words.forEach(word => {
                const btn = document.createElement("button");
                btn.textContent = word;
                btn.className = "btn-match";

                btn.onclick = () => handleClick(word, side, btn, col);

                col.appendChild(btn);
            });

            return col;
        };

        const leftCol = makeColumn(leftWords, "left");
        const rightCol = makeColumn(rightWords, "right");

        function handleClick(word, side, btn, col) {
            if (!selected || selected.side === side) {
                selected = { word, side };
                highlightSelection(btn, col);
                return;
            }

            // match
            const [left, right] = side === "left"
                ? [word, selected.word]
                : [selected.word, word];

            // remove previous conflicting matches
            Object.keys(pairs).forEach(k => {
                if (pairs[k] === right) delete pairs[k];
            });

            pairs[left] = right;

            selected = null;
            updateUI();
        }

        function updateUI() {
            [leftCol, rightCol].forEach(col =>
                col.querySelectorAll("button")
                    .forEach(b => b.classList.remove("correct", "wrong"))
            );

            let correctCount = 0;

            for (const [turk, eng] of Object.entries(pairs)) {
                const correct = sample.find(i => i["l-turk"] === turk)["l-eng"];

                const leftBtn = [...leftCol.children].find(b => b.textContent === turk);
                const rightBtn = [...rightCol.children].find(b => b.textContent === eng);

                const isCorrect = eng === correct;

                leftBtn.classList.add(isCorrect ? "correct" : "wrong");
                rightBtn.classList.add(isCorrect ? "correct" : "wrong");
                container.querySelectorAll("button").forEach(btn => {
                    btn.classList.remove("selected");
                    setTimeout(() => btn.blur(), 0);
                });

                if (isCorrect) {
                    leftBtn.disabled = true;
                    rightBtn.disabled = true;
                    correctCount++;
                }
            }

            if (correctCount === sample.length)
                addNextButton();
        }

        container.append(leftCol, rightCol);
        answersDiv.appendChild(container);
    }

    highlightSelection(selectedBtn, container) {
        container.querySelectorAll("button").forEach(btn => btn.classList.remove("selected"));
        selectedBtn.classList.add("selected");
    }
}


//////////////////////////////////////////////////
// 4. FILL IN THE BLANK
//////////////////////////////////////////////////

function fillBlanks() {
    document.getElementById("title").textContent = "Fill in the blanks";
    const answersDiv = document.getElementById("answers");
    answersDiv.style = "display: flex; gap: 8px;";
    const hintParagraph = document.getElementById("hint");
    hintParagraph.style.display = "";
    const buttonsDiv = document.getElementById("buttons");

    const item = randomSentence();
    const sentence = item["l-turk"];
    ANSWER = sentence;
    const words = sentence.split(" ");

    // Show English translation
    const englishTranslation = item["l-eng"];
    document.getElementById("question").innerHTML = englishTranslation;

    // Randomly select 1 or 2 words to blank out (but less than total words)
    const numBlanks = Math.min(Math.floor(Math.random() * 2) + 1, Math.max(1, words.length - 1))
    let numBlanksCovered = 0;
    const blankIndices = [];
    while (blankIndices.length < numBlanks) {
        const idx = Math.floor(Math.random() * words.length);
        if (!blankIndices.includes(idx)) {
            blankIndices.push(idx);
        }
    }
    blankIndices.sort((a, b) => a - b);

    const blankStr = "______";
    let correctGuesses = [];
    let displaySentenceWords = [];
    for (let i = 0; i < words.length; i++) {
        if (blankIndices.includes(i)) {
            correctGuesses.push(words[i]);
            displaySentenceWords.push(blankStr);
        } else {
            displaySentenceWords.push(words[i]);
        }
    }

    hintParagraph.innerHTML = displaySentenceWords.join(" ");

    const wrongGuesses = shuffle(INPUT_DATA)
        .filter(i => i["type"] === "word")
        .filter(i => i !== item)
        .slice(0, 3)
        .map(i => i["l-turk"]);

    const options = shuffle([...correctGuesses, ...wrongGuesses]);

    const buttons = [];
    options.forEach(word => {
        const btn = document.createElement("button");
        btn.textContent = word;
        btn.onclick = () => { addWordToSentence(btn, word) };
        buttons.push(btn);
        answersDiv.appendChild(btn);
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.classList.add("btn-delete");
    deleteBtn.onclick = deleteWord;
    deleteBtn.disabled = true;
    buttonsDiv.appendChild(deleteBtn);

    const checkBtn = document.createElement("button");
    checkBtn.textContent = "Check";
    checkBtn.classList.add("btn-check");
    checkBtn.onclick = checkResult;
    checkBtn.disabled = true;
    buttonsDiv.appendChild(checkBtn);

    function addWordToSentence(btn, word) {
        const firstBlankIndex = displaySentenceWords.findIndex(str => str === blankStr);
        if (firstBlankIndex !== -1) {
            displaySentenceWords[firstBlankIndex] = word;
            hintParagraph.innerHTML = displaySentenceWords.join(" ");
            deleteBtn.disabled = false;
            btn.disabled = true;
            numBlanksCovered++;
        }
        if (numBlanksCovered === numBlanks) {
            checkBtn.disabled = false;
        }
    }

    function deleteWord() {
        let lastWordIndex = blankIndices[numBlanksCovered - 1];
        for (btn of buttons) {
            if (btn.textContent === displaySentenceWords[lastWordIndex])
                btn.disabled = false;
        }
        displaySentenceWords[lastWordIndex] = blankStr;
        hintParagraph.innerHTML = displaySentenceWords.join(" ");
        numBlanksCovered--;
        if (numBlanksCovered === 0)
            deleteBtn.disabled = true;
        checkBtn.disabled = true;
    }

    function checkResult() {
        for (btn of buttons)
            btn.disabled = true;
        deleteBtn.remove();
        checkBtn.remove();
        const result = displaySentenceWords.join(" ");
        if (result !== ANSWER) {
            hintParagraph.textContent = ANSWER;
            hintParagraph.style.fontWeight = "bold";
        }
        addNextButton(result === ANSWER);
    }
}

//////////////////////////////////////////////////
// 5. REORDER THE SENTENCE
//////////////////////////////////////////////////

function reorderSentence() {
    document.getElementById("title").textContent = "Reorder the sentence";
    const answersDiv = document.getElementById("answers");
    answersDiv.style = "display: flex; gap: 8px;";
    const hintParagraph = document.getElementById("hint");
    hintParagraph.style.display = "";
    const buttonsDiv = document.getElementById("buttons");

    const item = randomSentence();
    const sentence = item["l-turk"];
    ANSWER = sentence;
    const words = sentence.split(" ");
    const shuffledWords = shuffle(words);

    // Show English translation
    const englishTranslation = item["l-eng"];
    document.getElementById("question").innerHTML = englishTranslation;

    const blankStr = "______";
    let blanks = [];
    for (let i = 0; i < words.length; i++) {
        blanks.push(blankStr);
    }
    hintParagraph.innerHTML = blanks.join(" ");

    const buttons = [];
    shuffledWords.forEach(word => {
        const btn = document.createElement("button");
        btn.textContent = word;
        btn.onclick = () => { addWordToSentence(btn, word) };
        buttons.push(btn);
        answersDiv.appendChild(btn);
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.classList.add("btn-delete");
    deleteBtn.onclick = deleteWord;
    deleteBtn.disabled = true;
    buttonsDiv.appendChild(deleteBtn);

    const checkBtn = document.createElement("button");
    checkBtn.textContent = "Check";
    checkBtn.classList.add("btn-check");
    checkBtn.onclick = checkResult;
    checkBtn.disabled = true;
    buttonsDiv.appendChild(checkBtn);

    function addWordToSentence(btn, word) {
        const firstBlankIndex = blanks.findIndex(str => str === blankStr);
        if (firstBlankIndex !== -1) {
            blanks[firstBlankIndex] = word;
            hintParagraph.innerHTML = blanks.join(" ");
            deleteBtn.disabled = false;
            btn.disabled = true;
        }
        if (firstBlankIndex == blanks.length - 1)
            checkBtn.disabled = false;
    }

    function deleteWord() {
        const firstBlankIndex = blanks.findIndex(str => str === blankStr);
        let lastWordIndex = 0;
        if (firstBlankIndex === -1)
            lastWordIndex = blanks.length - 1;
        else
            lastWordIndex = firstBlankIndex - 1;
        for (btn of buttons) {
            if (btn.textContent === blanks[lastWordIndex])
                btn.disabled = false;
        }
        blanks[lastWordIndex] = blankStr;
        hintParagraph.innerHTML = blanks.join(" ");
        if (lastWordIndex === 0)
            deleteBtn.disabled = true;
        checkBtn.disabled = true;
    }

    function checkResult() {
        deleteBtn.remove();
        checkBtn.remove();
        const result = blanks.join(" ");
        if (result !== ANSWER) {
            hintParagraph.textContent = ANSWER;
            hintParagraph.style.fontWeight = "bold";
        }
        addNextButton(result === ANSWER);
    }
}

//////////////////////////////////////////////////
// UTILITY FUNCTIONS
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

function clearButtonsDiv() {
    const buttonsDiv = document.getElementById("buttons");
    const buttons = buttonsDiv.querySelectorAll("button");
    buttons.forEach(btn => btn.remove());
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

function highlightDifferences(correct, user) {
    const len = Math.max(correct.length, user.length);
    let html = "";
    for (let i = 0; i < len; i++) {
        const c = correct[i] || "";
        const u = user[i] || "";
        if (normalizeTurkish(c) === normalizeTurkish(u)) html += c;
        else html += `<span style="color:red;">${u || "_"}</span>`;
    }
    return html;
}

//////////////////////////////////////////////////
// MAIN FLOW
//////////////////////////////////////////////////

function nextExercise() {
    ANSWER = null;
    document.getElementById("question").innerHTML = "";
    document.getElementById("hint").innerHTML = "";
    document.getElementById("hint").style.display = "none";
    document.getElementById("hint").style.fontWeight = "normal";
    document.getElementById("answers").innerHTML = "";
    document.getElementById("feedback").textContent = "";
    clearButtonsDiv();
    skipEnable();

    console.log("DONE:", numExercisesDone)
    if (numExercisesDone > 0 && numExercisesDone % 3 === 0) {
        if (failedExercises.length == 0) {
            numExercisesDone = 0;
            nextExercise();
            return;
        }
        console.log("REPEATING EXERCISE");
        repeatMistake();
        return;
    }

    const types = [ExerciseTranslation, ExerciseTranslationWithGuesses, ExerciseMatching];
    const randomExercise = types[Math.floor(Math.random() * types.length)];
    exercise = new randomExercise();
    // exercise.do();

    // exercise = new ExerciseTranslation(); exercise.do();
    // exercise = new ExerciseTranslationWithGuesses(); exercise.do();
    exercise = new ExerciseMatching(); exercise.do();
    // exercise = new ExerciseFillBlanks(); exercise.do();
    // exercise = new ExerciseReorderSentence(); exercise.do();

    numExercisesDone++;
}

function skipExercise() {
    nextExercise();
}

function skipEnable() {
    document.getElementById("btn-skip").disabled = false;
    setTimeout(() => { document.getElementById("btn-skip").blur(); }, 50);
}

function skipDisable() {
    document.getElementById("btn-skip").disabled = true;
}

function saveMistake(exercise) {
    if (failedExercises.length < 10)
        failedExercises.push(exercise);
}

function repeatMistake() {
    exercise = failedExercises.at(0);
    exercise.do();
    failedExercises.shift();
}


let INPUT_DATA = [];
let ANSWER = null;
let numExercisesDone = 0;
let failedExercises = [];

async function init() {
    const res = await fetch("data/language_data.json");
    INPUT_DATA = await res.json();
    nextExercise();
}

init();
