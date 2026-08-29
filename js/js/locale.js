
const LOCALES = {
    ru: {
        // Меню
        title: 'NEON HOOK',
        subtitle: 'Одна кнопка.\nДержи — крюк и вращение.\nОтпусти — полёт по касательной.',
        btnPlay: 'ИГРАТЬ',
        btnSettings: '⚙ НАСТРОЙКИ',
        bestLabel: 'Рекорд',
        walletLabel: 'Кошелёк',

        // Геймплей
        metersShort: 'м',
        height: 'ВЫСОТА',
        combo: 'СЕРИЯ',
        series: 'СЕРИЯ',

        // Реакции
        perfect: 'ПЕРФЕКТ',
        fast: 'БЫСТРО!',
        fastGrab: 'ЦЕП!',
        fastRelease: 'ПУФ!',
        longJump: 'ДАЛЬНИЙ!',
        megaJump: 'МЕГА-ПРЫЖОК!',
        slow: 'Время ушло',

        // Смерть
        gameOver: 'СРЫВ',
        newRecord: '★ НОВЫЙ РЕКОРД ★',
        btnAgain: 'ЕЩЁ РАЗ',
        btnSame: 'ТОТ ЖЕ МАРШРУТ',
        btnMenu: 'МЕНЮ',
        btnRevive: '▶ ПРОДОЛЖИТЬ',

        // Настройки
        settings: 'НАСТРОЙКИ',
        music: 'Музыка',
        sfx: 'Эффекты',
        shake: 'Тряска',
        flash: 'Вспышки',
        back: '← НАЗАД',

        // Пауза
        pause: 'ПАУЗА',
        resume: 'ПРОДОЛЖИТЬ',
        restart: 'ЗАНОВО',

        // Подсказки
        hintHold: 'ДЕРЖИ ЭКРАН — ЗАЦЕПИТЬСЯ КРЮКОМ',
        hintRelease: 'ОТПУСТИ — ПОЛЁТ ПО КАСАТЕЛЬНОЙ',
        hintFlash: 'ЖМИ, КОГДА ТОЧКА ВСПЫХНЕТ',
        hintNear: 'ДЕРЖИ!!!',

        timesShort: 'раз',
        shieldText: 'ЩИТ 3с',

        howto: 'лови <b style="color:#fff">вспышку</b> точки — это момент максимальной силы.<br>ранний зацеп = дальний полёт',
        settingsMusic: '🎵 Музыка:',
        settingsSfx: '🔊 Эффекты:',
        settingsShake: '📳 Тряска:',
        settingsFlash: '✨ Вспышки:',
    },

    en: {
        // Menu
        title: 'NEON HOOK',
        subtitle: 'One button.\nHold — hook and spin.\nRelease — fly on tangent.',
        btnPlay: 'PLAY',
        btnSettings: '⚙ SETTINGS',
        bestLabel: 'Best',
        walletLabel: 'Wallet',

        // Gameplay
        metersShort: 'm',
        height: 'HEIGHT',
        combo: 'COMBO',
        series: 'SERIES',

        // Reactions
        perfect: 'PERFECT',
        fast: 'FAST!',
        fastGrab: 'CLACK!',
        fastRelease: 'POOF!',
        longJump: 'LONG JUMP!',
        megaJump: 'MEGA JUMP!',
        slow: 'Time is up',

        // Death
        gameOver: 'FALL',
        newRecord: '★ NEW RECORD ★',
        btnAgain: 'AGAIN',
        btnSame: 'SAME ROUTE',
        btnMenu: 'MENU',
        btnRevive: '▶ CONTINUE',

        // Settings
        settings: 'SETTINGS',
        music: 'Music',
        sfx: 'Sound',
        shake: 'Shake',
        flash: 'Flash',
        back: '← BACK',

        // Pause
        pause: 'PAUSE',
        resume: 'RESUME',
        restart: 'RESTART',

        // Hints
        hintHold: 'HOLD SCREEN — HOOK THE POINT',
        hintRelease: 'RELEASE — FLY ON TANGENT',
        hintFlash: 'TAP WHEN THE POINT FLASHES',
        hintNear: 'HOLD!!!',

        timesShort: 'time',
        shieldText: 'SHIELD 3s',

        howto: 'catch the point <b style="color:#fff">flash</b> — it is the moment of max power.<br>early grab = longer flight',
        settingsMusic: '🎵 Music:',
        settingsSfx: '🔊 Sound:',
        settingsShake: '📳 Shake:',
        settingsFlash: '✨ Flash:',
    },
};

// Текущий язык (определяется из SDK или браузера)
let currentLocale = 'ru';

// Функция получения перевода
function t(key) {
    const locale = LOCALES[currentLocale] || LOCALES.ru;
    return locale[key] || LOCALES.ru[key] || key;
}

// Установка языка
function setLocale(lang) {
    if (LOCALES[lang]) {
        currentLocale = lang;
    }
}

// Применяет перевод ко всем статичным DOM-элементам
function applyLocale() {
    const $ = id => document.getElementById(id);

    // Меню
    if ($('btnPlay')) $('btnPlay').textContent = t('btnPlay');
    if ($('btnSettings')) $('btnSettings').textContent = t('btnSettings');
    if ($('mLbl')) $('mLbl').textContent = t('height');

    // Экран смерти
    if ($('btnRevive')) {
        $('btnRevive').innerHTML = t('btnRevive') + ' <span style="font-size:.7em">(1 ' + t('timesShort') + ')</span>';
    }
    if ($('btnAgain')) $('btnAgain').textContent = t('btnAgain');
    if ($('btnSame')) $('btnSame').textContent = t('btnSame');
    if ($('btnMenu1')) $('btnMenu1').textContent = t('btnMenu');
    if ($('btnMenu2')) $('btnMenu2').textContent = t('btnMenu');

    // Настройки и пауза
    if ($('btnBackMenu')) $('btnBackMenu').textContent = t('back');
    if ($('btnResume')) $('btnResume').textContent = t('resume');
    if ($('btnRestart')) $('btnRestart').textContent = t('restart');

    // Субтитр и подсказка в меню
    const sub = document.querySelector('#menu .sub');
    if (sub) sub.innerHTML = t('subtitle').replace(/\n/g, '<br>');

    const howto = document.querySelector('#menu .howto');
    if (howto) howto.innerHTML = t('howto');

    // Заголовки настроек (есть в двух местах: настройки и пауза)
    document.querySelectorAll('.settingsLabelMusic').forEach(el => el.textContent = t('settingsMusic'));
    document.querySelectorAll('.settingsLabelSfx').forEach(el => el.textContent = t('settingsSfx'));
    document.querySelectorAll('.settingsLabelShake').forEach(el => el.textContent = t('settingsShake'));
    document.querySelectorAll('.settingsLabelFlash').forEach(el => el.textContent = t('settingsFlash'));
}