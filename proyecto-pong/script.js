// Improved collision detection
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 100;
const BALL_SIZE = 10;

// Constants for audio handling
const AUDIO_FILE_HIT = 'hit.mp3';
const AUDIO_FILE_MISS = 'miss.mp3';

// Refactored code for collision detection
function detectCollision(ball, paddle) {
    return ball.x < paddle.x + PADDLE_WIDTH &&
           ball.x + BALL_SIZE > paddle.x &&
           ball.y < paddle.y + PADDLE_HEIGHT &&
           ball.y + BALL_SIZE > paddle.y;
}

// Improved audio handling function
function playAudio(file) {
    const audio = new Audio(file);
    audio.play();
}

// Example usage in the game loop
function gameLoop() {
    // ... existing game loop logic ...
    if (detectCollision(ball, playerPaddle)) {
        playAudio(AUDIO_FILE_HIT);
        // Handle collision
    }
    // ... more game logic ...
}