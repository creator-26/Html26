// High Score
let highScore = localStorage.getItem('carrerasHighScore') || 0;
document.getElementById('highScoreDisplay').innerText = `Mejor puntuación: ${highScore}`;

// --- SISTEMA DE VEHÍCULOS ---
const vehiculos = [
    { id: 1, nombre: 'Rojo Clásico', archivo: 'autos/auto1.png', desbloqueado: true, nivelRequerido: 0 },
    { id: 2, nombre: 'Azul Velocista', archivo: 'autos/auto2.png', desbloqueado: true, nivelRequerido: 0 },
    { id: 3, nombre: 'Camión Monstruo', archivo: 'autos/auto3.png', desbloqueado: false, nivelRequerido: 4 },
    { id: 4, nombre: 'Super Camión', archivo: 'autos/auto4.png', desbloqueado: false, nivelRequerido: 5 },
    { id: 5, nombre: 'Shadow Tank', archivo: 'autos/auto5.png', desbloqueado: false, nivelRequerido: 6 }
];
// Cargar desbloqueos guardados
let desbloqueosGuardados = JSON.parse(localStorage.getItem('vehiculosDesbloqueados')) || [];
// Aplicar el estado guardado al array de vehículos
vehiculos.forEach(v => {
    if (desbloqueosGuardados.includes(v.id)) {
        v.desbloqueado = true;
    }
});

let vehiculoSeleccionado = parseInt(localStorage.getItem('vehiculoSeleccionado')) || 1;

function aplicarVehiculoSeleccionado() {
    const vehiculo = vehiculos.find(v => v.id === vehiculoSeleccionado);
    if (vehiculo) {
        auto.style.backgroundImage = `url('${vehiculo.archivo}')`;
    }
}

function actualizarGaraje() {
    const cards = document.querySelectorAll('.vehiculo-card');
    cards.forEach(card => {
        const id = parseInt(card.getAttribute('data-vehiculo'));
        const vehiculo = vehiculos.find(v => v.id === id);
        if (!vehiculo) return;

        card.classList.remove('seleccionado', 'bloqueado');
        const estadoDiv = card.querySelector('.vehiculo-estado');

        if (!vehiculo.desbloqueado) {
            card.classList.add('bloqueado');
            estadoDiv.innerHTML = `<span class="estado-bloqueado">🔒 BLOQUEADO - Nivel ${vehiculo.nivelRequerido}</span>`;
        } else if (id === vehiculoSeleccionado) {
            card.classList.add('seleccionado');
            estadoDiv.innerHTML = `
                        <span class="estado-seleccionado">✓ Seleccionado</span>
                        <span class="estado-actual">Clásico (Actual)</span>
                    `;
        } else {
            estadoDiv.innerHTML = `
                        <button class="btn-seleccionar" data-vehiculo="${id}">SELECCIONAR</button>
                    `;
        }
    });

    document.querySelectorAll('.btn-seleccionar').forEach(btn => {
        btn.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
            e.preventDefault();
            const id = parseInt(btn.getAttribute('data-vehiculo'));
            seleccionarVehiculo(id);
        });
    });
}

function seleccionarVehiculo(id) {
    const vehiculo = vehiculos.find(v => v.id === id);
    if (!vehiculo || !vehiculo.desbloqueado) return;
    vehiculoSeleccionado = id;
    localStorage.setItem('vehiculoSeleccionado', id);
    aplicarVehiculoSeleccionado();
    actualizarGaraje();
}

function verificarDesbloqueos() {
    let huboCambio = false;
    vehiculos.forEach(v => {
        if (!v.desbloqueado && nivel >= v.nivelRequerido) {
            v.desbloqueado = true;
            huboCambio = true;
        }
    });
    if (huboCambio) {
        // Guardar en localStorage la lista de IDs desbloqueados
        const idsDesbloqueados = vehiculos
            .filter(v => v.desbloqueado)
            .map(v => v.id);
        localStorage.setItem('vehiculosDesbloqueados', JSON.stringify(idsDesbloqueados));
        actualizarGaraje();
    }
}

// --- GARAJE UI ---
const pantallaGaraje = document.getElementById('pantallaGaraje');
const btnElegirVehiculo = document.getElementById('btnElegirVehiculo');
const btnCerrarGaraje = document.getElementById('btnCerrarGaraje');

btnElegirVehiculo.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    actualizarGaraje();
    pantallaGaraje.style.display = 'flex';
});

btnCerrarGaraje.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    pantallaGaraje.style.display = 'none';
});

// --- FIN SISTEMA DE VEHÍCULOS ---

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

const btnPausa = document.getElementById("btnPausa");
const pantallaPausa = document.getElementById("pantallaPausa");
const btnReanudar = document.getElementById("btnReanudar");
const btnSalirMenu = document.getElementById("btnSalirMenu");

const gameAudio = document.getElementById('gameAudio');
const collisionSound = document.getElementById('collisionSound');
const powerupSound = document.getElementById('powerupSound');

let screenWidth = window.innerWidth;
let screenHeight = window.innerHeight;
let autoWidth = 60;

let autoPos = (screenWidth / 2) - (autoWidth / 2);
let velocidadBase = 4;
let velocidadActual = 4;
let puntuacion = 0;
let nivel = 1;
let vidas = 3;
let jugando = false;
let enPausa = false;
let moviendoIzquierda = false;
let moviendoDerecha = false;
let obstaculos = [];
let powerUps = [];
let frames = 0;
let animacionId = null;
let invulnerable = false;
let invulnerableTime = 0;

// Aplicar vehículo guardado al cargar
aplicarVehiculoSeleccionado();

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
    if (!jugando || enPausa) return;
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
    verificarDesbloqueos();
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
            if (collisionSound) { collisionSound.currentTime = 0;
                collisionSound.play().catch(() => {}); }

            if ("vibrate" in navigator) {
                navigator.vibrate(300);
            }

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
            if (powerupSound) { powerupSound.currentTime = 0;
                powerupSound.play().catch(() => {}); }
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
    
    // Elimina listeners previos para evitar duplicados al reiniciar
    const nuevosBtnIzq = btnIzquierda.cloneNode(true);
    const nuevosBtnDer = btnDerecha.cloneNode(true);
    btnIzquierda.parentNode.replaceChild(nuevosBtnIzq, btnIzquierda);
    btnDerecha.parentNode.replaceChild(nuevosBtnDer, btnDerecha);
    
    // Referencias actualizadas
    const btnIzq = document.getElementById("btnIzquierda");
    const btnDer = document.getElementById("btnDerecha");
    
    const pressIzq = (e) => {
        e.preventDefault();
        moviendoIzquierda = true;
        moviendoDerecha = false;
        btnIzq.classList.add('pressed');
        // Vibración ligera al presionar (opcional)
        if (navigator.vibrate) navigator.vibrate(10);
    };
    
    const pressDer = (e) => {
        e.preventDefault();
        moviendoDerecha = true;
        moviendoIzquierda = false;
        btnDer.classList.add('pressed');
        if (navigator.vibrate) navigator.vibrate(10);
    };
    
    const releaseIzq = (e) => {
        e.preventDefault();
        moviendoIzquierda = false;
        btnIzq.classList.remove('pressed');
    };
    
    const releaseDer = (e) => {
        e.preventDefault();
        moviendoDerecha = false;
        btnDer.classList.remove('pressed');
    };
    
    // Listeners táctiles y de mouse
    btnIzq.addEventListener('pointerdown', pressIzq);
    btnDer.addEventListener('pointerdown', pressDer);
    
    // Se liberan al levantar el dedo EN CUALQUIER LUGAR de la pantalla
    // Esto evita que el movimiento se detenga si el dedo se sale del botón
    document.addEventListener('pointerup', (e) => {
        if (moviendoIzquierda) releaseIzq(e);
        if (moviendoDerecha) releaseDer(e);
    });
    
    // También liberamos si se cancela el puntero (ej. gesto del sistema)
    document.addEventListener('pointercancel', (e) => {
        moviendoIzquierda = false;
        moviendoDerecha = false;
        btnIzq.classList.remove('pressed');
        btnDer.classList.remove('pressed');
    });
    
    // Prevenir menú contextual en los botones
    btnIzq.addEventListener('contextmenu', (e) => e.preventDefault());
    btnDer.addEventListener('contextmenu', (e) => e.preventDefault());
    
    // Evitar scroll accidental al tocar los botones
    btnIzq.style.touchAction = 'none';
    btnDer.style.touchAction = 'none';
}

function pausarJuego() {
    if (!jugando || enPausa) return;
    enPausa = true;
    pantallaPausa.style.display = "flex";
    btnPausa.style.display = "none";
    if (gameAudio) gameAudio.pause();
}

function reanudarJuego() {
    enPausa = false;
    pantallaPausa.style.display = "none";
    btnPausa.style.display = "flex";
    if (gameAudio) gameAudio.play().catch(() => {});
}

function salirAlMenu(e) {
    if (e) e.preventDefault();
     removerControlesTeclado();

    enPausa = false;
    jugando = false;
    cancelAnimationFrame(animacionId);
    pantallaPausa.style.display = "none";
    btnPausa.style.display = "none";

    if (gameAudio) {
        gameAudio.pause();
        gameAudio.currentTime = 0;
    }

    puntuacion = 0;
    nivel = 1;
    vidas = 3;
    velocidadActual = velocidadBase;
    invulnerable = false;

    puntajeTexto.innerText = "Puntos: 0";
    nivelTexto.innerText = "Nivel: 1";
    actualizarVidas();

    auto.style.opacity = "1";
    obstaculos.forEach(obs => obs.remove());
    powerUps.forEach(pu => pu.remove());
    obstaculos = [];
    powerUps = [];

    document.getElementById('highScoreDisplay').innerText = `Mejor puntuación: ${highScore}`;

    setTimeout(() => {
        startScreen.style.display = 'flex';
    }, 300);
}

btnPausa.addEventListener('pointerdown', pausarJuego);
btnReanudar.addEventListener('pointerdown', reanudarJuego);
btnSalirMenu.addEventListener('pointerdown', (e) => salirAlMenu(e));

function finDelJuego() {
    removerControlesTeclado();
    jugando = false;
    btnPausa.style.display = "none";
    if (collisionSound) collisionSound.play().catch(() => {});

    if (puntuacion > highScore) {
        highScore = puntuacion;
        localStorage.setItem('carrerasHighScore', highScore);
        document.getElementById('newRecord').style.display = 'block';
    } else {
        document.getElementById('newRecord').style.display = 'none';
    }

    finalScore.innerText = `Puntuación: ${puntuacion} | Nivel: ${nivel}`;
    pantallaPerdiste.style.display = "flex";
    if (gameAudio) gameAudio.pause();
}

function victoria() {
    removerControlesTeclado();
    jugando = false;
    btnPausa.style.display = "none";
    finalScoreWin.innerText = `¡Llegaste a ${puntuacion} puntos!`;
    pantallaGanaste.style.display = "flex";
    if (gameAudio) gameAudio.pause();
}

function reiniciarJuego() {
    removerControlesTeclado();
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
    iniciarJuego();
}

// --- CONTROLES DE TECLADO (PC) ---
function manejarKeyDown(e) {
    // Solo si el juego está activo y no en pausa
    if (!jugando || enPausa) return;

    if (e.key === 'ArrowLeft' || e.key === 'Left' || e.key === 'a' || e.key === 'A') {
        e.preventDefault(); // evitar scroll horizontal
        moviendoIzquierda = true;
        moviendoDerecha = false;
    }
    if (e.key === 'ArrowRight' || e.key === 'Right' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        moviendoDerecha = true;
        moviendoIzquierda = false;
    }
}

function manejarKeyUp(e) {
    if (e.key === 'ArrowLeft' || e.key === 'Left' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        moviendoIzquierda = false;
    }
    if (e.key === 'ArrowRight' || e.key === 'Right' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        moviendoDerecha = false;
    }
}

function agregarControlesTeclado() {
    document.addEventListener('keydown', manejarKeyDown);
    document.addEventListener('keyup', manejarKeyUp);
}

function removerControlesTeclado() {
    document.removeEventListener('keydown', manejarKeyDown);
    document.removeEventListener('keyup', manejarKeyUp);
}

function iniciarJuego() {
    startScreen.style.display = 'none';
    btnPausa.style.display = "flex";
    jugando = true;
    enPausa = false;

    screenWidth = window.innerWidth;
    screenHeight = window.innerHeight;
    autoPos = (screenWidth / 2) - (autoWidth / 2);
    auto.style.left = autoPos + "px";

    aplicarVehiculoSeleccionado();
    crearObstaculos();
    configurarControles();
    agregarControlesTeclado();

    if (gameAudio) {
        gameAudio.currentTime = 0;
        gameAudio.volume = 0.5;
        gameAudio.play().catch(() => {});
    }

    gameLoop();
}

document.getElementById('startButton').addEventListener('click', iniciarJuego);
