/**
 * Fermentation calculation constants
 * Baseline: 5 hours at 22°C with 20% starter
 */
export const FERMENTATION_CONSTANTS = {
    BASE_TIME: 5,           // Hours
    BASE_TEMP: 22,          // Celsius
    BASE_STARTER: 20,       // Percent
    TEMP_FACTOR: 1.15,      // Each degree changes time by 15%
    STARTER_FACTOR: 0.85,   // Each 5% starter changes time by 15%
    MIN_TIME: 2,            // Minimum bulk time (hours)
    MAX_TIME: 24            // Maximum bulk time (hours)
};

/**
 * Application state namespace
 */
export const SourdoughApp = {
    timerInterval: null,
    endTime: null,
    calculatedTime: 0
};
