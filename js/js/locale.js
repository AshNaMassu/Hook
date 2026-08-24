
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
        longJump: 'ДАЛЬНИЙ!',

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
        longJump: 'LONG JUMP!',

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
    $('btnPlay').textContent = t('btnPlay');
    $('btnSettings').textContent = t('btnSettings');
    $('mLbl').textContent = t('height');

    // Экран смерти
    $('overCombo').textContent = t('series') + ' ×0';
    $('btnRevive').innerHTML = t('btnRevive') + ' <span style="font-size:.7em">(1 ' + t('timesShort') + ')</span>';
    $('btnAgain').textContent = t('btnAgain');
    $('btnSame').textContent = t('btnSame');
    $('btnMenu1').textContent = t('btnMenu');
    $('btnMenu2').textContent = t('btnMenu');

    // Настройки
    $('btnBackMenu').textContent = t('back');

    // Пауза
    $('btnResume').textContent = t('resume');
    $('btnRestart').textContent = t('restart');
}