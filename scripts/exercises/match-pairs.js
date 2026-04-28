class ExerciseMatchPairs {
    constructor(INPUT_DATA) {
        const item = randomItem(INPUT_DATA);
        this.data = new ExerciseData(item);
        this.toTurkish = Math.random() > 0.5;
        this.question = this.toTurkish ? this.data.getLanguageEN() : this.data.getLanguageTR();
        this.answer = this.data.getTranslation(this.question);
        this.wrongGuesses = shuffle(INPUT_DATA)
            .filter(i => i.type !== "sentence")
            .filter(i => i !== item)
            .slice(0, 3)
            .map(i => this.toTurkish ? getLanguageValue(i["l-TR"]) : getLanguageValue(i["l-EN"]));
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

            const leftWords = this.sample.map(i => getLanguageValue(i["l-TR"]));
            const rightWords = shuffle(this.sample.map(i => getLanguageValue(i["l-EN"])));

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
            const correct = getLanguageValue(this.sample.find(i => getLanguageValue(i["l-TR"]) === turk)["l-EN"]);

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
