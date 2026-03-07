// High Score
let highScore = localStorage.getItem('carrerasHighScore') || 0;
document.getElementById('highScoreDisplay').innerText = `Mejor puntuación: ${highScore}`;

// Elementos
const auto = document.getElementById("auto");
const gameContainer = document.querySelector(".game-container");
const pantallaPerdiste = document.getElementById("pantallaPerdiste");
const pantallaGanaste = document.getElementById("pantallaGanaste");
const puntajeTexto = document.getElementById("puntaje");
const nivelTexto = document.getElementById("nivel");
const vidasTexto = document.getElementById("vidas");
const startScreen = document.getElementById("startScreen");
const finalScore = document.getElementById("finalScore");
const finalScoreWin = document.getElementById("finalScoreWin");

// NUEVOS Elementos de Pausa
const btnPausa = document.getElementById("btnPausa");
const pantallaPausa = document.getElementById("pantallaPausa");
const btnReanudar = document.getElementById("btnReanudar");
const btnSalirMenu = document.getElementById("btnSalirMenu");

// Audios
const gameAudio = document.getElementById('gameAudio');
const collisionSound = document.getElementById('collisionSound');
const powerupSound = document.getElementById('powerupSound');

// Dimensiones dinámicas de la pantalla
let screenWidth = window.innerWidth;
let screenHeight = window.innerHeight;
let autoWidth = 60; 

// Variables del juego
let autoPos = (screenWidth / 2) - (autoWidth / 2);
let velocidadBase = 4;
let velocidadActual = 4;
let puntuacion = 0;
let nivel = 1;
let vidas = 3;
let jugando = false;
let enPausa = false; // NUEVA VARIABLE PARA LA PAUSA
let moviendoIzquierda = false;
let moviendoDerecha = false;
let obstaculos = [];
let powerUps = [];
let frames = 0;
let animacionId = null;
let invulnerable = false;
let invulnerableTime = 0;

// Actualizar dimensiones si se gira el móvil
window.addEventListener('resize', () => {
    screenWidth = window.innerWidth;
    screenHeight = window.innerHeight;
    if (autoPos > screenWidth - autoWidth) autoPos = screenWidth - autoWidth;
});

function crearExplosion(x, y) {
    const explosion = document.createElement('div');
    explosion.className = 'explosion';
    explosion.innerHTML = '💥';
    explosion.style.left = x + 'px';
    explosion.style.top = y + 'px';
    gameContainer.appendChild(explosion);
    setTimeout(() => explosion.remove(), 500);
}

function crearObstaculos() {
    obstaculos.forEach(obs => obs.remove());
    obstaculos = [];
    for (let i = 0; i < 3; i++) {
        const obs = document.createElement("div");
        obs.className = "obstaculo";
        obs.innerHTML = "🚧";
        obs.style.left = Math.random() * (screenWidth - 60) + "px";
        obs.style.top = (-120 - (i * (screenHeight / 3))) + "px";
        gameContainer.appendChild(obs);
        obstaculos.push(obs);
    }
}

function crearPowerUp() {
    if (Math.random() < 0.3 && powerUps.length === 0) {
        const powerUp = document.createElement("div");
        powerUp.className = "power-up";
        powerUp.innerHTML = "⭐";
        powerUp.style.left = Math.random() * (screenWidth - 60) + "px";
        powerUp.style.top = "-100px";
        gameContainer.appendChild(powerUp);
        powerUps.push(powerUp);
    }
}

function moverAuto() {
    if (!jugando || enPausa) return; // Si está en pausa, no se mueve
    const velocidad = screenWidth * 0.02; 
    const margen = 5;
    const limiteIzq = margen;
    const limiteDer = screenWidth - autoWidth - margen;
    
    if (moviendoIzquierda && autoPos > limiteIzq) {
        autoPos -= velocidad;
        auto.style.transform = "rotate(-8deg)";
    }
    if (moviendoDerecha && autoPos < limiteDer) {
        autoPos += velocidad;
        auto.style.transform = "rotate(8deg)";
    }
    if (!moviendoIzquierda && !moviendoDerecha) {
        auto.style.transform = "rotate(0deg)";
    }
    auto.style.left = autoPos + "px";
}

function actualizarNivel() {
    nivel = Math.floor(puntuacion / 20) + 1;
    nivelTexto.innerText = `Nivel: ${nivel}`;
    velocidadActual = velocidadBase + (nivel * 0.5);
}

function detectarColision(elemento, esPowerUp = false) {
    const autoRect = auto.getBoundingClientRect();
    const elementRect = elemento.getBoundingClientRect();
    const margen = esPowerUp ? 10 : 15; 
    
    return autoRect.left < elementRect.right - margen &&
           autoRect.right > elementRect.left + margen &&
           autoRect.top < elementRect.bottom - margen &&
           autoRect.bottom > elementRect.top + margen;
}

function gameLoop() {
    if (!jugando) return;
    animacionId = requestAnimationFrame(gameLoop);
    
    // NUEVO: ¡Magia de la pausa! Si está en pausa, congela todo aquí y no ejecuta lo de abajo
    if (enPausa) return; 
    
    frames++;
    moverAuto();
    
    if (invulnerable) {
        invulnerableTime--;
        auto.style.opacity = invulnerableTime % 10 < 5 ? '0.5' : '1';
        if (invulnerableTime <= 0) {
            invulnerable = false;
            auto.style.opacity = '1';
        }
    }
    
    obstaculos.forEach(obs => {
        let top = parseFloat(obs.style.top) || 0;
        top += velocidadActual;
        
        if (top >= screenHeight) {
            top = -100;
            obs.style.left = Math.random() * (screenWidth - 60) + "px";
            puntuacion += 1;
            puntajeTexto.innerText = `Puntos: ${puntuacion}`;
            actualizarNivel();
        }
        obs.style.top = top + "px";
        
        if (!invulnerable && detectarColision(obs)) {
            if(collisionSound) { collisionSound.currentTime = 0; collisionSound.play().catch(()=>{}); }
            const autoRect = auto.getBoundingClientRect();
            crearExplosion(autoRect.left, autoRect.top);
            
            vidas--;
            actualizarVidas();
            
            if (vidas <= 0) {
                finDelJuego();
            } else {
                invulnerable = true;
                invulnerableTime = 120;
            }
        }
    });
    
    powerUps.forEach((powerUp, index) => {
        let top = parseFloat(powerUp.style.top) || 0;
        top += velocidadActual;
        
        if (top >= screenHeight) {
            powerUp.remove();
            powerUps.splice(index, 1);
            return;
        }
        powerUp.style.top = top + "px";
        
        if (detectarColision(powerUp, true)) {
            if(powerupSound) { powerupSound.currentTime = 0; powerupSound.play().catch(()=>{}); }
            powerUp.remove();
            powerUps.splice(index, 1);
            puntuacion += 5;
            puntajeTexto.innerText = `Puntos: ${puntuacion}`;
            invulnerable = true;
            invulnerableTime = 180;
        }
    });
    
    if (frames % 300 === 0) crearPowerUp();
    if (puntuacion >= 200) victoria();
}

function actualizarVidas() {
    let vidasDisplay = '';
    for (let i = 0; i < 3; i++) {
        vidasDisplay += i < vidas ? '❤️' : '🖤';
    }
    vidasTexto.innerHTML = vidasDisplay;
}

function configurarControles() {
    const btnIzquierda = document.getElementById("btnIzquierda");
    const btnDerecha = document.getElementById("btnDerecha");
    
    const pressButton = (e, direccion, btn) => {
        e.preventDefault(); 
        if (direccion === 'izq') {
            moviendoIzquierda = true;
            moviendoDerecha = false;
        } else {
            moviendoDerecha = true;
            moviendoIzquierda = false;
        }
        btn.classList.add('pressed');
    };
    
    const releaseButton = (e, direccion, btn) => {
        e.preventDefault();
        if (direccion === 'izq') moviendoIzquierda = false;
        if (direccion === 'der') moviendoDerecha = false;
        btn.classList.remove('pressed');
    };
    
    btnIzquierda.addEventListener("pointerdown", (e) => pressButton(e, 'izq', btnIzquierda));
    btnDerecha.addEventListener("pointerdown", (e) => pressButton(e, 'der', btnDerecha));
    btnIzquierda.addEventListener("pointerup", (e) => releaseButton(e, 'izq', btnIzquierda));
    btnDerecha.addEventListener("pointerup", (e) => releaseButton(e, 'der', btnDerecha));
    btnIzquierda.addEventListener("pointerleave", (e) => releaseButton(e, 'izq', btnIzquierda));
    btnDerecha.addEventListener("pointerleave", (e) => releaseButton(e, 'der', btnDerecha));
    btnIzquierda.addEventListener("pointercancel", (e) => releaseButton(e, 'izq', btnIzquierda));
    btnDerecha.addEventListener("pointercancel", (e) => releaseButton(e, 'der', btnDerecha));
    btnIzquierda.addEventListener("contextmenu", (e) => e.preventDefault());
    btnDerecha.addEventListener("contextmenu", (e) => e.preventDefault());
}

// --- NUEVAS FUNCIONES DE PAUSA ---
function pausarJuego() {
    if (!jugando || enPausa) return;
    enPausa = true;
    pantallaPausa.style.display = "flex";
    btnPausa.style.display = "none";
    if(gameAudio) gameAudio.pause();
}

function reanudarJuego() {
    enPausa = false;
    pantallaPausa.style.display = "none";
    btnPausa.style.display = "flex";
    if(gameAudio) gameAudio.play().catch(()=>{});
}

function salirAlMenu(e) {
    if(e) e.preventDefault(); 

    enPausa = false;
    jugando = false;
    cancelAnimationFrame(animacionId);
    pantallaPausa.style.display = "none";
    btnPausa.style.display = "none";
    
    if(gameAudio) {
        gameAudio.pause();
        gameAudio.currentTime = 0;
    }

    // --- LA SOLUCIÓN: RESETEAR TODAS LAS VARIABLES ---
    puntuacion = 0;
    nivel = 1;
    vidas = 3;
    velocidadActual = velocidadBase;
    invulnerable = false;
    
    // Actualizar los textos y corazones en la pantalla
    puntajeTexto.innerText = "Puntos: 0";
    nivelTexto.innerText = "Nivel: 1";
    actualizarVidas();
    // ------------------------------------------------

    auto.style.opacity = "1";
    obstaculos.forEach(obs => obs.remove());
    powerUps.forEach(pu => pu.remove());
    obstaculos = [];
    powerUps = [];

    document.getElementById('highScoreDisplay').innerText = `Mejor puntuación: ${highScore}`;
    
    // Esperamos un momento para evitar el "clic fantasma"
    setTimeout(() => {
        startScreen.style.display = 'flex';
    }, 300);
}


// Eventos de los botones de pausa
btnPausa.addEventListener('pointerdown', pausarJuego);
btnReanudar.addEventListener('pointerdown', reanudarJuego);
btnSalirMenu.addEventListener('pointerdown', (e) => salirAlMenu(e));

// ----------------------------------

function finDelJuego() {
    jugando = false;
    btnPausa.style.display = "none"; // Ocultar pausa al perder
    if(collisionSound) collisionSound.play().catch(()=>{});
    
    if (puntuacion > highScore) {
        highScore = puntuacion;
        localStorage.setItem('carrerasHighScore', highScore);
        document.getElementById('newRecord').style.display = 'block';
    } else {
        document.getElementById('newRecord').style.display = 'none';
    }
    
    finalScore.innerText = `Puntuación: ${puntuacion} | Nivel: ${nivel}`;
    pantallaPerdiste.style.display = "flex";
    if(gameAudio) gameAudio.pause();
}

function victoria() {
    jugando = false;
    btnPausa.style.display = "none"; // Ocultar pausa al ganar
    finalScoreWin.innerText = `¡Llegaste a ${puntuacion} puntos!`;
    pantallaGanaste.style.display = "flex";
    if(gameAudio) gameAudio.pause();
}

function reiniciarJuego() {
    cancelAnimationFrame(animacionId);
    jugando = false;
    pantallaPerdiste.style.display = "none";
    pantallaGanaste.style.display = "none";
    
    autoPos = (screenWidth / 2) - (autoWidth / 2);
    auto.style.left = autoPos + "px";
    auto.style.transform = "rotate(0deg)";
    auto.style.opacity = "1";
    puntuacion = 0;
    nivel = 1;
    vidas = 3;
    velocidadActual = velocidadBase;
    invulnerable = false;
    
    puntajeTexto.innerText = "Puntos: 0";
    nivelTexto.innerText = "Nivel: 1";
    actualizarVidas();
    
    obstaculos.forEach(obs => obs.remove());
    powerUps.forEach(pu => pu.remove());
    obstaculos = [];
    powerUps = [];
    
    document.getElementById('highScoreDisplay').innerText = `Mejor puntuación: ${highScore}`;
    iniciarJuego(); // Al darle "Jugar de nuevo" arranca directo
}

function iniciarJuego() {
    startScreen.style.display = 'none';
    btnPausa.style.display = "flex"; // Muestra el botón de pausa al iniciar
    jugando = true;
    enPausa = false;
    
    screenWidth = window.innerWidth;
    screenHeight = window.innerHeight;
    autoPos = (screenWidth / 2) - (autoWidth / 2);
    auto.style.left = autoPos + "px";

    crearObstaculos();
    configurarControles();
    
    if(gameAudio) {
        gameAudio.currentTime = 0;
        gameAudio.volume = 0.5;
        gameAudio.play().catch(() => {});
    }
    
    gameLoop();
}

document.getElementById('startButton').addEventListener('click', iniciarJuego);
