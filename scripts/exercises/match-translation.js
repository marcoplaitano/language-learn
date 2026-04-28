class ExerciseMatchTranslation {
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
