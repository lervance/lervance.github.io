import './styles/global.css';
import Lenis from '@studio-freight/lenis';
import { createIcons, Copy, Bitcoin, Coins, Eye, MessageCircle, Instagram, Music2, Gamepad2 } from 'lucide';
import { trackWebsiteVisit } from './viewTracker';

createIcons({
  icons: {
    Copy,
    Bitcoin,
    Coins,
    Eye,
    MessageCircle,
    Instagram,
    Music2,
    Gamepad2
  }
});

const DISCORD_USER_ID = '825485336951390239';

const enterScreen = document.getElementById('enter-screen');
const bgMusic = document.getElementById('bg-music');
const roarSfx = document.getElementById('roar-sfx');

trackWebsiteVisit()
  .then((count) => {
    document.getElementById('view-count').innerText = String(count);
  })
  .catch(() => {
    console.log('Error fetching view count');
    document.getElementById('view-count').innerText = "8065";
  });

const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  direction: 'vertical',
  gestureDirection: 'vertical',
  smooth: true,
  smoothTouch: false,
  touchMultiplier: 2,
});

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}

const cursor = document.getElementById('cursor');
const cursorTrail = document.getElementById('cursor-trail');
let mouseX = 0;
let mouseY = 0;
let cursorX = 0;
let cursorY = 0;
let trailX = 0;
let trailY = 0;

document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

function renderCursor() {
  cursorX += (mouseX - cursorX) * 0.28;
  cursorY += (mouseY - cursorY) * 0.28;
  trailX += (mouseX - trailX) * 0.12;
  trailY += (mouseY - trailY) * 0.12;

  cursor.style.transform = `translate(${cursorX}px, ${cursorY}px) translate(-50%, -50%) rotate(45deg)`;
  cursorTrail.style.transform = `translate(${trailX}px, ${trailY}px) translate(-50%, -50%) rotate(45deg)`;
  requestAnimationFrame(renderCursor);
}
renderCursor();

const iteractableElements = document.querySelectorAll('a, button, input, textarea');
iteractableElements.forEach(el => {
  el.addEventListener('mouseenter', () => document.body.setAttribute('data-hovering', 'true'));
  el.addEventListener('mouseleave', () => document.body.setAttribute('data-hovering', 'false'));
});

bgMusic.volume = 0.4;
if (roarSfx) roarSfx.volume = 0.8;

enterScreen.addEventListener('click', () => {
  bgMusic.play().catch(e => console.log('Missing theme audio'));
  if (roarSfx) roarSfx.play().catch(e => console.log('Missing roar audio'));

  enterScreen.style.opacity = '0';
  setTimeout(() => {
    enterScreen.style.display = 'none';
    requestAnimationFrame(raf);
  }, 1500);
});

document.querySelectorAll('.crypto-address-box').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const textToCopy = btn.getAttribute('data-copy');
    navigator.clipboard.writeText(textToCopy).then(() => {
      btn.classList.add('copied');
      setTimeout(() => {
        btn.classList.remove('copied');
      }, 1500);
    });
  });
});

function connectLanyard() {
  const ws = new WebSocket('wss://api.lanyard.rest/socket');

  ws.onopen = () => {
    ws.send(JSON.stringify({
      op: 2,
      d: { subscribe_to_id: DISCORD_USER_ID }
    }));
  };

  ws.onmessage = (event) => {
    const { op, d, t } = JSON.parse(event.data);
    if (op === 0) {
      if (t === 'INIT_STATE' || t === 'PRESENCE_UPDATE') {
        updateDiscordPresence(d);
      }
    }
  };

  ws.onclose = () => {
    setTimeout(connectLanyard, 5000);
  };
}

function updateDiscordPresence(data) {
  const discordAvatar = document.getElementById('discord-avatar');
  const discordStatus = document.getElementById('discord-status');
  const discordUsername = document.getElementById('discord-username');
  const discordGame = document.getElementById('discord-game');

  const { discord_user, discord_status, activities, spotify } = data;

  const displayName = discord_user.display_name || discord_user.username;
  discordUsername.innerHTML = `${displayName} <span class="discord-tag">(@${discord_user.username})</span>`;

  const avatarUrl = discord_user.avatar
    ? `https://cdn.discordapp.com/avatars/${discord_user.id}/${discord_user.avatar}.png?size=256`
    : `https://cdn.discordapp.com/embed/avatars/${parseInt(discord_user.discriminator || '0') % 5}.png`;

  discordAvatar.src = avatarUrl;

  const statusColors = {
    online: '#43b581',
    idle: '#faa61a',
    dnd: '#f04747',
    offline: '#747f8d'
  };

  discordStatus.style.backgroundColor = statusColors[discord_status] || statusColors.offline;

  if (spotify) {
    discordGame.innerText = `Listening to ${spotify.song} by ${spotify.artist}`;
  } else if (activities && activities.length > 0) {
    const customStatus = activities.find(a => a.type === 4);
    const game = activities.find(a => a.type === 0);

    if (game) {
      discordGame.innerText = `Playing ${game.name}`;
    } else if (customStatus && customStatus.state) {
      discordGame.innerText = customStatus.state;
    } else {
      discordGame.innerText = "Guarding the realm.";
    }
  } else {
    discordGame.innerText = "Resting in the weirwood.";
  }
}

connectLanyard();

const canvas = document.getElementById('realm-canvas');
const ctx = canvas.getContext('2d');

let width, height;
function resizeCanvas() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const particles = [];
const PARTICLE_COUNT = 70;
const interactRadius = 150;
const interactRadiusSquared = interactRadius * interactRadius;
let lastParticleFrame = 0;

for (let i = 0; i < PARTICLE_COUNT; i++) {
  particles.push({
    x: Math.random() * width,
    y: Math.random() * height,
    size: Math.random() * 2 + 0.5,
    life: Math.random(),
    maxLife: Math.random() * 0.5 + 0.5
  });
}

function renderParticles() {
  const now = performance.now();
  if (now - lastParticleFrame < 33) {
    requestAnimationFrame(renderParticles);
    return;
  }
  lastParticleFrame = now;

  if (document.hidden) {
    requestAnimationFrame(renderParticles);
    return;
  }

  ctx.clearRect(0, 0, width, height);

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];

    p.y += (Math.random() * 0.9 + 0.35);
    p.x += Math.cos(p.life * 10) * 0.3;

    const isPrimaryColor = Math.random() > 0.3;
    ctx.fillStyle = isPrimaryColor
      ? `rgba(163, 23, 25, ${p.life * 0.8})`
      : `rgba(225, 184, 15, ${p.life * 0.8})`;

    const dx = p.x - mouseX;
    const dy = p.y - mouseY;
    const distanceSquared = dx * dx + dy * dy;

    if (distanceSquared > 0 && distanceSquared < interactRadiusSquared) {
      const distance = Math.sqrt(distanceSquared);
      const force = (interactRadius - distance) / interactRadius;
      p.x += (dx / distance) * force * 4;
      p.y += (dy / distance) * force * 4;
    }

    if (p.x < 0) p.x = width;
    if (p.x > width) p.x = 0;
    if (p.y > height) {
      p.y = 0;
      p.x = Math.random() * width;
    }

    p.life -= 0.005;
    if (p.life <= 0) p.life = p.maxLife;

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }

  requestAnimationFrame(renderParticles);
}

requestAnimationFrame(renderParticles);
