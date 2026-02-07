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
    updateBreadEmojis,
    updateWholeGrainPercent,
    updateRecipeSummary
} from './display.js';
import { startTimer, stopTimer, resumeTimer, restartTimer } from './timer.js';
import { validateInputs, validateRecipeWarnings, displayWarnings } from './validation.js';
import { trackCalculatorUsed, trackTimerStarted } from './analytics.js';

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

        // Check for recipe warnings (extreme values)
        const warnings = validateRecipeWarnings(
            inputs.flour,
            inputs.water,
            inputs.starter,
            inputs.salt
        );

        // Display warnings if any (doesn't block calculation)
        displayWarnings(warnings);

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

        const resultDiv = document.getElementById('result');
        resultDiv.innerHTML = `
            <div style="background: linear-gradient(135deg, #fff5f5 0%, #ffe5e5 100%);
                        border-left: 4px solid #dc3545;
                        padding: var(--space-4);
                        border-radius: 12px;
                        margin-top: var(--space-4);">
                <h3 style="color: #dc3545; margin-top: 0;">⚠️ Ett fel uppstod</h3>
                <p style="margin-bottom: 0;">${error.message || 'Kunde inte beräkna jästid. Kontrollera att alla värden är korrekta och försök igen.'}</p>
            </div>
        `;
        resultDiv.classList.add('show');

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

    // Save current numLoaves value before regenerating HTML
    const currentNumLoaves = parseFloat(document.getElementById('numLoaves')?.value) || 1;

    // Calculate total time including cold proof
    const totalTimeWithCold = time + coldProof;

    // Save calculated time for timer (bulk + cold proof)
    SourdoughApp.calculatedTime = totalTimeWithCold;

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
    infoText.textContent = generateInfoText(temp, starterPercent);

    // Show result
    resultDiv.classList.add('show');

    // Add event listener for number of loaves (after element is created)
    setTimeout(() => {
        const numLeavesInput = document.getElementById('numLoaves');
        if (numLeavesInput) {
            // Remove old listener if exists
            numLeavesInput.removeEventListener('input', handleNumLeavesChange);
            // Add new listener
            numLeavesInput.addEventListener('input', handleNumLeavesChange);
        }
    }, 50);

    // Announce to screen readers
    const { hours, minutes } = formatHoursMinutes(time);
    announceToScreenReader(`Beräkning klar. Rekommenderad jästid är ${hours} timmar och ${minutes} minuter.`);
}

/**
 * Handle number of loaves change
 */
function handleNumLeavesChange() {
    updateBreadEmojis();
    calculateTime();
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
 * Sync temperature slider with number input
 */
function syncTemperature() {
    const tempSlider = document.getElementById('temperatureSlider');
    const tempInput = document.getElementById('temperature');

    tempSlider.addEventListener('input', function() {
        tempInput.value = this.value;
        calculateTime();
    });

    tempInput.addEventListener('input', function() {
        tempSlider.value = this.value;
        calculateTime();
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
            title: '📏 Platt bröd / ingen oven spring',
            causes: [
                '⚠️ För svag surdegsstart (VANLIGASTE ORSAKEN!)',
                'Överjäst deg - jäste för länge',
                'För lite ånga under gräddning',
                'För få vikningar under bulkjäsning',
                'För låg ugnstemperatur',
                'Glömde snitta brödet',
                'Degen formades för löst'
            ],
            solutions: [
                '💪 <strong>Starkare surdegsstart (FIX DETTA FÖRST!)</strong> - Mata 1:5:5 dagligen i 3-5 dagar. Din surdeg ska dubblas på 4-6h och flyta i vatten (flyttest). Använd vid peak!',
                '💨 <strong>Mer ånga!</strong> - Dutch oven: släng in 3-4 isbitar när du lägger i brödet. Öppen bakning: häll 1 dl vatten på en het plåt längst ner i ugnen',
                '🙌 <strong>Fler vikningar</strong> - gör 4-5 stretch & folds under bulkjäsningen för att bygga styrka',
                '⏱️ <strong>Korta ner bulkjäsningen</strong> - använd kalkylatorn och fingertestet',
                '🔥 <strong>Högre temperatur</strong> - 250°C och förvärm i 60 min',
                '🔪 <strong>Snitta djupare</strong> - använd riktigt vass snittkniv',
                '🤲 <strong>Forma tightare</strong> - bygg mer ytspänning vid formning'
            ],
            starterCheck: {
                title: '⚠️ Är din surdegsstart tillräckligt stark?',
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
            title: '🌊 Spretig form (degen rann ut)',
            causes: [
                'För lite glutenutveckling (för få vikningar)',
                'För hög hydrering',
                'Mjöl med låg proteinhalt',
                'Överjäst',
                'Formades för löst'
            ],
            solutions: [
                '🙌 <strong>Arbeta mer med vikningarna!</strong> - Gör 4-5 stretch & folds under bulkjäsningen. Detta bygger styrka i degen så den håller formen bättre',
                '🌾 <strong>Högre proteinhalt</strong> - Byt till mjöl med minst 12% protein (t.ex. Manitoba, starkt brödjöl). Lågt protein = svagare glutennätverk',
                '💧 <strong>Sänk hydreringen</strong> - Om vikningar inte hjälper, prova 5% mindre vatten',
                '⏱️ <strong>Korta jästiden</strong> - överjäst deg tappar struktur',
                '🤲 <strong>Tight formning</strong> - bygg stark ytspänning',
                '❄️ <strong>Kalljäsning</strong> - gör degen fastare och lättare att hantera'
            ]
        },
        'dense': {
            title: '🕳️ För tätt / inga hål / kompakt',
            causes: [
                '⚠️ Svag eller inaktiv surdegsstart (VANLIGASTE ORSAKEN!)',
                'Underjäst - jäste för kort tid',
                'För lite surdegsstart (under 15%)',
                'För låg temperatur',
                'För mycket knådning/vikningar'
            ],
            solutions: [
                '💪 <strong>Starkare surdegsstart (FIX DETTA FÖRST!)</strong> - 90% av alla täta bröd beror på svag surdeg! Mata 1:5:5 dagligen. Surdegen ska dubblas på 4-6h och flyta i vatten.',
                '⏱️ <strong>Längre bulkjäsning</strong> - degen ska växa 50-75% (men funkar inte om surdegen är svag!)',
                '📊 <strong>Mer surdeg</strong> - prova 20-25% surdegsandel',
                '🌡️ <strong>Varmare miljö</strong> - sikta på 24-26°C',
                '🙌 <strong>Färre vikningar</strong> - max 3-4 för vitt mjöl'
            ],
            starterCheck: {
                title: '⚠️ Är din surdegsstart tillräckligt stark?',
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
            title: '🎈 För luftigt / jättehål',
            causes: [
                'För få vikningar',
                'För hög hydrering',
                'Överjäst',
                'Luftfickor vid formning'
            ],
            solutions: [
                '🙌 <strong>Fler vikningar</strong> - gör 4-5 stretch & folds',
                '💧 <strong>Lägre hydrering</strong> - sänk med 5%',
                '⏱️ <strong>Titta på jästtiden</strong> - överjäst ger ojämna hål',
                '🤲 <strong>Bättre formning</strong> - få ut luften försiktigt'
            ]
        },
        'burnt': {
            title: '🔥 Bränd skorpa',
            causes: [
                'För hög temperatur',
                'För lång gräddningstid',
                'Glömde sänka temperaturen',
                'För mycket socker/mjöl på ytan'
            ],
            solutions: [
                '🌡️ <strong>Sänk temperaturen</strong> - 230°C efter första 20 min',
                '⏱️ <strong>Kortare tid</strong> - kolla efter 35-40 min totalt',
                '🎪 <strong>Dutch oven</strong> - ta av locket efter 20 min',
                '🧹 <strong>Mindre mjöl</strong> - borsta av överskott före gräddning'
            ]
        },
        'gummy': {
            title: '🥖 Gummiartat / rått inuti',
            causes: [
                'Inte färdiggräddat',
                'För hög hydrering',
                'Överjäst',
                'Skar för tidigt'
            ],
            solutions: [
                '🌡️ <strong>Grädda längre</strong> - använd termometer, 95-98°C inuti',
                '💧 <strong>Lägre hydrering</strong> - prova 70-75%',
                '⏱️ <strong>Korta jästningen</strong> - överjäst ger gummigt',
                '⏰ <strong>Vänta med att skära</strong> - låt svalna i 1-2h först'
            ]
        },
        'bland': {
            title: '😐 Ingen smak / för blant',
            causes: [
                'För lite salt',
                'För kort jästning',
                'Ingen kalljäsning (mjölksyran får inte utvecklas)',
                'Ung surdegsstart'
            ],
            solutions: [
                '🧂 <strong>Mer salt</strong> - använd 2% (20g per 1000g mjöl)',
                '❄️ <strong>Kalljäsning (BÄSTA SMAKTRICKET!)</strong> - Kalljäs den formade degen i 12-24h. Detta låter mjölksyrabakterierna arbeta långsamt och utveckla komplex, god smak',
                '⏱️ <strong>Längre bulkjäsning</strong> - mer tid vid rumstemperatur = mer smak',
                '💪 <strong>Mogen surdeg</strong> - använd surdeg vid peak för bäst smak',
                '🌾 <strong>Prova surdegsbröd med fullkorn</strong> - ger mer smak än rent vitt mjöl'
            ]
        },
        'sour': {
            title: '🍋 För surt',
            causes: [
                'Överjäst',
                'För lång kalljäsning',
                'För varm miljö',
                'Gammal/sur surdegsstart'
            ],
            solutions: [
                '⏱️ <strong>Korta jästningen</strong> - överjäst = surare',
                '❄️ <strong>Kortare kalljäsning</strong> - max 12-16h',
                '🌡️ <strong>Kallare miljö</strong> - 20-22°C istället för 26°C',
                '💪 <strong>Fräsch surdeg</strong> - mata oftare, använd vid peak'
            ]
        },
        'crust': {
            title: '❌ Problem med skorpan',
            causes: [
                'För lite eller för mycket ånga',
                'Fel temperatur',
                'För tidigt eller sent avslöjning'
            ],
            solutions: [
                '💨 <strong>Rätt ånga</strong> - 15-20 min med ånga, sedan utan',
                '🔥 <strong>Hög start-temp</strong> - 250°C första 20 min',
                '🎪 <strong>Dutch oven</strong> - perfekt för nybörjare',
                '⏱️ <strong>Rätt timing</strong> - ta av lock/ånga efter 20 min'
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
                        <strong style="color: var(--green-dark); display: block; margin-bottom: var(--space-1);">✅ Stark surdeg:</strong>
                        <ul style="margin-left: var(--space-4); font-size: var(--text-sm); color: var(--green-dark); line-height: 1.6;">
                            ${diagnosis.starterCheck.strong.map(item => `<li>${item}</li>`).join('')}
                        </ul>
                    </div>
                    <div>
                        <strong style="color: var(--green-dark); display: block; margin-bottom: var(--space-1);">❌ Svag surdeg:</strong>
                        <ul style="margin-left: var(--space-4); font-size: var(--text-sm); color: var(--green-dark); line-height: 1.6;">
                            ${diagnosis.starterCheck.weak.map(item => `<li>${item}</li>`).join('')}
                        </ul>
                    </div>
                </div>
                <div style="background: rgba(255, 255, 255, 0.7); padding: var(--space-2); border-radius: 4px; border-left: 3px solid #ff9933;">
                    <strong style="color: var(--green-dark); font-size: var(--text-sm);">🚀 Fix: </strong>
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

            <h4 style="color: var(--green-dark); font-size: var(--text-base); margin: var(--space-4) 0 var(--space-2) 0; font-weight: 700;">
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

// Export for external use (e.g., inline scripts)
window.calculateTime = calculateTime;
window.updateWholeGrainPercent = updateWholeGrainPercent;
window.startTimer = startTimer;
window.stopTimer = stopTimer;
window.resumeTimer = resumeTimer;
window.restartTimer = restartTimer;
window.switchTab = switchTab;
window.showTroubleshootingForm = showTroubleshootingForm;
