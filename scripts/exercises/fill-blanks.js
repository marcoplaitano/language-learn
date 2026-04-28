class ExerciseFillBlanks {
    constructor(INPUT_DATA) {
        this.item = randomSentence(INPUT_DATA);
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
                .map(i => getLanguageValue(i["l-TR"]));

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
