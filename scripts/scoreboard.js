function formatDate(dateStr) {
    const date = new Date(dateStr);
    const formatted = date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
    return formatted;
}

function readScores() {
    return JSON.parse(localStorage.getItem("lessonScores")) || [];
}

function createEntryBar(correct, failed, skipped) {
    const bar = document.createElement("div");
    bar.className = "scorebar";
    const total = correct + failed + skipped;
    console.log("TOTAL:", total);
    const correctWidth = (correct / total) * 100;
    const failedWidth = (failed / total) * 100;
    const skippedWidth = (skipped / total) * 100;
    if (correctWidth > 0) {
        const correctPart = document.createElement("div");
        correctPart.className = "scorebar-correct";
        correctPart.style.width = `${correctWidth}%`;
        bar.appendChild(correctPart);
    }
    if (failedWidth > 0) {
        const failedPart = document.createElement("div");
        failedPart.className = "scorebar-failed";
        failedPart.style.width = `${failedWidth}%`;
        bar.appendChild(failedPart);
    }
    if (skippedWidth > 0) {
        const skippedPart = document.createElement("div");
        skippedPart.className = "scorebar-skipped";
        skippedPart.style.width = `${skippedWidth}%`;
        bar.appendChild(skippedPart);
    }
    return bar;
}

function createEntry(correct, failed, skipped) {
    const entry = document.createElement("div");
    entry.className = "scoreboard-entry";
    const bar = createEntryBar(correct, failed, skipped);
    entry.appendChild(bar);
    const text = document.createElement("p");
    const textCorrect = document.createElement("span");
    textCorrect.textContent = `${correct}`;
    textCorrect.className = "scoreboard-text-correct";
    const textFailed = document.createElement("span");
    textFailed.textContent = `${failed}`;
    textFailed.className = "scoreboard-text-failed";
    const textSkipped = document.createElement("span");
    textSkipped.textContent = `${skipped}`;
    textSkipped.className = "scoreboard-text-skipped";
    text.appendChild(textCorrect);
    text.appendChild(document.createTextNode(" "));
    text.appendChild(textFailed);
    text.appendChild(document.createTextNode("  "));
    text.appendChild(textSkipped);
    entry.appendChild(text);
    return entry;
}

function showScoreboard() {
    const scores = readScores();
    const scoreboard = document.getElementById("scoreboard");
    if (scores.length === 0)
        return;
    scoreboard.innerHTML = "";

    scores.forEach(score => {
        if (score.date !== lastDate) {
            lastDate = score.date;
            const dateHeader = document.createElement("h3");
            dateHeader.textContent = formatDate(score.date);
            scoreboard.appendChild(dateHeader);
        }
        const entry = createEntry(score.correct, score.failed, score.skipped);
        scoreboard.appendChild(entry);
    });
}


let lastDate = null;

showScoreboard();
