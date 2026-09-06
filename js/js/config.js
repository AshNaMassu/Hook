const TAU = Math.PI * 2, RAD = Math.PI / 180;
const clamp = (v, a, b) => v < a ? a : (v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

/* ---------- Профиль физики (GDD §5.1 / §11) ---------- */
const PF = {
    grabRadius: 3.5,    // радиус захвата (расстояние от героя до точки для зацепа)
    rMin: 1.2,          // минимальная длина верёвки (ближе нельзя)
    rMax: 3,            // максимальная длина верёвки (дальше нельзя)
    wMin: 3,            // минимальная скорость вращения (рад/сек)
    wMax: 5.5,          // максимальная скорость вращения (рад/сек)
    spinAccel: 2.5,     // ускорение вращения (как быстро набирается скорость)
    mom: 0.2,           // порог момента импульса для определения направления вращения
    g: 14,              // гравитация (ускорение свободного падения)
    upAssist: 0.8,      // помощь вверх при релизе (добавка к вертикальной скорости)
    rNorm: 2.1,         // нормализованный радиус для расчёта силы полёта
    normalizePower: false, // использовать нормализованный радиус (false = использовать реальный)
    lookahead: -1.5     // начальное смещение камеры по Y (отрицательное = камера выше героя)
};

// Ограничения генерации и камеры
const ANCH_CLAMP = 3.8,  // максимальное горизонтальное смещение камеры
    MAXDX = 5.2,         // максимальное горизонтальное расстояние между точками
    SPIKE_X = 4.6;       // горизонтальное смещение шипов от точек

/* ---------- Лава (палач) ---------- */
const LAVA = {
    startY: -10,         // начальная позиция лавы
    baseSpeed: 0.8,      // базовая скорость подъёма лавы
    speedRamp: 1.4,      // ускорение лавы со временем (линейный рост)
    rubberBand: 3,       // при каком расстоянии от лавы тормозить камеру
    killMargin: 0.5,     // запас для смерти (hero.y < lavaY - killMargin)
};

const SETTINGS = {
    shakeIntensity: 1.0,
    flashIntensity: 1.0,
};

/* ---------- Камера ---------- */
const CAMERA = {
    // Динамическая камера (вкл/выкл)
    dynamicEnabled: true,
    fixedViewWidth: 13,  // фиксированный вью при выключенной динамике
    // Диапазон обзора
    viewWidthMin: 10,      // минимальный обзор (низкая скорость)
    viewWidthMax: 16,      // максимальный обзор (высокая скорость)

    speedMin: 7,         // ← минимальная скорость (wMin × rMin)
    speedThreshold: 16,    // Скорость при которой достигается максимум
    speedRange: speedThreshold - speedMin,
    // Плавность изменения (меньше = плавнее)
    smoothness: 0.6,       // ← уменьшили с 2 до 0.8 (меньше рывков)

    // Остальное
    anchorClamp: 4.5,
    // Асимметричное сглаживание скорости (attack/release)
    speedAttack: 0.4,   // реакция на ускорение (быстрее)
    speedRelease: 0.08, // реакция на замедление (медленнее)

    anchorClampScaled: anchorClamp * 0.3,
}

/* ---------- Стены из лавы ---------- */
const WALLS = {
    enabled: true,          // включить стены
    margin: 1.0,            // запас от крайней точки до стены (юниты)
    killOnTouch: true,      // смерть при касании стены
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
        threshold: 0.75,   // порог дальнего прыжка (0.75 = 75% от максимального полёта)
        bonusCoins: 3,     // бонус монет за дальний прыжок
    },
    megaJump: {
        threshold: 1.0,    // порог мега-прыжка (100% от максимальной высоты)
        bonusCoins: 5,    // бонус монет за мега-прыжок
    },

    // Визуал
    timerRingColor: '#26e0ff',   // цвет кольца таймера
    dangerColor: '#ff2e5f',      // цвет при истечении времени
};

/* ---------- Цвета надписей (реакций) ---------- */
const FEEDBACK_COLORS = {
    perfect: '#ffc23d',      // ПЕРФЕКТ — золотой
    fastGrab: '#26e0ff',     // ЗАЦЕП! — зелёный
    fastRelease: '#39ff14',  // РЕЛИЗ! — голубой
    longJump: '#ff4fd8',     // ДАЛЬНИЙ! — розовый
    megaJump: '#ff4fd8',     // МЕГА-ПРЫЖОК! — розовый (ярче можно)
    slow: '#ff2e5f',         // Время вышло — красный
    coin: '#ffc23d',         // Монеты — золотой
};

/* ---------- Серии наград ---------- */
const STREAKS = {
    // Порог идеального тайминга для ПЕРФЕКТа
    perfectEarlyGrabThreshold: 0.85,

    // Приоритет вспышек (выше = важнее)
    priority: {
        longJump: 5,
        perfect: 4,
        fastGrab: 3,
        fastRelease: 2,
    },

    // Уровни наград ДЛЯ КАЖДОЙ СЕРИИ (разные монеты)
    perfect: [
        { count: 3, bonusCoins: 3 },
        { count: 6, bonusCoins: 6 },
        { count: 9, bonusCoins: 10 },
        { count: 12, bonusCoins: 15 },
    ],

    fastGrab: [
        { count: 3, bonusCoins: 2 },
        { count: 6, bonusCoins: 4 },
        { count: 9, bonusCoins: 7 },
        { count: 12, bonusCoins: 10 },
    ],

    fastRelease: [
        { count: 3, bonusCoins: 2 },
        { count: 6, bonusCoins: 4 },
        { count: 9, bonusCoins: 7 },
        { count: 12, bonusCoins: 10 },
    ],

    longJump: [
        { count: 3, bonusCoins: 5 },
        { count: 6, bonusCoins: 10 },
        { count: 9, bonusCoins: 15 },
        { count: 12, bonusCoins: 25 },
    ],
};

/* ---------- Настройки по уровням качества ---------- */
const QUALITY_SETTINGS = {
    // LOW = 0, MEDIUM = 1, HIGH = 2
    0: { maxReach: 2, flightSteps: 30 },   // LOW
    1: { maxReach: 3, flightSteps: 38 },   // MEDIUM
    2: { maxReach: 4, flightSteps: 45 },   // HIGH
};

/* ------------------ Предвычисленные константы физики ---------- */
const PHYSICS_PRECOMPUTED = {
    maxSpeed: PF.wMax * PF.rMax,                                    // 16.5
    maxJumpDist: (PF.wMax * PF.rMax) ** 2 / (2 * PF.g) * 0.8,      // ~7.8
    maxJumpDistNoMargin: (PF.wMax * PF.rMax) ** 2 / (2 * PF.g),   // ~9.7
    avgRadius: (PF.rMin + PF.rMax) / 2,       // 2.1
    avgSpeed: PF.wMin + (PF.wMax - PF.wMin) * 0.6,  // 4.5
};