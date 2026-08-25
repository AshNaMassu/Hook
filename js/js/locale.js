
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
        slow: 'Время ушло'

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
        shieldText: 'ЩИТ 3с'
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
        slow: 'Time is up'

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
        shieldText: 'SHIELD 3s'
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
}