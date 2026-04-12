import './styles/global.css';
import Lenis from '@studio-freight/lenis';
import { createIcons, Copy, Bitcoin, Coins, Eye } from 'lucide';

// Initialize Icons
createIcons({
  icons: {
    Copy,
    Bitcoin,
    Coins,
    Eye
  }
});

// Settings
const DISCORD_USER_ID = '825485336951390239';

// DOM Elements
const enterScreen = document.getElementById('enter-screen');
const bgMusic = document.getElementById('bg-music');
const roarSfx = document.getElementById('roar-sfx');

// Hit Counter API (No Auth required)
fetch('https://api.counterapi.dev/v1/7even-kingdoms-portfolio/visits/up')
  .then(res => res.json())
  .then(data => {
    document.getElementById('view-count').innerText = data.count || "...";
  })
  .catch(e => {
    console.log('Error fetching view count');
    document.getElementById('view-count').innerText = "10,581";
  });

// Lenis Smooth Scroll Configuration
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

// Custom Sharp Diamond Cursor Logic
const cursor = document.getElementById('cursor');
const cursorTrail = document.getElementById('cursor-trail');
let mouseX = 0;
let mouseY = 0;
let trailX = 0;
let trailY = 0;

document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;

  // Instant follow for main dot
  cursor.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%) rotate(45deg)`;
});

// Render loop for trail (smooth interpolation)
function renderCursor() {
  trailX += (mouseX - trailX) * 0.15;
  trailY += (mouseY - trailY) * 0.15;
  cursorTrail.style.transform = `translate(${trailX}px, ${trailY}px) translate(-50%, -50%) rotate(45deg)`;
  requestAnimationFrame(renderCursor);
}
renderCursor();

// Add hover effect states for cursor
const iteractableElements = document.querySelectorAll('a, button, input, textarea');
iteractableElements.forEach(el => {
  el.addEventListener('mouseenter', () => document.body.setAttribute('data-hovering', 'true'));
  el.addEventListener('mouseleave', () => document.body.setAttribute('data-hovering', 'false'));
});

// Enter Screen & Audio Init
bgMusic.volume = 0.4;
if (roarSfx) roarSfx.volume = 0.8;

enterScreen.addEventListener('click', () => {
  bgMusic.play().catch(e => console.log('Missing theme audio'));
  if (roarSfx) roarSfx.play().catch(e => console.log('Missing roar audio'));

  // Fade out screen
  enterScreen.style.opacity = '0';
  setTimeout(() => {
    enterScreen.style.display = 'none';
    requestAnimationFrame(raf);
  }, 1500);
});

// Copy to clipboard logic
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

// Lanyard API Connection
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

  // Set Display Name and Username
  const displayName = discord_user.display_name || discord_user.username;
  discordUsername.innerHTML = `${displayName} <span class="discord-tag">(@${discord_user.username})</span>`;

  // Set Avatar
  const avatarUrl = discord_user.avatar
    ? `https://cdn.discordapp.com/avatars/${discord_user.id}/${discord_user.avatar}.png?size=256`
    : `https://cdn.discordapp.com/embed/avatars/${parseInt(discord_user.discriminator || '0') % 5}.png`;

  discordAvatar.src = avatarUrl;

  // Status color mapping
  const statusColors = {
    online: '#43b581',
    idle: '#faa61a',
    dnd: '#f04747',
    offline: '#747f8d'
  };

  discordStatus.style.backgroundColor = statusColors[discord_status] || statusColors.offline;

  // Set Activity / Spotify
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

// Interactive Particle Background (Permanent Dark Theme)
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
const PARTICLE_COUNT = 150;

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
  // Clear canvas
  ctx.clearRect(0, 0, width, height);
  const interactRadius = 150;

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];

    // Constant slow float/fall
    p.y += (Math.random() * 1.5 + 0.5);
    p.x += Math.cos(p.life * 10) * 0.5;

    // Mix of Red (#a31719) and Gold (#e1b80f) particles
    const isPrimaryColor = Math.random() > 0.3;
    ctx.fillStyle = isPrimaryColor
      ? `rgba(163, 23, 25, ${p.life * 0.8})`  // Deep Red
      : `rgba(225, 184, 15, ${p.life * 0.8})`; // Gold

    // Mouse Interaction (Push away based on mouse position)
    const dx = p.x - mouseX;
    const dy = p.y - mouseY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < interactRadius) {
      const force = (interactRadius - distance) / interactRadius;
      p.x += (dx / distance) * force * 5;
      p.y += (dy / distance) * force * 5;
    }

    // Respawn logic based on bounds
    if (p.x < 0) p.x = width;
    if (p.x > width) p.x = 0;
    if (p.y > height) {
      p.y = 0;
      p.x = Math.random() * width;
    }

    // Flicker/Fade life
    p.life -= 0.005;
    if (p.life <= 0) p.life = p.maxLife;

    // Draw
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }

  requestAnimationFrame(renderParticles);
}

// Ensure first render starts
requestAnimationFrame(renderParticles);
