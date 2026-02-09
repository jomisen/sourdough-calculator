import { FERMENTATION_CONSTANTS, SourdoughApp } from './constants.js';
import { getInputValues, calculateBakersPercentages, calculateTemperatureFactor, calculateStarterFactor, calculateFlourFactor, calculateAdvancedFactors, calculateColdProofAdjustment, calculateFoldingSchedule, calculateBakingTime } from './calculator.js';
import { formatHoursMinutes, generateTimeDisplayText, generateTimeRangeInfo, generateRecipeCardsHTML, generateInfoText, announceToScreenReader, updateWholeGrainPercent, updateRecipeSummary } from './display.js';
import { startTimer, stopTimer, resumeTimer, restartTimer } from './timer.js';
import { validateInputs, validateRecipeWarnings, displayWarnings } from './validation.js';
import { trackCalculatorUsed, trackTimerStarted } from './analytics.js';
import { initFAQ } from './faq.js';
function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = window.setTimeout(() => func.apply(this, args), delay);
    };
}
function showLoadingIndicator() {
    const resultDiv = document.getElementById('result');
    if (!resultDiv)
        return;
    let loadingDiv = document.getElementById('loading-indicator');
    if (!loadingDiv) {
        loadingDiv = document.createElement('div');
        loadingDiv.id = 'loading-indicator';
        loadingDiv.className = 'loading-indicator';
        loadingDiv.setAttribute('role', 'status');
        loadingDiv.setAttribute('aria-live', 'polite');
        loadingDiv.innerHTML = `
            <div class="loading-content">
                <span class="loading-spinner" aria-hidden="true"></span>
                <span class="loading-text">Beräknar...</span>
            </div>
        `;
    }
    if (!loadingDiv.parentElement && resultDiv.parentNode) {
        resultDiv.parentNode.insertBefore(loadingDiv, resultDiv);
    }
    resultDiv.style.opacity = '0.5';
    resultDiv.style.pointerEvents = 'none';
}
function hideLoadingIndicator() {
    const loadingDiv = document.getElementById('loading-indicator');
    const resultDiv = document.getElementById('result');
    if (loadingDiv) {
        loadingDiv.remove();
    }
    if (resultDiv) {
        resultDiv.style.opacity = '1';
        resultDiv.style.pointerEvents = 'auto';
    }
}
function calculateTime() {
    showLoadingIndicator();
    setTimeout(() => {
        calculateTimeInternal();
    }, 50);
}
function calculateTimeInternal() {
    try {
        validateInputs();
        const inputs = getInputValues();
        if (isNaN(inputs.temp) || isNaN(inputs.flour) || isNaN(inputs.water) ||
            isNaN(inputs.starter) || isNaN(inputs.salt)) {
            throw new Error('Ogiltiga inmatningsvärden. Kontrollera att alla fält innehåller nummer.');
        }
        if (inputs.flour === 0) {
            throw new Error('Mjölmängden kan inte vara 0.');
        }
        const oldError = document.getElementById('calculation-error');
        if (oldError) {
            oldError.remove();
        }
        try {
            const warnings = validateRecipeWarnings(inputs.flour, inputs.water, inputs.starter, inputs.salt);
            displayWarnings(warnings);
        }
        catch (warningError) {
            console.error('Warning display failed (non-critical):', warningError);
        }
        const percentages = calculateBakersPercentages(inputs);
        const tempFactor = calculateTemperatureFactor(inputs.temp);
        const starterFactor = calculateStarterFactor(percentages.starterPercent);
        const flourFactor = calculateFlourFactor(inputs.flourType, inputs.flour);
        const { peakFactor, ratioFactor, autolyseFactor } = calculateAdvancedFactors(inputs);
        let bulkTime = FERMENTATION_CONSTANTS.BASE_TIME *
            tempFactor *
            starterFactor *
            flourFactor *
            ratioFactor *
            peakFactor *
            autolyseFactor;
        bulkTime = Math.max(FERMENTATION_CONSTANTS.MIN_TIME, Math.min(FERMENTATION_CONSTANTS.MAX_TIME, bulkTime));
        const { coldProofEquivalent, bulkAdjustment } = calculateColdProofAdjustment(inputs.coldProof, inputs.fridgeTemp, bulkTime);
        if (bulkAdjustment > 0) {
            bulkTime = Math.max(3, bulkTime - bulkAdjustment);
        }
        const minTime = bulkTime * 0.85;
        const maxTime = bulkTime * 1.15;
        displayResults(bulkTime, minTime, maxTime, inputs.temp, percentages.starterPercent, percentages.hydration, percentages.saltPercent, inputs.flour, inputs.water, inputs.starter, inputs.salt, inputs.coldProof, inputs.fridgeTemp, coldProofEquivalent, bulkAdjustment);
    }
    catch (error) {
        console.error('Fel vid beräkning:', error);
        try {
            const oldWarning = document.getElementById('recipe-warnings');
            if (oldWarning)
                oldWarning.remove();
        }
        catch (e) {
            console.warn('Could not remove warnings during error handling');
        }
        const resultDiv = document.getElementById('result');
        if (resultDiv) {
            let errorDiv = document.getElementById('calculation-error');
            if (!errorDiv) {
                errorDiv = document.createElement('div');
                errorDiv.id = 'calculation-error';
                resultDiv.insertBefore(errorDiv, resultDiv.firstChild);
            }
            const errorMessage = error instanceof Error ? error.message : 'Kunde inte beräkna jästid. Kontrollera att alla värden är korrekta och försök igen.';
            errorDiv.innerHTML = `
                <div style="background: linear-gradient(135deg, #fff5f5 0%, #ffe5e5 100%);
                            border-left: 4px solid #dc3545;
                            padding: var(--space-4);
                            border-radius: 12px;
                            margin-bottom: var(--space-4);">
                    <h3 style="color: #dc3545; margin-top: 0; display: flex; align-items: center; gap: var(--space-2);">⚠️ Ett fel uppstod</h3>
                    <p style="margin-bottom: var(--space-2);">${errorMessage}</p>
                    <button onclick="location.reload()" style="width: auto; padding: var(--space-2) var(--space-3); font-size: var(--text-sm); margin-top: var(--space-2); display: inline-flex; align-items: center; gap: 6px;">
                        🔄 Ladda om sidan
                    </button>
                </div>
            `;
            resultDiv.classList.add('show');
        }
        const errorMessage = error instanceof Error ? error.message : 'Ett fel uppstod';
        announceToScreenReader(`Fel: ${errorMessage}`);
    }
    finally {
        hideLoadingIndicator();
    }
}
function displayResults(time, minTime, maxTime, temp, starterPercent, hydration, _saltPercent, flour, water, starter, salt, coldProof, fridgeTemp, coldProofEquivalent, bulkAdjustment) {
    const resultDiv = document.getElementById('result');
    const timeDisplay = document.getElementById('timeDisplay');
    const timeRange = document.getElementById('timeRange');
    const infoText = document.getElementById('infoText');
    if (!resultDiv || !timeDisplay || !timeRange || !infoText) {
        console.error('Missing required DOM elements:', {
            resultDiv: !!resultDiv,
            timeDisplay: !!timeDisplay,
            timeRange: !!timeRange,
            infoText: !!infoText
        });
        throw new Error('Kunde inte hitta alla nödvändiga element på sidan. Försök ladda om sidan.');
    }
    const currentNumLoaves = parseFloat(document.getElementById('numLoaves')?.value || '1') || 1;
    SourdoughApp.calculatedTime = time;
    if (SourdoughApp.timerInterval) {
        stopTimer();
    }
    timeDisplay.innerHTML = generateTimeDisplayText(time, coldProof);
    const totalWeight = flour + water + starter + salt;
    const foldingSchedule = calculateFoldingSchedule(hydration);
    const bakingTimes = calculateBakingTime(totalWeight, currentNumLoaves);
    const timeInfo = generateTimeRangeInfo(minTime, maxTime, coldProof, fridgeTemp, coldProofEquivalent, bulkAdjustment);
    timeRange.innerHTML = `
        <div style="margin-bottom: var(--space-3);">${timeInfo}</div>
        ${generateRecipeCardsHTML(foldingSchedule, bakingTimes, hydration, currentNumLoaves)}
    `;
    infoText.innerHTML = generateInfoText(temp, starterPercent);
    resultDiv.classList.add('show');
    const { hours, minutes } = formatHoursMinutes(time);
    announceToScreenReader(`Beräkning klar. Rekommenderad jästid är ${hours} timmar och ${minutes} minuter.`);
    if (typeof window.updateFoldsRecommendation === 'function') {
        window.updateFoldsRecommendation();
    }
}
function toggleAdvanced() {
    const checkbox = document.getElementById('advancedToggle');
    const section = document.getElementById('advancedSection');
    if (!checkbox || !section)
        return;
    if (checkbox.checked) {
        section.classList.add('show');
        setTimeout(() => {
            const firstInput = section.querySelector('select, input');
            if (firstInput) {
                firstInput.focus();
                announceToScreenReader('Avancerade inställningar öppnade. Du kan nu justera mjöltyp, matningsratio och kalljäsning.');
            }
        }, 100);
    }
    else {
        section.classList.remove('show');
        announceToScreenReader('Avancerade inställningar stängda.');
    }
    calculateTime();
}
function updateTemperatureFeedback(temp) {
    const feedback = document.getElementById('tempFeedback');
    const slider = document.getElementById('temperatureSlider');
    if (!feedback || !slider)
        return;
    if (temp >= 22 && temp <= 24) {
        slider.classList.add('sweet-spot');
        feedback.innerHTML = '<span style="color: var(--green-medium);">✅ Perfekt för jäsning!</span>';
    }
    else {
        slider.classList.remove('sweet-spot');
        if (temp < 20) {
            feedback.innerHTML = '<span style="color: #5B9BD5;">❄️ Kallt - jäsningen blir långsammare</span>';
        }
        else if (temp >= 20 && temp < 22) {
            feedback.innerHTML = '<span style="color: var(--green-medium);">Bra temperatur - lite långsam jäsning</span>';
        }
        else if (temp > 24 && temp <= 26) {
            feedback.innerHTML = '<span style="color: #FFB347;">Varmt - snabbare jäsning</span>';
        }
        else if (temp > 26) {
            feedback.innerHTML = '<span style="color: #FF6B6B;">🔥 Mycket varmt - risk för överjäsning!</span>';
        }
    }
}
function syncTemperature() {
    const tempSlider = document.getElementById('temperatureSlider');
    const tempInput = document.getElementById('temperature');
    if (!tempSlider || !tempInput)
        return;
    updateTemperatureFeedback(parseFloat(tempInput.value));
    tempSlider.addEventListener('input', function () {
        tempInput.value = this.value;
        updateTemperatureFeedback(parseFloat(this.value));
        calculateTime();
    });
    tempInput.addEventListener('input', function () {
        tempSlider.value = this.value;
        updateTemperatureFeedback(parseFloat(this.value));
        calculateTime();
    });
    tempInput.addEventListener('blur', function () {
        updateTemperatureFeedback(parseFloat(this.value));
    });
}
function setupAutoCalculate() {
    const debouncedCalculate = debounce(() => {
        updateRecipeSummary();
        calculateTime();
    }, 300);
    const inputs = ['flour', 'water', 'starter', 'salt', 'coldProof', 'fridgeTemp', 'wholeGrainAmount'];
    inputs.forEach(inputId => {
        const element = document.getElementById(inputId);
        if (element) {
            element.addEventListener('input', debouncedCalculate);
        }
    });
    const selects = ['flourType', 'feedingRatio', 'peakStatus', 'autolyse'];
    selects.forEach(selectId => {
        const element = document.getElementById(selectId);
        if (element) {
            element.addEventListener('change', debouncedCalculate);
        }
    });
    const advancedToggle = document.getElementById('advancedToggle');
    if (advancedToggle) {
        advancedToggle.addEventListener('change', toggleAdvanced);
    }
    const flourType = document.getElementById('flourType');
    if (flourType) {
        flourType.addEventListener('change', function () {
            const wholeGrainGroup = document.getElementById('wholeGrainGroup');
            if (wholeGrainGroup) {
                if (this.value === 'mixed') {
                    wholeGrainGroup.style.display = 'block';
                    updateWholeGrainPercent();
                }
                else {
                    wholeGrainGroup.style.display = 'none';
                }
            }
        });
    }
}
function setupEditableHydration() {
    const hydrationInput = document.getElementById('hydrationInput');
    const waterInput = document.getElementById('water');
    const flourInput = document.getElementById('flour');
    const hydrationFeedback = document.getElementById('hydrationFeedback');
    const lockToggle = document.getElementById('hydrationLockToggle');
    const lockStatusText = document.getElementById('lockStatusText');
    const helpIcon = document.querySelector('.help-icon');
    const helpTooltip = document.getElementById('hydrationHelpTooltip');
    const tooltipClose = document.querySelector('.tooltip-close');
    if (!hydrationInput || !waterInput || !flourInput || !lockToggle) {
        console.warn('Hydration lock setup failed - missing elements');
        return;
    }
    console.log('✅ Hydration lock 2.0 initialized successfully!');
    let isHydrationLocked = false;
    let isUpdating = false;
    function updateLockVisuals() {
        const lockButtonText = document.getElementById('lockButtonText');
        if (!lockToggle)
            return;
        lockToggle.setAttribute('aria-checked', isHydrationLocked ? 'true' : 'false');
        console.log('🔄 Toggle state updated:', isHydrationLocked ? 'LOCKED (red)' : 'UNLOCKED (green)');
        console.log('   aria-checked:', lockToggle.getAttribute('aria-checked'));
        if (isHydrationLocked) {
            if (lockButtonText) {
                lockButtonText.textContent = 'Lås upp hydrering';
            }
            lockToggle.setAttribute('aria-label', 'Lås upp hydrering för att redigera mjöl och vatten oberoende');
            if (lockStatusText) {
                lockStatusText.innerHTML = '<span class="status-locked">🔒 Låst - Mjöl och vatten justeras automatiskt</span>';
            }
        }
        else {
            if (lockButtonText) {
                lockButtonText.textContent = 'Lås hydrering';
            }
            lockToggle.setAttribute('aria-label', 'Lås hydrering för att automatiskt justera mjöl och vatten');
            if (lockStatusText) {
                lockStatusText.innerHTML = '<span class="status-unlocked">🔓 Olåst - Mjöl och vatten är oberoende</span>';
            }
        }
    }
    updateLockVisuals();
    lockToggle.addEventListener('click', function (e) {
        e.preventDefault();
        console.log('🖱️ Toggle clicked! Current state:', isHydrationLocked);
        isHydrationLocked = !isHydrationLocked;
        console.log('   New state:', isHydrationLocked);
        updateLockVisuals();
        const status = isHydrationLocked ? 'låst' : 'olåst';
        announceToScreenReader(`Hydrering ${status}. ${isHydrationLocked ? 'Mjöl och vatten justeras nu automatiskt för att bibehålla hydreringen.' : 'Du kan nu ändra mjöl och vatten oberoende.'}`);
    });
    if (helpIcon && helpTooltip) {
        helpIcon.addEventListener('click', function (e) {
            e.preventDefault();
            const isVisible = helpTooltip.style.display === 'block';
            helpTooltip.style.display = isVisible ? 'none' : 'block';
        });
    }
    if (tooltipClose && helpTooltip) {
        tooltipClose.addEventListener('click', function () {
            helpTooltip.style.display = 'none';
            localStorage.setItem('hydrationHelpSeen', 'true');
        });
    }
    function showFeedback() {
        if (hydrationFeedback) {
            hydrationFeedback.classList.add('show');
            setTimeout(() => {
                hydrationFeedback.classList.remove('show');
            }, 1500);
        }
    }
    hydrationInput.addEventListener('input', function () {
        if (isUpdating)
            return;
        const flour = parseFloat(flourInput.value) || 0;
        const hydration = parseFloat(this.value) || 0;
        if (flour > 0 && hydration >= 50 && hydration <= 120) {
            const newWater = Math.round(flour * (hydration / 100));
            isUpdating = true;
            waterInput.value = String(newWater);
            showFeedback();
            updateRecipeSummary();
            calculateTime();
            announceToScreenReader(`Vattenmängd uppdaterad till ${newWater} gram baserat på ${hydration}% hydrering.`);
            setTimeout(() => {
                isUpdating = false;
            }, 100);
        }
    });
    flourInput.addEventListener('input', function () {
        if (!isHydrationLocked || isUpdating)
            return;
        const flour = parseFloat(this.value) || 0;
        const hydration = parseFloat(hydrationInput.value) || 0;
        if (flour > 0 && hydration > 0) {
            const newWater = Math.round(flour * (hydration / 100));
            isUpdating = true;
            waterInput.value = String(newWater);
            showFeedback();
            setTimeout(() => {
                isUpdating = false;
            }, 50);
        }
    });
    waterInput.addEventListener('input', function () {
        if (!isHydrationLocked || isUpdating)
            return;
        const water = parseFloat(this.value) || 0;
        const hydration = parseFloat(hydrationInput.value) || 0;
        if (water > 0 && hydration > 0) {
            const newFlour = Math.round(water / (hydration / 100));
            isUpdating = true;
            flourInput.value = String(newFlour);
            showFeedback();
            setTimeout(() => {
                isUpdating = false;
            }, 50);
        }
    });
    hydrationInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            this.blur();
        }
    });
}
function setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' || e.key === 'Esc') {
            const advancedToggle = document.getElementById('advancedToggle');
            const advancedSection = document.getElementById('advancedSection');
            if (advancedToggle && advancedToggle.checked && advancedSection) {
                advancedToggle.checked = false;
                advancedSection.classList.remove('show');
                announceToScreenReader('Avancerade inställningar stängda med Escape.');
                advancedToggle.focus();
            }
        }
    });
    const inputs = document.querySelectorAll('input[type="number"]');
    inputs.forEach((input, index) => {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const nextInput = inputs[index + 1];
                if (nextInput) {
                    nextInput.focus();
                    nextInput.select();
                }
            }
        });
    });
}
function init() {
    syncTemperature();
    setupAutoCalculate();
    setupEditableHydration();
    setupKeyboardNavigation();
    updateRecipeSummary();
    calculateTime();
    const startTimerBtn = document.getElementById('startTimerBtn');
    if (startTimerBtn) {
        startTimerBtn.addEventListener('click', () => {
            startTimer();
            trackTimerStarted();
        });
    }
    const stopTimerBtn = document.getElementById('stopTimerBtn');
    if (stopTimerBtn) {
        stopTimerBtn.addEventListener('click', stopTimer);
    }
    const flourType = document.getElementById('flourType');
    if (flourType && flourType.value !== 'mixed') {
        const wholeGrainGroup = document.getElementById('wholeGrainGroup');
        if (wholeGrainGroup) {
            wholeGrainGroup.style.display = 'none';
        }
    }
    window.addEventListener('beforeunload', () => {
        if (SourdoughApp.timerInterval) {
            clearInterval(SourdoughApp.timerInterval);
            SourdoughApp.timerInterval = null;
        }
    });
    const originalCalculateTime = calculateTime;
    window.calculateTime = function () {
        originalCalculateTime();
        trackCalculatorUsed();
    };
    initFAQ();
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
}
else {
    init();
}
window.calculateTime = calculateTime;
window.updateWholeGrainPercent = updateWholeGrainPercent;
window.startTimer = startTimer;
window.stopTimer = stopTimer;
window.resumeTimer = resumeTimer;
window.restartTimer = restartTimer;
//# sourceMappingURL=app.js.map