// 页面切换
const pageHome = document.getElementById('page-home');
const pageCandle = document.getElementById('page-candle');
const pageFireworks = document.getElementById('page-fireworks');
const startBtn = document.querySelector('.start-btn');
const blowBtn = document.querySelector('.blow-btn');
const candleVideo = document.getElementById('candle-video');
const darkVideo = document.getElementById('dark-video');
const fireworksCanvas = document.getElementById('fireworks-canvas');
const replayBtn = document.querySelector('.replay-btn');
const usagiAudio = document.getElementById('usagi-audio');
const soundModal = document.getElementById('sound-modal');
const allowSoundBtn = document.getElementById('allow-sound-btn');
const muteSoundBtn = document.getElementById('mute-sound-btn');

let darkBgTimeout = null;

function setBodyBgToDark() {
  document.body.style.background = '#000';
  const fireworksPage = document.getElementById('page-fireworks');
  if (fireworksPage) fireworksPage.style.background = '#000';
}
function restoreBodyBg() {
  document.body.style.background = '';
  const fireworksPage = document.getElementById('page-fireworks');
  if (fireworksPage) fireworksPage.style.background = '';
}

function showPage(page) {
  [pageHome, pageCandle, pageFireworks].forEach(p => p.classList.remove('show'));
  page.classList.add('show');
  // 页面切换时恢复背景色
  restoreBodyBg();
  if (darkBgTimeout) {
    clearTimeout(darkBgTimeout);
    darkBgTimeout = null;
  }
}

// 首页usagi动画（循环不断掉落，落点分布更均匀）
function createUsagiRainLoop() {
  const container = document.querySelector('.usagi-container');
  container.innerHTML = '';
  const rows = 6, cols = 5;
  let usagiId = 0;
  function spawnBatch() {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const img = document.createElement('img');
        img.src = 'usagi-image.PNG';
        img.className = 'usagi-drop';
        // 横向均匀分布，纵向终点均匀分布
        const left = (c + Math.random()*0.5) * (100/cols);
        const endY = 10 + Math.random()*80; // 10~90vh
        img.style.left = `calc(${left}vw)`;
        img.style.animation = `usagi-fall-loop 2.2s cubic-bezier(0.6,0.2,0.4,1)`;
        img.style.animationDelay = `${(r * 0.3 + c * 0.15).toFixed(2)}s`;
        img.style.setProperty('--endY', endY + 'vh');
        img.dataset.usagiId = usagiId++;
        container.appendChild(img);
        img.addEventListener('animationend', () => {
          img.remove();
        });
      }
    }
  }
  spawnBatch();
  let interval = setInterval(spawnBatch, 900);
  // 停止动画时清理
  return () => clearInterval(interval);
}

let stopUsagiRain = null;
function enterHomePage() {
  showPage(pageHome);
  if(stopUsagiRain) stopUsagiRain();
  stopUsagiRain = createUsagiRainLoop();
}

function playUsagiSoundThen(fn) {
  usagiAudio.currentTime = 0;
  usagiAudio.play();
  usagiAudio.onended = function handler() {
    usagiAudio.onended = null;
    fn();
  };
}

startBtn.onclick = () => {
  playUsagiSoundThen(() => {
    showPage(pageCandle);
    candleVideo.currentTime = 0;
    candleVideo.play();
    if(stopUsagiRain) stopUsagiRain();
    replayBtn.style.display = 'none';
  });
};

blowBtn.onclick = () => {
  playUsagiSoundThen(() => {
    showPage(pageFireworks);
    darkVideo.currentTime = 0;
    darkVideo.play();
    if(stopUsagiRain) stopUsagiRain();
    fireworksCanvas.width = window.innerWidth;
    fireworksCanvas.height = window.innerHeight;
    const ctx = fireworksCanvas.getContext('2d');
    ctx && ctx.clearRect(0,0,fireworksCanvas.width,fireworksCanvas.height);
    // 监听darkVideo播放进度
    if (darkBgTimeout) clearTimeout(darkBgTimeout);
    restoreBodyBg();
    darkBgTimeout = setTimeout(setBodyBgToDark, 1500);
  });
};

candleVideo.onended = () => {
  replayBtn.style.display = '';
};

replayBtn.onclick = () => {
  playUsagiSoundThen(() => {
    candleVideo.currentTime = 0;
    candleVideo.play();
    replayBtn.style.display = 'none';
  });
};

darkVideo.onended = () => {
  startFireworks();
};

// 进入首页时初始化
enterHomePage();

// 烟花动画
function startFireworks() {
  const ctx = fireworksCanvas.getContext('2d');
  fireworksCanvas.width = window.innerWidth;
  fireworksCanvas.height = window.innerHeight;
  let particles = [];
  function randomColor() {
    const colors = [
      '#ff4d4d',  // bright red
      '#ffd700',  // gold
      '#1e90ff',  // dodger blue
      '#32cd32',  // lime green
      '#ff69b4',  // hot pink
      '#ff8c00',  // dark orange
      '#9370db',  // medium purple
      '#00ced1',  // dark turquoise
      '#ffffff',  // white
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }
  
  
  function createFirework() {
    const x = Math.random() * fireworksCanvas.width * 0.8 + fireworksCanvas.width*0.1;
    const y = Math.random() * fireworksCanvas.height * 0.3 + fireworksCanvas.height*0.1;
    const count = 32 + Math.floor(Math.random()*16);
    for(let i=0;i<count;i++){
      const angle = (Math.PI*2/count)*i;
      const speed = 2 + Math.random()*2;
      particles.push({
        x, y,
        vx: Math.cos(angle)*speed,
        vy: Math.sin(angle)*speed,
        alpha: 1,
        color: randomColor(),
        size: 2+Math.random()*2
      });
    }
  }


  let frame = 0;
  function animate() {
    ctx.clearRect(0,0,fireworksCanvas.width,fireworksCanvas.height);
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.03;
      p.alpha -= 0.012;
    });
    particles = particles.filter(p => p.alpha > 0);
    particles.forEach(p => {
      ctx.globalAlpha = p.alpha;
      const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
      gradient.addColorStop(0, p.color);
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
      ctx.fillStyle = gradient;
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    if(frame%18===0) createFirework();
    frame++;
    if(frame<180 || particles.length>0) {
      requestAnimationFrame(animate);
    }
  }
  animate();
}
// 适配屏幕尺寸变化
window.addEventListener('resize',()=>{
  if(pageFireworks.classList.contains('show')){
    fireworksCanvas.width = window.innerWidth;
    fireworksCanvas.height = window.innerHeight;
  }
});

if (soundModal && allowSoundBtn) {
  allowSoundBtn.onclick = () => {
    soundModal.style.display = 'none';
    usagiAudio.muted = false;
  };
}

function createUsagiJumpAboveButton(btn) {
  const rect = btn.getBoundingClientRect();
  const img = document.createElement('img');
  img.src = 'usagi-image.PNG';
  img.style.position = 'fixed';
  img.style.left = (rect.left + rect.width/2 - 24) + 'px';
  img.style.top = (rect.top - 60) + 'px';
  img.style.width = '48px';
  img.style.height = '48px';
  img.style.zIndex = 2000;
  img.style.pointerEvents = 'none';
  img.style.transition = 'transform 0.6s cubic-bezier(0.6, -0.3, 0.4, 1), opacity 0.3s 0.4s';
  img.style.transform = 'translateY(0) scale(1)';
  document.body.appendChild(img);
  setTimeout(()=>{
    img.style.transform = 'translateY(-60px) scale(1.15)';
    img.style.opacity = '0';
  }, 10);
  setTimeout(()=>{
    img.remove();
  }, 700);
}

// 给所有button添加点击usagi跳跃特效
function addUsagiJumpToAllButtons() {
  document.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', function(e) {
      // 只在可用按钮上触发
      if (!btn.disabled) createUsagiJumpAboveButton(btn);
    });
  });
}
// 页面加载完后执行
window.addEventListener('DOMContentLoaded', addUsagiJumpToAllButtons); 