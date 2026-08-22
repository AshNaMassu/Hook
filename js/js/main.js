/* ---------- главный цикл ---------- */
const HSTEP = 1 / 240;
let lastT = performance.now(), acc = 0;
function frame(now) {
    requestAnimationFrame(frame);
    let dtR = Math.min(0.05, (now - lastT) / 1000); lastT = now;
    const ts = dying ? 0.3 : 1;               // лёгкое slow-mo на смерти
    acc += dtR * ts;
    let n = 0;
    while (acc >= HSTEP && n < 20) { stepWorld(HSTEP); acc -= HSTEP; n++; }
    render();
    hudSync();
}

/* ---------- старт ---------- */
toMenu();          // аттракт-режим: бот играет за меню
requestAnimationFrame(frame);