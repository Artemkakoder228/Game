const tg = window.Telegram.WebApp;
tg.expand(); 

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let score = 0;
let gameOver = false;
let frames = 0;

const player = {
    x: canvas.width / 2,
    y: canvas.height - 120, // Трохи вище для зручності пальця
    size: 50, // Трохи більша ракета
    emoji: "🚀"
};

const bullets = [];
const enemies = [];
const particles = [];

// === ПОКРАЩЕНЕ УПРАВЛІННЯ ===
function movePlayer(e) {
    if (gameOver) return;
    
    // Блокуємо скрол сторінки, щоб екран не їздив
    if(e.type === 'touchmove' || e.type === 'touchstart') {
        e.preventDefault(); 
    }

    let clientX;
    
    if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
    } else {
        clientX = e.clientX;
    }

    player.x = clientX;
    
    // Обмеження країв
    if (player.x < player.size/2) player.x = player.size/2;
    if (player.x > canvas.width - player.size/2) player.x = canvas.width - player.size/2;
}

// Додаємо слухачі подій
// touchstart - щоб ракета стрибала до пальця відразу при натисканні
canvas.addEventListener('touchstart', movePlayer, { passive: false });
canvas.addEventListener('touchmove', movePlayer, { passive: false });
canvas.addEventListener('mousemove', movePlayer);

// === ОСНОВНИЙ ЦИКЛ ===
function update() {
    if (gameOver) return;
    
    requestAnimationFrame(update);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    frames++;

    // 1. Зірки
    if (frames % 5 === 0) {
        particles.push({x: Math.random() * canvas.width, y: 0, speed: Math.random() * 5 + 2, size: Math.random() * 2, color: 'white'});
    }

    // 2. Гравець
    ctx.font = "50px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle"; // Центруємо емодзі вертикально
    ctx.fillText(player.emoji, player.x, player.y);

    // 3. Стрільба (швидша стрільба для драйву - кожні 10 кадрів)
    if (frames % 10 === 0) {
        bullets.push({x: player.x, y: player.y - 30});
    }

    // 4. Спавн ворогів
    let spawnRate = 50 - Math.floor(score / 50);
    if (spawnRate < 15) spawnRate = 15;
    
    if (frames % spawnRate === 0) {
        const size = Math.random() * 30 + 35; // Вороги трохи більші
        enemies.push({
            x: Math.random() * (canvas.width - size) + size/2,
            y: -50,
            size: size,
            emoji: Math.random() > 0.3 ? "🪨" : "🛸",
            speed: Math.random() * 3 + 2 + (score / 500)
        });
    }

    // 5. Кулі
    for (let i = bullets.length - 1; i >= 0; i--) {
        let b = bullets[i];
        b.y -= 12; // Швидші кулі
        ctx.fillStyle = "#00ffcc";
        ctx.fillRect(b.x - 3, b.y, 6, 20); // Товстіший лазер

        if (b.y < 0) bullets.splice(i, 1);
    }

    // 6. Вороги і зіткнення
    for (let i = enemies.length - 1; i >= 0; i--) {
        let e = enemies[i];
        e.y += e.speed;
        ctx.font = `${e.size}px Arial`;
        ctx.fillText(e.emoji, e.x, e.y);

        // Влучання
        for (let j = bullets.length - 1; j >= 0; j--) {
            let b = bullets[j];
            let dx = b.x - e.x;
            let dy = b.y - e.y;
            let dist = Math.sqrt(dx*dx + dy*dy);

            if (dist < e.size/1.5) { // Трохи поблажливіший хітбокс
                enemies.splice(i, 1);
                bullets.splice(j, 1);
                score += 10;
                document.getElementById('score').innerText = score;
                tg.HapticFeedback.impactOccurred('light');
                break;
            }
        }

        // Аварія
        let dx = player.x - e.x;
        let dy = player.y - e.y;
        let dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist < (player.size/2 + e.size/2 - 15)) {
            endGame();
        }

        if (e.y > canvas.height + 50) enemies.splice(i, 1);
    }

    // 7. Частинки
    ctx.fillStyle = "white";
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.y += p.speed;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
        ctx.fill();
        if (p.y > canvas.height) particles.splice(i, 1);
    }
}

function endGame() {
    gameOver = true;
    tg.HapticFeedback.notificationOccurred('error');
    document.getElementById('gameover').style.display = 'block';
    document.getElementById('final-score').innerText = score;
}

function sendScore() {
    const data = JSON.stringify({
        action: "game_score",
        amount: score
    });
    tg.sendData(data); 
}

update();