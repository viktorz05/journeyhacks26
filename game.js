const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreSpan = document.getElementById('finalScore');

// --- CONFIGURATION ---
let canvasWidth = window.innerWidth;
let canvasHeight = window.innerHeight;
canvas.width = canvasWidth;
canvas.height = canvasHeight;

// He reducido la lista y repetido palabras para que pruebes los COMBOS fácilmente
const wordList = [
    "hack", "hack", "code", "code", "java", "java",
    "bug", "fix", "data", "loop", "loop", "if", "else",
    "try", "catch", "void", "null", "int", "float"
];

const rebootSound = new Audio('reboot.m4a');
const completionSounds = [
    new Audio('completition1.m4a'),
    new Audio('completition3.m4a'),
    new Audio('completition4.m4a'),
    new Audio("completition5.m4a"),
    new Audio("completition6.m4a"),
    new Audio("completition7.m4a"),
    new Audio("completition8.m4a")
];

function playRandomSound() {
    const randomIndex = Math.floor(Math.random() * completionSounds.length);
    const soundToPlay = completionSounds[randomIndex];
    const clone = soundToPlay.cloneNode();
    clone.volume = 0.6;
    clone.play().catch(e => console.log("Sound effect error:", e));
}

const bgMusic = new Audio('background.mp3');
bgMusic.loop = true;   // Que se repita infinitamente
bgMusic.volume = 0.3;  // Volumen bajo (30%) para no molestar

// Bandera para iniciar la música con la primera tecla (Política de navegadores)
let hasGameStarted = false;

// --- GAME STATE ---
let wordsOnScreen = [];
let score = 0;
let highScore = localStorage.getItem('hackathonHighScore') || 0;
let isGameOver = false;
let spawnRate = 2000;
let fallSpeed = 1.0;

let targetIndex = 0;

// --- CORE FUNCTIONS ---

function spawnWord() {
    if (isGameOver) return;

    const text = wordList[Math.floor(Math.random() * wordList.length)];
    const x = Math.random() * (canvasWidth - 150) + 50;

    wordsOnScreen.push({
        text: text,
        x: x,
        y: -30,
        vy: 0,
        isDead: false,
        shakeTimer: 0,
        shakingCharIndex: -1
    });

    if (spawnRate > 500) spawnRate -= 50;
    if (fallSpeed < 5) fallSpeed += 0.05;

    setTimeout(spawnWord, spawnRate);
}

function update() {
    if (isGameOver) return;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // 1. Identificar al LÍDER (La palabra más antigua/baja)
    const leader = wordsOnScreen.find(w => !w.isDead);

    drawUI(leader);

    for (let i = wordsOnScreen.length - 1; i >= 0; i--) {
        let wordObj = wordsOnScreen[i];

        // --- MOVIMIENTO ---
        if (wordObj.isDead) {
            wordObj.vy += 1;
            wordObj.y += wordObj.vy;

            if (wordObj.y > canvasHeight + 50) {
                wordsOnScreen.splice(i, 1);
                continue;
            }
        } else {
            wordObj.y += fallSpeed;
            if (wordObj.y > canvasHeight - 20) {
                triggerGameOver();
            }
        }

        if (wordObj.shakeTimer > 0) wordObj.shakeTimer--;

        // --- DIBUJAR ---
        // Pasamos el 'leader' para saber quiénes son del grupo activo
        drawWordCombo(wordObj, leader);
    }

    requestAnimationFrame(update);
}

// --- DIBUJADO CON LÓGICA DE COMBO ---

function drawWordCombo(wordObj, leader) {
    ctx.font = "bold 24px Courier New";
    let currentX = wordObj.x;

    // ¿Es esta palabra parte del combo activo?
    // Sí, si existe un líder Y esta palabra tiene el mismo texto que el líder.
    const isPartOfCombo = (leader && wordObj.text === leader.text);

    for (let i = 0; i < wordObj.text.length; i++) {
        let char = wordObj.text[i];

        // Temblor
        let offsetX = 0;
        let offsetY = 0;
        if (wordObj.shakeTimer > 0 && i === wordObj.shakingCharIndex) {
            const intensity = 5;
            offsetX = (Math.random() - 0.5) * intensity;
            offsetY = (Math.random() - 0.5) * intensity;
        }

        // --- COLORES ---
        if (wordObj.isDead) {
            ctx.fillStyle = "#33ff33";
        }
        else if (isPartOfCombo) {
            // Es parte del grupo activo (Combo)
            if (i < targetIndex) {
                ctx.fillStyle = "#33ff33"; // Verde (letras ya escritas)
            } else {
                ctx.fillStyle = "#ffffff"; // Blanco (letras pendientes)
            }
        }
        else {
            // No es el turno de esta palabra
            ctx.fillStyle = "#ffffff";
        }

        ctx.fillText(char, currentX + offsetX, wordObj.y + offsetY);
        currentX += ctx.measureText(char).width;
    }

    // Indicador de combo (Flecha doble si es parte del combo)
    if (isPartOfCombo && !wordObj.isDead) {
        ctx.fillStyle = "#ffff00";
        ctx.fillText("<<", currentX + 5, wordObj.y);
    }
}

function drawUI(leader) {
    ctx.fillStyle = "#33ff33";
    ctx.font = "20px Courier New";
    ctx.fillText("SCORE: " + score, 20, 30);

    ctx.fillStyle = "#ffcc00"; // Amarillo
    ctx.textAlign = "right";
    ctx.fillText("MAX: " + highScore, canvasWidth - 20, 30);
    ctx.textAlign = "left"; // Resetear alineación

    if (leader) {
        // Contamos cuántas palabras iguales hay en pantalla para avisar del combo
        const comboCount = wordsOnScreen.filter(w => !w.isDead && w.text === leader.text).length;

        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";

        let text = "TARGET: " + leader.text.toUpperCase();
        if (comboCount > 1) text += " (COMBO x" + comboCount + "!)";

        ctx.fillText(text, canvasWidth / 2, canvasHeight - 30);
        ctx.textAlign = "start";
    }
}

// --- INPUT HANDLING (COMBO) ---

window.addEventListener('keydown', (e) => {
    if (isGameOver) return;

    if (!hasGameStarted) {
        bgMusic.play().catch(e => console.log("Music failed:", e));
        hasGameStarted = true;
    }

    if (!e.key.match(/^[a-z]$/i)) return;

    const key = e.key.toLowerCase();

    // 1. Buscamos al Líder (el más bajo)
    const leader = wordsOnScreen.find(w => !w.isDead);
    if (!leader) return;

    // 2. Buscamos a TODOS los que son iguales al líder (El Grupo Combo)
    const comboGroup = wordsOnScreen.filter(w => !w.isDead && w.text === leader.text);

    // 3. Verificamos la letra contra el líder
    const nextCharNeeded = leader.text[targetIndex];

    if (key === nextCharNeeded) {
        // ¡ACIERTO!

        // Afectamos a TODOS los miembros del grupo
        comboGroup.forEach(word => {
            word.shakingCharIndex = targetIndex; // Todos tiemblan en esa letra
            word.shakeTimer = 5;
        });

        targetIndex++;

        // ¿Palabra terminada?
        if (targetIndex >= leader.text.length) {

            playRandomSound();
            // ¡MATAR A TODO EL GRUPO!
            comboGroup.forEach(word => {
                word.isDead = true;
                word.vy = 5;
            });

            // Puntos extra por combo (10 pts por palabra)
            score += 10 * comboGroup.length;

            targetIndex = 0;
        }
    }
});

function triggerGameOver() {
    isGameOver = true;

    bgMusic.pause();
    bgMusic.currentTime = 0; // Reiniciar la canción al principio

    // NUEVO: Lógica de guardado
    let message = score;

    // Si superamos el récord, actualizamos y guardamos
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('hackathonHighScore', highScore);
        message += " (NEW RECORD!)";
    }

    finalScoreSpan.innerText = message;
    gameOverScreen.classList.remove('hidden');

    const rebootBtn = document.querySelector('#gameOverScreen button');

    if (rebootBtn) {
        // 1. Le quitamos el "onclick" que tenía en el HTML (para que no recargue directo)
        rebootBtn.removeAttribute("onclick");

        // 2. Le ponemos nuestra propia función
        rebootBtn.addEventListener('click', () => {
            // Reproducir sonido
            rebootSound.play().catch(e => console.log(e));

            // Esperar 500 milisegundos (0.5 seg) para que se escuche algo del sonido
            setTimeout(() => {
                location.reload();
            }, 500);
        });
    }
}

window.addEventListener('resize', () => {
    canvasWidth = window.innerWidth;
    canvasHeight = window.innerHeight;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
});

// START
setTimeout(spawnWord, 1000);
update();