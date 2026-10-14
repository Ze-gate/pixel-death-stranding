```javascript
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 640;
canvas.height = 360;

let gameState = 'START'; 
let distance = 0;
const maxDistance = 2500;

let sam = {
    x: 80,
    y: 260,
    width: 24,
    height: 32,
    lean: 0,
    isBalanced: true
};

let obstacles = [];
let particles = [];
let inputMove = 0;
let weatherTimer = 0;
let currentWeather = 'CLEAR';

window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a') inputMove = -1;
    if (e.key === 'ArrowRight' || e.key === 'd') inputMove = 1;
    if (e.key === 't' || e.key === 'T') triggerBalance();
    if (e.key === 'o' || e.key === 'O') triggerOdradek();
});

window.addEventListener('keyup', (e) => {
    if ((e.key === 'ArrowLeft' || e.key === 'a') && inputMove === -1) inputMove = 0;
    if ((e.key === 'ArrowRight' || e.key === 'd') && inputMove === 1) inputMove = 0;
});

function setMove(dir) {
    inputMove = dir;
}

function triggerBalance() {
    sam.lean = 0;
    sam.isBalanced = true;
    document.getElementById('game-status').innerText = "STABLE";
    document.getElementById('game-status').className = "text-green-400 font-bold";
}

function triggerOdradek() {
    for(let i=0; i<15; i++) {
        particles.push({
            x: sam.x + 12,
            y: sam.y + 16,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 4,
            life: 30,
            color: '#22d3ee'
        });
    }
}

function startGame() {
    gameState = 'PLAYING';
    distance = 0;
    sam.lean = 0;
    obstacles = [];
    particles = [];
    document.getElementById('overlay-screen').classList.add('hidden');
}

function gameOver(reason) {
    gameState = 'GAMEOVER';
    document.getElementById('overlay-title').innerText = "MISI GAGAL";
    document.getElementById('overlay-desc').innerText = reason + "\nKargo rusak atau Anda terjatuh oleh BTs.";
    document.getElementById('overlay-screen').classList.remove('hidden');
}

function gameWin() {
    gameState = 'WIN';
    document.getElementById('overlay-title').innerText = "MISI BERHASIL!";
    document.getElementById('overlay-desc').innerText = "Selamat! Kargo berhasil dikirim ke Terminal UCA dengan aman.";
    document.getElementById('overlay-screen').classList.remove('hidden');
}

function update() {
    if (gameState !== 'PLAYING') return;

    distance += 2;
    if (distance >= maxDistance) {
        gameWin();
        return;
    }

    weatherTimer++;
    if (weatherTimer > 300) {
        currentWeather = Math.random() > 0.4 ? 'TIMEFALL' : 'CLEAR';
        document.getElementById('weather-status').innerText = currentWeather;
        document.getElementById('weather-status').className = currentWeather === 'TIMEFALL' ? 'text-purple-400 font-bold' : 'text-cyan-400 font-bold';
        weatherTimer = 0;
    }

    sam.lean += (Math.random() - 0.5) * 0.08 + (inputMove * 0.04);
    if (Math.abs(sam.lean) > 0.8) {
        sam.isBalanced = false;
        document.getElementById('game-status').innerText = "WARNING!";
        document.getElementById('game-status').className = "text-red-500 font-bold animate-pulse";
    }
    if (Math.abs(sam.lean) > 1.2) {
        gameOver("Kargo Terbalik & Jatuh ke Tanah!");
    }

    if (Math.random() < 0.02) {
        obstacles.push({
            x: canvas.width,
            y: 280,
            type: Math.random() > 0.5 ? 'ROCK' : 'BT'
        });
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].x -= 3;
        if (Math.abs(obstacles[i].x - sam.x) < 18 && obstacles[i].type === 'ROCK') {
            sam.lean += 0.5;
            obstacles.splice(i, 1);
            continue;
        }
        if (obstacles[i].x < -30) {
            obstacles.splice(i, 1);
        }
    }

    if (currentWeather === 'TIMEFALL') {
        for(let i=0; i<3; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: 0,
                vx: -1,
                vy: 6,
                life: 40,
                color: '#c084fc'
            });
        }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].x += particles[i].vx;
        particles[i].y += particles[i].vy;
        particles[i].life--;
        if (particles[i].life <= 0) particles.splice(i, 1);
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(0, 280);
    ctx.lineTo(120, 180);
    ctx.lineTo(240, 280);
    ctx.lineTo(380, 150);
    ctx.lineTo(520, 280);
    ctx.lineTo(640, 200);
    ctx.lineTo(640, 360);
    ctx.lineTo(0, 360);
    ctx.fill();

    ctx.fillStyle = '#334155';
    ctx.fillRect(0, 300, canvas.width, 60);
    ctx.fillStyle = '#0f172a';
    for(let x = -(distance % 40); x < canvas.width; x += 40) {
        ctx.fillRect(x, 300, 20, 4);
    }

    ctx.save();
    ctx.translate(sam.x + 12, sam.y + 16);
    ctx.rotate(sam.lean);

    ctx.fillStyle = 'orange';
    ctx.fillRect(-14, -8, 12, 18);

    ctx.fillStyle = '#475569';
    ctx.fillRect(-6, -12, 12, 22);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-6, -18, 12, 8);
    ctx.fillStyle = '#22d3ee';
    ctx.fillRect(6, -16, 4, 4);

    ctx.restore();

    obstacles.forEach(obs => {
        if (obs.type === 'ROCK') {
            ctx.fillStyle = '#64748b';
            ctx.fillRect(obs.x, 285, 20, 15);
        } else {
            ctx.fillStyle = 'rgba(192, 132, 252, 0.6)';
            ctx.fillRect(obs.x, 240 + Math.sin(Date.now() * 0.01) * 10, 16, 24);
        }
    });

    particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 2, 4);
    });

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(20, 20, 200, 10);
    ctx.fillStyle = '#22d3ee';
    ctx.fillRect(20, 20, (distance / maxDistance) * 200, 10);
    ctx.strokeStyle = '#9ca3af';
    ctx.strokeRect(20, 20, 200, 10);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '8px "Press Start 2P"';
    ctx.fillText('DESTINATION: UCA', 20, 44);
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

window.onload = function() {
    loop();
};
```
