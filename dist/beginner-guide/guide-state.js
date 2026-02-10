const STORAGE_KEY = 'sourdough_guide_v1';
const EXPIRY_DAYS = 30;
const WARNING_DAYS = 28;
function getDefaultState() {
    const now = Date.now();
    return {
        version: 1,
        currentStep: 0,
        completedSteps: [],
        unlockedSteps: [0],
        startedAt: now,
        lastUpdated: now,
        expiresAt: now + (EXPIRY_DAYS * 24 * 60 * 60 * 1000),
        activeTimer: null
    };
}
export function loadGuideState() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            return getDefaultState();
        }
        const parsed = JSON.parse(stored);
        if (parsed.version !== 1) {
            console.warn('Guide state version mismatch, resetting');
            return getDefaultState();
        }
        const now = Date.now();
        if (now > parsed.expiresAt) {
            console.info('Guide state expired, resetting');
            return getDefaultState();
        }
        const warningTime = parsed.expiresAt - (WARNING_DAYS * 24 * 60 * 60 * 1000);
        if (now > warningTime) {
            const daysLeft = Math.ceil((parsed.expiresAt - now) / (24 * 60 * 60 * 1000));
            console.warn(`Guide state expires in ${daysLeft} days`);
        }
        if (!Array.isArray(parsed.completedSteps) || !Array.isArray(parsed.unlockedSteps)) {
            console.warn('Invalid guide state data, resetting');
            return getDefaultState();
        }
        return parsed;
    }
    catch (error) {
        console.error('Failed to load guide state:', error);
        return getDefaultState();
    }
}
let saveTimeout = null;
export function saveGuideState(state) {
    if (saveTimeout !== null) {
        clearTimeout(saveTimeout);
    }
    saveTimeout = window.setTimeout(() => {
        try {
            state.lastUpdated = Date.now();
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        }
        catch (error) {
            console.error('Failed to save guide state:', error);
        }
        saveTimeout = null;
    }, 500);
}
export function resetGuideState() {
    try {
        localStorage.removeItem(STORAGE_KEY);
    }
    catch (error) {
        console.error('Failed to reset guide state:', error);
    }
    return getDefaultState();
}
export function completeStep(state, stepId) {
    if (!state.completedSteps.includes(stepId)) {
        state.completedSteps.push(stepId);
    }
    const nextStepId = stepId + 1;
    if (nextStepId <= 7 && !state.unlockedSteps.includes(nextStepId)) {
        state.unlockedSteps.push(nextStepId);
    }
    if (stepId === state.currentStep && nextStepId <= 7) {
        state.currentStep = nextStepId;
    }
    saveGuideState(state);
    return state;
}
export function unlockStep(state, stepId) {
    if (!state.unlockedSteps.includes(stepId)) {
        state.unlockedSteps.push(stepId);
    }
    saveGuideState(state);
    return state;
}
export function setActiveStep(state, stepId) {
    state.currentStep = stepId;
    saveGuideState(state);
    return state;
}
export function setActiveTimer(state, stepId, durationHours) {
    state.activeTimer = {
        stepId,
        startedAt: Date.now(),
        durationHours
    };
    saveGuideState(state);
    return state;
}
export function clearActiveTimer(state) {
    state.activeTimer = null;
    saveGuideState(state);
    return state;
}
export function isTimerComplete(state) {
    if (!state.activeTimer)
        return false;
    const elapsed = Date.now() - state.activeTimer.startedAt;
    const duration = state.activeTimer.durationHours * 60 * 60 * 1000;
    return elapsed >= duration;
}
export function calculateProgress(state) {
    return Math.round((state.completedSteps.length / 8) * 100);
}
export function getProgressEmoji(progressPercent) {
    if (progressPercent === 0)
        return '🌱';
    if (progressPercent <= 25)
        return '🌱';
    if (progressPercent <= 50)
        return '💪';
    if (progressPercent <= 75)
        return '🔥';
    return '🎉';
}
export function isStepLocked(state, stepId) {
    return !state.unlockedSteps.includes(stepId);
}
export function isStepCompleted(state, stepId) {
    return state.completedSteps.includes(stepId);
}
export function isStepActive(state, stepId) {
    return state.currentStep === stepId;
}
//# sourceMappingURL=guide-state.js.map