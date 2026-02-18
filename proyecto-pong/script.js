// ✅ VERSIÓN COMPLETA CORREGIDA - COPIA ESTO A tu script.js
document.addEventListener('DOMContentLoaded', () => {
    // Obtener elementos del DOM
    const canvas = document.getElementById("game");
    const ctx = canvas?.getContext("2d");
    
    if (!canvas || !ctx) {
        console.error("Canvas no encontrado");
        return;
    }

    const startScreen = document.getElementById("startScreen");
    const startBtn = document.getElementById("startBtn");
    const diffBtns = document.querySelectorAll(".diff-btn");
    const p1Display = document.getElementById("p1Display");
    const p2Display = document.getElementById("p2Display");
    const menuTitle = document.getElementById("menuTitle");
    const hitSound = document.getElementById("hitSound");
    const pauseButton = document.getElementById("pauseButton");
    const pauseMenu = document.getElementById("pauseMenu");
    const resumeBtn = document.getElementById("resumeBtn");
    const exitToMenuBtn = document.getElementById("exitToMenuBtn");

    // CONSTANTES
    const PADDLE_WIDTH = 16;
    const PADDLE_HEIGHT = 110;
    const BALL_RADIUS = 8;
    const SERVE_DELAY = 1000;
    const INITIAL_SPEED_FACTOR = 0.3;
    const WINNING_SCORE = 10;
    const PADDLE_LEFT_X = 15;

    // Estado
    let playing = false;
    let paused = false;
    let currentLevel = "medium";
    let ballReady = false;
    let serveTimer = 0;
    let ballSpeedMultiplier = 1;

    // Configuración
    const config = {
        easy:   { ballSpeed: 5, botReaction: 0.05, label: "Modo Fácil" },
        medium: { ballSpeed: 6.5, botReaction: 0.07, label: "Modo Normal" },
        hard:   { ballSpeed: 8, botReaction: 0.10, label: "Modo Difícil" }
    };

    // ✅ FIX 3: Redimensionamiento mejorado
    function resize() {
        const newWidth = window.innerWidth;
        const newHeight = window.innerHeight;
        if (canvas.width !== newWidth || canvas.height !== newHeight) {
            canvas.width = newWidth;
            canvas.height = newHeight;
            playerY = Math.max(0, Math.min(canvas.height - PADDLE_HEIGHT, playerY));
            botY = Math.max(0, Math.min(canvas.height - PADDLE_HEIGHT, botY));
        }
    }
    window.addEventListener("resize", resize);
    resize();

    // Variables
    let playerY = canvas.height / 2 - PADDLE_HEIGHT / 2;
    let targetY = playerY;
    let botY = canvas.height / 2 - PADDLE_HEIGHT / 2;
    let p1Score = 0;
    let p2Score = 0;
    let ball = {
        x: 0, y: 0, vx: 0, vy: 0, r: BALL_RADIUS,
        direction: 1, baseSpeed: 0
    };

    // Sonido
    function playHitSound() {
        if (!hitSound) return;
        try {
            hitSound.currentTime = 0;
            hitSound.play?.().catch(e => console.log("Audio:", e));
        } catch (e) {
            console.log("Error sonido:", e);
        }
    }

    // ✅ FIX 1: Dificultad con addEventListener y stopPropagation
    diffBtns.forEach(btn => {
        btn.addEventListener("click", function(e) {
            e.preventDefault();
            e.stopPropagation();
            diffBtns.forEach(b => b.classList.remove("active"));
            this.classList.add("active");
            currentLevel = this.dataset.level;
            console.log("✓ Dificultad:", currentLevel);
        });
    });

    // ✅ FIX 5: Controles con validación
    const handleMove = (y) => {
        const rect = canvas.getBoundingClientRect();
        const relativeY = y - rect.top - PADDLE_HEIGHT / 2;
        targetY = Math.max(0, Math.min(canvas.height - PADDLE_HEIGHT, relativeY));
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

    // Colisiones AABB
    function checkPaddleCollision(ball, paddleY, paddleX) {
        return ball.x - ball.r < paddleX + PADDLE_WIDTH &&
               ball.x + ball.r > paddleX &&
               ball.y - ball.r < paddleY + PADDLE_HEIGHT &&
               ball.y + ball.r > paddleY;
    }

    function resetBall(winner) {
        ball.x = canvas.width / 2;
        ball.y = canvas.height / 2;
        ball.vx = 0;
        ball.vy = 0;
        ballReady = false;
        const speed = config[currentLevel].ballSpeed;
        ball.direction = winner === 'player' ? -1 : 1;
        ball.baseSpeed = speed;
        serveTimer = Date.now() + SERVE_DELAY;
        ballSpeedMultiplier = INITIAL_SPEED_FACTOR;
    }

    function update() {
        // Movimiento
        playerY += (targetY - playerY) * 0.2;
        playerY = Math.max(0, Math.min(canvas.height - PADDLE_HEIGHT, playerY));

        if (ballReady) {
            let botCenter = botY + PADDLE_HEIGHT / 2;
            botY += (ball.y - botCenter) * config[currentLevel].botReaction;
            botY = Math.max(0, Math.min(canvas.height - PADDLE_HEIGHT, botY));
        }

        if (!ballReady && serveTimer && Date.now() > serveTimer) {
            ball.vx = ball.direction * ball.baseSpeed * ballSpeedMultiplier;
            ball.vy = (Math.random() * ball.baseSpeed * ballSpeedMultiplier) - (ball.baseSpeed * ballSpeedMultiplier / 2);
            ballReady = true;
        }

        if (ballReady) {
            ball.x += ball.vx;
            ball.y += ball.vy;
        }

        // Colisiones
        if (ballReady && (ball.y - ball.r < 0 || ball.y + ball.r > canvas.height)) {
            ball.vy *= -1;
            playHitSound();
        }

        // ✅ FIX 4: Colisión con margen extra
        if (ballReady && ball.vx < 0 && checkPaddleCollision(ball, playerY, PADDLE_LEFT_X)) {
            let impact = (ball.y - (playerY + PADDLE_HEIGHT / 2)) / (PADDLE_HEIGHT / 2);
            ballSpeedMultiplier = 1.0;
            ball.vx = Math.abs(ball.baseSpeed) * ballSpeedMultiplier;
            ball.vy = impact * ball.baseSpeed * ballSpeedMultiplier * 0.8;
            ball.x = PADDLE_LEFT_X + PADDLE_WIDTH + ball.r + 2; // MARGEN EXTRA
            playHitSound();
        }

        const botPaddleX = canvas.width - PADDLE_WIDTH - PADDLE_LEFT_X;
        if (ballReady && ball.vx > 0 && checkPaddleCollision(ball, botY, botPaddleX)) {
            let impact = (ball.y - (botY + PADDLE_HEIGHT / 2)) / (PADDLE_HEIGHT / 2);
            ballSpeedMultiplier = 1.0;
            ball.vx = -Math.abs(ball.baseSpeed) * ballSpeedMultiplier;
            ball.vy = impact * ball.baseSpeed * ballSpeedMultiplier * 0.8;
            ball.x = botPaddleX - ball.r - 2; // MARGEN EXTRA
            playHitSound();
        }

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

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = "rgba(255,255,255,0.05)";
        ctx.setLineDash([15, 15]);
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, 0);
        ctx.lineTo(canvas.width / 2, canvas.height);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.roundRect(PADDLE_LEFT_X, playerY, PADDLE_WIDTH, PADDLE_HEIGHT, 6);
        ctx.roundRect(canvas.width - PADDLE_WIDTH - PADDLE_LEFT_X, botY, PADDLE_WIDTH, PADDLE_HEIGHT, 6);
        ctx.fill();
        ctx.shadowBlur = 10;
        ctx.shadowColor = "white";
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    function gameLoop() {
        if (playing && !paused) {
            update();
            draw();
        } else if (playing && paused) {
            draw();
        }
        requestAnimationFrame(gameLoop);
    }

    pauseButton.addEventListener("click", () => {
        if (playing) {
            paused = true;
            pauseMenu.style.display = "flex";
        }
    });

    resumeBtn.addEventListener("click", () => {
        paused = false;
        pauseMenu.style.display = "none";
    });

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

    // ✅ FIX 2: Botón inicio con addEventListener y validación
    startBtn.addEventListener("click", (e) => {
        e.preventDefault();
        console.log("✓ Juego iniciado con dificultad:", currentLevel);
        startScreen.style.display = "none";
        playing = true;
        paused = false;
        pauseButton.style.display = "flex";
        resetBall();
    });

    gameLoop();

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

    console.log("✓ Pong inicializado correctamente");
});