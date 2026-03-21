//////////////////////////////////////////////////
// 1. TRANSLATION
//////////////////////////////////////////////////

function translation() {
    document.getElementById("title").textContent = "Translate";

    const item = randomItem();
    const toTurkish = Math.random() > 0.5;

    const question = toTurkish ? item["l-eng"] : item["l-turk"];
    const correct = toTurkish ? item["l-turk"] : item["l-eng"];
    document.getElementById("question").textContent = question;

    const checkBtn = document.createElement("button");
    checkBtn.textContent = "Check";
    checkBtn.disabled = true;
    checkBtn.onclick = checkResult;

    const input = document.createElement("input");
    input.placeholder = "Type...";

    input.addEventListener("keydown", e => {
        if (e.key === "Enter")
            checkResult();
    });
    input.addEventListener("input", () => {
        checkBtn.disabled = input.value.trim() === "";
    });
    document.getElementById("answers").appendChild(input);
    document.getElementById("buttons").appendChild(checkBtn);

    function checkResult() {
        const inputText = input.value.trim().toLowerCase();
        if (inputText === "") return;

        checkBtn.remove();
        input.disabled = true;
        const nextBtn = document.createElement("button");
        nextBtn.textContent = "Next";
        nextBtn.className = "btn-next";
        nextBtn.onclick = nextExercise;

        const normalizedInput = normalizeTurkish(inputText);
        const normalizedCorrect = normalizeTurkish(correct);
        const distance = levenshtein(normalizedInput, normalizedCorrect);
        const isCorrect = distance === 0;
        const hasMinorTypo = distance > 0 && distance <= 1;

        if (isCorrect || hasMinorTypo) {
            nextBtn.classList.add("correct");
            if (hasMinorTypo) {
                document.getElementById("feedback").textContent = correct;
            } else if (inputText !== correct) {
                // Correct after normalization but raw input differs
                document.getElementById("feedback").textContent = correct;
            }
        } else {
            nextBtn.classList.add("wrong");
            document.getElementById("feedback").textContent = correct;
        }
        document.getElementById("buttons").appendChild(nextBtn);
    }
}

function translation_with_guesses() {
    document.getElementById("title").textContent = "Match the translation";

    const item = randomItem();
    const toTurkish = Math.random() > 0.5;

    const question = toTurkish ? item["l-eng"] : item["l-turk"];
    const correct = toTurkish ? item["l-turk"] : item["l-eng"];

    const wrong = shuffle(data)
        .filter(i => i !== item)
        .slice(0, 3)
        .map(i => toTurkish ? i["l-turk"] : i["l-eng"]);

    const options = shuffle([correct, ...wrong]);

    document.getElementById("question").textContent = question;

    const container = document.createElement("div");
    container.style.cssText = "display:flex;justify-content:space-between";
    // container.style.cssText = "display:grid;grid-template-columns:1fr 1fr;gap:10px;";

    const makeColumn = (words) => {
        const col = document.createElement("div");
        words.forEach(word => {
            const btn = document.createElement("button");
            btn.classList.add("btn-guess");
            btn.textContent = word;
            if (word === correct)
                correctOption = btn;
            btn.onclick = () => showResult(btn, word === correct);
            btn.addEventListener("keydown", e => {
                if (e.key === "Enter") showResult(btn, word === correct);
            });
            col.appendChild(btn);
        });
        return col;
    };

    const leftCol = makeColumn(options.slice(0, 2));
    const rightCol = makeColumn(options.slice(2));
    container.append(leftCol, rightCol);

    document.getElementById("answers").appendChild(container);

    function showResult(element, isCorrect) {
        if (isCorrect) {
            element.classList.add("correct");
        } else {
            element.classList.add("wrong");
            correctOption.classList.add("correct");
        }
        document.querySelectorAll(".btn-guess").forEach(b => b.disabled = true);
        addNextButton();
    }
}

//////////////////////////////////////////////////
// 2. MATCHING
//////////////////////////////////////////////////

function matching() {
    document.getElementById("title").textContent = "Match the pairs";
    const answersDiv = document.getElementById("answers");

    const sample = shuffle([...data]).slice(0, 4);
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

        if (correctCount === sample.length) addNextButton();
    }

    container.append(leftCol, rightCol);
    answersDiv.appendChild(container);
}

function highlightSelection(selectedBtn, container) {
    container.querySelectorAll("button").forEach(btn => btn.classList.remove("selected"));
    selectedBtn.classList.add("selected");
}

//////////////////////////////////////////////////
// 3. FILL IN THE BLANK
//////////////////////////////////////////////////

function fillBlanks() {
    document.getElementById("title").textContent = "Fill in the blanks";
    const answersDiv = document.getElementById("answers");
    answersDiv.style = "display: flex; gap: 8px;";
    const hintParagraph = document.getElementById("hint");
    hintParagraph.style.display = "";
    const buttonsDiv = document.getElementById("buttons");

    const sentences = data.filter(item => item.type === "sentence");
    const item = sentences[Math.floor(Math.random() * sentences.length)];
    const sentence = item["l-turk"];
    const words = sentence.split(" ");

    // Show English translation
    const englishTranslation = item["l-eng"];
    document.getElementById("question").innerHTML = englishTranslation;

    const sentenceParagraph = document.createElement("p");
    sentenceParagraph.style.textAlign = "center";
    sentenceParagraph.style.marginBottom = "3.2rem";

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

    sentenceParagraph.innerHTML = displaySentenceWords.join(" ");
    hintParagraph.appendChild(sentenceParagraph);

    const wrongGuesses = shuffle(data)
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
    deleteBtn.onclick = deleteWord;
    deleteBtn.disabled = true;
    buttonsDiv.appendChild(deleteBtn);

    const checkBtn = document.createElement("button");
    checkBtn.textContent = "Check";
    checkBtn.onclick = checkResult;
    checkBtn.disabled = true;
    buttonsDiv.appendChild(checkBtn);

    function addWordToSentence(btn, word) {
        const firstBlankIndex = displaySentenceWords.findIndex(str => str === blankStr);
        if (firstBlankIndex !== -1) {
            displaySentenceWords[firstBlankIndex] = word;
            sentenceParagraph.innerHTML = displaySentenceWords.join(" ");
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
        sentenceParagraph.innerHTML = displaySentenceWords.join(" ");
        numBlanksCovered--;
        if (numBlanksCovered === 0)
            deleteBtn.disabled = true;
        checkBtn.disabled = true;
    }

    function checkResult() {
        const nextBtn = document.createElement("button");
        nextBtn.textContent = "Next";
        nextBtn.className = "btn-next";
        nextBtn.onclick = nextExercise;

        for (btn of buttons)
            btn.disabled = true;
        deleteBtn.remove();
        checkBtn.remove();
        const result = displaySentenceWords.join(" ");
        if (result === sentence) {
            nextBtn.classList.add("correct");
        } else {
            nextBtn.classList.add("wrong");
            document.getElementById("feedback").textContent = sentence;
        }
        buttonsDiv.appendChild(nextBtn);
    }
}

//////////////////////////////////////////////////
// 4. REORDER THE SENTENCE
//////////////////////////////////////////////////

function reorderSentence() {
    document.getElementById("title").textContent = "Reorder the sentence";
    const answersDiv = document.getElementById("answers");
    answersDiv.style = "display: flex; gap: 8px;";
    const hintParagraph = document.getElementById("hint");
    hintParagraph.style.display = "";
    const buttonsDiv = document.getElementById("buttons");

    const sentences = data.filter(item => item.type === "sentence");
    const item = sentences[Math.floor(Math.random() * sentences.length)];
    const sentence = item["l-turk"];
    const words = sentence.split(" ");
    const shuffledWords = shuffle(words);

    // Show English translation
    const englishTranslation = item["l-eng"];
    document.getElementById("question").innerHTML = englishTranslation;

    const sentenceParagraph = document.createElement("p");
    sentenceParagraph.style.textAlign = "center";
    sentenceParagraph.style.marginBottom = "3.2rem";

    const blankStr = "______";
    let blanks = [];
    for (let i = 0; i < words.length; i++) {
        blanks.push(blankStr);
    }
    sentenceParagraph.innerHTML = blanks.join(" ");
    hintParagraph.appendChild(sentenceParagraph);

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
    deleteBtn.onclick = deleteWord;
    deleteBtn.disabled = true;
    buttonsDiv.appendChild(deleteBtn);

    const checkBtn = document.createElement("button");
    checkBtn.textContent = "Check";
    checkBtn.onclick = checkResult;
    checkBtn.disabled = true;
    buttonsDiv.appendChild(checkBtn);

    function addWordToSentence(btn, word) {
        const firstBlankIndex = blanks.findIndex(str => str === blankStr);
        if (firstBlankIndex !== -1) {
            blanks[firstBlankIndex] = word;
            sentenceParagraph.innerHTML = blanks.join(" ");
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
        sentenceParagraph.innerHTML = blanks.join(" ");
        if (lastWordIndex === 0)
            deleteBtn.disabled = true;
        checkBtn.disabled = true;
    }

    function checkResult() {
        const nextBtn = document.createElement("button");
        nextBtn.textContent = "Next";
        nextBtn.className = "btn-next";
        nextBtn.onclick = nextExercise;

        deleteBtn.remove();
        checkBtn.remove();
        const result = blanks.join(" ");
        if (result === sentence) {
            nextBtn.classList.add("correct");
        } else {
            nextBtn.classList.add("wrong");
            document.getElementById("feedback").textContent = sentence;
        }
        buttonsDiv.appendChild(nextBtn);
    }
}

//////////////////////////////////////////////////
// UTILITY FUNCTIONS
//////////////////////////////////////////////////

function randomItem() {
    return data[Math.floor(Math.random() * data.length)];
}

function shuffle(arr) {
    return arr.sort(() => Math.random() - 0.5);
}

function addNextButton() {
    const btn = document.createElement("button");
    btn.textContent = "Next";
    btn.className = "btn-next";
    btn.onclick = nextExercise;
    document.getElementById("buttons").appendChild(btn);
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
    document.getElementById("question").innerHTML = "";
    document.getElementById("hint").innerHTML = "";
    document.getElementById("hint").style.display = "none";
    document.getElementById("answers").innerHTML = "";
    document.getElementById("feedback").textContent = "";
    clearButtonsDiv();

    const types = [translation, translation_with_guesses, matching, fillBlanks, reorderSentence];
    const randomExercise = types[Math.floor(Math.random() * types.length)];
    randomExercise();

    // translation();
    // translation_with_guesses();
    // matching();
    // fillBlanks();
    // reorderSentence();
}

let data = [];

async function init() {
    const res = await fetch("data/language_data.json");
    data = await res.json();
    nextExercise();
}

init();
