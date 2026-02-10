/**
 * Main application orchestrator
 * Initializes and coordinates all modules
 */

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
import { initBeginnerGuide } from './beginner-guide/guide.js';

/**
 * Debounce function for performance optimization
 */
function debounce(func: Function, delay: number): (...args: any[]) => void {
    let timeoutId: number;
    return function(this: any, ...args: any[]) {
        clearTimeout(timeoutId);
        timeoutId = window.setTimeout(() => func.apply(this, args), delay);
    };
}

/**
 * Switch between tabs (calculator, schedule, troubleshoot, tips)
 */
function switchTab(tabName: string): void {
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
    const tabNames: { [key: string]: string } = {
        'calculator': 'Jästningsberäknare',
        'guide': 'Nybörjarguide',
        'schedule': 'Skapa bakschema',
        'troubleshoot': 'Felsök ditt bröd',
        'tips': 'Tips och råd'
    };

    if (tabNames[tabName]) {
        announceToScreenReader(`${tabNames[tabName]} vald`);
    }
}

/**
 * Show action toast notification
 */
function showActionToast(message: { emoji: string; text: string } | string, duration: number = 3500): void {
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
 * Track user journey usage
 */
function trackJourneyUsage(journeyType: string): void {
    try {
        const history = JSON.parse(localStorage.getItem('userJourneyHistory') || '{}');
        history[journeyType] = (history[journeyType] || 0) + 1;
        localStorage.setItem('userJourneyHistory', JSON.stringify(history));

        localStorage.setItem('userJourney', journeyType);
        localStorage.setItem('userJourneyTimestamp', Date.now().toString());
    } catch (e) {
        console.error('Error tracking journey usage:', e);
    }
}

/**
 * User chose "Timer Only" journey
 */
function chooseTimerOnly(): void {
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

/**
 * User chose "Full Schedule" journey
 */
function chooseFullSchedule(): void {
    switchTab('schedule');

    // Scroll to top immediately after tab switch
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });

    setTimeout(() => {
        // Initialize time input if empty
        const timeInput = document.getElementById('scheduleTime') as HTMLInputElement | null;
        if (timeInput && !timeInput.value) {
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            timeInput.value = `${hours}:${minutes}`;
        }

        // Auto-calculate if not done yet
        if (!SourdoughApp.calculatedTime) {
            const flour = parseFloat((document.getElementById('flour') as HTMLInputElement | null)?.value || '');
            const water = parseFloat((document.getElementById('water') as HTMLInputElement | null)?.value || '');
            if (flour && water) {
                calculateTime();
            }
        }

        const calculatedRadio = document.querySelector('input[name="scheduleDataSource"][value="calculated"]') as HTMLInputElement | null;
        if (calculatedRadio) {
            calculatedRadio.checked = true;
        }

        if (typeof (window as any).generateBakingSchedule === 'function') {
            (window as any).generateBakingSchedule(true);
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
 * Show loading indicator
 */
function showLoadingIndicator(): void {
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
    if (!loadingDiv.parentElement && resultDiv.parentNode) {
        resultDiv.parentNode.insertBefore(loadingDiv, resultDiv);
    }

    // Fade out result section
    resultDiv.style.opacity = '0.5';
    resultDiv.style.pointerEvents = 'none';
}

/**
 * Hide loading indicator
 */
function hideLoadingIndicator(): void {
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
function calculateTime(): void {
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
function calculateTimeInternal(): void {
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

        // Announce error to screen readers
        const errorMessage = error instanceof Error ? error.message : 'Ett fel uppstod';
        announceToScreenReader(`Fel: ${errorMessage}`);
    } finally {
        // Always hide loading indicator when done
        hideLoadingIndicator();
    }
}

/**
 * Main display function
 * Orchestrates all display helper functions to show results
 */
function displayResults(
    time: number,
    minTime: number,
    maxTime: number,
    temp: number,
    starterPercent: number,
    hydration: number,
    _saltPercent: number,
    flour: number,
    water: number,
    starter: number,
    salt: number,
    coldProof: number,
    fridgeTemp: number,
    coldProofEquivalent: number,
    bulkAdjustment: number
): void {
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
    const currentNumLoaves = parseFloat((document.getElementById('numLoaves') as HTMLInputElement | null)?.value || '1') || 1;

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

    // Announce to screen readers
    const { hours, minutes } = formatHoursMinutes(time);
    announceToScreenReader(`Beräkning klar. Rekommenderad jästid är ${hours} timmar och ${minutes} minuter.`);

    // Update schedule folds recommendation if function is available
    if (typeof (window as any).updateFoldsRecommendation === 'function') {
        (window as any).updateFoldsRecommendation();
    }
}

/**
 * Toggle advanced settings
 */
function toggleAdvanced(): void {
    const checkbox = document.getElementById('advancedToggle') as HTMLInputElement | null;
    const section = document.getElementById('advancedSection');

    if (!checkbox || !section) return;

    if (checkbox.checked) {
        section.classList.add('show');

        // Move focus to first input in advanced section for keyboard users
        setTimeout(() => {
            const firstInput = section.querySelector('select, input') as HTMLElement | null;
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
function updateTemperatureFeedback(temp: number): void {
    const feedback = document.getElementById('tempFeedback');
    const slider = document.getElementById('temperatureSlider') as HTMLInputElement | null;

    if (!feedback || !slider) return;

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
function syncTemperature(): void {
    const tempSlider = document.getElementById('temperatureSlider') as HTMLInputElement | null;
    const tempInput = document.getElementById('temperature') as HTMLInputElement | null;

    if (!tempSlider || !tempInput) return;

    // Update feedback on load
    updateTemperatureFeedback(parseFloat(tempInput.value));

    tempSlider.addEventListener('input', function() {
        tempInput.value = this.value;
        updateTemperatureFeedback(parseFloat(this.value));
        calculateTime();
    });

    tempInput.addEventListener('input', function() {
        tempSlider.value = this.value;
        updateTemperatureFeedback(parseFloat(this.value));
        calculateTime();
    });

    // Also update on blur for validation
    tempInput.addEventListener('blur', function() {
        updateTemperatureFeedback(parseFloat(this.value));
    });
}

/**
 * Setup auto-calculate when any input changes (debounced for performance)
 */
function setupAutoCalculate(): void {
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
    const flourType = document.getElementById('flourType');
    if (flourType) {
        flourType.addEventListener('change', function(this: HTMLSelectElement) {
            const wholeGrainGroup = document.getElementById('wholeGrainGroup');
            if (wholeGrainGroup) {
                if (this.value === 'mixed') {
                    wholeGrainGroup.style.display = 'block';
                    updateWholeGrainPercent();
                } else {
                    wholeGrainGroup.style.display = 'none';
                }
            }
        });
    }
}

/**
 * Setup editable hydration with toggle lock
 */
function setupEditableHydration(): void {
    const hydrationInput = document.getElementById('hydrationInput') as HTMLInputElement | null;
    const waterInput = document.getElementById('water') as HTMLInputElement | null;
    const flourInput = document.getElementById('flour') as HTMLInputElement | null;
    const hydrationFeedback = document.getElementById('hydrationFeedback');
    const lockToggle = document.getElementById('hydrationLockToggle');
    const lockStatusText = document.getElementById('lockStatusText');
    const helpIcon = document.querySelector('.help-icon') as HTMLElement | null;
    const helpTooltip = document.getElementById('hydrationHelpTooltip');
    const tooltipClose = document.querySelector('.tooltip-close') as HTMLElement | null;

    if (!hydrationInput || !waterInput || !flourInput || !lockToggle) {
        console.warn('Hydration lock setup failed - missing elements');
        return;
    }

    console.log('✅ Hydration lock 2.0 initialized successfully!');

    // Track lock state and update flags
    // ALWAYS start unlocked - lock state does NOT persist between sessions
    let isHydrationLocked = false;
    let isUpdating = false;

    // Update visual state based on lock status
    function updateLockVisuals(): void {
        const lockButtonText = document.getElementById('lockButtonText');

        if (!lockToggle) return;

        // Explicitly set aria-checked as string for CSS selector
        lockToggle.setAttribute('aria-checked', isHydrationLocked ? 'true' : 'false');

        console.log('🔄 Toggle state updated:', isHydrationLocked ? 'LOCKED (red)' : 'UNLOCKED (green)');
        console.log('   aria-checked:', lockToggle.getAttribute('aria-checked'));

        if (isHydrationLocked) {
            // Locked state - RED toggle, "Lås upp hydrering" text
            if (lockButtonText) {
                lockButtonText.textContent = 'Lås upp hydrering';
            }
            lockToggle.setAttribute('aria-label', 'Lås upp hydrering för att redigera mjöl och vatten oberoende');
            if (lockStatusText) {
                lockStatusText.innerHTML = '<span class="status-locked">🔒 Låst - Mjöl och vatten justeras automatiskt</span>';
            }
        } else {
            // Unlocked state - GREEN toggle, "Lås hydrering" text
            if (lockButtonText) {
                lockButtonText.textContent = 'Lås hydrering';
            }
            lockToggle.setAttribute('aria-label', 'Lås hydrering för att automatiskt justera mjöl och vatten');
            if (lockStatusText) {
                lockStatusText.innerHTML = '<span class="status-unlocked">🔓 Olåst - Mjöl och vatten är oberoende</span>';
            }
        }
    }

    // Initialize visuals
    updateLockVisuals();

    // Note: Help tooltip is available via the help icon (?)
    // Removed auto-show to avoid clutter on page load

    // Toggle lock when clicking toggle switch
    lockToggle.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('🖱️ Toggle clicked! Current state:', isHydrationLocked);
        isHydrationLocked = !isHydrationLocked;
        console.log('   New state:', isHydrationLocked);
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
    function showFeedback(): void {
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

    // When flour is changed and hydration is locked, adjust water
    flourInput.addEventListener('input', function() {
        if (!isHydrationLocked || isUpdating) return;

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

    // When water is changed and hydration is locked, adjust flour
    waterInput.addEventListener('input', function() {
        if (!isHydrationLocked || isUpdating) return;

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
function setupKeyboardNavigation(): void {
    // Escape key to close advanced settings
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' || e.key === 'Esc') {
            const advancedToggle = document.getElementById('advancedToggle') as HTMLInputElement | null;
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
            if ((e as KeyboardEvent).key === 'Enter') {
                e.preventDefault();
                const nextInput = inputs[index + 1] as HTMLInputElement | undefined;
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
function init(): void {
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
    const flourType = document.getElementById('flourType') as HTMLSelectElement | null;
    if (flourType && flourType.value !== 'mixed') {
        const wholeGrainGroup = document.getElementById('wholeGrainGroup');
        if (wholeGrainGroup) {
            wholeGrainGroup.style.display = 'none';
        }
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
    (window as any).calculateTime = function() {
        originalCalculateTime();
        trackCalculatorUsed();
    };

    // Initialize FAQ accordion
    initFAQ();

    // Initialize Beginner Guide
    initBeginnerGuide();
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Export for external use (e.g., inline scripts)
(window as any).calculateTime = calculateTime;
(window as any).switchTab = switchTab;
(window as any).chooseTimerOnly = chooseTimerOnly;
(window as any).chooseFullSchedule = chooseFullSchedule;
(window as any).updateWholeGrainPercent = updateWholeGrainPercent;
(window as any).startTimer = startTimer;
(window as any).stopTimer = stopTimer;
(window as any).resumeTimer = resumeTimer;
(window as any).restartTimer = restartTimer;
(window as any).showActionToast = showActionToast;
(window as any).announceToScreenReader = announceToScreenReader;
