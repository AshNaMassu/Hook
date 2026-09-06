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

/* ------------------ Параметры генерации уровней ---------- */
const GEN = {
    // Горизонтальные ограничения
    anchorClamp: 3.8,      // макс. смещение точек по X
    maxDx: 5.2,            // макс. расстояние между точками по X
    spikeX: 4.6,           // макс. смещение шипов по X

    // Плотность точек (вертикальное расстояние)
    densityClose: 4,     // близко на старте (0-50м)
    densityFar: 5,       // далеко (200м+)
    densityStartHeight: 50,
    densityEndHeight: 200,

    // Минимальный горизонтальный разброс (чтобы не в один столбец)
    minDxClose: 4,       // до 100м
    minDxFar: 2,         // после 100м
    minDxThreshold: 100,   // граница плотности по X

    // Свобода по вертикали на старте
    verticalFreedom: 0.7,  // множитель mdy для старта

    // Рандомизация позиций
    angleJitter: 25,        // ±градусов от базового угла
    jitterScaleMax: 1.0,    // макс. смещение
    jitterDiffScale: 0.5,   // как быстро уменьшается с сложностью
    jitterVertical: 0.6,    // множитель вертикального смещения

    // Шипы
    spikeStartIdx: 100,     // после какой точки спавнить
    spikeBaseChance: 0.22,  // базовый шанс спавна
    spikeDiffScale: 0.4,    // рост шанса со сложностью
    spikeMinDistToAnchor: 3.8,
    spikeMinDistToOther: 2.4,
    spikeMinDistToPath: 1.9,
    spikeMinDistToCoin: 1.0,
    spikeRadiusMin: 1.9,
    spikeRadiusMax: 3.4,

    // Строгое чередование сторон на старте
    strictSideHeight: 50,

    // "Спокойные" точки (без шипов, меньшая плотность)
    calmPeriod: 11,
    calmOffset: 10,
    calmDensityFactor: 0.6,

    // Бонусные секции (больше монет)
    bonusPeriod: 10,
    bonusThreshold: 7,
};

/* ---------- Лава (палач) ---------- */
const LAVA = {
    startY: -10,
    baseSpeed: 0.8,
    speedRamp: 1.4,
    rubberBandFar: 18,     // при таком расстоянии ускоряем
    rubberBandFarMult: 1.5,
    rubberBandClose: 4,    // при таком замедляем
    rubberBandCloseMult: 0.75,
    killMargin: 0.5,
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
    // Плавность изменения (меньше = плавнее)
    smoothness: 0.6,       // ← уменьшили с 2 до 0.8 (меньше рывков)

    // Остальное
    anchorClamp: 4.5,
    // Асимметричное сглаживание скорости (attack/release)
    speedAttack: 0.4,   // реакция на ускорение (быстрее)
    speedRelease: 0.08, // реакция на замедление (медленнее)

    // Коэффициент влияния позиции героя на камеру по X (0-1)
    // 0.3 = камера следует за героем на 30% от его смещения
    followFactorX: 0.3,
};

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

    // freq: каждые N зацепов даётся награда
    // coins: размер награды
    rewards: {
        perfect: { freq: 3, coins: 3, multiplierStep: 0.5 },      // каждые 3 перфекта по 3 монеты
        fastGrab: { freq: 3, coins: 1, multiplierStep: 0.2 },     // каждые 3 зацепа по 1 монете
        fastRelease: { freq: 3, coins: 1, multiplierStep: 0.3 },  // каждые 3 релиза по 1 монете
        longJump: { freq: 3, coins: 5, multiplierStep: 1 },     // каждые 3 прыжка по 5 монет
    },
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
    speedRange: CAMERA.speedThreshold - CAMERA.speedMin,
    anchorClampScaled: CAMERA.anchorClamp * CAMERA.followFactorX,
};