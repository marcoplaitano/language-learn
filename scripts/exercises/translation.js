class ExerciseTranslation {
    constructor(INPUT_DATA) {
        this.data = new ExerciseData(randomItem(INPUT_DATA));
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



async function doExercise() {
    while (true) {
        document.getElementById("question").innerHTML = "";
        document.getElementById("hint").innerHTML = "";
        document.getElementById("hint").style.display = "none";
        document.getElementById("hint").style.fontWeight = "normal";
        document.getElementById("answers").innerHTML = "";
        document.getElementById("feedback").textContent = "";
        document.getElementById("bottom-menu-container").style.display = "";
        clearButtonsDiv();
        EXERCISE = new ExerciseTranslation(INPUT_DATA);
        await EXERCISE.do();
    }
}

async function init() {
    const [langRes] = await Promise.all([
        fetch("/data/language_data.json"),
    ]);
    INPUT_DATA = await langRes.json();
    await doExercise();
}

EXERCISE = null;
