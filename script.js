// 獲取畫布和上下文
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 600; // 設置畫布寬度
canvas.height = 400; // 設置畫布高度

let balls = [{ x: 100, y: 100, radius: 10, speedX: 2, speedY: 2 }];
let trails = []; // 儲存尾跡
let paddle = { x: canvas.width / 2 - 50, y: canvas.height - 20, width: 100, height: 10 };
let bricks = []; // 磚塊數組
let score = 0;
let lives = 3; // 血量限制為三條
let level = 1; // 當前關卡
let timeLimit = 30; // 時間挑戰模式的限制
let timer; // 計時器
let powerUps = []; // 儲存道具
let jumpCooldown = false;
let particles = []; // 確保這行存在

// 創建粒子效果
function createParticles(x, y) {
    const particleCount = 10; // 限制每次生成的粒子數量
    for (let i = 0; i < particleCount; i++) {
        const speedX = (Math.random() - 0.5) * 4; // 隨機速度
        const speedY = (Math.random() - 0.5) * 4; // 隨機速度
        const particle = {
            x: x,
            y: y,
            speedX: speedX,
            speedY: speedY,
            alpha: 1
        };
        particles.push(particle); // 將粒子加入粒子數組
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i];
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        particle.alpha -= 0.02; // 減少透明度

        // 檢查透明度
        if (particle.alpha <= 0) {
            particles.splice(i, 1); // 移除透明度為0的粒子
        }
    }
}
function jumpPaddle() {
    if (!jumpCooldown) {
        jumpCooldown = true;
        paddle.y -= 50; // 擋板向上移動50像素

        // 使用setTimeout來重置擋板位置
        setTimeout(() => {
            paddle.y += 50; // 擋板返回原位
            jumpCooldown = false; // 重置冷卻時間
        }, 300); // 這個時間可以根據需要調整
    }
}

// 事件監聽器
document.addEventListener('keydown', (event) => {
    if (event.key === ' ') { // 使用空格鍵來觸發跳躍
        jumpPaddle();
    }
});

canvas.addEventListener('click', jumpPaddle); // 鼠標點擊也觸發跳躍

// 磚塊排列函數
function createBricks() {
    bricks = [];
    for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 3; j++) {
            bricks.push({ x: i * 80 + 10, y: j * 30 + 30, width: 70, height: 20, isHit: false });
        }
    }
}

// 初始化遊戲
function init() {
    createBricks();
    startTimer();
    backgroundMusic.play(); // 播放背景音樂
}

// 更新函數
function update() {
    // 更新每顆球的位置
    for (const ball of balls) {
        ball.x += ball.speedX;
        ball.y += ball.speedY;

        // 將當前球的位置推入尾跡
        trails.push({ x: ball.x, y: ball.y, alpha: 1 });
    }

    // 更新粒子效果
    updateParticles(); // 呼叫更新粒子效果的函數
    if (lives <= 0) {
        endGame(); // 如果生命數小於或等於 0，結束遊戲
        }
    // 更新尾跡的透明度
    for (let i = 0; i < trails.length; i++) {
        trails[i].alpha -= 0.02; // 每次減少透明度
        if (trails[i].alpha <= 0) {
            trails.splice(i, 1); // 移除透明度為0的尾跡
            i--; // 調整索引
        }
    }

    // 檢查碰撞
    for (const ball of balls) {
        // 檢查與擋板的碰撞
        if (ball.y + ball.radius > paddle.y && ball.x > paddle.x && ball.x < paddle.x + paddle.width) {
            ball.speedY = -ball.speedY; // 改變方向
        }

        // 檢查與磚塊的碰撞
        for (const brick of bricks) {
            if (!brick.isHit && ball.x > brick.x && ball.x < brick.x + brick.width && ball.y + ball.radius > brick.y && ball.y - ball.radius < brick.y + brick.height) {
                ball.speedY = -ball.speedY; // 改變方向
                brick.isHit = true; // 標記磚塊已被打破
                score += 10; // 增加分數
                hitSound.play();
                break;
            }
        }

        // 碰撞邊界檢查
        if (ball.x + ball.radius > canvas.width || ball.x - ball.radius < 0) {
            ball.speedX = -ball.speedX; // 改變方向
        }
        if (ball.y - ball.radius < 0) {
            ball.speedY = -ball.speedY; // 改變方向
        }
        if (ball.y + ball.radius > canvas.height) {
            lives--; // 減少生命
            resetBall(ball); // 重置球的位置
        }
    }

    // 檢查是否通過關卡
    if (bricks.every(brick => brick.isHit)) {
        level++; // 增加關卡
        createBricks(); // 重新創建磚塊
        // 增加新的球
        balls.push({ x: 100, y: 100, radius: 10, speedX: 2, speedY: 2 });
    }

    // 處理道具
    for (let i = 0; i < powerUps.length; i++) {
        const powerUp = powerUps[i];
        powerUp.y += powerUp.speed; // 向下移動
        if (powerUp.y > canvas.height) {
            powerUps.splice(i, 1); // 移除超出畫布的道具
            i--;
        } else if (powerUp.y + powerUp.radius > paddle.y && powerUp.x > paddle.x && powerUp.x < paddle.x + paddle.width) {
            // 檢查擋板是否接觸到道具
            applyPowerUp(powerUp);
            powerUps.splice(i, 1);
            i--;
        }
    }
}

// 繪製函數
function draw() {
    // 清空畫布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 繪製尾跡
    for (const trail of trails) {
        ctx.fillStyle = `rgba(255, 0, 0, ${trail.alpha})`; // 使用紅色，透明度由 tail.alpha 決定
        ctx.beginPath();
        ctx.arc(trail.x, trail.y, 5, 0, Math.PI * 2); // 繪製圓形
        ctx.fill();
    }

    // 繪製球
    for (const ball of balls) {
        ctx.fillStyle = 'blue'; // 球的顏色
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fill();
    }

    // 繪製擋板
    ctx.fillStyle = 'green'; // 擋板顏色
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);

    // 繪製磚塊
    for (const brick of bricks) {
        if (!brick.isHit) {
            ctx.fillStyle = 'orange';
            ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
        }
    }

    // 繪製分數和生命
    ctx.fillStyle = 'black';
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Lives: ${lives}`, canvas.width - 80, 20);
    ctx.fillText(`Level: ${level}`, canvas.width / 2 - 20, 20);
}

// 重置球的位置
function resetBall(ball) {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    ball.speedX = 2 * (Math.random() > 0.5 ? 1 : -1);
    ball.speedY = -2;
}

// 開始計時
function startTimer() {
    timer = setInterval(() => {
        timeLimit--;
        
    }, 1000);
}

// 應用道具
function applyPowerUp(powerUp) {
    switch (powerUp.type) {
        case 'expandPaddle':
            paddle.width *= 1.5; // 擴大擋板
            setTimeout(() => paddle.width /= 1.5, 5000); // 5秒後恢復
            break;
        case 'shrinkPaddle':
            paddle.width /= 1.5; // 縮小擋板
            setTimeout(() => paddle.width *= 1.5, 5000); // 5秒後恢復
            break;
        case 'speedUpBall':
            for (const ball of balls) {
                ball.speedX *= 1.5; // 增加球速
                ball.speedY *= 1.5;
            }
            setTimeout(() => {
                for (const ball of balls) {
                    ball.speedX /= 1.5; // 10秒後恢復
                    ball.speedY /= 1.5;
                }
            }, 10000);
            break;
        case 'slowDownBall':
            for (const ball of balls) {
                ball.speedX /= 1.5; // 減少球速
                ball.speedY /= 1.5;
            }
            setTimeout(() => {
                for (const ball of balls) {
                    ball.speedX *= 1.5; // 10秒後恢復
                    ball.speedY *= 1.5;
                }
            }, 10000);
            break;
    }
}

// 遊戲循環
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop); // 繼續下一幀
}

// 控制擋板移動
document.addEventListener('mousemove', (event) => {
    const mouseX = event.clientX - canvas.getBoundingClientRect().left;
    if (mouseX > 0 && mouseX < canvas.width) {
        paddle.x = mouseX - paddle.width / 2; // 設定擋板位置
    }
});

// 開始遊戲
init();
gameLoop();

// 更改背景函數
function changeBackground() {
    const selectedBackground = document.getElementById("backgroundSelect").value;
    let backgroundImage = '';

    switch (selectedBackground) {
        case 'default':
            backgroundImage = 'url(https://thumb.photo-ac.com/56/564d7708097fcf9e3afc35d896da492d_t.jpeg)';
            break;
        case 'night-sky':
            backgroundImage = 'url(https://png.pngtree.com/thumb_back/fh260/background/20190223/ourmid/pngtree-pure-beautiful-starry-grass-background-backgroundmeteorstarstarry-grassgrassland-under-image_86920.jpg)';
            break;
        case 'forest':
            backgroundImage = 'url(https://example.com/forest-background.jpg)'; // Add appropriate forest image URL
            break;
    }

    canvas.style.backgroundImage = backgroundImage; // Apply background to canvas
   
}

document.getElementById("backgroundSelect").addEventListener("change", changeBackground);
document.body.style.backgroundImage = backgroundImage;

function createExplosion(x, y) {
  const explosion = document.createElement('div');
  explosion.className = 'explosion';
  explosion.style.position = 'absolute';
  explosion.style.left = `${x}px`;
  explosion.style.top = `${y}px`;
  explosion.style.width = '50px'; // 可以根據需要調整大小
  explosion.style.height = '50px'; // 可以根據需要調整大小
  explosion.style.background = 'yellow'; // 可以根據需要調整顏色
  explosion.style.borderRadius = '50%'; // 使其為圓形

  document.body.appendChild(explosion);

  // 移除動畫結束後的元素
  explosion.addEventListener('animationend', () => {
      explosion.remove();
  });
}