import { FERMENTATION_CONSTANTS, SourdoughApp } from './constants.js';
import {
    getInputValues,
    calculateBakersPercentages,
    calculateTemperatureFactor,
    calculateStarterFactor,
    calculateFlourFactor,
    calculateAdvancedFactors,
    calculateColdProofAdjustment,
    calculateFoldingSchedule,
    calculateBakingTime
} from './calculator.js';
import {
    formatHoursMinutes,
    generateTimeDisplayText,
    generateTimeRangeInfo,
    generateRecipeCardsHTML,
    generateInfoText,
    announceToScreenReader,
    updateWholeGrainPercent,
    updateRecipeSummary
} from './display.js';
import { startTimer, stopTimer, resumeTimer, restartTimer } from './timer.js';
import { validateInputs, validateRecipeWarnings, displayWarnings } from './validation.js';
import { trackCalculatorUsed, trackTimerStarted } from './analytics.js';
import { initFAQ } from './faq.js';

/**
 * Debounce function for performance optimization
 */
function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

/**
 * Show loading indicator
 */
function showLoadingIndicator() {
    const resultDiv = document.getElementById('result');
    if (!resultDiv) return;

    // Create loading indicator if it doesn't exist
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

    // Insert before result section if not already inserted
    if (!loadingDiv.parentElement) {
        resultDiv.parentNode.insertBefore(loadingDiv, resultDiv);
    }

    // Fade out result section
    resultDiv.style.opacity = '0.5';
    resultDiv.style.pointerEvents = 'none';
}

/**
 * Hide loading indicator
 */
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

/**
 * Main calculation function with loading state
 * Orchestrates all helper functions to calculate fermentation time
 */
function calculateTime() {
    // Show loading indicator
    showLoadingIndicator();

    // Use setTimeout to ensure loading indicator renders before heavy calculation
    setTimeout(() => {
        calculateTimeInternal();
    }, 50);
}

/**
 * Internal calculation function
 * Performs the actual calculation logic
 */
function calculateTimeInternal() {
    try {
        // Validate inputs (shows visual feedback but doesn't block calculation)
        validateInputs();

        // Read all input values
        const inputs = getInputValues();

        // Validate basic inputs
        if (isNaN(inputs.temp) || isNaN(inputs.flour) || isNaN(inputs.water) ||
            isNaN(inputs.starter) || isNaN(inputs.salt)) {
            throw new Error('Ogiltiga inmatningsvärden. Kontrollera att alla fält innehåller nummer.');
        }

        if (inputs.flour === 0) {
            throw new Error('Mjölmängden kan inte vara 0.');
        }

        // Clear any previous error messages from failed calculations
        const oldError = document.getElementById('calculation-error');
        if (oldError) {
            oldError.remove();
        }

        // Check for recipe warnings (extreme values)
        // Wrap in try-catch to prevent DOM errors from breaking calculation
        try {
            const warnings = validateRecipeWarnings(
                inputs.flour,
                inputs.water,
                inputs.starter,
                inputs.salt
            );
            displayWarnings(warnings);
        } catch (warningError) {
            console.error('Warning display failed (non-critical):', warningError);
            // Continue with calculation even if warnings fail
        }

        // Calculate baker's percentages
        const percentages = calculateBakersPercentages(inputs);

        // Calculate fermentation factors
        const tempFactor = calculateTemperatureFactor(inputs.temp);
        const starterFactor = calculateStarterFactor(percentages.starterPercent);
        const flourFactor = calculateFlourFactor(inputs.flourType, inputs.flour);
        const { peakFactor, ratioFactor, autolyseFactor } = calculateAdvancedFactors(inputs);

        // Calculate bulk fermentation time
        let bulkTime = FERMENTATION_CONSTANTS.BASE_TIME *
                      tempFactor *
                      starterFactor *
                      flourFactor *
                      ratioFactor *
                      peakFactor *
                      autolyseFactor;

        // Ensure reasonable bounds
        bulkTime = Math.max(
            FERMENTATION_CONSTANTS.MIN_TIME,
            Math.min(FERMENTATION_CONSTANTS.MAX_TIME, bulkTime)
        );

        // Apply cold proofing adjustment
        const { coldProofEquivalent, bulkAdjustment } = calculateColdProofAdjustment(
            inputs.coldProof,
            inputs.fridgeTemp,
            bulkTime
        );

        if (bulkAdjustment > 0) {
            bulkTime = Math.max(3, bulkTime - bulkAdjustment);
        }

        // Create time range (±15%)
        const minTime = bulkTime * 0.85;
        const maxTime = bulkTime * 1.15;

        // Display results
        displayResults(
            bulkTime, minTime, maxTime,
            inputs.temp, percentages.starterPercent, percentages.hydration, percentages.saltPercent,
            inputs.flour, inputs.water, inputs.starter, inputs.salt,
            inputs.coldProof, inputs.fridgeTemp, coldProofEquivalent, bulkAdjustment
        );
    } catch (error) {
        // Handle calculation errors gracefully
        console.error('Fel vid beräkning:', error);

        // Remove any warnings that might be showing
        try {
            const oldWarning = document.getElementById('recipe-warnings');
            if (oldWarning) oldWarning.remove();
        } catch (e) {
            console.warn('Could not remove warnings during error handling');
        }

        const resultDiv = document.getElementById('result');
        if (resultDiv) {
            // Don't use innerHTML to avoid destroying child elements
            // Instead, create a separate error message div
            let errorDiv = document.getElementById('calculation-error');
            if (!errorDiv) {
                errorDiv = document.createElement('div');
                errorDiv.id = 'calculation-error';
                resultDiv.insertBefore(errorDiv, resultDiv.firstChild);
            }

            errorDiv.innerHTML = `
                <div style="background: linear-gradient(135deg, #fff5f5 0%, #ffe5e5 100%);
                            border-left: 4px solid #dc3545;
                            padding: var(--space-4);
                            border-radius: 12px;
                            margin-bottom: var(--space-4);">
                    <h3 style="color: #dc3545; margin-top: 0; display: flex; align-items: center; gap: var(--space-2);">⚠️ Ett fel uppstod</h3>
                    <p style="margin-bottom: var(--space-2);">${error.message || 'Kunde inte beräkna jästid. Kontrollera att alla värden är korrekta och försök igen.'}</p>
                    <button onclick="location.reload()" style="width: auto; padding: var(--space-2) var(--space-3); font-size: var(--text-sm); margin-top: var(--space-2); display: inline-flex; align-items: center; gap: 6px;">
                        🔄 Ladda om sidan
                    </button>
                </div>
            `;
            resultDiv.classList.add('show');

        }

        // Announce error to screen readers
        announceToScreenReader(`Fel: ${error.message}`);
    } finally {
        // Always hide loading indicator when done
        hideLoadingIndicator();
    }
}

/**
 * Main display function
 * Orchestrates all display helper functions to show results
 */
function displayResults(time, minTime, maxTime, temp, starterPercent, hydration, saltPercent, flour, water, starter, salt, coldProof, fridgeTemp, coldProofEquivalent, bulkAdjustment) {
    const resultDiv = document.getElementById('result');
    const timeDisplay = document.getElementById('timeDisplay');
    const timeRange = document.getElementById('timeRange');
    const infoText = document.getElementById('infoText');

    // Validate that all required elements exist
    if (!resultDiv || !timeDisplay || !timeRange || !infoText) {
        console.error('Missing required DOM elements:', {
            resultDiv: !!resultDiv,
            timeDisplay: !!timeDisplay,
            timeRange: !!timeRange,
            infoText: !!infoText
        });
        throw new Error('Kunde inte hitta alla nödvändiga element på sidan. Försök ladda om sidan.');
    }

    // Save current numLoaves value before regenerating HTML
    const currentNumLoaves = parseFloat(document.getElementById('numLoaves')?.value) || 1;

    // Calculate total time including cold proof
    const totalTimeWithCold = time + coldProof;

    // Save calculated time for timer (only bulk fermentation, not cold proof)
    SourdoughApp.calculatedTime = time;

    // Reset timer if running
    if (SourdoughApp.timerInterval) {
        stopTimer();
    }

    // Generate time display
    timeDisplay.innerHTML = generateTimeDisplayText(time, coldProof);

    // Calculate components
    const totalWeight = flour + water + starter + salt;
    const foldingSchedule = calculateFoldingSchedule(hydration);
    const bakingTimes = calculateBakingTime(totalWeight, currentNumLoaves);

    // Generate time range info
    const timeInfo = generateTimeRangeInfo(
        minTime, maxTime, coldProof, fridgeTemp,
        coldProofEquivalent, bulkAdjustment
    );

    // Generate recipe cards
    timeRange.innerHTML = `
        <div style="margin-bottom: var(--space-3);">${timeInfo}</div>
        ${generateRecipeCardsHTML(foldingSchedule, bakingTimes, hydration, currentNumLoaves)}
    `;

    // Generate and display info text
    infoText.innerHTML = generateInfoText(temp, starterPercent);

    // Show result
    resultDiv.classList.add('show');


    // Add event listener for number of loaves (after element is created)
    setTimeout(() => {
        // Note: Antal bröd moved to Schedule tab
    }, 50);

    // Announce to screen readers
    const { hours, minutes } = formatHoursMinutes(time);
    announceToScreenReader(`Beräkning klar. Rekommenderad jästid är ${hours} timmar och ${minutes} minuter.`);

    // Update schedule folds recommendation if function is available
    if (typeof window.updateFoldsRecommendation === 'function') {
        window.updateFoldsRecommendation();
    }
}

/**
 * Handle number of loaves change
 */
function handleNumLeavesChange() {
    const input = document.getElementById('numLoaves');
    if (!input) return;

    const min = 1;
    const max = 10;
    let value = parseInt(input.value) || 0;

    // Validate and constrain value
    if (value < min) value = min;
    if (value > max) value = max;

    // Update input if value was corrected
    if (parseInt(input.value) !== value) {
        input.value = value;
    }

    // Update button states
    updateLoafButtonStates(value, min, max);

    // Update display and recalculate
    updateBreadEmojis();
    calculateTime();
}

/**
 * Handle loaf input focus - select all text for easy replacement
 */
function handleLoafInputFocus(event) {
    const input = event.target;
    // Use setTimeout to ensure it works on mobile browsers
    setTimeout(() => {
        input.select();
    }, 0);
}

/**
 * Handle loaf +/- button clicks
 */
function handleLoafButtonClick(event) {
    const button = event.currentTarget;
    const action = button.dataset.action;
    const input = document.getElementById('numLoaves');

    if (!input) return;

    let currentValue = parseInt(input.value) || 1;
    const min = 1;
    const max = 10;

    if (action === 'increase' && currentValue < max) {
        currentValue++;
    } else if (action === 'decrease' && currentValue > min) {
        currentValue--;
    }

    // Update input value
    input.value = currentValue;

    // Update button states
    updateLoafButtonStates(currentValue, min, max);

    // Trigger change
    updateBreadEmojis();
    calculateTime();
}

/**
 * Update loaf button disabled states
 */
function updateLoafButtonStates(value, min, max) {
    const minusBtn = document.querySelector('.loaf-btn-minus');
    const plusBtn = document.querySelector('.loaf-btn-plus');

    if (minusBtn) {
        minusBtn.disabled = value <= min;
    }
    if (plusBtn) {
        plusBtn.disabled = value >= max;
    }
}

/**
 * Toggle advanced settings
 */
function toggleAdvanced() {
    const checkbox = document.getElementById('advancedToggle');
    const section = document.getElementById('advancedSection');

    if (checkbox.checked) {
        section.classList.add('show');

        // Move focus to first input in advanced section for keyboard users
        setTimeout(() => {
            const firstInput = section.querySelector('select, input');
            if (firstInput) {
                firstInput.focus();
                announceToScreenReader('Avancerade inställningar öppnade. Du kan nu justera mjöltyp, matningsratio och kalljäsning.');
            }
        }, 100); // Small delay to ensure section is visible
    } else {
        section.classList.remove('show');
        announceToScreenReader('Avancerade inställningar stängda.');
    }

    // Recalculate when toggling advanced settings on/off
    calculateTime();
}

/**
 * Update temperature feedback text and styling
 */
function updateTemperatureFeedback(temp) {
    const feedback = document.getElementById('tempFeedback');
    const slider = document.getElementById('temperatureSlider');

    if (!feedback || !slider) return;

    temp = parseFloat(temp);

    // Sweet spot: 22-24°C
    if (temp >= 22 && temp <= 24) {
        slider.classList.add('sweet-spot');
        feedback.innerHTML = '<span style="color: var(--green-medium);">✅ Perfekt för jäsning!</span>';
    } else {
        slider.classList.remove('sweet-spot');

        if (temp < 20) {
            feedback.innerHTML = '<span style="color: #5B9BD5;">❄️ Kallt - jäsningen blir långsammare</span>';
        } else if (temp >= 20 && temp < 22) {
            feedback.innerHTML = '<span style="color: var(--green-medium);">Bra temperatur - lite långsam jäsning</span>';
        } else if (temp > 24 && temp <= 26) {
            feedback.innerHTML = '<span style="color: #FFB347;">Varmt - snabbare jäsning</span>';
        } else if (temp > 26) {
            feedback.innerHTML = '<span style="color: #FF6B6B;">🔥 Mycket varmt - risk för överjäsning!</span>';
        }
    }
}

/**
 * Sync temperature slider with number input
 */
function syncTemperature() {
    const tempSlider = document.getElementById('temperatureSlider');
    const tempInput = document.getElementById('temperature');

    // Update feedback on load
    updateTemperatureFeedback(tempInput.value);

    tempSlider.addEventListener('input', function() {
        tempInput.value = this.value;
        updateTemperatureFeedback(this.value);
        calculateTime();
    });

    tempInput.addEventListener('input', function() {
        tempSlider.value = this.value;
        updateTemperatureFeedback(this.value);
        calculateTime();
    });

    // Also update on blur for validation
    tempInput.addEventListener('blur', function() {
        updateTemperatureFeedback(this.value);
    });
}

/**
 * Setup auto-calculate when any input changes (debounced for performance)
 */
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

    // Advanced selects
    const selects = ['flourType', 'feedingRatio', 'peakStatus', 'autolyse'];
    selects.forEach(selectId => {
        const element = document.getElementById(selectId);
        if (element) {
            element.addEventListener('change', debouncedCalculate);
        }
    });

    // Advanced toggle
    const advancedToggle = document.getElementById('advancedToggle');
    if (advancedToggle) {
        advancedToggle.addEventListener('change', toggleAdvanced);
    }

    // Flour type change handler
    document.getElementById('flourType').addEventListener('change', function() {
        const wholeGrainGroup = document.getElementById('wholeGrainGroup');
        if (this.value === 'mixed') {
            wholeGrainGroup.style.display = 'block';
            updateWholeGrainPercent();
        } else {
            wholeGrainGroup.style.display = 'none';
        }
    });
}

/**
 * Setup editable hydration with toggle lock - New Design 2.0
 * - Toggle switch to lock/unlock hydration
 * - When locked: changing flour/water adjusts the other to maintain hydration
 * - When unlocked: flour and water are independent, hydration is calculated
 * - Help tooltip for first-time users
 */
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

    // Track lock state and update flags
    // ALWAYS start unlocked - lock state does NOT persist between sessions
    let isHydrationLocked = false;
    let isUpdating = false;

    // Check if user has seen the help tooltip
    const hasSeenHelp = localStorage.getItem('hydrationHelpSeen') === 'true';

    // Update visual state based on lock status
    function updateLockVisuals() {
        const lockButtonText = document.getElementById('lockButtonText');

        // Explicitly set aria-checked as string for CSS selector
        lockToggle.setAttribute('aria-checked', isHydrationLocked ? 'true' : 'false');

        // Debug logging
        console.log('🔄 Toggle state updated:', isHydrationLocked ? 'LOCKED (red)' : 'UNLOCKED (green)');
        console.log('   aria-checked:', lockToggle.getAttribute('aria-checked'));

        if (isHydrationLocked) {
            // Locked state - RED toggle, "Lås upp hydrering" text
            if (lockButtonText) {
                lockButtonText.textContent = 'Lås upp hydrering';
            }
            lockToggle.setAttribute('aria-label', 'Lås upp hydrering för att redigera mjöl och vatten oberoende');
            lockStatusText.innerHTML = '<span class="status-locked">🔒 Låst - Mjöl och vatten justeras automatiskt</span>';
        } else {
            // Unlocked state - GREEN toggle, "Lås hydrering" text
            if (lockButtonText) {
                lockButtonText.textContent = 'Lås hydrering';
            }
            lockToggle.setAttribute('aria-label', 'Lås hydrering för att automatiskt justera mjöl och vatten');
            lockStatusText.innerHTML = '<span class="status-unlocked">🔓 Olåst - Mjöl och vatten är oberoende</span>';
        }
    }

    // Initialize visuals
    updateLockVisuals();

    // Show help tooltip on first visit
    if (!hasSeenHelp && helpTooltip) {
        setTimeout(() => {
            helpTooltip.style.display = 'block';
        }, 1000);
    }

    // Toggle lock when clicking toggle switch
    lockToggle.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('🖱️ Toggle clicked! Current state:', isHydrationLocked);
        isHydrationLocked = !isHydrationLocked;
        console.log('   New state:', isHydrationLocked);
        // Note: Lock state is NOT saved to localStorage - always resets to unlocked on page load
        updateLockVisuals();

        const status = isHydrationLocked ? 'låst' : 'olåst';
        announceToScreenReader(`Hydrering ${status}. ${isHydrationLocked ? 'Mjöl och vatten justeras nu automatiskt för att bibehålla hydreringen.' : 'Du kan nu ändra mjöl och vatten oberoende.'}`);
    });

    // Help icon click - show tooltip
    if (helpIcon && helpTooltip) {
        helpIcon.addEventListener('click', function(e) {
            e.preventDefault();
            const isVisible = helpTooltip.style.display === 'block';
            helpTooltip.style.display = isVisible ? 'none' : 'block';
        });
    }

    // Close tooltip
    if (tooltipClose && helpTooltip) {
        tooltipClose.addEventListener('click', function() {
            helpTooltip.style.display = 'none';
            localStorage.setItem('hydrationHelpSeen', 'true');
        });
    }

    // Show feedback helper function
    function showFeedback() {
        if (hydrationFeedback) {
            hydrationFeedback.classList.add('show');
            setTimeout(() => {
                hydrationFeedback.classList.remove('show');
            }, 1500);
        }
    }

    // When hydration percentage is changed, update water amount
    hydrationInput.addEventListener('input', function() {
        if (isUpdating) return;

        const flour = parseFloat(flourInput.value) || 0;
        const hydration = parseFloat(this.value) || 0;

        if (flour > 0 && hydration >= 50 && hydration <= 120) {
            const newWater = Math.round(flour * (hydration / 100));

            isUpdating = true;
            waterInput.value = newWater;
            showFeedback();

            updateRecipeSummary();
            calculateTime();
            announceToScreenReader(`Vattenmängd uppdaterad till ${newWater} gram baserat på ${hydration}% hydrering.`);

            setTimeout(() => {
                isUpdating = false;
            }, 100);
        }
    });

    // When flour is changed and hydration is locked, adjust water
    flourInput.addEventListener('input', function() {
        if (!isHydrationLocked || isUpdating) return;

        const flour = parseFloat(this.value) || 0;
        const hydration = parseFloat(hydrationInput.value) || 0;

        if (flour > 0 && hydration > 0) {
            const newWater = Math.round(flour * (hydration / 100));

            isUpdating = true;
            waterInput.value = newWater;
            showFeedback();

            setTimeout(() => {
                isUpdating = false;
            }, 50);
        }
    });

    // When water is changed and hydration is locked, adjust flour
    waterInput.addEventListener('input', function() {
        if (!isHydrationLocked || isUpdating) return;

        const water = parseFloat(this.value) || 0;
        const hydration = parseFloat(hydrationInput.value) || 0;

        if (water > 0 && hydration > 0) {
            const newFlour = Math.round(water / (hydration / 100));

            isUpdating = true;
            flourInput.value = newFlour;
            showFeedback();

            setTimeout(() => {
                isUpdating = false;
            }, 50);
        }
    });

    // Handle Enter key
    hydrationInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            this.blur();
        }
    });
}

/**
 * Setup keyboard navigation for accessibility
 */
function setupKeyboardNavigation() {
    // Escape key to close advanced settings
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' || e.key === 'Esc') {
            const advancedToggle = document.getElementById('advancedToggle');
            const advancedSection = document.getElementById('advancedSection');

            if (advancedToggle && advancedToggle.checked && advancedSection) {
                advancedToggle.checked = false;
                advancedSection.classList.remove('show');
                announceToScreenReader('Avancerade inställningar stängda med Escape.');
                advancedToggle.focus(); // Return focus to toggle
            }
        }
    });

    // Enter key on number inputs to move to next field
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

/**
 * Initialize application
 */
function init() {
    // Sync temperature controls
    syncTemperature();

    // Setup auto-calculate
    setupAutoCalculate();

    // Setup editable hydration
    setupEditableHydration();

    // Setup keyboard navigation
    setupKeyboardNavigation();

    // Calculate on load with default values
    updateRecipeSummary();
    calculateTime();

    // Setup timer button
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

    // Hide whole grain group initially if not mixed flour
    const flourType = document.getElementById('flourType');
    if (flourType && flourType.value !== 'mixed') {
        document.getElementById('wholeGrainGroup').style.display = 'none';
    }

    // Setup beforeunload cleanup for timer
    window.addEventListener('beforeunload', () => {
        if (SourdoughApp.timerInterval) {
            clearInterval(SourdoughApp.timerInterval);
            SourdoughApp.timerInterval = null;
        }
    });

    // Track calculator usage
    const originalCalculateTime = calculateTime;
    window.calculateTime = function() {
        originalCalculateTime();
        trackCalculatorUsed();
    };

    // Initialize FAQ accordion
    initFAQ();

    // Initialize Action Card badges based on user preferences
    initializeActionCardBadges();
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

/**
 * Tab switching function
 */
function switchTab(tabName) {
    // Hide all tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    // Remove active class from all tab buttons
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
        button.setAttribute('aria-selected', 'false');
    });

    // Show selected tab content
    const tabContent = document.getElementById(`${tabName}-tab`);
    const tabButton = document.getElementById(`${tabName}-tab-button`);

    if (tabContent) tabContent.classList.add('active');
    if (tabButton) {
        tabButton.classList.add('active');
        tabButton.setAttribute('aria-selected', 'true');
    }

    // Announce to screen readers
    const tabNames = {
        'calculator': 'Jästningsberäknare',
        'troubleshoot': 'Felsök ditt bröd'
    };
    announceToScreenReader(`${tabNames[tabName]} vald`);
}

/**
 * Troubleshooting diagnosis function
 */
function showTroubleshootingForm(problemType) {
    const resultDiv = document.getElementById('diagnosis-result');

    if (!problemType) {
        resultDiv.style.display = 'none';
        return;
    }

    const diagnoses = {
        'flat': {
            title: '📏Platt bröd / ingen oven spring',
            causes: [
                '⚠️För svag surdegsstart (VANLIGASTE ORSAKEN!)',
                'Överjäst deg - jäste för länge',
                'För lite ånga under gräddning',
                'För få vikningar under bulkjäsning',
                'För låg ugnstemperatur',
                'Glömde snitta brödet',
                'Degen formades för löst'
            ],
            solutions: [
                '💪<strong>Starkare surdegsstart (FIX DETTA FÖRST!)</strong> - Mata 1:5:5 dagligen i 3-5 dagar. Din surdeg ska dubblas på 4-6h och flyta i vatten (flyttest). Använd vid peak!',
                '💨<strong>Mer ånga!</strong> - Dutch oven: släng in 3-4 isbitar när du lägger i brödet. Öppen bakning: häll 1 dl vatten på en het plåt längst ner i ugnen',
                '🙌<strong>Fler vikningar</strong> - gör 4-5 stretch & folds under bulkjäsningen för att bygga styrka',
                '⏱️<strong>Korta ner bulkjäsningen</strong> - använd kalkylatorn och fingertestet',
                '🔥<strong>Högre temperatur</strong> - 250°C och förvärm i 60 min',
                '🔪<strong>Snitta djupare</strong> - använd riktigt vass snittkniv',
                '🙌<strong>Forma tightare</strong> - bygg mer ytspänning vid formning'
            ],
            starterCheck: {
                title: '⚠️Är din surdegsstart tillräckligt stark?',
                strong: [
                    'Dubblad på 4-6 timmar efter matning',
                    'Många bubblor på ytan',
                    'Flyter i vatten (flyttest)',
                    'Doftar fruktigt/syrligt (inte illa)'
                ],
                weak: [
                    'Dubbleras INTE inom 6-8h',
                    'Få eller inga bubblor',
                    'Sjunker i vatten',
                    'Obehaglig lukt eller hooch (vattenskikt)'
                ],
                fix: 'Mata 1:5:5 (1 del surdeg : 5 delar vatten : 5 delar mjöl) varje dag vid 24-26°C tills den är stark'
            }
        },
        'spread': {
            title: '🌊Spretig form (degen rann ut)',
            causes: [
                'För lite glutenutveckling (för få vikningar)',
                'För hög hydrering',
                'Mjöl med låg proteinhalt',
                'Överjäst',
                'Formades för löst'
            ],
            solutions: [
                '🙌<strong>Arbeta mer med vikningarna!</strong> - Gör 4-5 stretch & folds under bulkjäsningen. Detta bygger styrka i degen så den håller formen bättre',
                '🌾<strong>Högre proteinhalt</strong> - Byt till mjöl med minst 12% protein (t.ex. Manitoba, starkt brödjöl). Lågt protein = svagare glutennätverk',
                '💧<strong>Sänk hydreringen</strong> - Om vikningar inte hjälper, prova 5% mindre vatten',
                '⏱️<strong>Korta jästiden</strong> - överjäst deg tappar struktur',
                '🙌<strong>Tight formning</strong> - bygg stark ytspänning',
                '❄️<strong>Kalljäsning</strong> - gör degen fastare och lättare att hantera'
            ]
        },
        'dense': {
            title: '🕳️För tätt / inga hål / kompakt',
            causes: [
                '⚠️Svag eller inaktiv surdegsstart (VANLIGASTE ORSAKEN!)',
                'Underjäst - jäste för kort tid',
                'För lite surdegsstart (under 15%)',
                'För låg temperatur',
                'För mycket knådning/vikningar'
            ],
            solutions: [
                '💪<strong>Starkare surdegsstart (FIX DETTA FÖRST!)</strong> - 90% av alla täta bröd beror på svag surdeg! Mata 1:5:5 dagligen. Surdegen ska dubblas på 4-6h och flyta i vatten.',
                '⏱️<strong>Längre bulkjäsning</strong> - degen ska växa 50-75% (men funkar inte om surdegen är svag!)',
                '📊<strong>Mer surdeg</strong> - prova 20-25% surdegsandel',
                '🌡️<strong>Varmare miljö</strong> - sikta på 24-26°C',
                '🙌<strong>Färre vikningar</strong> - max 3-4 för vitt mjöl'
            ],
            starterCheck: {
                title: '⚠️Är din surdegsstart tillräckligt stark?',
                strong: [
                    'Dubblad på 4-6 timmar efter matning',
                    'Många bubblor på ytan',
                    'Flyter i vatten (flyttest)',
                    'Doftar fruktigt/syrligt (inte illa)'
                ],
                weak: [
                    'Dubbleras INTE inom 6-8h',
                    'Få eller inga bubblor',
                    'Sjunker i vatten',
                    'Obehaglig lukt eller hooch (vattenskikt)'
                ],
                fix: 'Mata 1:5:5 (1 del surdeg : 5 delar vatten : 5 delar mjöl) varje dag vid 24-26°C tills den är stark'
            }
        },
        'too-open': {
            title: '🎈För luftigt / jättehål',
            causes: [
                'För få vikningar',
                'För hög hydrering',
                'Överjäst',
                'Luftfickor vid formning'
            ],
            solutions: [
                '🙌<strong>Fler vikningar</strong> - gör 4-5 stretch & folds',
                '💧<strong>Lägre hydrering</strong> - sänk med 5%',
                '⏱️<strong>Titta på jästtiden</strong> - överjäst ger ojämna hål',
                '🙌<strong>Bättre formning</strong> - få ut luften försiktigt'
            ]
        },
        'burnt': {
            title: '🔥Bränd skorpa',
            causes: [
                'För hög temperatur',
                'För lång gräddningstid',
                'Glömde sänka temperaturen',
                'För mycket socker/mjöl på ytan'
            ],
            solutions: [
                '🌡️<strong>Sänk temperaturen</strong> - 230°C efter första 20 min',
                '⏱️<strong>Kortare tid</strong> - kolla efter 35-40 min totalt',
                '🔥<strong>Dutch oven</strong> - ta av locket efter 20 min',
                '🧂<strong>Mindre mjöl</strong> - borsta av överskott före gräddning'
            ]
        },
        'gummy': {
            title: '🥖Gummiartat / rått inuti',
            causes: [
                'Inte färdiggräddat',
                'För hög hydrering',
                'Överjäst',
                'Skar för tidigt'
            ],
            solutions: [
                '🌡️<strong>Grädda längre</strong> - använd termometer, 95-98°C inuti',
                '💧<strong>Lägre hydrering</strong> - prova 70-75%',
                '⏱️<strong>Korta jästningen</strong> - överjäst ger gummigt',
                '⏱️<strong>Vänta med att skära</strong> - låt svalna i 1-2h först'
            ]
        },
        'no-ear': {
            title: '👂Inget öra på brödet',
            causes: [
                '🔪Slö kniv eller rakblad (VANLIGASTE ORSAKEN!)',
                'Fel vinkel på skårningen (ska vara 30-45°, inte rakt ned)',
                'För djup eller för grund skårning',
                'Överjäst deg',
                'För lite ånga',
                'För låg ugnstemperatur',
                'Degen inte tillräckligt spänd vid formning'
            ],
            solutions: [
                '🔪<strong>Vass kniv (VIKTIGAST!)</strong> - använd snittkniv med rakblad eller mycket vass kniv. Byt blad ofta! Ett slött blad drar i degen istället för att skära rent',
                '📐<strong>Rätt vinkel</strong> - skåra i 30-45° vinkel mot brödet, INTE rakt ned. Håll kniven nästan vågrät och skär en "hylla" i degen',
                '📏<strong>Rätt djup</strong> - skåra 1-1.5cm djupt, inte djupare',
                '⏱️<strong>Rätt jästningstid</strong> - överjäst deg ger inget öra. Använd kalkylatorn och fingertestet',
                '💨<strong>Mer ånga!</strong> - Dutch oven med isbitar, eller häll 1dl vatten på het plåt',
                '🔥<strong>Högre temp</strong> - 250°C och förvärm minst 60 min',
                '🙌<strong>Tight formning</strong> - spänn degen ordentligt när du formar den'
            ]
        },
        'bland': {
            title: '😐Svag smak / smaklöst',
            causes: [
                'För lite salt',
                'För kort jästning',
                'Ingen kalljäsning (mjölksyran får inte utvecklas)',
                'Ung surdegsstart'
            ],
            solutions: [
                '🧂<strong>Mer salt</strong> - använd 2% (20g per 1000g mjöl)',
                '❄️<strong>Kalljäsning (BÄSTA SMAKTRICKET!)</strong> - Kalljäs den formade degen i 12-24h. Detta låter mjölksyrabakterierna arbeta långsamt och utveckla komplex, god smak',
                '⏱️<strong>Längre bulkjäsning</strong> - mer tid vid rumstemperatur = mer smak',
                '💪<strong>Mogen surdeg</strong> - använd surdeg vid peak för bäst smak',
                '🌾<strong>Prova surdegsbröd med fullkorn</strong> - ger mer smak än rent vitt mjöl'
            ]
        },
        'sour': {
            title: '🍋För surt',
            causes: [
                'Överjäst',
                'För lång kalljäsning',
                'För varm miljö',
                'Gammal/sur surdegsstart'
            ],
            solutions: [
                '⏱️<strong>Korta jästningen</strong> - överjäst = surare',
                '❄️<strong>Kortare kalljäsning</strong> - max 12-16h',
                '🌡️<strong>Kallare miljö</strong> - 20-22°C istället för 26°C',
                '💪<strong>Fräsch surdeg</strong> - mata oftare, använd vid peak'
            ]
        },
        'crust': {
            title: '❌Problem med skorpan',
            causes: [
                'För lite eller för mycket ånga',
                'Fel temperatur',
                'För tidigt eller sent avslöjning'
            ],
            solutions: [
                '💨<strong>Rätt ånga</strong> - 15-20 min med ånga, sedan utan',
                '🔥<strong>Hög start-temp</strong> - 250°C första 20 min',
                '🔥<strong>Dutch oven</strong> - perfekt för nybörjare',
                '⏱️<strong>Rätt timing</strong> - ta av lock/ånga efter 20 min'
            ]
        }
    };

    const diagnosis = diagnoses[problemType];
    if (!diagnosis) return;

    // Build starter check section if it exists
    let starterCheckHTML = '';
    if (diagnosis.starterCheck) {
        starterCheckHTML = `
            <div style="background: linear-gradient(135deg, #fff5e6 0%, #ffe8cc 100%);
                        border: 3px solid #ff9933;
                        border-radius: var(--radius-sm);
                        padding: var(--space-3);
                        margin: var(--space-4) 0;
                        box-shadow: var(--shadow-sm);">
                <h4 style="color: #d97706; font-size: var(--text-base); margin: 0 0 var(--space-2) 0; font-weight: 700;">
                    ${diagnosis.starterCheck.title}
                </h4>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-3); margin-bottom: var(--space-2);">
                    <div>
                        <strong style="color: var(--green-dark); display: block; margin-bottom: var(--space-1); display: flex; align-items: center; gap: 4px;">✅ Stark surdeg:</strong>
                        <ul style="margin-left: var(--space-4); font-size: var(--text-sm); color: var(--green-dark); line-height: 1.6;">
                            ${diagnosis.starterCheck.strong.map(item => `<li>${item}</li>`).join('')}
                        </ul>
                    </div>
                    <div>
                        <strong style="color: var(--green-dark); display: block; margin-bottom: var(--space-1); display: flex; align-items: center; gap: 4px;">❌ Svag surdeg:</strong>
                        <ul style="margin-left: var(--space-4); font-size: var(--text-sm); color: var(--green-dark); line-height: 1.6;">
                            ${diagnosis.starterCheck.weak.map(item => `<li>${item}</li>`).join('')}
                        </ul>
                    </div>
                </div>
                <div style="background: rgba(255, 255, 255, 0.7); padding: var(--space-2); border-radius: 4px; border-left: 3px solid #ff9933;">
                    <strong style="color: var(--green-dark); font-size: var(--text-sm); display: inline-flex; align-items: center; gap: 4px;">🚀 Fix: </strong>
                    <span style="color: var(--green-dark); font-size: var(--text-sm);">${diagnosis.starterCheck.fix}</span>
                </div>
            </div>
        `;
    }

    resultDiv.innerHTML = `
        <div class="recipe-card" style="margin-bottom: var(--space-4);">
            <h3 style="color: var(--green-dark); font-size: var(--text-xl); margin-bottom: var(--space-3);">
                ${diagnosis.title}
            </h3>

            <h4 style="color: var(--green-dark); font-size: var(--text-base); margin: var(--space-3) 0 var(--space-2) 0; font-weight: 700;">
                Troliga orsaker:
            </h4>
            <ul style="margin-left: var(--space-5); line-height: 1.8; color: var(--green-medium);">
                ${diagnosis.causes.map(cause => `<li>${cause}</li>`).join('')}
            </ul>

            ${starterCheckHTML}

            <h4 style="color: var(--green-dark); font-size: var(--text-base); margin: var(--space-4) 0 var(--space-2) 0; font-weight: 700; display: flex; align-items: center; gap: var(--space-2);">
                💡 Så här fixar du det:
            </h4>
            <ul style="margin-left: var(--space-5); line-height: 2; color: var(--green-dark);">
                ${diagnosis.solutions.map(solution => `<li>${solution}</li>`).join('')}
            </ul>
        </div>
    `;

    resultDiv.style.display = 'block';
    resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * USER JOURNEY SELECTION - Adaptive routing based on user type
 */

/**
 * Show toast notification for actions
 */
function showActionToast(message, duration = 3500) {
    const existingToast = document.querySelector('.action-toast');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = 'action-toast';
    toast.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        background: var(--green-dark);
        color: white;
        padding: var(--space-3) var(--space-4);
        border-radius: var(--radius-md);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
        display: flex;
        align-items: center;
        gap: var(--space-2);
        font-size: var(--text-base);
        font-weight: 600;
        z-index: 1000;
        animation: slideInUp 0.3s ease, fadeOut 0.3s ease ${duration - 300}ms;
    `;

    const emojiText = typeof message === 'object' ? message : { emoji: '✓', text: message };
    toast.innerHTML = `<span style="font-size: 24px;">${emojiText.emoji || '✓'}</span> <span>${emojiText.text || message}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, duration);
}

/**
 * Track journey usage in history
 */
function trackJourneyUsage(journeyType) {
    try {
        const history = JSON.parse(localStorage.getItem('userJourneyHistory') || '{}');
        history[journeyType] = (history[journeyType] || 0) + 1;
        localStorage.setItem('userJourneyHistory', JSON.stringify(history));

        localStorage.setItem('userJourney', journeyType);
        localStorage.setItem('userJourneyTimestamp', Date.now());
    } catch (e) {
        console.error('Error tracking journey usage:', e);
    }
}

/**
 * Get journey statistics
 */
function getJourneyStats() {
    try {
        const history = JSON.parse(localStorage.getItem('userJourneyHistory') || '{}');
        const lastUsed = localStorage.getItem('userJourney');
        const lastTimestamp = parseInt(localStorage.getItem('userJourneyTimestamp') || '0');

        return { history, lastUsed, lastTimestamp };
    } catch (e) {
        console.error('Error getting journey stats:', e);
        return { history: {}, lastUsed: null, lastTimestamp: 0 };
    }
}

/**
 * Option 1: Timer Only (Experienced Bakers)
 */
window.chooseTimerOnly = function() {
    if (typeof startTimer === 'function') {
        startTimer();

        setTimeout(() => {
            const timeCard = document.querySelector('.time-card');
            if (timeCard) {
                timeCard.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }, 100);

        showActionToast({
            emoji: '⏰',
            text: 'Timer startad! Tips: Du kan skapa schema i nästa flik.'
        });

        trackJourneyUsage('timer-only');

        announceToScreenReader('Timer startad. Du kan skapa ett detaljerat schema i Skapa bakschema-fliken om du vill.');
    }
}

/**
 * Option 2: Full Schedule (Beginners)
 */
window.chooseFullSchedule = function() {
    if (typeof switchTab === 'function') {
        switchTab('schedule');
    }

    // Scroll to top immediately after tab switch
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });

    setTimeout(() => {
        // CRITICAL: Initialize time input if empty (for default values)
        const timeInput = document.getElementById('scheduleTime');
        if (timeInput && !timeInput.value) {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            timeInput.value = `${hours}:${minutes}`;
        }

        // CRITICAL: Auto-calculate if not done yet (works with default values!)
        if (!SourdoughApp.calculatedTime) {
            const flour = parseFloat(document.getElementById('flour')?.value);
            const water = parseFloat(document.getElementById('water')?.value);
            if (flour && water && typeof calculateTime === 'function') {
                calculateTime(); // Calculate with existing values (even defaults)
            }
        }

        const calculatedRadio = document.querySelector('input[name="scheduleDataSource"][value="calculated"]');
        if (calculatedRadio) {
            calculatedRadio.checked = true;
        }

        if (typeof window.generateBakingSchedule === 'function') {
            window.generateBakingSchedule(true);
        }

        showActionToast({
            emoji: '📅',
            text: 'Schema genererat! Bocka av stegen när du är klar.'
        }, 4000);

        trackJourneyUsage('full-schedule');

        announceToScreenReader('Bakschema skapat. Du kan bocka av varje steg när du har genomfört det.');
    }, 300);
}

/**
 * Option 3: Plan Backward (Time-based Planning)
 */
window.choosePlanBackward = function() {
    if (typeof switchTab === 'function') {
        switchTab('schedule');
    }

    // Scroll to top immediately after tab switch
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });

    setTimeout(() => {
        // CRITICAL: Initialize time input if empty (for default values)
        const timeInput = document.getElementById('scheduleTime');
        if (timeInput && !timeInput.value) {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            timeInput.value = `${hours}:${minutes}`;
        }

        // CRITICAL: Auto-calculate if not done yet (works with default values!)
        if (!SourdoughApp.calculatedTime) {
            const flour = parseFloat(document.getElementById('flour')?.value);
            const water = parseFloat(document.getElementById('water')?.value);
            if (flour && water && typeof calculateTime === 'function') {
                calculateTime(); // Calculate with existing values (even defaults)
            }
        }

        const backwardRadio = document.querySelector('input[name="timeDirection"][value="backward"]');
        if (backwardRadio) {
            backwardRadio.checked = true;

            if (typeof window.toggleTimeDirection === 'function') {
                window.toggleTimeDirection();
            }
        }

        // Reuse timeInput from above (already declared at line 1138)
        if (timeInput) {
            timeInput.focus();
            timeInput.style.boxShadow = '0 0 0 4px rgba(212, 165, 116, 0.3)';
            setTimeout(() => {
                timeInput.style.boxShadow = '';
            }, 2000);
        }

        showActionToast({
            emoji: '🎯',
            text: 'Ange när brödet ska vara klart, så beräknar vi starttiden!'
        }, 4500);

        trackJourneyUsage('backward-planning');

        announceToScreenReader('Planera bakåt-läge aktiverat. Ange när du vill att brödet ska vara färdigt.');
    }, 300);
}

/**
 * Initialize Action Card with user preference badges
 */
function initializeActionCardBadges() {
    const { history, lastUsed, lastTimestamp } = getJourneyStats();

    // Don't show badges if no history
    if (!lastUsed || Object.keys(history).length === 0) {
        return;
    }

    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    const isRecent = lastTimestamp > sevenDaysAgo;

    // Map journey types to button IDs
    const journeyMap = {
        'timer-only': 'timerOnlyOption',
        'full-schedule': 'fullScheduleOption',
        'backward-planning': 'backwardPlanningOption'
    };

    // "Senast använd" badge removed per user request
    // (Keeping code commented in case feature is needed later)
    /*
    if (isRecent && journeyMap[lastUsed]) {
        const button = document.getElementById(journeyMap[lastUsed]);
        if (button) {
            if (!button.querySelector('.last-used-badge')) {
                const badge = document.createElement('div');
                badge.className = 'last-used-badge';
                badge.style.cssText = `
                    position: absolute;
                    top: -8px;
                    left: -8px;
                    background: linear-gradient(135deg, var(--warm-accent), #e0a577);
                    color: white;
                    padding: 4px 10px;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: 700;
                    box-shadow: 0 2px 8px rgba(212, 165, 116, 0.4);
                    z-index: 1;
                    animation: fadeIn 0.3s ease;
                `;
                badge.textContent = 'Senast använd';
                button.style.position = 'relative';
                button.appendChild(badge);
            }
        }
    }
    */

    // Find most used journey
    let mostUsed = null;
    let maxCount = 0;
    for (const [journey, count] of Object.entries(history)) {
        if (count > maxCount) {
            maxCount = count;
            mostUsed = journey;
        }
    }

    // Add subtle glow to most used option (if it has been used at least 3 times and is clearly preferred)
    if (mostUsed && maxCount >= 3 && journeyMap[mostUsed]) {
        const totalUsage = Object.values(history).reduce((sum, count) => sum + count, 0);
        const preferenceRatio = maxCount / totalUsage;

        // Only highlight if this option is used >50% of the time
        if (preferenceRatio > 0.5) {
            const button = document.getElementById(journeyMap[mostUsed]);
            if (button) {
                button.style.animation = 'subtleGlow 3s ease-in-out infinite';
            }
        }
    }
}

// Export for external use (e.g., inline scripts)
window.calculateTime = calculateTime;
window.updateWholeGrainPercent = updateWholeGrainPercent;
window.startTimer = startTimer;
window.stopTimer = stopTimer;
window.resumeTimer = resumeTimer;
window.restartTimer = restartTimer;
window.switchTab = switchTab;
window.showTroubleshootingForm = showTroubleshootingForm;
