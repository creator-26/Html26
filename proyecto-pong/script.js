document.addEventListener('DOMContentLoaded', () => {
    // Obtener elementos del DOM
    const canvas = document.getElementById("game");
    const ctx = canvas.getContext("2d");
    const startScreen = document.getElementById("startScreen");
    const startBtn = document.getElementById("startBtn");
    const diffBtns = document.querySelectorAll(".diff-btn");
    const p1Display = document.getElementById("p1Display");
    const p2Display = document.getElementById("p2Display");
    const menuTitle = document.getElementById("menuTitle");
    const hitSound = document.getElementById("hitSound");

    // Nuevos elementos para pausa
    const pauseButton = document.getElementById("pauseButton");
    const pauseMenu = document.getElementById("pauseMenu");
    const resumeBtn = document.getElementById("resumeBtn");
    const exitToMenuBtn = document.getElementById("exitToMenuBtn");
    // Elementos de ajustes
const settingsGear = document.getElementById("settingsGear");
const settingsMenu = document.getElementById("settingsMenu");
const muteBtn = document.getElementById("muteBtn");
const volumeSlider = document.getElementById("volumeSlider");
const closeSettingsBtn = document.getElementById("closeSettingsBtn");

// Crear audio de fondo
const bgMusic = new Audio("fondo.mp3");
bgMusic.loop = true;
bgMusic.volume = 0.5;
let musicPlaying = false;

// Función para iniciar la música
function startMusic() {
    if (!musicPlaying) {
        bgMusic.play()
            .then(() => {
                musicPlaying = true;
                console.log("Música de fondo activada");
            })
            .catch(e => console.log("Autoplay bloqueado, se activará con interacción"));
    }
}

// Intentar reproducir al cargar la página
startMusic();

// Si el navegador bloquea el autoplay, la música comenzará con el primer clic del usuario
document.addEventListener('click', function initMusic() {
    startMusic();
    document.removeEventListener('click', initMusic); // Se ejecuta solo una vez
});
// Al hacer clic en el engranaje, también podemos iniciar la música si no ha empezado
settingsGear.addEventListener("click", () => {
    startMusic(); // Asegura que la música comience al abrir ajustes
    settingsMenu.style.display = "flex";
});

// Al iniciar el juego, aseguramos que la música esté sonando
startBtn.onclick = () => {
    startMusic(); // Inicia la música si no lo estaba
    startScreen.style.display = "none";
    playing = true;
    paused = false;
    pauseButton.style.display = "flex";
    resetBall();
    settingsMenu.style.display = "none";
};

// Cerrar menú de ajustes
closeSettingsBtn.addEventListener("click", () => {
    settingsMenu.style.display = "none";
});

// Mutear / desmutear
muteBtn.addEventListener("click", () => {
    bgMusic.muted = !bgMusic.muted;
    muteBtn.textContent = bgMusic.muted ? "Activar sonido" : "Silenciar";
});

// Control de volumen
volumeSlider.addEventListener("input", (e) => {
    bgMusic.volume = e.target.value;
    // Si estaba muteado y movemos el volumen, desmutear automáticamente
    if (bgMusic.muted) {
        bgMusic.muted = false;
        muteBtn.textContent = "Silenciar";
    }
});

// Al iniciar el juego (startBtn.onclick), aseguramos que el menú de ajustes se cierre
// y que la música siga sonando (si ya estaba sonando)
startBtn.onclick = () => {
    startScreen.style.display = "none";
    playing = true;
    paused = false;
    pauseButton.style.display = "flex";
    resetBall();
    // Cerrar menú de ajustes por si estaba abierto
    settingsMenu.style.display = "none";
};

// Al salir al menú (exitToMenuBtn), mostramos el engranaje y aseguramos que el menú de ajustes esté cerrado
exitToMenuBtn.addEventListener("click", () => {
    playing = false;
    paused = false;
    pauseMenu.style.display = "none";
    startScreen.style.display = "flex";
    pauseButton.style.display = "none";
    p1Score = 0; p2Score = 0;
    p1Display.textContent = "0"; p2Display.textContent = "0";
    menuTitle.textContent = "🏓 PONG PRO";
    // Cerrar menú de ajustes
    settingsMenu.style.display = "none";
});

// Si el usuario hace clic fuera del menú de ajustes, también se puede cerrar (opcional)
settingsMenu.addEventListener("click", (e) => {
    if (e.target === settingsMenu) {
        settingsMenu.style.display = "none";
    }
});

    // Estado del juego
    let playing = false;
    let paused = false;
    let currentLevel = "medium";
    // Nuevas variables para el sistema de preparación
let ballReady = false;        // Indica si la pelota está lista para moverse
let serveTimer = 0;           // Contador para el tiempo de espera
let ballSpeedMultiplier = 1;  // Multiplicador de velocidad (inicia lento)
const SERVE_DELAY = 1000;     // 1 segundos de espera en milisegundos
const INITIAL_SPEED_FACTOR = 0.3; // 30% de la velocidad normal al inicio

    // Configuración de dificultad
    const config = {
        easy:   { ballSpeed: 5.5, botReaction: 0.06, label: "Modo Fácil" },
        medium: { ballSpeed: 7, botReaction: 0.09, label: "Modo Normal" },
        hard:   { ballSpeed: 9, botReaction: 0.12, label: "Modo Difícil" }
    };

    // Manejo de botones de dificultad
    diffBtns.forEach(btn => {
        btn.onclick = () => {
            diffBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentLevel = btn.dataset.level;
        };
    });

    // Ajustar tamaño del canvas
    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener("resize", resize);
    resize();

    // Objetos del juego
    const paddleW = 16;
    const paddleH = 110;
    let playerY = canvas.height / 2 - paddleH / 2;
    let targetY = playerY;
    let botY = canvas.height / 2 - paddleH / 2;
    let p1Score = 0;
    let p2Score = 0;

    let ball = {
        x: 0, y: 0, vx: 0, vy: 0, r: 8
    };

    // Controles (solo si el juego está activo y no pausado)
    const handleMove = (y) => {
        const rect = canvas.getBoundingClientRect();
        targetY = y - rect.top - paddleH / 2;
    };

    canvas.addEventListener("touchmove", e => {
        if (!playing || paused) return; // No mover si está pausado
        e.preventDefault();
        handleMove(e.touches[0].clientY);
    }, { passive: false });

    canvas.addEventListener("mousemove", e => {
        if (!playing || paused) return;
        handleMove(e.clientY);
    });

    // Función para reproducir sonido
    function playHitSound() {
        if (hitSound) {
            hitSound.currentTime = 0;
            hitSound.play().catch(e => console.log("Error al reproducir sonido:", e));
        }
    }

    // Reiniciar pelota
    function resetBall(winner) {
    // Posición central
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    
    // La pelota NO se mueve inicialmente
    ball.vx = 0;
    ball.vy = 0;
    
    // Indicamos que la pelota no está lista (en espera)
    ballReady = false;
    
    // Guardamos la dirección que debería tomar cuando empiece
    const speed = config[currentLevel].ballSpeed;
    
    // Por defecto (inicio) saca hacia la derecha (hacia el bot)
    let direction = 1;
    if (winner === 'player') direction = -1;
    if (winner === 'bot') direction = 1;
    
    // Guardamos la dirección para usarla después
    ball.direction = direction;
    ball.baseSpeed = speed;
    
    // Iniciamos el temporizador de espera
    serveTimer = Date.now() + SERVE_DELAY;
    
    // Reiniciamos el multiplicador de velocidad
    ballSpeedMultiplier = INITIAL_SPEED_FACTOR;
}

    // Lógica de actualización
    function update() {
    // Movimiento suave del jugador
    playerY += (targetY - playerY) * 0.2;
    playerY = Math.max(0, Math.min(canvas.height - paddleH, playerY));

    // IA del bot (solo si la pelota está en movimiento)
    if (ballReady) {
        let botCenter = botY + paddleH / 2;
        botY += (ball.y - botCenter) * config[currentLevel].botReaction;
        botY = Math.max(0, Math.min(canvas.height - paddleH, botY));
    }

    // === NUEVA LÓGICA DE PREPARACIÓN ===
    // Verificamos si la pelota debe empezar a moverse
    if (!ballReady && serveTimer && Date.now() > serveTimer) {
        // ¡Tiempo cumplido! La pelota empieza a moverse lentamente
        ball.vx = ball.direction * ball.baseSpeed * ballSpeedMultiplier;
        ball.vy = (Math.random() * ball.baseSpeed * ballSpeedMultiplier) - (ball.baseSpeed * ballSpeedMultiplier / 2);
        ballReady = true;
    }

    // Movimiento de la pelota (solo si está lista)
    if (ballReady) {
        ball.x += ball.vx;
        ball.y += ball.vy;
    }
    // ===============================

    // Colisión techo/suelo
    if (ballReady && (ball.y - ball.r < 0 || ball.y + ball.r > canvas.height)) {
        ball.vy *= -1;
        playHitSound();
    }

    // Colisión paleta jugador
    if (ballReady && ball.vx < 0 && ball.x < 15 + paddleW) {
        if (ball.y > playerY && ball.y < playerY + paddleH) {
            let impact = (ball.y - (playerY + paddleH / 2)) / (paddleH / 2);
            
            // Cuando el jugador golpea la pelota, ¡aceleramos a velocidad normal!
            ballSpeedMultiplier = 1.0; // Velocidad normal
            ball.vx = Math.abs(ball.baseSpeed) * ballSpeedMultiplier;
            ball.vy = impact * ball.baseSpeed * ballSpeedMultiplier * 0.8;
            
            playHitSound();
        }
    }

    // Colisión paleta bot
    if (ballReady && ball.vx > 0 && ball.x > canvas.width - 15 - paddleW) {
        if (ball.y > botY && ball.y < botY + paddleH) {
            let impact = (ball.y - (botY + paddleH / 2)) / (paddleH / 2);
            
            // También aceleramos si el bot la golpea (para ser justos)
            ballSpeedMultiplier = 1.0;
            ball.vx = -Math.abs(ball.baseSpeed) * ballSpeedMultiplier;
            ball.vy = impact * ball.baseSpeed * ballSpeedMultiplier * 0.8;
            
            playHitSound();
        }
    }

    // Goles
    if (ball.x < 0) {
        p2Score++;
        p2Display.textContent = p2Score;
        resetBall('bot');
    }
    if (ball.x > canvas.width) {
        p1Score++;
        p1Display.textContent = p1Score;
        resetBall('player');
    }

    // Fin de partida
    if (p1Score >= 10 || p2Score >= 10) {
        playing = false;
        pauseButton.style.display = "none";
        setTimeout(() => {
            menuTitle.textContent = p1Score >= 10 ? "¡VICTORIA! 🏆" : "DERROTA 🤖";
            startScreen.style.display = "flex";
            p1Score = 0;
            p2Score = 0;
            p1Display.textContent = "0";
            p2Display.textContent = "0";
        }, 500);
    }
}

    // Dibujado
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Línea central
        ctx.strokeStyle = "rgba(255,255,255,0.05)";
        ctx.setLineDash([15, 15]);
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, 0);
        ctx.lineTo(canvas.width / 2, canvas.height);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = "white";

        // Paletas
        ctx.beginPath();
        ctx.roundRect(15, playerY, paddleW, paddleH, 6);
        ctx.roundRect(canvas.width - paddleW - 15, botY, paddleW, paddleH, 6);
        ctx.fill();

        // Pelota
        ctx.shadowBlur = 10;
        ctx.shadowColor = "white";
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    // Bucle principal
    function gameLoop() {
        if (playing && !paused) {
            update();
            draw();
        } else if (playing && paused) {
            // Solo dibujar (congelado)
            draw();
        }
        requestAnimationFrame(gameLoop);
    }

    // Botón de pausa
    pauseButton.addEventListener("click", () => {
        if (playing) {
            paused = true;
            pauseMenu.style.display = "flex";
        }
    });

    // Botón reanudar
    resumeBtn.addEventListener("click", () => {
        paused = false;
        pauseMenu.style.display = "none";
    });

    // Botón salir al menú
    exitToMenuBtn.addEventListener("click", () => {
        playing = false;
        paused = false;
        pauseMenu.style.display = "none";
        startScreen.style.display = "flex";
        pauseButton.style.display = "none";
        // Reiniciar puntuaciones
        p1Score = 0;
        p2Score = 0;
        p1Display.textContent = "0";
        p2Display.textContent = "0";
        menuTitle.textContent = "🏓 PONG PRO";
    });

    // Iniciar juego
    startBtn.onclick = () => {
        startScreen.style.display = "none";
        playing = true;
        paused = false;
        pauseButton.style.display = "flex"; // Mostrar botón de pausa
        resetBall(); // Saca hacia la derecha
    };

    // Iniciar bucle
    gameLoop();

    // Polyfill para roundRect
    if (!CanvasRenderingContext2D.prototype.roundRect) {
        CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
            if (w < 2 * r) r = w / 2;
            if (h < 2 * r) r = h / 2;
            this.moveTo(x + r, y);
            this.arcTo(x + w, y, x + w, y + h, r);
            this.arcTo(x + w, y + h, x, y + h, r);
            this.arcTo(x, y + h, x, y, r);
            this.arcTo(x, y, x + w, y, r);
            return this;
        };
    }
});