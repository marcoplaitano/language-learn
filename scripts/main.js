let data = [];

async function init() {
    const res = await fetch("data/language_data.json");
    data = await res.json();
    nextExercise();
}

function randomItem() {
    return data[Math.floor(Math.random() * data.length)];
}

function shuffle(arr) {
    return arr.sort(() => Math.random() - 0.5);
}

//////////////////////////////////////////////////
// MAIN FLOW
//////////////////////////////////////////////////

function nextExercise() {
    document.getElementById("feedback").textContent = "";
    document.getElementById("answers").innerHTML = "";

    const types = [translation, matching, fillBlank, formPlural];
    const random = types[Math.floor(Math.random() * types.length)];
    random();
}

//////////////////////////////////////////////////
// 1. TRANSLATION
//////////////////////////////////////////////////

function translation() {
    document.getElementById("title").textContent = "Translate";

    const item = randomItem();
    const toTurkish = Math.random() > 0.5;

    const question = toTurkish ? item["l-eng"][0] : item["l-turk"][0];
    const correct = toTurkish ? item["l-turk"][0] : item["l-eng"][0];

    const wrong = shuffle(data)
        .filter(i => i !== item)
        .slice(0, 3)
        .map(i => toTurkish ? i["l-turk"][0] : i["l-eng"][0]);

    const options = shuffle([correct, ...wrong]);

    document.getElementById("question").textContent = question;

    options.forEach(opt => {
        const btn = document.createElement("button");
        btn.textContent = opt;

        btn.onclick = () => showResult(btn, opt === correct, correct);

        btn.addEventListener("keydown", e => {
            if (e.key === "Enter") showResult(btn, opt === correct, correct);
        });

        document.getElementById("answers").appendChild(btn);
    });
}

//////////////////////////////////////////////////
// 2. MATCHING
//////////////////////////////////////////////////

function matching() {
    document.getElementById("title").textContent = "Match the pairs";
    document.getElementById("question").textContent = "";

    const sample = shuffle([...data]).slice(0, 4);
    const leftWords = sample.map(i => i["l-turk"][0]);
    const rightWords = shuffle(sample.map(i => i["l-eng"][0]));

    const app = document.getElementById("answers");
    app.innerHTML = "";

    let selectedLeft = null;
    let pairs = {};
    const container = document.createElement("div");
    container.style.display = "flex";
    container.style.justifyContent = "space-between";
    container.style.gap = "20px";

    const leftCol = document.createElement("div");
    const rightCol = document.createElement("div");

    leftWords.forEach(word => {
        const btn = document.createElement("button");
        btn.textContent = word;
        btn.className = "match-btn";

        btn.onclick = () => {
            selectedLeft = word;
            highlightSelection(btn, leftCol);
        };

        leftCol.appendChild(btn);
    });

    rightWords.forEach(word => {
        const btn = document.createElement("button");
        btn.textContent = word;
        btn.className = "match-btn";

        btn.onclick = () => {
            if (!selectedLeft) return;

            for (let key in pairs) {
                if (pairs[key] === word) delete pairs[key];
            }

            pairs[selectedLeft] = word;
            updateUI();
            selectedLeft = null;
        };

        rightCol.appendChild(btn);
    });

    function updateUI() {
        leftCol.querySelectorAll("button").forEach(btn => btn.classList.remove("correct", "wrong"));
        rightCol.querySelectorAll("button").forEach(btn => btn.classList.remove("correct", "wrong"));

        let correctCount = 0;
        for (let turk in pairs) {
            const eng = pairs[turk];
            const correct = sample.find(i => i["l-turk"][0] === turk)["l-eng"][0];

            const leftBtn = [...leftCol.children].find(b => b.textContent === turk);
            const rightBtn = [...rightCol.children].find(b => b.textContent === eng);

            if (eng === correct) {
                leftBtn.classList.add("correct");
                rightBtn.classList.add("correct");
                correctCount++;
            } else {
                leftBtn.classList.add("wrong");
                rightBtn.classList.add("wrong");
            }
        }

        if (correctCount === sample.length) {
            document.getElementById("feedback").textContent = "🎉 Perfect!";
            addNextButton();
        } else {
            document.getElementById("feedback").textContent = "";
        }
    }

    container.appendChild(leftCol);
    container.appendChild(rightCol);
    app.appendChild(container);
}

function highlightSelection(selectedBtn, container) {
    container.querySelectorAll("button").forEach(btn => btn.classList.remove("selected"));
    selectedBtn.classList.add("selected");
}

//////////////////////////////////////////////////
// 3. FILL IN THE BLANK
//////////////////////////////////////////////////

function fillBlank() {
    document.getElementById("title").textContent = "Fill in the blanks";
    document.getElementById("feedback").textContent = "";
    document.getElementById("answers").innerHTML = "";

    const sentences = data.filter(d => d.type === "sentence" || d.type === "phrase");
    const item = sentences[Math.floor(Math.random() * sentences.length)];
    const sentenceTR = item["l-turk"][0];
    const sentenceEN = item["l-eng"][0];

    const words = sentenceTR.split(" ");
    const numBlanks = Math.min(2, words.length);
    const blankIndexes = [];
    while (blankIndexes.length < numBlanks) {
        const idx = Math.floor(Math.random() * words.length);
        if (!blankIndexes.includes(idx)) blankIndexes.push(idx);
    }

    const answers = blankIndexes.map(i => words[i]);
    blankIndexes.forEach(i => words[i] = "_____");

    document.getElementById("question").innerHTML = `
    <div style="font-size:14px; color:#666; margin-bottom:8px;">${sentenceEN}</div>
    <div style="font-size:22px;">${words.join(" ")}</div>
  `;

    const inputs = [];
    blankIndexes.forEach((_, i) => {
        const input = document.createElement("input");
        input.placeholder = "Select or type word...";
        input.dataset.index = i;
        document.getElementById("answers").appendChild(input);
        inputs.push(input);

        input.addEventListener("keydown", e => { if (e.key === "Enter") checkFill(); });
    });

    blankIndexes.forEach((_, i) => {
        const blankDiv = document.createElement("div");
        const correct = answers[i];
        const wrongWords = shuffle(data.filter(d => d.type === "word" && !d["l-turk"].includes(correct))).slice(0, 3).map(d => d["l-turk"][0]);
        const options = shuffle([correct, ...wrongWords]);
        options.forEach(opt => {
            const btn = document.createElement("button");
            btn.textContent = opt;
            btn.onclick = () => { inputs[i].value = opt; checkFill(); };
            blankDiv.appendChild(btn);
        });
        document.getElementById("answers").appendChild(blankDiv);
    });

    const btn = document.createElement("button");
    btn.textContent = "Check";
    btn.onclick = checkFill;
    document.getElementById("answers").appendChild(btn);

    function checkFill() {
        const feedbackHtml = [];
        const userWords = inputs.map(input => input.value.trim());
        userWords.forEach((uw, i) => {
            const ans = answers[i];
            const distance = levenshtein(normalizeTurkish(uw), normalizeTurkish(ans));
            if (distance <= 2) feedbackHtml.push(`<span style="color:green;">${uw}</span>`);
            else feedbackHtml.push(highlightDifferences(ans, uw));
        });

        document.getElementById("feedback").innerHTML = feedbackHtml.join(" ") +
            `<div style="margin-top:10px;color:#555;">Full sentence: ${sentenceTR}</div>`;

        inputs.forEach(input => input.disabled = true);
        btn.disabled = true;

        addNextButton();
    }
}

//////////////////////////////////////////////////
// 4. FORM THE PLURAL
//////////////////////////////////////////////////

function formPlural() {
    document.getElementById("title").textContent = "Fill in the blanks";
    document.getElementById("feedback").textContent = "";
    document.getElementById("answers").innerHTML = "";

    const words = data.filter(d => d.type === "sentence" || d.type === "phrase");
    const item = words[Math.floor(Math.random() * words.length)];
    const singular = item["l-turk"];
    const singularEN = item["l-eng"];

    addNextButton();
}

//////////////////////////////////////////////////
// UTILITY FUNCTIONS
//////////////////////////////////////////////////

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

function showResult(element, isCorrect, correctAnswer) {
    const feedback = document.getElementById("feedback");
    if (isCorrect) {
        feedback.textContent = "✅ Correct!";
        element.classList.add("correct");
    } else {
        feedback.textContent = "❌ Correct answer: " + correctAnswer;
        element.classList.add("wrong");
    }
    document.querySelectorAll("button").forEach(b => b.disabled = true);
    addNextButton();
}

function addNextButton() {
    const btn = document.createElement("button");
    btn.textContent = "Next";
    btn.className = "next";
    btn.onclick = nextExercise;
    document.getElementById("answers").appendChild(btn);
}







init();