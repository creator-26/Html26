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

    // CONSTANTES DEL JUEGO
    const PADDLE_WIDTH = 16;
    const PADDLE_HEIGHT = 110;
    const BALL_RADIUS = 8;
    const SERVE_DELAY = 1000;
    const INITIAL_SPEED_FACTOR = 0.3;
    const WINNING_SCORE = 10;

    // Estado del juego
    let playing = false;
    let paused = false;
    let currentLevel = "medium";
    let ballReady = false;
    let serveTimer = 0;
    let ballSpeedMultiplier = 1;

    // Configuración de dificultad
    const config = {
        easy:   { ballSpeed: 5, botReaction: 0.05, label: "Modo Fácil" },
        medium: { ballSpeed: 6.5, botReaction: 0.07, label: "Modo Normal" },
        hard:   { ballSpeed: 8, botReaction: 0.10, label: "Modo Difícil" }
    };

    // Manejo de botones de dificultad
    diffBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            diffBtns.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentLevel = btn.dataset.level;
            console.log("Dificultad cambiada a:", currentLevel);
        });
    });

    // Ajustar tamaño del canvas
    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener("resize", resize);
    resize();

    // Objetos del juego
    let playerY = canvas.height / 2 - PADDLE_HEIGHT / 2;
    let targetY = playerY;
    let botY = canvas.height / 2 - PADDLE_HEIGHT / 2;
    let p1Score = 0;
    let p2Score = 0;

    let ball = {
        x: 0, 
        y: 0, 
        vx: 0, 
        vy: 0, 
        r: BALL_RADIUS,
        direction: 1,
        baseSpeed: 0
    };

    // Función para reproducir sonido mejorada
    function playHitSound() {
        if (hitSound) {
            try {
                hitSound.currentTime = 0;
                const promise = hitSound.play();
                if (promise !== undefined) {
                    promise.catch(e => console.log("Audio bloqueado:", e));
                }
            } catch (e) {
                console.log("Error al reproducir sonido:", e);
            }
        }
    }

    // Controles (solo si el juego está activo y no pausado)
    const handleMove = (y) => {
        const rect = canvas.getBoundingClientRect();
        targetY = y - rect.top - PADDLE_HEIGHT / 2;
    };

    canvas.addEventListener("touchmove", e => {
        if (!playing || paused) return;
        e.preventDefault();
        handleMove(e.touches[0].clientY);
    }, { passive: false });

    canvas.addEventListener("mousemove", e => {
        if (!playing || paused) return;
        handleMove(e.clientY);
    });

    // Función de detección de colisión mejorada
    function checkPaddleCollision(ball, paddleY, paddleX, isPlayer) {
        const ballLeft = ball.x - ball.r;
        const ballRight = ball.x + ball.r;
        const ballTop = ball.y - ball.r;
        const ballBottom = ball.y + ball.r;

        const paddleLeft = paddleX;
        const paddleRight = paddleX + PADDLE_WIDTH;
        const paddleTop = paddleY;
        const paddleBottom = paddleY + PADDLE_HEIGHT;

        // Verificar AABB (Axis-Aligned Bounding Box)
        if (ballLeft < paddleRight && ballRight > paddleLeft &&
            ballTop < paddleBottom && ballBottom > paddleTop) {
            return true;
        }
        return false;
    }

    // Reiniciar pelota
    function resetBall(winner) {
        ball.x = canvas.width / 2;
        ball.y = canvas.height / 2;
        ball.vx = 0;
        ball.vy = 0;
        ballReady = false;

        const speed = config[currentLevel].ballSpeed;
        let direction = 1;
        if (winner === 'player') direction = -1;
        if (winner === 'bot') direction = 1;

        ball.direction = direction;
        ball.baseSpeed = speed;
        serveTimer = Date.now() + SERVE_DELAY;
        ballSpeedMultiplier = INITIAL_SPEED_FACTOR;
    }

    // Lógica de actualización
    function update() {
        // Movimiento suave del jugador
        playerY += (targetY - playerY) * 0.2;
        playerY = Math.max(0, Math.min(canvas.height - PADDLE_HEIGHT, playerY));

        // IA del bot (solo si la pelota está en movimiento)
        if (ballReady) {
            let botCenter = botY + PADDLE_HEIGHT / 2;
            botY += (ball.y - botCenter) * config[currentLevel].botReaction;
            botY = Math.max(0, Math.min(canvas.height - PADDLE_HEIGHT, botY));
        }

        // Verificar si la pelota debe empezar a moverse
        if (!ballReady && serveTimer && Date.now() > serveTimer) {
            ball.vx = ball.direction * ball.baseSpeed * ballSpeedMultiplier;
            ball.vy = (Math.random() * ball.baseSpeed * ballSpeedMultiplier) - (ball.baseSpeed * ballSpeedMultiplier / 2);
            ballReady = true;
        }

        // Movimiento de la pelota (solo si está lista)
        if (ballReady) {
            ball.x += ball.vx;
            ball.y += ball.vy;
        }

        // Colisión techo/suelo
        if (ballReady && (ball.y - ball.r < 0 || ball.y + ball.r > canvas.height)) {
            ball.vy *= -1;
            playHitSound();
        }

        // Colisión paleta jugador - MEJORADA
        if (ballReady && ball.vx < 0 && checkPaddleCollision(ball, playerY, 15, true)) {
            let impact = (ball.y - (playerY + PADDLE_HEIGHT / 2)) / (PADDLE_HEIGHT / 2);
            ballSpeedMultiplier = 1.0;
            ball.vx = Math.abs(ball.baseSpeed) * ballSpeedMultiplier;
            ball.vy = impact * ball.baseSpeed * ballSpeedMultiplier * 0.8;
            ball.x = 15 + PADDLE_WIDTH + ball.r; // Evitar penetración
            playHitSound();
        }

        // Colisión paleta bot - MEJORADA
        if (ballReady && ball.vx > 0 && checkPaddleCollision(ball, botY, canvas.width - PADDLE_WIDTH - 15, false)) {
            let impact = (ball.y - (botY + PADDLE_HEIGHT / 2)) / (PADDLE_HEIGHT / 2);
            ballSpeedMultiplier = 1.0;
            ball.vx = -Math.abs(ball.baseSpeed) * ballSpeedMultiplier;
            ball.vy = impact * ball.baseSpeed * ballSpeedMultiplier * 0.8;
            ball.x = canvas.width - PADDLE_WIDTH - 15 - ball.r; // Evitar penetración
            playHitSound();
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
        if (p1Score >= WINNING_SCORE || p2Score >= WINNING_SCORE) {
            playing = false;
            pauseButton.style.display = "none";
            setTimeout(() => {
                menuTitle.textContent = p1Score >= WINNING_SCORE ? "¡VICTORIA! 🏆" : "DERROTA 🤖";
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
        ctx.roundRect(15, playerY, PADDLE_WIDTH, PADDLE_HEIGHT, 6);
        ctx.roundRect(canvas.width - PADDLE_WIDTH - 15, botY, PADDLE_WIDTH, PADDLE_HEIGHT, 6);
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
        p1Score = 0;
        p2Score = 0;
        p1Display.textContent = "0";
        p2Display.textContent = "0";
        menuTitle.textContent = "🏓 PONG PRO";
    });

    // Iniciar juego
    startBtn.addEventListener("click", () => {
        console.log("Botón de inicio presionado, dificultad:", currentLevel);
        startScreen.style.display = "none";
        playing = true;
        paused = false;
        pauseButton.style.display = "flex";
        resetBall();
    });

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
