class ExerciseReorderSentence {
    constructor(INPUT_DATA) {
        this.item = randomSentence(INPUT_DATA);
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
