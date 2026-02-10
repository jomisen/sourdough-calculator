/**
 * Beginner Guide State Management
 * Handles localStorage persistence and state tracking
 */

const STORAGE_KEY = 'sourdough_guide_v1';
const EXPIRY_DAYS = 30;
const WARNING_DAYS = 28;

export interface GuideState {
    version: number;
    currentStep: number;              // 0-7 (active step)
    completedSteps: number[];         // Array of completed step IDs
    unlockedSteps: number[];          // Array of unlocked step IDs
    startedAt: number;                // Unix timestamp (ms)
    lastUpdated: number;              // Unix timestamp (ms)
    expiresAt: number;                // Unix timestamp (ms)
    activeTimer: {
        stepId: number;
        startedAt: number;
        durationHours: number;
    } | null;
}

/**
 * Default initial state
 */
function getDefaultState(): GuideState {
    const now = Date.now();
    return {
        version: 1,
        currentStep: 0,
        completedSteps: [],
        unlockedSteps: [0], // First step is always unlocked
        startedAt: now,
        lastUpdated: now,
        expiresAt: now + (EXPIRY_DAYS * 24 * 60 * 60 * 1000),
        activeTimer: null
    };
}

/**
 * Load state from localStorage with validation
 */
export function loadGuideState(): GuideState {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            return getDefaultState();
        }

        const parsed = JSON.parse(stored) as GuideState;

        // Validate schema version
        if (parsed.version !== 1) {
            console.warn('Guide state version mismatch, resetting');
            return getDefaultState();
        }

        // Check expiry
        const now = Date.now();
        if (now > parsed.expiresAt) {
            console.info('Guide state expired, resetting');
            return getDefaultState();
        }

        // Warning if approaching expiry
        const warningTime = parsed.expiresAt - (WARNING_DAYS * 24 * 60 * 60 * 1000);
        if (now > warningTime) {
            const daysLeft = Math.ceil((parsed.expiresAt - now) / (24 * 60 * 60 * 1000));
            console.warn(`Guide state expires in ${daysLeft} days`);
        }

        // Validate data integrity
        if (!Array.isArray(parsed.completedSteps) || !Array.isArray(parsed.unlockedSteps)) {
            console.warn('Invalid guide state data, resetting');
            return getDefaultState();
        }

        return parsed;
    } catch (error) {
        console.error('Failed to load guide state:', error);
        return getDefaultState();
    }
}

/**
 * Save state to localStorage (debounced)
 */
let saveTimeout: number | null = null;

export function saveGuideState(state: GuideState): void {
    // Debounce saves (500ms)
    if (saveTimeout !== null) {
        clearTimeout(saveTimeout);
    }

    saveTimeout = window.setTimeout(() => {
        try {
            state.lastUpdated = Date.now();
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (error) {
            console.error('Failed to save guide state:', error);
            // Graceful degradation - continue in-memory
        }
        saveTimeout = null;
    }, 500);
}

/**
 * Reset guide state (start over)
 */
export function resetGuideState(): GuideState {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.error('Failed to reset guide state:', error);
    }
    return getDefaultState();
}

/**
 * Mark step as completed
 */
export function completeStep(state: GuideState, stepId: number): GuideState {
    // Add to completed if not already there
    if (!state.completedSteps.includes(stepId)) {
        state.completedSteps.push(stepId);
    }

    // Unlock next step
    const nextStepId = stepId + 1;
    if (nextStepId <= 7 && !state.unlockedSteps.includes(nextStepId)) {
        state.unlockedSteps.push(nextStepId);
    }

    // Move current step forward if completing the active one
    if (stepId === state.currentStep && nextStepId <= 7) {
        state.currentStep = nextStepId;
    }

    saveGuideState(state);
    return state;
}

/**
 * Unlock step (soft lock override)
 */
export function unlockStep(state: GuideState, stepId: number): GuideState {
    if (!state.unlockedSteps.includes(stepId)) {
        state.unlockedSteps.push(stepId);
    }
    saveGuideState(state);
    return state;
}

/**
 * Set active step
 */
export function setActiveStep(state: GuideState, stepId: number): GuideState {
    state.currentStep = stepId;
    saveGuideState(state);
    return state;
}

/**
 * Set active timer
 */
export function setActiveTimer(
    state: GuideState,
    stepId: number,
    durationHours: number
): GuideState {
    state.activeTimer = {
        stepId,
        startedAt: Date.now(),
        durationHours
    };
    saveGuideState(state);
    return state;
}

/**
 * Clear active timer
 */
export function clearActiveTimer(state: GuideState): GuideState {
    state.activeTimer = null;
    saveGuideState(state);
    return state;
}

/**
 * Check if timer has completed
 */
export function isTimerComplete(state: GuideState): boolean {
    if (!state.activeTimer) return false;

    const elapsed = Date.now() - state.activeTimer.startedAt;
    const duration = state.activeTimer.durationHours * 60 * 60 * 1000;
    return elapsed >= duration;
}

/**
 * Calculate progress percentage
 */
export function calculateProgress(state: GuideState): number {
    return Math.round((state.completedSteps.length / 8) * 100);
}

/**
 * Get progress emoji based on completion
 */
export function getProgressEmoji(progressPercent: number): string {
    if (progressPercent === 0) return '🌱';
    if (progressPercent <= 25) return '🌱';
    if (progressPercent <= 50) return '💪';
    if (progressPercent <= 75) return '🔥';
    return '🎉';
}

/**
 * Check if step is locked
 */
export function isStepLocked(state: GuideState, stepId: number): boolean {
    return !state.unlockedSteps.includes(stepId);
}

/**
 * Check if step is completed
 */
export function isStepCompleted(state: GuideState, stepId: number): boolean {
    return state.completedSteps.includes(stepId);
}

/**
 * Check if step is active
 */
export function isStepActive(state: GuideState, stepId: number): boolean {
    return state.currentStep === stepId;
}
