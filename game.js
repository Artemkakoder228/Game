const tg = window.Telegram.WebApp;
tg.expand(); // Розгорнути на весь екран

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// Налаштування розміру
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Змінні гри
let score = 0;
let gameOver = false;
let frames = 0;

// Гравець
const player = {
    x: canvas.width / 2,
    y: canvas.height - 100,
    size: 40,
    emoji: "🚀"
};

const bullets = [];
const enemies = [];
const particles = [];

// === УПРАВЛІННЯ ===
function movePlayer(e) {
    if (gameOver) return;
    // Підтримка і миші, і тачскріну
    let clientX = e.touches ? e.touches[0].clientX : e.clientX;
    player.x = clientX;
    
    // Обмеження, щоб не вилітав за екран
    if (player.x < player.size/2) player.x = player.size/2;
    if (player.x > canvas.width - player.size/2) player.x = canvas.width - player.size/2;
}

window.addEventListener('mousemove', movePlayer);
window.addEventListener('touchmove', movePlayer, { passive: false });

// === ОСНОВНИЙ ЦИКЛ ===
function update() {
    if (gameOver) return;
    
    requestAnimationFrame(update);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    frames++;

    // 1. Фон (зірки)
    if (frames % 5 === 0) {
        particles.push({
            x: Math.random() * canvas.width, 
            y: 0, 
            speed: Math.random() * 5 + 2, 
            size: Math.random() * 2, 
            color: 'white'
        });
    }

    // 2. Гравець
    ctx.font = "40px Arial";
    ctx.textAlign = "center";
    ctx.fillText(player.emoji, player.x, player.y);

    // 3. Стрільба (автоматично)
    if (frames % 15 === 0) {
        bullets.push({x: player.x, y: player.y - 20});
    }

    // 4. Спавн ворогів (складність росте)
    let spawnRate = 60 - Math.floor(score / 50);
    if (spawnRate < 20) spawnRate = 20;
    
    if (frames % spawnRate === 0) {
        const size = Math.random() * 30 + 30;
        enemies.push({
            x: Math.random() * (canvas.width - size) + size/2,
            y: -50,
            size: size,
            emoji: Math.random() > 0.3 ? "🪨" : "🛸", // Камінь або НЛО
            speed: Math.random() * 3 + 2 + (score / 500)
        });
    }

    // 5. Оновлення куль
    for (let i = bullets.length - 1; i >= 0; i--) {
        let b = bullets[i];
        b.y -= 10;
        
        ctx.fillStyle = "#00ffcc";
        ctx.fillRect(b.x - 2, b.y, 4, 15); // Лазер

        if (b.y < 0) bullets.splice(i, 1);
    }

    // 6. Оновлення ворогів
    for (let i = enemies.length - 1; i >= 0; i--) {
        let e = enemies[i];
        e.y += e.speed;
        
        ctx.font = `${e.size}px Arial`;
        ctx.fillText(e.emoji, e.x, e.y);

        // Зіткнення кулі з ворогом
        for (let j = bullets.length - 1; j >= 0; j--) {
            let b = bullets[j];
            let dx = b.x - e.x;
            let dy = b.y - (e.y - e.size/2);
            let dist = Math.sqrt(dx*dx + dy*dy);

            if (dist < e.size/2) {
                enemies.splice(i, 1);
                bullets.splice(j, 1);
                score += 10; // Нагорода
                document.getElementById('score').innerText = score;
                tg.HapticFeedback.impactOccurred('light'); // Вібрація телефону
                break;
            }
        }

        // Зіткнення ворога з гравцем
        let dx = player.x - e.x;
        let dy = player.y - e.y;
        let dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist < (player.size/2 + e.size/2 - 10)) {
            endGame();
        }

        if (e.y > canvas.height + 50) enemies.splice(i, 1);
    }

    // 7. Малювання зірок фону
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

// === ЗАВЕРШЕННЯ ГРИ ===
function endGame() {
    gameOver = true;
    tg.HapticFeedback.notificationOccurred('error'); // Вібрація помилки
    document.getElementById('gameover').style.display = 'block';
    document.getElementById('final-score').innerText = score;
}

// === ВІДПРАВКА ДАНИХ БОТУ ===
function sendScore() {
    const data = JSON.stringify({
        action: "game_score",
        amount: score
    });
    tg.sendData(data); 
}

// Запуск
update();