
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 640;
canvas.height = 360;

let gameState = 'START';
let distance = 0;
const distancePerStation = 1000;
let deliveriesDone = 0;
const targetDeliveries = 3;

let sam = {
    x: 100,
    y: 250,
    width: 28,
    height: 38,
    lean: 0,
    stamina: 100,
    cargoWeight: 45,
    ammo: 8,
    isHoldingBreath: false,
    animFrame: 0
};

let bullets = [];
let obstacles = [];
let particles = [];
let station = null;
let bgScroll = 0;

let inputMove = 0;
let weatherTimer = 0;
let currentWeather = 'CERAH';
let odradekActive = false;
let odradekTimer = 0;

window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a') inputMove = -1;
    if (e.key === 'ArrowRight' || e.key === 'd') inputMove = 1;
    if (e.key === 't' || e.key === 'T') triggerBalance();
    if (e.key === 's' || e.key === 'S') triggerShoot();
    if (e.key === 'o' || e.key === 'O') triggerOdradek();
    if (e.code === 'Space') triggerHoldBreath();
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
    sam.stamina = 100;
    updateDashboard();
}

function triggerShoot() {
    if (gameState !== 'PLAYING') return;
    
    sam.ammo = Math.max(0, sam.ammo - 1);
    bullets.push({
        x: sam.x + 25,
        y: sam.y + 12,
        vx: 8
    });

    for(let i=0; i<8; i++) {
        particles.push({
            x: sam.x + 28,
            y: sam.y + 12,
            vx: Math.random() * 3 + 2,
            vy: (Math.random() - 0.5) * 3,
            life: 15,
            color: '#f59e0b'
        });
    }
    updateDashboard();
}

function triggerOdradek() {
    odradekActive = true;
    odradekTimer = 45;
    for(let i=0; i<20; i++) {
        particles.push({
            x: sam.x + 14,
            y: sam.y + 18,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            life: 30,
            color: '#22d3ee'
        });
    }
}

function triggerHoldBreath() {
    sam.isHoldingBreath = true;
    setTimeout(() => {
        sam.isHoldingBreath = false;
    }, 3000);
}

function updateDashboard() {
    document.getElementById('delivery-count').innerText = `${deliveriesDone} / ${targetDeliveries}`;
    document.getElementById('cargo-weight').innerText = `${sam.cargoWeight.toFixed(1)} KG`;
    document.getElementById('stamina-status').innerText = `${Math.floor(sam.stamina)}%`;
    document.getElementById('ammo-status').innerText = `${sam.ammo} AMMO`;
}

function startGame() {
    gameState = 'PLAYING';
    distance = 0;
    deliveriesDone = 0;
    sam.lean = 0;
    sam.stamina = 100;
    sam.cargoWeight = 45;
    sam.ammo = 8;
    obstacles = [];
    bullets = [];
    particles = [];
    station = null;
    updateDashboard();
    document.getElementById('overlay-screen').classList.add('hidden');
}

function gameWin() {
    gameState = 'WIN';
    document.getElementById('overlay-title').innerText = "MISI PENGIRIMAN SUKSES!";
    document.getElementById('overlay-desc').innerText = "Hebat! Semua paket kargo berhasil diantarkan ke Pos UCA dengan selamat dan damai.";
    document.getElementById('overlay-screen').classList.remove('hidden');
}

function spawnStation() {
    station = {
        x: canvas.width + 50,
        delivered: false
    };
}

function update() {
    if (gameState !== 'PLAYING') return;

    distance += 2.5;
    bgScroll += 1.2;

    if (distance > (deliveriesDone + 1) * distancePerStation && !station) {
        spawnStation();
    }

    if (station) {
        station.x -= 3;
        if (Math.abs(station.x - sam.x) < 40 && !station.delivered) {
            station.delivered = true;
            deliveriesDone++;
            sam.cargoWeight = Math.max(15, sam.cargoWeight - 15);
            sam.stamina = 100;
            sam.ammo = Math.min(12, sam.ammo + 5);
            
            for(let i=0; i<30; i++) {
                particles.push({
                    x: sam.x + 10,
                    y: sam.y - 10,
                    vx: (Math.random() - 0.5) * 8,
                    vy: (Math.random() - 0.5) * 8,
                    life: 40,
                    color: '#22c55e'
                });
            }

            updateDashboard();

            if (deliveriesDone >= targetDeliveries) {
                gameWin();
                return;
            }
        }
        if (station.x < -100) station = null;
    }

    weatherTimer++;
    if (weatherTimer > 400) {
        currentWeather = Math.random() > 0.6 ? 'TIMEFALL' : 'CERAH';
        document.getElementById('weather-status').innerText = currentWeather;
        document.getElementById('weather-status').className = currentWeather === 'TIMEFALL' ? 'text-purple-400 font-bold' : 'text-cyan-400 font-bold';
        weatherTimer = 0;
    }

    // Relaxed balance: auto-stabilize smoothly, no instant game over
    sam.lean += (inputMove * 0.05) - (sam.lean * 0.1);
    if (sam.lean > 1.0) sam.lean = 1.0;
    if (sam.lean < -1.0) sam.lean = -1.0;

    sam.stamina = Math.min(100, Math.max(20, sam.stamina + 0.02));
    updateDashboard();

    if (odradekTimer > 0) odradekTimer--;
    else odradekActive = false;

    if (Math.random() < 0.015 && !station) {
        const rand = Math.random();
        let type = 'ROCK';
        if (rand > 0.65) type = 'BT';
        else if (rand > 0.35) type = 'MULE';

        obstacles.push({
            x: canvas.width,
            y: type === 'MULE' ? 260 : 275,
            type: type,
            tied: false
        });
    }

    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].x += bullets[i].vx;

        for (let j = obstacles.length - 1; j >= 0; j--) {
            if (obstacles[j].type !== 'ROCK' && Math.abs(bullets[i].x - obstacles[j].x) < 20) {
                obstacles[j].tied = true;
                bullets.splice(i, 1);
                break;
            }
        }

        if (bullets[i] && bullets[i].x > canvas.width + 20) {
            bullets.splice(i, 1);
        }
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obs = obstacles[i];
        if (!obs.tied) obs.x -= 3;

        // Relaxed collision: obstacles just get passed or gently ignored without game over
        if (Math.abs(obs.x - sam.x) < 18) {
            if (obs.type === 'ROCK') {
                sam.lean += 0.2;
            }
            // MULEs and BTs are friendly / easily bypassed in casual mode
        }
        if (obs.x < -50) {
            obstacles.splice(i, 1);
        }
    }

    if (currentWeather === 'TIMEFALL') {
        for(let i=0; i<2; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: 0,
                vx: -1,
                vy: 6,
                life: 30,
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

function drawSam(x, y, lean) {
    ctx.save();
    ctx.translate(x + 14, y + 19);
    ctx.rotate(lean * 0.3);

    sam.animFrame += 0.12;
    const legCycle = Math.sin(sam.animFrame);

    const stackBoxes = Math.min(5, Math.floor(sam.cargoWeight / 10));
    for (let b = 0; b < stackBoxes; b++) {
        ctx.fillStyle = b % 2 === 0 ? '#b45309' : '#d97706';
        ctx.fillRect(-18, -18 - (b * 8), 14, 7);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-12, -18 - (b * 8), 2, 7);
        ctx.strokeStyle = '#78350f';
        ctx.strokeRect(-18, -18 - (b * 8), 14, 7);
    }

    ctx.fillStyle = '#334155';
    ctx.fillRect(-19, -18 - (stackBoxes * 8), 3, (stackBoxes * 8) + 10);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(-21, -12, 3, 4);

    ctx.fillStyle = '#ea580c';
    ctx.fillRect(-7, -13, 13, 19);
    
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-7, -13, 13, 6);
    ctx.fillRect(-8, -14, 4, 4);
    ctx.fillRect(4, -14, 4, 4);

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-6, -7, 11, 2);
    ctx.fillRect(-3, -11, 2, 8);
    ctx.fillRect(-7, -4, 13, 3);

    ctx.fillStyle = '#78350f';
    ctx.fillRect(1, -6, 7, 6);
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(2, -5, 5, 4);
    ctx.fillStyle = '#22d3ee';
    ctx.fillRect(3, -4, 3, 2);

    ctx.fillStyle = '#64748b';
    ctx.fillRect(-5, -17, 3, 4);
    if (odradekActive) {
        ctx.fillStyle = '#22d3ee';
        ctx.fillRect(-8, -24, 8, 8);
        ctx.fillStyle = '#c084fc';
        ctx.fillRect(-6, -22, 4, 4);
    } else {
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(-6, -21, 4, 4);
    }

    ctx.fillStyle = '#334155';
    ctx.fillRect(-6, -23, 11, 10);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(-6, -23, 11, 3);
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(0, -20, 5, 4);

    ctx.fillStyle = '#c2410c';
    ctx.fillRect(-3, -9, 8, 4);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(5, -8, 8, 5);

    ctx.fillStyle = '#1e293b';
    if (legCycle > 0) {
        ctx.fillRect(-6, 6, 4, 10);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-7, 14, 6, 3);
        
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 4, 4, 11);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-1, 13, 6, 3);
    } else {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-4, 4, 4, 11);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-5, 13, 6, 3);

        ctx.fillStyle = '#1e293b';
        ctx.fillRect(2, 6, 4, 10);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(1, 14, 6, 3);
    }

    ctx.restore();
}

function drawStation(x, y) {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x - 10, y - 80, 65, 90);
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 10, y - 80, 65, 90);

    ctx.strokeStyle = 'rgba(34, 211, 238, 0.6)';
    ctx.beginPath();
    ctx.arc(x + 22, y - 40, 35, Math.PI, 0, false);
    ctx.stroke();

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(x, y - 70, 45, 25);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(x + 4, y - 66, 37, 17);
    ctx.fillStyle = '#022c22';
    ctx.font = '5px "Press Start 2P"';
    ctx.fillText('UCA PORTAL', x + 6, y - 54);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const skyGrad = ctx.createLinearGradient(0, 0, 0, 360);
    skyGrad.addColorStop(0, '#f97316');
    skyGrad.addColorStop(0.35, '#fb923c');
    skyGrad.addColorStop(0.75, '#38bdf8');
    skyGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(520, 80, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(254, 240, 138, 0.25)';
    ctx.beginPath();
    ctx.arc(520, 80, 44, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(0, 270);
    let mountainOffset1 = (bgScroll * 0.2) % canvas.width;
    ctx.lineTo(90 - mountainOffset1, 110);
    ctx.lineTo(190 - mountainOffset1, 210);
    ctx.lineTo(280 - mountainOffset1, 90);
    ctx.lineTo(390 - mountainOffset1, 230);
    ctx.lineTo(480 - mountainOffset1, 120);
    ctx.lineTo(590 - mountainOffset1, 270);
    ctx.lineTo(canvas.width, 170);
    ctx.lineTo(canvas.width, 360);
    ctx.lineTo(0, 360);
    ctx.fill();

    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    let mountainOffset2 = (bgScroll * 0.45) % canvas.width;
    ctx.moveTo(0 - mountainOffset2, 290);
    ctx.lineTo(130 - mountainOffset2, 150);
    ctx.lineTo(250 - mountainOffset2, 290);
    ctx.lineTo(370 - mountainOffset2, 135);
    ctx.lineTo(490 - mountainOffset2, 290);
    ctx.lineTo(620 - mountainOffset2, 165);
    ctx.lineTo(canvas.width + 100, 290);
    ctx.lineTo(canvas.width + 100, 360);
    ctx.lineTo(0, 360);
    ctx.fill();

    ctx.strokeStyle = 'rgba(250, 204, 21, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 195);
    ctx.lineTo(canvas.width, 195);
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    let terrainOffset = (bgScroll * 0.8) % canvas.width;
    ctx.moveTo(0 - terrainOffset, 290);
    ctx.lineTo(160 - terrainOffset, 220);
    ctx.lineTo(320 - terrainOffset, 290);
    ctx.lineTo(480 - terrainOffset, 230);
    ctx.lineTo(640 - terrainOffset, 290);
    ctx.lineTo(canvas.width + 100, 290);
    ctx.lineTo(canvas.width + 100, 360);
    ctx.lineTo(0, 360);
    ctx.fill();

    ctx.fillStyle = '#475569';
    ctx.fillRect(0, 290, canvas.width, 70);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(0, 290, canvas.width, 3);

    if (station) {
        drawStation(station.x, 290);
    }

    if (odradekActive) {
        ctx.strokeStyle = 'rgba(34, 211, 238, 0.75)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sam.x + 14, sam.y + 10, (45 - odradekTimer) * 5, 0, Math.PI * 2);
        ctx.stroke();
    }

    drawSam(sam.x, sam.y, sam.lean);

    bullets.forEach(b => {
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(b.x, b.y, 10, 4);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(b.x - 3, b.y - 1, 4, 6);
    });

    obstacles.forEach(obs => {
        if (obs.type === 'ROCK') {
            ctx.fillStyle = '#475569';
            ctx.fillRect(obs.x, 272, 26, 18);
            ctx.fillStyle = '#64748b';
            ctx.fillRect(obs.x + 4, 268, 16, 6);
        } else if (obs.type === 'MULE') {
            ctx.fillStyle = obs.tied ? '#854d0e' : '#eab308';
            ctx.fillRect(obs.x, 252, 16, 28);
            ctx.fillStyle = '#ca8a04';
            ctx.fillRect(obs.x + 2, 248, 12, 6);
            if (obs.tied) {
                ctx.strokeStyle = '#f59e0b';
                ctx.lineWidth = 2;
                ctx.strokeRect(obs.x - 3, 250, 22, 32);
            }
        } else {
            ctx.fillStyle = obs.tied ? 'rgba(100, 100, 100, 0.3)' : 'rgba(192, 132, 252, 0.85)';
            const hoverY = 225 + Math.sin(Date.now() * 0.008) * 12;
            ctx.fillRect(obs.x, hoverY, 20, 32);
            ctx.fillStyle = 'rgba(216, 180, 254, 0.6)';
            ctx.fillRect(obs.x - 4, hoverY + 10, 4, 12);
            ctx.fillRect(obs.x + 20, hoverY + 14, 4, 12);
            if (obs.tied) {
                ctx.strokeStyle = '#f59e0b';
                ctx.lineWidth = 2;
                ctx.strokeRect(obs.x - 3, hoverY - 2, 26, 36);
            }
        }
    });

    particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 2, 6);
    });

    const progressToNext = (distance % distancePerStation) / distancePerStation;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(20, 15, 190, 14);
    ctx.fillStyle = '#22d3ee';
    ctx.fillRect(22, 17, progressToNext * 186, 10);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.strokeRect(20, 15, 190, 14);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '6px "Press Start 2P"';
    ctx.fillText('POS UCA TERMINAL', 28, 24);
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

window.onload = function() {
    loop();
};
