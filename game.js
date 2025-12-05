// Drone Delivery Simulator Game Logic

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game state
let gameState = {
    running: false,
    paused: false,
    score: 0,
    deliveries: 0,
    money: 0,
    level: 1,
    battery: 100,
    maxBattery: 100,
    difficulty: 'easy',
    totalAttempts: 0,
    upgrades: {
        battery: 0,
        speed: 0,
        weather: 0
    }
};

// Drone object
let drone = {
    x: 100,
    y: 100,
    targetX: 100,
    targetY: 100,
    size: 20,
    speed: 2,
    isDelivering: false,
    atBase: true
};

// Base location
const base = { x: 100, y: 100, size: 40 };

// Delivery locations
let deliveryPoints = [];
let activeDelivery = null;

// Obstacles
let obstacles = [];

// Weather system
let weather = {
    type: 'clear', // clear, rain, wind, storm
    severity: 0
};

const weatherTypes = [
    { type: 'clear', name: '☀️ Clear Skies', class: 'weather-clear', successMod: 1 },
    { type: 'rain', name: '🌧️ Light Rain', class: 'weather-rain', successMod: 0.9 },
    { type: 'wind', name: '💨 Windy', class: 'weather-wind', successMod: 0.85 },
    { type: 'storm', name: '⛈️ Storm', class: 'weather-storm', successMod: 0.6 }
];

// Animation frame
let animationFrame;
let lastTime = 0;

// Difficulty settings
const difficultySettings = {
    easy: { obstacleCount: 3, batteryDrain: 0.05, deliveryReward: 100, weatherChangeChance: 0.002 },
    medium: { obstacleCount: 5, batteryDrain: 0.08, deliveryReward: 150, weatherChangeChance: 0.004 },
    hard: { obstacleCount: 8, batteryDrain: 0.12, deliveryReward: 200, weatherChangeChance: 0.006 }
};

// Set difficulty
function setDifficulty(level) {
    gameState.difficulty = level;
    document.querySelectorAll('.difficulty-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(level + 'Btn').classList.add('active');
}

// Initialize game
function initGame() {
    // Reset game state
    gameState.score = 0;
    gameState.deliveries = 0;
    gameState.money = 0;
    gameState.level = 1;
    gameState.battery = gameState.maxBattery;
    gameState.totalAttempts = 0;

    // Reset drone
    drone.x = base.x;
    drone.y = base.y;
    drone.targetX = base.x;
    drone.targetY = base.y;
    drone.isDelivering = false;
    drone.atBase = true;

    // Generate delivery points
    generateDeliveryPoints();

    // Generate obstacles
    generateObstacles();

    // Set initial weather
    weather.type = 'clear';
    updateWeatherDisplay();

    updateDisplay();
}

// Generate random delivery points
function generateDeliveryPoints() {
    deliveryPoints = [];
    for (let i = 0; i < 6; i++) {
        deliveryPoints.push({
            x: Math.random() * (canvas.width - 100) + 50,
            y: Math.random() * (canvas.height - 100) + 50,
            active: true,
            size: 15,
            value: Math.floor(Math.random() * 100) + 50
        });
    }
}

// Generate obstacles
function generateObstacles() {
    obstacles = [];
    const settings = difficultySettings[gameState.difficulty];
    for (let i = 0; i < settings.obstacleCount; i++) {
        obstacles.push({
            x: Math.random() * (canvas.width - 100) + 50,
            y: Math.random() * (canvas.height - 100) + 50,
            width: Math.random() * 40 + 30,
            height: Math.random() * 40 + 30,
            type: Math.random() > 0.5 ? 'building' : 'tree'
        });
    }
}

// Start game
function startGame() {
    if (gameState.running) return;

    initGame();
    gameState.running = true;
    gameState.paused = false;

    document.getElementById('startBtn').disabled = true;
    document.getElementById('pauseBtn').disabled = false;
    document.getElementById('returnBtn').disabled = false;

    lastTime = performance.now();
    gameLoop();
}

// Game loop
function gameLoop(currentTime) {
    if (!gameState.running || gameState.paused) return;

    const deltaTime = (currentTime - lastTime) / 16.67; // Normalize to 60fps
    lastTime = currentTime;

    update(deltaTime);
    draw();

    animationFrame = requestAnimationFrame(gameLoop);
}

// Update game state
function update(deltaTime) {
    // Move drone
    if (!drone.atBase) {
        const dx = drone.targetX - drone.x;
        const dy = drone.targetY - drone.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 2) {
            const moveSpeed = drone.speed * (1 + gameState.upgrades.speed * 0.2);
            drone.x += (dx / distance) * moveSpeed * deltaTime;
            drone.y += (dy / distance) * moveSpeed * deltaTime;

            // Drain battery
            const drainRate = difficultySettings[gameState.difficulty].batteryDrain;
            gameState.battery -= drainRate * deltaTime * (weather.type === 'storm' ? 1.5 : 1);

            // Check battery
            if (gameState.battery <= 0) {
                gameOver('Battery depleted!');
                return;
            }

            updateDisplay();
        } else {
            // Reached target
            if (drone.isDelivering && activeDelivery) {
                completeDelivery();
            } else if (Math.abs(drone.x - base.x) < 5 && Math.abs(drone.y - base.y) < 5) {
                // Back at base
                drone.atBase = true;
                gameState.battery = Math.min(100, gameState.battery + 2); // Recharge
            }
        }
    }

    // Check collision with obstacles
    for (let obstacle of obstacles) {
        if (checkCollision(drone, obstacle)) {
            gameState.score = Math.max(0, gameState.score - 50);
            drone.x = base.x;
            drone.y = base.y;
            drone.targetX = base.x;
            drone.targetY = base.y;
            drone.atBase = true;
            drone.isDelivering = false;
            activeDelivery = null;
            updateDisplay();
            showAchievement('Collision! Returned to base. -50 points');
        }
    }

    // Random weather changes
    const weatherChance = difficultySettings[gameState.difficulty].weatherChangeChance;
    if (Math.random() < weatherChance) {
        changeWeather();
    }

    // Level up check
    if (gameState.deliveries >= gameState.level * 5) {
        levelUp();
    }
}

// Draw game
function draw() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw sky gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    if (weather.type === 'storm') {
        gradient.addColorStop(0, '#6B7280');
        gradient.addColorStop(1, '#9CA3AF');
    } else if (weather.type === 'rain') {
        gradient.addColorStop(0, '#93C5FD');
        gradient.addColorStop(1, '#BFDBFE');
    } else {
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#B0E0E6');
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw ground
    ctx.fillStyle = '#90EE90';
    ctx.fillRect(0, canvas.height - 50, canvas.width, 50);

    // Draw base
    ctx.fillStyle = '#3B82F6';
    ctx.fillRect(base.x - base.size/2, base.y - base.size/2, base.size, base.size);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🏠 BASE', base.x, base.y + 5);

    // Draw obstacles
    obstacles.forEach(obstacle => {
        if (obstacle.type === 'building') {
            ctx.fillStyle = '#9CA3AF';
            ctx.fillRect(obstacle.x - obstacle.width/2, obstacle.y - obstacle.height/2, obstacle.width, obstacle.height);
            ctx.fillStyle = '#6B7280';
            ctx.fillRect(obstacle.x - obstacle.width/2, obstacle.y - obstacle.height/2, obstacle.width, 10);
        } else {
            ctx.fillStyle = '#059669';
            ctx.beginPath();
            ctx.arc(obstacle.x, obstacle.y, obstacle.width/2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#047857';
            ctx.fillRect(obstacle.x - 3, obstacle.y, 6, obstacle.height/2);
        }
    });

    // Draw delivery points
    deliveryPoints.forEach((point, index) => {
        if (point.active) {
            ctx.fillStyle = '#F59E0B';
            ctx.beginPath();
            ctx.arc(point.x, point.y, point.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#D97706';
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.fillStyle = 'white';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('📦', point.x, point.y + 5);
        }
    });

    // Draw drone
    ctx.save();
    ctx.translate(drone.x, drone.y);

    // Drone body
    ctx.fillStyle = '#1E40AF';
    ctx.fillRect(-10, -10, 20, 20);

    // Propellers
    ctx.fillStyle = '#3B82F6';
    ctx.beginPath();
    ctx.arc(-15, -15, 8, 0, Math.PI * 2);
    ctx.arc(15, -15, 8, 0, Math.PI * 2);
    ctx.arc(-15, 15, 8, 0, Math.PI * 2);
    ctx.arc(15, 15, 8, 0, Math.PI * 2);
    ctx.fill();

    // Camera
    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Draw path line if delivering
    if (drone.isDelivering && activeDelivery) {
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(drone.x, drone.y);
        ctx.lineTo(activeDelivery.x, activeDelivery.y);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    // Draw rain/storm effects
    if (weather.type === 'rain' || weather.type === 'storm') {
        ctx.strokeStyle = weather.type === 'storm' ? 'rgba(200, 200, 255, 0.6)' : 'rgba(100, 100, 200, 0.3)';
        ctx.lineWidth = 1;
        for (let i = 0; i < (weather.type === 'storm' ? 100 : 50); i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x - 2, y + 10);
            ctx.stroke();
        }
    }
}

// Check collision
function checkCollision(obj1, obj2) {
    const buffer = 5;
    return Math.abs(obj1.x - obj2.x) < (obj2.width/2 + buffer) &&
           Math.abs(obj1.y - obj2.y) < (obj2.height/2 + buffer);
}

// Handle canvas click
canvas.addEventListener('click', (e) => {
    if (!gameState.running || gameState.paused || !drone.atBase) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    // Check if clicked on delivery point
    for (let point of deliveryPoints) {
        if (point.active) {
            const distance = Math.sqrt(Math.pow(clickX - point.x, 2) + Math.pow(clickY - point.y, 2));
            if (distance < point.size + 10) {
                startDelivery(point);
                break;
            }
        }
    }
});

// Start delivery
function startDelivery(deliveryPoint) {
    drone.targetX = deliveryPoint.x;
    drone.targetY = deliveryPoint.y;
    drone.isDelivering = true;
    drone.atBase = false;
    activeDelivery = deliveryPoint;
    gameState.totalAttempts++;
}

// Complete delivery
function completeDelivery() {
    const settings = difficultySettings[gameState.difficulty];
    const weatherMod = weatherTypes.find(w => w.type === weather.type).successMod;
    const weatherResistance = 1 + (gameState.upgrades.weather * 0.1);
    const finalMod = Math.min(1, weatherMod * weatherResistance);

    // Random success based on weather
    if (Math.random() < finalMod) {
        // Success!
        const reward = Math.floor(settings.deliveryReward * gameState.level);
        gameState.score += reward;
        gameState.money += reward;
        gameState.deliveries++;

        showAchievement(`Delivery Success! +$${reward}`);

        activeDelivery.active = false;

        // Generate new delivery point
        if (deliveryPoints.filter(p => p.active).length < 3) {
            deliveryPoints.push({
                x: Math.random() * (canvas.width - 100) + 50,
                y: Math.random() * (canvas.height - 100) + 50,
                active: true,
                size: 15,
                value: Math.floor(Math.random() * 100) + 50
            });
        }
    } else {
        // Failed due to weather
        gameState.score = Math.max(0, gameState.score - 50);
        showAchievement('Delivery Failed! Weather too severe. -50 points');
    }

    // Return to base
    drone.targetX = base.x;
    drone.targetY = base.y;
    drone.isDelivering = false;
    activeDelivery = null;

    updateDisplay();
}

// Return to base
function returnToBase() {
    if (!gameState.running || drone.atBase) return;

    drone.targetX = base.x;
    drone.targetY = base.y;
    drone.isDelivering = false;
    activeDelivery = null;
}

// Toggle pause
function togglePause() {
    if (!gameState.running) return;

    gameState.paused = !gameState.paused;
    document.getElementById('pauseBtn').textContent = gameState.paused ? 'Resume' : 'Pause';

    if (!gameState.paused) {
        lastTime = performance.now();
        gameLoop();
    }
}

// Change weather
function changeWeather() {
    const oldWeather = weather.type;
    weather.type = weatherTypes[Math.floor(Math.random() * weatherTypes.length)].type;

    if (oldWeather !== weather.type) {
        updateWeatherDisplay();
    }
}

// Update weather display
function updateWeatherDisplay() {
    const weatherInfo = weatherTypes.find(w => w.type === weather.type);
    const display = document.getElementById('weatherDisplay');
    display.textContent = weatherInfo.name;
    display.className = 'weather-indicator ' + weatherInfo.class;
}

// Level up
function levelUp() {
    gameState.level++;
    gameState.score += 500;
    showAchievement(`Level ${gameState.level}! +500 bonus points!`);

    // Add more obstacles
    if (gameState.level % 2 === 0) {
        obstacles.push({
            x: Math.random() * (canvas.width - 100) + 50,
            y: Math.random() * (canvas.height - 100) + 50,
            width: Math.random() * 40 + 30,
            height: Math.random() * 40 + 30,
            type: Math.random() > 0.5 ? 'building' : 'tree'
        });
    }

    updateDisplay();
}

// Buy upgrade
function buyUpgrade(type) {
    const costs = { battery: 500, speed: 750, weather: 1000 };
    const cost = costs[type] * (gameState.upgrades[type] + 1);

    if (gameState.money >= cost) {
        gameState.money -= cost;
        gameState.upgrades[type]++;

        if (type === 'battery') {
            gameState.maxBattery += 20;
            gameState.battery = Math.min(gameState.battery + 20, gameState.maxBattery);
        }

        showAchievement(`${type.charAt(0).toUpperCase() + type.slice(1)} upgraded! Level ${gameState.upgrades[type]}`);
        updateDisplay();
    } else {
        showAchievement('Not enough money for this upgrade!');
    }
}

// Show achievement popup
function showAchievement(text) {
    const popup = document.getElementById('achievementPopup');
    document.getElementById('achievementText').textContent = text;
    popup.classList.add('show');

    setTimeout(() => {
        popup.classList.remove('show');
    }, 3000);
}

// Update display
function updateDisplay() {
    document.getElementById('scoreDisplay').textContent = gameState.score;
    document.getElementById('deliveriesDisplay').textContent = gameState.deliveries;
    document.getElementById('moneyDisplay').textContent = '$' + gameState.money;
    document.getElementById('levelDisplay').textContent = gameState.level;

    const batteryPercent = Math.max(0, Math.min(100, gameState.battery));
    document.getElementById('batteryPercent').textContent = Math.floor(batteryPercent) + '%';
    document.getElementById('batteryBar').style.width = batteryPercent + '%';

    // Color code battery
    const batteryBar = document.getElementById('batteryBar');
    if (batteryPercent < 20) {
        batteryBar.style.background = '#EF4444';
    } else if (batteryPercent < 50) {
        batteryBar.style.background = '#F59E0B';
    } else {
        batteryBar.style.background = 'linear-gradient(90deg, #2563eb, #3b82f6)';
    }
}

// Game over
function gameOver(reason) {
    gameState.running = false;
    cancelAnimationFrame(animationFrame);

    document.getElementById('startBtn').disabled = false;
    document.getElementById('pauseBtn').disabled = true;
    document.getElementById('returnBtn').disabled = true;

    const successRate = gameState.totalAttempts > 0
        ? Math.floor((gameState.deliveries / gameState.totalAttempts) * 100)
        : 0;

    document.getElementById('gameOverTitle').textContent = 'Game Over!';
    document.getElementById('gameOverMessage').textContent = reason;
    document.getElementById('finalScore').textContent = gameState.score;
    document.getElementById('finalDeliveries').textContent = gameState.deliveries;
    document.getElementById('finalMoney').textContent = '$' + gameState.money;
    document.getElementById('successRate').textContent = successRate + '%';
    document.getElementById('finalLevel').textContent = gameState.level;
    document.getElementById('gameOverScreen').classList.add('show');
}

// Restart game
function restartGame() {
    document.getElementById('gameOverScreen').classList.remove('show');
    startGame();
}

// Initialize display
updateDisplay();
