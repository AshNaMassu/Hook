/* ============================================================================
   ОБУЧАЮЩИЙ РЕЖИМ (TUTORIAL) - ПОШАГОВЫЙ С ПАУЗОЙ
   ============================================================================ */

let tutorialStep = 0;
let tutorialActive = false;
let tutorialWaiting = false;  // ждём действия игрока
let tutorialHintTimer = 0;

const TUTORIAL_STEPS = [
    {
        id: 'welcome',
        text: 'tutorialWelcome',
        waitFor: null,  // не ждём, просто показываем
        duration: 2.0,
    },
    {
        id: 'grab',
        text: 'tutorialGrab',
        waitFor: 'attached',  // ждём зацепа
    },
    {
        id: 'hold',
        text: 'tutorialHold',
        waitFor: 'spin',  // ждём пока раскачается
        duration: 2.0,
    },
    {
        id: 'release',
        text: 'tutorialRelease',
        waitFor: 'flying',  // ждём релиза
    },
    {
        id: 'grab2',
        text: 'tutorialGrab2',
        waitFor: 'attached',  // ждём второго зацепа
    },
    {
        id: 'perfect',
        text: 'tutorialPerfect',
        waitFor: 'attached',  // ждём третьего зацепа
    },
    {
        id: 'done',
        text: 'tutorialDone',
        waitFor: null,
        duration: 2.0,
    },
];

function startTutorial() {
    tutorialStep = 0;
    tutorialActive = true;
    tutorialWaiting = false;
    tutorialHintTimer = 0;

    // Полностью останавливаем лаву
    lavaY = -999;

    // Замедляем время
    timeScale = 0.3;
}

function updateTutorial(dt) {
    if (!tutorialActive) return;

    const step = TUTORIAL_STEPS[tutorialStep];
    if (!step) {
        completeTutorial();
        return;
    }

    tutorialHintTimer += dt;

    // Проверяем условие завершения шага
    if (step.waitFor) {
        const conditionMet = checkTutorialCondition(step.waitFor);

        if (conditionMet) {
            advanceTutorial();
        } else {
            // Ждём действия игрока
            tutorialWaiting = true;
        }
    } else if (step.duration) {
        // Автоматический переход по таймеру
        if (tutorialHintTimer >= step.duration) {
            advanceTutorial();
        }
    }
}

function checkTutorialCondition(condition) {
    switch (condition) {
        case 'attached':
            return hero.attached;
        case 'flying':
            return !hero.attached && hero.grabs >= 1;
        case 'spin':
            return hero.attached && hero.attachT > 1.0;
        default:
            return true;
    }
}

function advanceTutorial() {
    tutorialStep++;
    tutorialHintTimer = 0;
    tutorialWaiting = false;

    // Эффект перехода
    if (tutorialStep < TUTORIAL_STEPS.length) {
        addFloat(hero.x, hero.y + 1.0, '✓', '#39ff14', 24);
        Snd.ui();
    }

    // Завершение обучалки
    if (tutorialStep >= TUTORIAL_STEPS.length) {
        completeTutorial();
    }
}

function completeTutorial() {
    tutorialActive = false;
    tutorialWaiting = false;
    tutorialCompleted = true;

    // Возвращаем нормальное время
    timeScale = 1.0;

    // Запускаем лаву
    lavaY = LAVA.startY;

    // Бонус за завершение
    const bonusCoins = 10;
    coinsRun += bonusCoins;
    addFloat(hero.x, hero.y + 1.5, t('tutorialBonus') + ' +' + bonusCoins + '◈', '#ffc23d', 24);

    // Сохраняем
    saveAllDataDebounced();
}

function getTutorialText() {
    if (!tutorialActive) return null;

    const step = TUTORIAL_STEPS[tutorialStep];
    if (!step) return null;

    return t(step.text);
}

function isTutorialWaiting() {
    return tutorialActive && tutorialWaiting;
}