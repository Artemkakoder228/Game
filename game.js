const tg = window.Telegram.WebApp;
tg.expand(); 

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let score = 0;
// НОВІ ЗМІННІ ДЛЯ HANDLING СТАНУ ЗАВЕРШЕННЯ ГРИ
let gameOver = false; // Гра зупиняє логіку, але вибух триває
let gameFinished = false; // Вибух завершено, показуємо UI
let gameOverTimer = 0; // Таймер для тривалості вибуху

let frames = 0;
let screenShake = 0;
let globalSpeed = 0.5; 

// --- КЛАСИ ---

class Player {
    constructor() {
        this.width = 90; 
        this.height = 80;
        this.x = canvas.width / 2;
        this.y = canvas.height - 150; 
        
        this.targetX = this.x; 
        this.targetY = this.y;
        this.vx = 0; 
        this.vy = 0; 
        
        this.hp = 3; // Життя (❤️❤️❤️)
        this.invulnerable = 0; // Таймер невразливості
    }

    update() {
        if (gameOver) return; // Ракета не оновлює фізику, якщо вибухає

        this.x += this.vx;
        this.y += this.vy;
        
        this.vx *= 0.85;
        this.vy *= 0.85;

        if (Math.abs(this.vx) < 5 && Math.abs(this.vy) < 5) {
            this.x += (this.targetX - this.x) * 0.15;
            this.y += (this.targetY - this.y) * 0.15;
        }

        if (this.x < this.width/2) this.x = this.width/2;
        if (this.x > canvas.width - this.width/2) this.x = canvas.width - this.width/2;
        if (this.y < this.height/2) this.y = this.height/2;
        if (this.y > canvas.height - this.height/2) this.y = canvas.height - this.height/2;

        if (this.invulnerable > 0) this.invulnerable--;
    }

    draw() {
        if (gameOver) return; // Ракета не малюється, якщо вибухає

        ctx.save();
        ctx.translate(this.x, this.y);

        if (this.invulnerable > 0 && frames % 10 < 5) {
            ctx.globalAlpha = 0.5;
        }

        let fireLen = (30 + Math.random() * 20) * globalSpeed;

        const drawFire = (xOffset, yOffset, scale) => {
            ctx.fillStyle = 'rgba(255, 80, 0, 0.8)';
            ctx.beginPath();
            ctx.moveTo(xOffset - 10 * scale, yOffset);
            ctx.lineTo(xOffset + 10 * scale, yOffset);
            ctx.lineTo(xOffset, yOffset + fireLen * scale);
            ctx.fill();

            ctx.fillStyle = 'rgba(255, 200, 0, 0.9)';
            ctx.beginPath();
            ctx.moveTo(xOffset - 6 * scale, yOffset);
            ctx.lineTo(xOffset + 6 * scale, yOffset);
            ctx.lineTo(xOffset, yOffset + fireLen * scale * 0.7);
            ctx.fill();

            ctx.fillStyle = 'rgba(150, 220, 255, 1)';
            ctx.beginPath();
            ctx.moveTo(xOffset - 3 * scale, yOffset);
            ctx.lineTo(xOffset + 3 * scale, yOffset);
            ctx.lineTo(xOffset, yOffset + fireLen * scale * 0.3);
            ctx.fill();
        };

        // ФІКС: Полум'я тепер чітко під двигунами (yOffset змінено на this.height/2 - 5 та +5)
        drawFire(0, this.height/2 - 5, 1);       
        drawFire(-19, this.height/2 + 5, 0.4);   
        drawFire(19, this.height/2 + 5, 0.4);    

        ctx.fillStyle = '#222';
        ctx.beginPath(); ctx.moveTo(-24, 0); ctx.lineTo(-45, 15); ctx.lineTo(-24, 30); ctx.fill();
        ctx.beginPath(); ctx.moveTo(24, 0); ctx.lineTo(45, 15); ctx.lineTo(24, 30); ctx.fill();

        ctx.fillStyle = '#555';
        ctx.fillRect(-47, -5, 4, 20); 
        ctx.fillRect(43, -5, 4, 20);  
        
        ctx.fillStyle = '#00ffcc';
        ctx.fillRect(-48, -7, 6, 4);
        ctx.fillRect(42, -7, 6, 4);

        let leftBoosterGrad = ctx.createLinearGradient(-24, 0, -14, 0);
        leftBoosterGrad.addColorStop(0, '#444'); leftBoosterGrad.addColorStop(0.5, '#eee'); leftBoosterGrad.addColorStop(1, '#333');
        ctx.fillStyle = leftBoosterGrad;
        ctx.beginPath(); ctx.roundRect(-24, -5, 10, 40, 2); ctx.fill(); 
        
        let rightBoosterGrad = ctx.createLinearGradient(14, 0, 24, 0);
        rightBoosterGrad.addColorStop(0, '#333'); rightBoosterGrad.addColorStop(0.5, '#eee'); rightBoosterGrad.addColorStop(1, '#444');
        ctx.fillStyle = rightBoosterGrad;
        ctx.beginPath(); ctx.roundRect(14, -5, 10, 40, 2); ctx.fill();

        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath(); ctx.moveTo(-24, -5); ctx.lineTo(-14, -5); ctx.lineTo(-19, -15); ctx.fill();
        ctx.beginPath(); ctx.moveTo(14, -5); ctx.lineTo(24, -5); ctx.lineTo(19, -15); ctx.fill();

        let bodyGrad = ctx.createLinearGradient(-14, 0, 14, 0);
        bodyGrad.addColorStop(0, '#555'); bodyGrad.addColorStop(0.3, '#fff'); bodyGrad.addColorStop(0.8, '#ccc'); bodyGrad.addColorStop(1, '#444');
        ctx.fillStyle = bodyGrad;
        ctx.beginPath(); ctx.roundRect(-14, -25, 28, 60, 4); ctx.fill();

        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath(); ctx.moveTo(-14, -25); ctx.lineTo(14, -25); ctx.lineTo(0, -45); ctx.fill();

        ctx.fillStyle = '#00ffcc'; 
        ctx.beginPath(); ctx.ellipse(0, -15, 5, 12, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#ffffff'; 
        ctx.beginPath(); ctx.ellipse(-2, -18, 2, 4, Math.PI/8, 0, Math.PI*2); ctx.fill();
        
        ctx.fillStyle = '#cc0000'; 
        ctx.fillRect(-14, 15, 28, 5);

        ctx.restore();
    }
}

class Enemy {
    constructor() {
        this.size = Math.random() * 30 + 40;
        this.x = Math.random() * (canvas.width - this.size) + this.size/2;
        this.y = -50;
        this.baseSpeed = Math.random() * 2 + 2; 
        this.hp = 2; 
        this.angle = Math.random() * Math.PI * 2; 
        this.rotSpeed = (Math.random() - 0.5) * 0.05; 
        
        this.vertices = [];
        let points = 8 + Math.floor(Math.random() * 4);
        for(let i=0; i<points; i++) {
            let a = (i / points) * Math.PI * 2;
            let r = this.size/2 * (0.7 + Math.random() * 0.3); 
            this.vertices.push({x: Math.cos(a) * r, y: Math.sin(a) * r});
        }
    }

    update() {
        if (gameOver) return; // Вороги зупиняються під час фінального вибуху
        this.y += this.baseSpeed * globalSpeed;
        this.angle += this.rotSpeed * globalSpeed;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        let grad = ctx.createRadialGradient(-this.size/6, -this.size/6, 0, 0, 0, this.size);
        grad.addColorStop(0, '#888');
        grad.addColorStop(1, '#222');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
        for(let i=1; i<this.vertices.length; i++) {
            ctx.lineTo(this.vertices[i].x, this.vertices[i].y);
        }
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.arc(this.size/6, this.size/6, this.size/5, 0, Math.PI*2);
        ctx.fill();

        ctx.restore();
    }
}

// НОВІ ПАРАМЕТРИ ДЛЯ КЛАСУ PARTICLE
class Particle {
    constructor(x, y, color, vx, vy, size, life, decay, growth = 1.0) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.vx = vx;
        this.vy = vy;
        this.size = size;
        this.maxLife = life;
        this.life = life;
        this.decay = decay; // Швидкість згасання
        this.growth = growth; // Швидкість розширення
    }
    update() {
        this.x += this.vx * globalSpeed;
        this.y += this.vy * globalSpeed;
        this.size *= this.growth; // Розширення
        this.life -= this.decay * globalSpeed; // Згасання (залежить від швидкості)
    }
    draw() {
        ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, Math.max(0.1, this.size), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

const player = new Player();
const bullets = [];
const enemies = [];
const particles = [];
const stars = []; 

for(let i = 0; i < 150; i++) {
    stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 1.5,
        baseSpeed: Math.random() * 2 + 0.5
    });
}

// УНІВЕРСАЛЬНА ФУНКЦІЯ ДЛЯ МАЛЕНЬКИХ ВИБУХІВ
function createExplosion(x, y, color, isBig = false) {
    let count = isBig ? 30 : 10;
    for(let i=0; i<count; i++) {
        // Оновлено конструктор Particle
        particles.push(new Particle(
            x, y, color,
            (Math.random() - 0.5) * (isBig ? 10 : 5), // vx
            (Math.random() - 0.5) * (isBig ? 10 : 5), // vy
            Math.random() * 4 + 2, // size
            30, // life
            1.0 // decay
        ));
    }
}

// --- СПЕЦІАЛЬНІ ФУНКЦІЇ ДЛЯ ВИБУХУ ГРАВЦЯ ---

// 1. Ефект отримання шкоди (маленький спалах)
function createSimpleHitEffect(x, y) {
    for(let i=0; i<10; i++) {
        particles.push(new Particle(
            x, y, '#ff4400',
            (Math.random() - 0.5) * 6, // vx
            (Math.random() - 0.5) * 6, // vy
            Math.random() * 3 + 1, // size
            20, // life
            1.5 // decay
        ));
    }
}

// 2. ФІНАЛЬНИЙ ВЕЛИКИЙ ВИБУХ (тобі це потрібно)
function createPlayerExplosion(x, y) {
    // Шари вибуху: спалах, уламки, дим, іскри

    // A. Початковий спалах
    for (let i = 0; i < 5; i++) {
        particles.push(new Particle(
            x + (Math.random() - 0.5) * 20,
            y + (Math.random() - 0.5) * 20,
            'rgba(255, 255, 200, 1)', // Яскраве ядро
            (Math.random() - 0.5) * 5, // vx
            (Math.random() - 0.5) * 5, // vy
            Math.random() * 15 + 10, // Великий розмір
            15, // Коротке життя
            1.5, // Швидке згасання
            1.2 // Значне розширення
        ));
    }

    // B. Основний вогонь і уламки (більше частинок)
    for (let i = 0; i < 40; i++) {
        particles.push(new Particle(
            x, y,
            ['#ff0000', '#ff8800', '#ffcc00'][Math.floor(Math.random() * 3)], // різні кольори
            (Math.random() - 0.5) * 12, // Велика швидкість
            (Math.random() - 0.5) * 12, // vy
            Math.random() * 5 + 2, // size
            40, // life
            1.0 // decay
        ));
    }

    // C. Дим, який розширюється
    for (let i = 0; i < 20; i++) {
        particles.push(new Particle(
            x, y,
            'rgba(80, 80, 80, 0.7)', // Напівпрозорий сірий
            (Math.random() - 0.5) * 6, // vx
            (Math.random() - 0.5) * 6, // vy
            Math.random() * 15 + 10, // size
            60, // life
            0.5, // slow decay
            1.1 // Розширення
        ));
    }

    // D. Швидкі іскри
    for (let i = 0; i < 15; i++) {
        particles.push(new Particle(
            x, y, '#ffffff',
            (Math.random() - 0.5) * 18, // vx
            (Math.random() - 0.5) * 18, // vy
            Math.random() * 3 + 1, // size
            25, // life
            2.0 // high decay
        ));
    }
}

// НОВІ УПРАВЛІННЯ ПАЛЬЦЕМ
function movePlayer(e) {
    if (gameOver) return;
    if(e.type === 'touchmove' || e.type === 'touchstart') e.preventDefault(); 

    let clientX = (e.touches && e.touches.length > 0) ? e.touches[0].clientX : e.clientX;
    let clientY = (e.touches && e.touches.length > 0) ? e.touches[0].clientY : e.clientY;
    
    player.targetX = clientX;
    player.targetY = clientY - 80; // Ракета вище пальця
}

canvas.addEventListener('touchstart', movePlayer, { passive: false });
canvas.addEventListener('touchmove', movePlayer, { passive: false });
canvas.addEventListener('mousemove', movePlayer);

// --- ОСНОВНИЙ ЦИКЛ ---
function update() {
    if (gameFinished) return; // Повна зупинка, якщо UI вже показано
    requestAnimationFrame(update);

    if (gameOverTimer === 0 && !gameOver) { // Тільки поки ми граємо
        if (globalSpeed < 3.0) {
            globalSpeed += 0.0003; 
        }
    }

    let dx = 0, dy = 0;
    if (screenShake > 0) {
        dx = (Math.random() - 0.5) * screenShake;
        dy = (Math.random() - 0.5) * screenShake;
        screenShake *= 0.9; 
        if(screenShake < 0.5) screenShake = 0;
    }

    ctx.fillStyle = '#020205'; 
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.save();
    ctx.translate(dx, dy); 
    
    // 1. Зорі (завжди)
    ctx.fillStyle = "white";
    stars.forEach(star => {
        star.y += star.baseSpeed * globalSpeed;
        if(star.y > canvas.height) { star.y = 0; star.x = Math.random() * canvas.width; }
        ctx.globalAlpha = Math.min(1, (star.baseSpeed / 3) * globalSpeed); 
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI*2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;

    // 2. Дим від ракети (завжди, якщо вона не вибухає)
    if (!gameOver && frames % 4 === 0) {
        particles.push(new Particle(player.x, player.y + 45, 'rgba(150, 150, 150, 0.4)', 2, 6, 6, 20, 1.0));
        particles.push(new Particle(player.x - 19, player.y + 40, 'rgba(150, 150, 150, 0.3)', 2, 4, 4, 15, 1.0));
        particles.push(new Particle(player.x + 19, player.y + 40, 'rgba(150, 150, 150, 0.3)', 2, 4, 4, 15, 1.0));
    }

    // --- ЛОГІКА ГРИ (тільки якщо НЕ gameOver) ---
    if (!gameOver) {
        frames++;
        player.update();
        player.draw();

        // Стрільба
        let shootRate = Math.max(15, Math.floor(28 - (globalSpeed * 3)));
        if (frames % shootRate === 0) {
            bullets.push({x: player.x - 45, y: player.y - 10});
            bullets.push({x: player.x + 45, y: player.y - 10});
        }

        // Спавн ворогів
        let spawnRate = Math.max(20, Math.floor(80 / globalSpeed));
        if (frames % spawnRate === 0) {
            enemies.push(new Enemy());
        }

        // Кулі
        ctx.fillStyle = "#ffcc00"; 
        for (let i = bullets.length - 1; i >= 0; i--) {
            let b = bullets[i];
            b.y -= 12 + (3 * globalSpeed); 
            ctx.beginPath(); ctx.ellipse(b.x, b.y, 4, 12, 0, 0, Math.PI*2); ctx.fill();
            if (b.y < 0) bullets.splice(i, 1);
        }

        // Вороги і зіткнення
        for (let i = enemies.length - 1; i >= 0; i--) {
            let e = enemies[i];
            e.update();
            e.draw();

            for (let j = bullets.length - 1; j >= 0; j--) {
                let b = bullets[j];
                let dist = Math.hypot(b.x - e.x, b.y - e.y);

                if (dist < e.size/2 + 5) { 
                    e.hp--;
                    bullets.splice(j, 1);
                    createExplosion(b.x, b.y, '#ffaa00', false); 

                    if(e.hp <= 0) {
                        createExplosion(e.x, e.y, '#777777', true); 
                        enemies.splice(i, 1);
                        score += 15;
                        document.getElementById('score').innerText = score;
                        if(globalSpeed < 3.0) globalSpeed += 0.01; 
                        if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('light');
                    }
                    break;
                }
            }

            // ЗІТКНЕННЯ ГРАВЦЯ З ВОРОГОМ
            if (enemies[i] && player.invulnerable <= 0) {
                let distToPlayer = Math.hypot(player.x - e.x, player.y - e.y);
                
                if (distToPlayer < (player.width/2 + e.size/2 - 15) && Math.abs(player.y - e.y) < player.height/2) {
                    
                    player.hp--; // Втрата життя
                    
                    // Рахуємо кут відкидання
                    let angle = Math.atan2(player.y - e.y, player.x - e.x);
                    let force = 35;
                    player.vx = Math.cos(angle) * force;
                    player.vy = Math.sin(angle) * force;
                    
                    player.invulnerable = 90; 
                    
                    // НЕ робимо великий вибух тут!
                    createSimpleHitEffect(player.x, player.y); // Просто іскри
                    screenShake = 30;
                    
                    if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('warning');

                    if (player.hp <= 0) {
                        // ТАК, ЦЕ ЗАУВАЖЕННЯ: ВЕЛИКИЙ ВИБУХ ТУТ!
                        createPlayerExplosion(player.x, player.y);
                        gameOver = true; // Зупиняємо логіку на наступному кадрі
                        gameOverTimer = 180; // Тривалість вибуху (3 сек, 180 кадрів)
                    }

                    // Знищуємо метеорит, що в нас врізався
                    enemies.splice(i, 1);
                }
            }

            if (e && e.y > canvas.height + 50) enemies.splice(i, 1);
        }
    } else {
        // --- ЛОГІКА ХЕНДЛІНГУ СТАНУ ЗАВЕРШЕННЯ (якщо gameOver) ---
        
        // Зупиняємо або значно сповільнюємо гру (наприклад, зорі)
        // У цьому коді ми їх не сповільнюємо, щоб вибух виглядав динамічно.
        // Але нові вороги або кулі більше не оновлюються.

        // Перевірка таймера на повну зупинку
        if (gameOverTimer > 0) {
            gameOverTimer--;
            if (gameOverTimer === 0) {
                // Повний капець, показуємо UI і зупиняємо update
                showGameOverUI();
                gameFinished = true; // Повна зупинка update
                return;
            }
        }
    }

    // 3. Відмальовка частинок (завжди)
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].draw();
        if (particles[i].life <= 0) particles.splice(i, 1);
    }

    // 4. Малюємо інтерфейс життів (Сердечка) зверху справа
    if (!gameFinished) { // Малюємо тільки якщо UI ще немає
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.font = "24px Arial";
        for(let l = 0; l < player.hp; l++) {
            ctx.fillText("❤️", canvas.width - 20 - (l * 35), 35);
        }
    }

    ctx.restore();
}

// НОВА ФУНКЦІЯ ДЛЯ ПОКАЗУ UI (вона тепер викликається автоматично таймером)
function showGameOverUI() {
    if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('error');
    document.getElementById('gameover').style.display = 'block';
    document.getElementById('final-score').innerText = score;
}

function sendScore() {
    const data = JSON.stringify({ action: "game_score", amount: score });
    tg.sendData(data); 
}

// Запускаємо цикл
update();