let state = 'menu';           // menu | play | pause | over
let seed = 1, lastSeed = 1, rng = Math.random;
let anchors = [], coins = [], spikes = [], particles = [], floats = [];
let topAnchor = null, anchorIdx = 0, prevSide = 1, streakLeft = 0;
let camY = 2, camFreeze = 0, camX = 0, runT = 0, maxAlt = 0, coinsRun = 0, combo = 0, maxCombo = 0;
let shieldT = 0, dying = false, deathT = 0, deathFinished = false, reviveAvail = false, revivePoint = { x: 0, y: -2.5 };
let perfectFlash = 0, shakeT = 0, uiT = 0, bot = false;
let lavaY = LAVA.startY;
let firstGrabDone = false;
let timeScale = 1.0;

// Серии наград
let streakPerfect = 0;       // серия идеальных зацепов
let streakFastGrab = 0;      // серия быстрых зацепов
let streakFastRelease = 0;   // серия быстрых отпусканий
let streakLongJump = 0;      // серия дальних прыжков

// Вспышка серии (чтобы не накладывать несколько)
let pendingStreakFlash = null;  // { type, color, intensity }

// Стены из лавы
let wallLeft = -10;   // левая стена (будет обновлена при генерации)
let wallRight = 10;   // правая стена

// Максимально возможный полёт (вычисляется один раз при старте)
let maxFlightDist = 0;

const hero = {
    x: 0, y: 0, vx: 0, vy: 0, attached: false, anchor: null, lastAnchor: null,
    theta: 0, omega: 0, r: 2, spinDir: 1, attachT: 0, grabs: 0,
    grabTime: 0, comboTimer: 0, lastReleaseTime: 0
};

const trail = [];
const stars = [];
for (let i = 0; i < 70; i++) stars.push({ x: (Math.random() * 2 - 1) * 6, y: Math.random() * 24, z: 0.2 + Math.random() * 0.55, s: Math.random() < 0.25 ? 2 : 1 });

const bgParticles = [];
for (let i = 0; i < 40; i++) {
    bgParticles.push({
        x: (Math.random() * 2 - 1) * 8,
        y: Math.random() * 30,
        vx: (Math.random() - 0.5) * 0.02,
        vy: -0.3 - Math.random() * 0.5,
        size: 0.5 + Math.random() * 1.5,
        alpha: 0.1 + Math.random() * 0.2
    });
}