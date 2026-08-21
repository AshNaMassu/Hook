const TAU = Math.PI * 2, RAD = Math.PI / 180;
const clamp = (v, a, b) => v < a ? a : (v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

/* ---------- Profile (GDD §5.1 / §11) ---------- */
const PF = {
    grabRadius: 3, rMin: 1.2, rMax: 3, wMin: 3, wMax: 6.5, spinAccel: 2.5, mom: 0.5,
    g: 14, upAssist: 1, rNorm: 2.1, normalizePower: false, lookahead: -1.5
};
const ANCH_CLAMP = 3.8, MAXDX = 5.2, SPIKE_X = 4.6;

const LAVA = {
    startY: -10,
    baseSpeed: 0.8,
    speedRamp: 1.4,
    rubberBand: 3,      // при каком расстоянии от лавы тормозить камеру
    killMargin: 0.5,    // запас для смерти
};

const SETTINGS = {
    shakeIntensity: 1.0,
    flashIntensity: 1.0,
};


/* ---------- Комбо и реакции (GDD §X) ---------- */
const COMBO = {
    // Окно для отпускания после зацепа
    window: 1.0,           // 0.5с чтобы отпустить и сохранить комбо
    fastThreshold: 0.5,    // <0.2с = "БЫСТРО!"

    // Множители монет по уровню комбо
    multipliers: [
        { min: 0, mult: 1.0 },
        { min: 3, mult: 1.5 },
        { min: 6, mult: 2.0 },
        { min: 10, mult: 3.0 },
    ],

    // Дальний прыжок
    longJump: {
        skipPoints: 2,     // пролёт через 2+ точек = "ДАЛЬНИЙ!"
        bonusCoins: 3,     // бонус монет за дальний прыжок
    },

    // Визуал
    timerRingColor: '#26e0ff',   // цвет кольца таймера
    dangerColor: '#ff2e5f',      // цвет при истечении времени
};