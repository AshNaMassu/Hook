/* ---------- canvas / layout ---------- */
const stage = document.getElementById('stage'), cv = document.getElementById('cv'), ctx = cv.getContext('2d');

// offscreen canvas для bloom
const bloomCv = document.createElement('canvas');
const bloomCtx = bloomCv.getContext('2d');

let W = 0, H = 0, scale = 1, viewW = 10, viewH = 16, dpr = 1;

let currentViewWidth = CAMERA.viewWidth;  // текущий обзор (начинаем с базового)

function resize() {
    let sw = window.innerWidth, sh = window.innerHeight;
    if (sw / sh > 0.62) sw = Math.round(sh * 0.62);
    dpr = Math.min(2, window.devicePixelRatio || 1);
    stage.style.width = sw + 'px'; stage.style.height = sh + 'px';
    cv.width = Math.round(sw * dpr); cv.height = Math.round(sh * dpr);
    cv.style.width = sw + 'px'; cv.style.height = sh + 'px';
    W = cv.width; H = cv.height;

    // Начинаем с минимального обзора (для старта)
    currentViewWidth = CAMERA.viewWidthMin;
    viewW = currentViewWidth;
    viewH = viewW * (H / W);
    scale = W / viewW;

    // offscreen для bloom (половинное разрешение для производительности)
    bloomCv.width = Math.round(W / 2);
    bloomCv.height = Math.round(H / 2);
}

window.addEventListener('resize', resize);
window.addEventListener('orientationchange', () => setTimeout(resize, 60));
resize();

const SX = x => W / 2 + (x - camX) * scale;
const camTop = () => camY + viewH / 2;
const SY = y => (camTop() - y) * scale;

// Динамическая камера: обновление видимой области на основе скорости
// Скользящее среднее скорости (глобальная переменная)
let smoothedSpeed = 0;

function updateViewport(dt) {
    // Меняем сглаженную скорость ТОЛЬКО при зацепе
    // В полёте smoothedSpeed зафиксирован (чтобы избежать покачивания от гравитации)
    if (hero.attached) {
        const effectiveSpeed = hero.omega * hero.r;

        // Асимметричное сглаживание: быстрая реакция на ускорение, медленная на замедление
        const baseAlpha = (effectiveSpeed > smoothedSpeed) ? CAMERA.speedAttack : CAMERA.speedRelease;

        // Привязка к dt: одинаковое сглаживание на 60/30/15 FPS
        const alpha = 1 - Math.pow(1 - baseAlpha, dt * 60);

        smoothedSpeed = smoothedSpeed * (1 - alpha) + effectiveSpeed * alpha;
    }

    // Целевой вью всегда на основе smoothedSpeed (даже в полёте)
    const t = clamp((smoothedSpeed - CAMERA.speedMin) / (CAMERA.speedThreshold - CAMERA.speedMin), 0, 1);
    const targetViewWidth = lerp(CAMERA.viewWidthMin, CAMERA.viewWidthMax, t);

    // Плавный переход к целевому вью работает всегда
    currentViewWidth = lerp(currentViewWidth, targetViewWidth, dt * CAMERA.smoothness);

    viewW = currentViewWidth;
    viewH = viewW * (H / W);
    scale = W / viewW;

    // Отладочные значения
    const effectiveSpeed = hero.attached
        ? hero.omega * hero.r
        : Math.hypot(hero.vx, hero.vy);

    window._debugViewport = {
        effectiveSpeed: effectiveSpeed.toFixed(1),
        smoothedSpeed: smoothedSpeed.toFixed(1),
        targetViewWidth: targetViewWidth.toFixed(1),
        currentViewWidth: currentViewWidth.toFixed(1),
        t: t.toFixed(2),
        attached: hero.attached,
    };
}