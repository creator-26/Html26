// Sistema de High Score con localStorage
let highScore = localStorage.getItem('carrerasHighScore') || 0;
document.getElementById('highScoreDisplay').innerText = `Mejor puntuación: ${highScore}`;

// Variables mejoradas
const gameAudio = document.getElementById('gameAudio');
const collisionSound = document.getElementById('collisionSound');
const powerupSound = document.getElementById('powerupSound');
const auto = document.getElementById("auto");
const gameContainer = document.querySelector(".game-container");
const pantallaPerdiste = document.getElementById("pantallaPerdiste");
const pantallaGanaste = document.getElementById("pantallaGanaste");
const finalScore = document.getElementById("finalScore");
const finalScoreWin = document.getElementById("finalScoreWin");
const puntajeTexto = document.getElementById("puntaje");
const nivelTexto = document.getElementById("nivel");
const vidasTexto = document.getElementById("vidas");
const startScreen = document.getElementById("startScreen");

let autoPos = 138;
let velocidadBase = 3;
let velocidadActual = 3;
let puntuacion = 0;
let nivel = 1;
let vidas = 3;
let jugando = false;
let moviendoIzquierda = false;
let moviendoDerecha = false;
let obstaculos = [];
let powerUps = [];
let frames = 0;
let animacionId = null;
let invulnerable = false;
let invulnerableTime = 0;

// Sistema de partículas
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
        obs.style.left = Math.random() * 240 + "px";
        obs.style.top = (-60 - (i * 180)) + "px";
        gameContainer.appendChild(obs);
        obstaculos.push(obs);
    }
}

function crearPowerUp() {
    if (Math.random() < 0.3 && powerUps.length === 0) {
        const powerUp = document.createElement("div");
        powerUp.className = "power-up";
        powerUp.innerHTML = "⭐";
        powerUp.style.left = Math.random() * 240 + "px";
        powerUp.style.top = "-60px";
        gameContainer.appendChild(powerUp);
        powerUps.push(powerUp);
    }
}

function moverAuto() {
    if (!jugando) return;
    
    const velocidad = 4;
    
    if (moviendoIzquierda && autoPos > 5) {
        autoPos -= velocidad;
        auto.style.transform = "rotate(-8deg) translateZ(0)";
    }
    if (moviendoDerecha && autoPos < 265) {
        autoPos += velocidad;
        auto.style.transform = "rotate(8deg) translateZ(0)";
    }
    if (!moviendoIzquierda && !moviendoDerecha) {
        auto.style.transform = "rotate(0deg) translateZ(0)";
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
    const margen = esPowerUp ? 10 : 5;
    
    const colision = autoRect.left < elementRect.right - margen &&
                   autoRect.right > elementRect.left + margen &&
                   autoRect.top < elementRect.bottom - margen &&
                   autoRect.bottom > elementRect.top + margen;
    
    return colision;
}

function gameLoop() {
    if (!jugando) return;
    
    animacionId = requestAnimationFrame(gameLoop);
    frames++;
    
    // Mover auto
    moverAuto();
    
    // Actualizar invulnerabilidad
    if (invulnerable) {
        invulnerableTime--;
        auto.style.opacity = invulnerableTime % 10 < 5 ? '0.5' : '1';
        if (invulnerableTime <= 0) {
            invulnerable = false;
            auto.style.opacity = '1';
        }
    }
    
    // Mover y crear obstáculos
    if (frames % 2 === 0) {
        obstaculos.forEach(obs => {
            let top = parseFloat(obs.style.top) || 0;
            top += velocidadActual;
            
            if (top >= 560) {
                top = -60;
                obs.style.left = Math.random() * 250 + "px";
                puntuacion += 1;
                puntajeTexto.innerText = `Puntos: ${puntuacion}`;
                actualizarNivel();
            }
            
            obs.style.top = top + "px";
            
            if (!invulnerable && detectarColision(obs)) {
                collisionSound.currentTime = 0;
                collisionSound.play().catch(() => {});
                crearExplosion(autoPos + 22, 450);
                vidas--;
                actualizarVidas();
                
                if (vidas <= 0) {
                    finDelJuego();
                } else {
                    invulnerable = true;
                    invulnerableTime = 120; // 2 segundos a 60fps
                }
            }
        });
        
        // Mover power-ups
        powerUps.forEach((powerUp, index) => {
            let top = parseFloat(powerUp.style.top) || 0;
            top += velocidadActual;
            
            if (top >= 560) {
                powerUp.remove();
                powerUps.splice(index, 1);
                return;
            }
            
            powerUp.style.top = top + "px";
            
            if (detectarColision(powerUp, true)) {
                powerupSound.currentTime = 0;
                powerupSound.play().catch(() => {});
                powerUp.remove();
                powerUps.splice(index, 1);
                puntuacion += 5;
                puntajeTexto.innerText = `Puntos: ${puntuacion}`;
                invulnerable = true;
                invulnerableTime = 180; // 3 segundos
            }
        });
        
        // Crear power-ups ocasionalmente
        if (frames % 300 === 0) crearPowerUp();
    }
    
    // Verificar victoria
    if (puntuacion >= 200) {
        victoria();
    }
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
    
    const startMove = (e, direccion, btn) => {
        e.preventDefault();
        if (direccion === 'izq') moviendoIzquierda = true;
        else moviendoDerecha = true;
        btn.classList.add('pressed');
    };
    
    const stopMove = (e, direccion, btn) => {
        e.preventDefault();
        if (direccion === 'izq') moviendoIzquierda = false;
        else moviendoDerecha = false;
        btn.classList.remove('pressed');
    };
    
    // Touch events
    btnIzquierda.addEventListener("touchstart", (e) => startMove(e, 'izq', btnIzquierda), {passive: false});
    btnIzquierda.addEventListener("touchend", (e) => stopMove(e, 'izq', btnIzquierda), {passive: false});
    btnDerecha.addEventListener("touchstart", (e) => startMove(e, 'der', btnDerecha), {passive: false});
    btnDerecha.addEventListener("touchend", (e) => stopMove(e, 'der', btnDerecha), {passive: false});
    
    // Mouse events
    btnIzquierda.addEventListener("mousedown", (e) => startMove(e, 'izq', btnIzquierda));
    btnIzquierda.addEventListener("mouseup", (e) => stopMove(e, 'izq', btnIzquierda));
    btnDerecha.addEventListener("mousedown", (e) => startMove(e, 'der', btnDerecha));
    btnDerecha.addEventListener("mouseup", (e) => stopMove(e, 'der', btnDerecha));
    
    // Cancel events
    btnIzquierda.addEventListener("touchcancel", () => {
        moviendoIzquierda = false;
        btnIzquierda.classList.remove('pressed');
    });
    btnDerecha.addEventListener("touchcancel", () => {
        moviendoDerecha = false;
        btnDerecha.classList.remove('pressed');
    });
    
    // Keyboard support
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            moviendoIzquierda = true;
            btnIzquierda.classList.add('pressed');
        }
        if (e.key === 'ArrowRight') {
            moviendoDerecha = true;
            btnDerecha.classList.add('pressed');
        }
    });
    
    document.addEventListener('keyup', (e) => {
        if (e.key === 'ArrowLeft') {
            moviendoIzquierda = false;
            btnIzquierda.classList.remove('pressed');
        }
        if (e.key === 'ArrowRight') {
            moviendoDerecha = false;
            btnDerecha.classList.remove('pressed');
        }
    });
}

function finDelJuego() {
    jugando = false;
    collisionSound.play().catch(() => {});
    
    // Actualizar highscore
    if (puntuacion > highScore) {
        highScore = puntuacion;
        localStorage.setItem('carrerasHighScore', highScore);
        document.getElementById('newRecord').style.display = 'block';
    } else {
        document.getElementById('newRecord').style.display = 'none';
    }
    
    finalScore.innerText = `Puntuación: ${puntuacion} | Nivel: ${nivel}`;
    pantallaPerdiste.style.display = "flex";
    gameAudio.pause();
    gameAudio.currentTime = 0;
}

function victoria() {
    jugando = false;
    finalScoreWin.innerText = `¡Llegaste a ${puntuacion} puntos!`;
    pantallaGanaste.style.display = "flex";
    gameAudio.pause();
    gameAudio.currentTime = 0;
}

function reiniciarJuego() {
    cancelAnimationFrame(animacionId);
    animacionId = null;
    
    jugando = false;
    pantallaPerdiste.style.display = "none";
    pantallaGanaste.style.display = "none";
    
    // Resetear variables
    autoPos = 138;
    auto.style.left = autoPos + "px";
    auto.style.transform = "rotate(0deg)";
    auto.style.opacity = "1";
    puntuacion = 0;
    nivel = 1;
    vidas = 3;
    velocidadActual = velocidadBase;
    invulnerable = false;
    invulnerableTime = 0;
    frames = 0;
    
    puntajeTexto.innerText = "Puntos: 0";
    nivelTexto.innerText = "Nivel: 1";
    actualizarVidas();
    
    // Limpiar elementos
    obstaculos.forEach(obs => obs.remove());
    powerUps.forEach(pu => pu.remove());
    obstaculos = [];
    powerUps = [];
    
    // Mostrar pantalla de inicio
    document.getElementById('highScoreDisplay').innerText = `Mejor puntuación: ${highScore}`;
    startScreen.style.display = 'flex';
}

function iniciarJuego() {
    startScreen.style.display = 'none';
    jugando = true;
    
    crearObstaculos();
    configurarControles();
    
    // Forzar la carga y reproducción del audio
    gameAudio.load();
    gameAudio.volume = 0.5;
    gameAudio.play()
        .then(() => console.log("✅ Audio reproduciéndose"))
        .catch(e => console.error("❌ Error al reproducir:", e));
    
    gameLoop();
}

// Inicialización
document.getElementById('startButton').addEventListener('click', iniciarJuego);

// Prevenir zoom en móviles
document.addEventListener('touchmove', function(e) {
    e.preventDefault();
}, { passive: false });
