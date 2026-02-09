export const FERMENTATION_CONSTANTS = {
    BASE_TIME: 5,
    BASE_TEMP: 22,
    TEMP_FACTOR: 1.15,
    BASE_STARTER: 20,
    STARTER_FACTOR: 0.85,
    BASE_HYDRATION: 75,
    HYDRATION_FACTOR: 1.05,
    MIN_FOLDS: 3,
    MAX_FOLDS: 6,
    MIN_TIME: 2,
    MAX_TIME: 24
};
export const SourdoughApp = {
    timerInterval: null,
    endTime: null,
    calculatedTime: 0,
    isPaused: false,
    remainingTime: 0
};
//# sourceMappingURL=constants.js.map