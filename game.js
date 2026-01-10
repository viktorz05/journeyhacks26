const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreSpan = document.getElementById('finalScore');

// --- CONFIGURATION ---
let canvasWidth = window.innerWidth;
let canvasHeight = window.innerHeight;
canvas.width = canvasWidth;
canvas.height = canvasHeight;

// The word pool - Expand this later!
const wordList = [
    "hack", "code", "python", "java", "script", "terminal",
    "matrix", "cyber", "net", "data", "algorithm", "bug",
    "compile", "server", "cloud", "binary", "zero", "one", "bao"
];

// --- GAME STATE ---
let wordsOnScreen = []; // Array containing active word objects
let currentInput = "";  // What the player is currently typing
let score = 0;
let isGameOver = false;
let spawnRate = 2000;   // New word every 2 seconds (decreases over time)
let fallSpeed = 1.5;    // Pixels per frame (increases over time)

// --- CORE FUNCTIONS ---

// 1. Spawn a new word at the top
function spawnWord() {
    if (isGameOver) return;

    const text = wordList[Math.floor(Math.random() * wordList.length)];
    // Ensure word stays within horizontal bounds
    const x = Math.random() * (canvasWidth - 150) + 50;

    wordsOnScreen.push({
        text: text,
        x: x,
        y: -20 // Start just off-screen top
    });

    // Difficulty Scaling: Make it faster over time
    if (spawnRate > 500) spawnRate -= 50;
    if (fallSpeed < 5) fallSpeed += 0.05;

    // Schedule next spawn based on current rate
    setTimeout(spawnWord, spawnRate);
}


// 2. The Main Game Loop (runs approx 60 times per second)
function update() {
    if (isGameOver) return;

    // Clear screen for next frame
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Draw Score and Current Input
    drawUI();

    // Loop through all active words
    for (let i = wordsOnScreen.length - 1; i >= 0; i--) {
        let wordObj = wordsOnScreen[i];

        // Move word down
        wordObj.y += fallSpeed;

        // Check collision with bottom
        if (wordObj.y > canvasHeight - 20) {
            triggerGameOver();
        }

        // Draw the word
        drawWord(wordObj);
    }

    requestAnimationFrame(update);
}

// --- DRAWING HELPERS ---

function drawUI() {
    ctx.fillStyle = "#33ff33"; // Matrix Green color
    ctx.font = "20px Courier New";
    ctx.fillText("SCORE: " + score, 20, 30);

    // Show what the user is currently typing at the bottom center
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.fillText("> " + currentInput, canvasWidth / 2, canvasHeight - 30);
    ctx.textAlign = "start"; // Reset alignment
}

function drawWord(wordObj) {
    ctx.font = "bold 24px Courier New";

    // Visual Polish: If what's typed matches the start of this word, highlight it
    if (wordObj.text.startsWith(currentInput) && currentInput.length > 0) {
        // Draw the matching part in green
        ctx.fillStyle = "#33ff33";
        ctx.fillText(currentInput, wordObj.x, wordObj.y);

        // Draw the rest in white
        ctx.fillStyle = "#ffffff";
        let remainingText = wordObj.text.substring(currentInput.length);
        // Calculate width of already drawn text to place the rest correctly
        let measuredWidth = ctx.measureText(currentInput).width;
        ctx.fillText(remainingText, wordObj.x + measuredWidth, wordObj.y);
    } else {
        // No match, just draw white text
        ctx.fillStyle = "#ffffff";
        ctx.fillText(wordObj.text, wordObj.x, wordObj.y);
    }
}

// --- INPUT HANDLING ---

window.addEventListener('keydown', (e) => {
    if (isGameOver) return;

    // Only allow letters (a-z)
    if (e.key.match(/^[a-z]$/i)) {
        currentInput += e.key.toLowerCase();
        checkMatches();
    }
    // Handle Backspace
    else if (e.key === 'Backspace') {
        currentInput = currentInput.slice(0, -1);
    }
    // Optional: Clear input with Enter or Space
    else if (e.key === 'Enter' || e.key === ' ') {
        currentInput = "";
    }
});


function checkMatches() {
    // Check if currentInput exactly matches any word on screen
    const matchIndex = wordsOnScreen.findIndex(w => w.text === currentInput);

    if (matchIndex !== -1) {
        // MATCH FOUND!
        wordsOnScreen.splice(matchIndex, 1); // Remove word
        score += 10; // Increase score
        currentInput = ""; // Reset input buffer
        // (Here you would add sound effects)
    }
}

function triggerGameOver() {
    isGameOver = true;
    finalScoreSpan.innerText = score;
    gameOverScreen.classList.remove('hidden');
    // Stop the game loop by not calling requestAnimationFrame again
}


// Handle window resizing
window.addEventListener('resize', () => {
    canvasWidth = window.innerWidth;
    canvasHeight = window.innerHeight;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
});

function shaking() {

}

// --- START GAME ---
// Start spawing after 1 second
setTimeout(spawnWord, 1000);
// Start the animation loop
update();