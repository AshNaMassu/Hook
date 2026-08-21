/* ---------- canvas / layout ---------- */
const stage = document.getElementById('stage'), cv = document.getElementById('cv'), ctx = cv.getContext('2d');

// offscreen canvas для bloom
const bloomCv = document.createElement('canvas');
const bloomCtx = bloomCv.getContext('2d');

let W = 0, H = 0, scale = 1, viewW = 10, viewH = 16, dpr = 1;
function resize() {
    let sw = window.innerWidth, sh = window.innerHeight;
    if (sw / sh > 0.62) sw = Math.round(sh * 0.62);
    dpr = Math.min(2, window.devicePixelRatio || 1);
    stage.style.width = sw + 'px'; stage.style.height = sh + 'px';
    cv.width = Math.round(sw * dpr); cv.height = Math.round(sh * dpr);
    cv.style.width = sw + 'px'; cv.style.height = sh + 'px';
    W = cv.width; H = cv.height;
    scale = Math.min(H / 16, W / 9.5);
    viewW = W / scale; viewH = H / scale;

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