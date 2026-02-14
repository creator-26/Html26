const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const startScreen = document.getElementById("startScreen");
const startBtn = document.getElementById("startBtn");
const sound = document.getElementById("hitSound");

/* ========= RESPONSIVE ========= */

function resize(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

/* ========= OBJETOS ========= */

const paddleWidth = 12;
const paddleHeight = 110;

let playerY = canvas.height/2;
let targetY = playerY;
let botY = canvas.height/2;

let playerScore = 0;
let botScore = 0;
const maxScore = 10;

let ball = {
    x: canvas.width/2,
    y: canvas.height/2,
    vx: 6,
    vy: 4,
    r: 10
};

let playing = false;

/* ========= CONTROL TÁCTIL ========= */

canvas.addEventListener("touchmove", e=>{
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    targetY = e.touches[0].clientY - rect.top;
},{passive:false});

/* ========= REINICIAR PELOTA ========= */

function resetBall(){
    ball.x = canvas.width/2;
    ball.y = canvas.height/2;

    ball.vx *= -1;
    ball.vy = (Math.random()*6)-3;
}

/* ========= IA REALISTA ========= */

function updateBot(){
    let center = botY + paddleHeight/2;

    // retraso humano
    botY += (ball.y - center) * 0.08;
}

/* ========= FÍSICAS ========= */

function update(){

    // movimiento suave jugador
    playerY += (targetY - playerY) * 0.25;

    playerY = Math.max(0,
        Math.min(canvas.height - paddleHeight, playerY)
    );

    updateBot();

    ball.x += ball.vx;
    ball.y += ball.vy;

    // rebote arriba abajo
    if(ball.y < 0 || ball.y > canvas.height){
        ball.vy *= -1;
        sound.currentTime=0;
        sound.play();
    }

    // jugador golpe
    if(
        ball.x < 25 &&
        ball.y > playerY &&
        ball.y < playerY+paddleHeight
    ){
        let collide =
        (ball.y-(playerY+paddleHeight/2))/(paddleHeight/2);

        ball.vx = Math.abs(ball.vx);
        ball.vy = collide * 8;

        sound.currentTime=0;
        sound.play();
    }

    // bot golpe
    if(
        ball.x > canvas.width-25 &&
        ball.y > botY &&
        ball.y < botY+paddleHeight
    ){
        let collide =
        (ball.y-(botY+paddleHeight/2))/(paddleHeight/2);

        ball.vx = -Math.abs(ball.vx);
        ball.vy = collide * 8;

        sound.currentTime=0;
        sound.play();
    }

    /* puntos */

    if(ball.x < 0){
        botScore++;
        resetBall();
    }

    if(ball.x > canvas.width){
        playerScore++;
        resetBall();
    }

    /* ganador */

    if(playerScore===maxScore || botScore===maxScore){
        playing=false;

        setTimeout(()=>{
            alert(
                playerScore>botScore ?
                "🏆 Ganaste!" :
                "🤖 Gana el bot"
            );

            playerScore=0;
            botScore=0;
            resetBall();
            startScreen.style.display="flex";
        },100);
    }
}

/* ========= DIBUJO ========= */

function draw(){

    ctx.clearRect(0,0,canvas.width,canvas.height);

    ctx.fillStyle="white";

    // jugador
    ctx.fillRect(10,playerY,paddleWidth,paddleHeight);

    // bot
    ctx.fillRect(
        canvas.width-22,
        botY,
        paddleWidth,
        paddleHeight
    );

    // pelota
    ctx.beginPath();
    ctx.arc(ball.x,ball.y,ball.r,0,Math.PI*2);
    ctx.fill();

    // marcador
    ctx.font="40px Arial";
    ctx.fillText(playerScore,canvas.width/4,60);
    ctx.fillText(botScore,canvas.width*3/4,60);
}

/* ========= LOOP PRO ========= */

function gameLoop(){
    if(playing){
        update();
        draw();
    }
    requestAnimationFrame(gameLoop);
}
gameLoop();

/* ========= INICIO ========= */

startBtn.onclick=()=>{
    startScreen.style.display="none";
    playing=true;
};