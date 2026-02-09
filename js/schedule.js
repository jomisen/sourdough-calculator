import { SourdoughApp } from './constants.js';
import { formatTime } from './timer.js';
import { announceToScreenReader } from './display.js';

/**
 * Show inline message instead of alert
 * @param {string} message - Message text
 * @param {string} type - Type: 'warning', 'error', 'success', 'info'
 * @param {string} containerId - ID of container to show message in
 * @param {number} duration - Auto-dismiss after milliseconds (0 = no auto-dismiss)
 */
function showInlineMessage(message, type = 'info', containerId = 'scheduleOutput', duration = 0) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Remove any existing messages
    const existing = container.querySelector('.inline-message');
    if (existing) {
        existing.remove();
    }

    // Icon based on type
    const icons = {
        warning: '⚠️',
        error: '❌',
        success: '✅',
        info: 'ℹ️'
    };

    // Create message element
    const messageEl = document.createElement('div');
    messageEl.className = `inline-message ${type}`;
    messageEl.setAttribute('role', 'alert');
    messageEl.innerHTML = `
        <span class="inline-message-icon">${icons[type] || icons.info}</span>
        <div class="inline-message-content">
            <div class="inline-message-text">${message}</div>
        </div>
        <button class="inline-message-close" onclick="this.parentElement.remove()" aria-label="Stäng meddelande">×</button>
    `;

    // Insert at the top of container
    container.insertBefore(messageEl, container.firstChild);

    // Scroll to message
    messageEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // Announce to screen readers
    announceToScreenReader(message);

    // Auto-dismiss if duration is set
    if (duration > 0) {
        setTimeout(() => {
            if (messageEl.parentElement) {
                messageEl.style.opacity = '0';
                messageEl.style.transform = 'translateY(-10px)';
                setTimeout(() => messageEl.remove(), 300);
            }
        }, duration);
    }
}

/**
 * Format time with date if different day
 */
function formatTimeWithDate(date, referenceDate) {
    const sameDay = date.toDateString() === referenceDate.toDateString();

    if (sameDay) {
        return formatTime(date);
    } else {
        // Different day - show weekday and time
        const weekday = date.toLocaleDateString('sv-SE', { weekday: 'long' });
        const dayMonth = date.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
        const time = formatTime(date);

        return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)} ${dayMonth}, ${time}`;
    }
}

/**
 * Get day number from start date (for showing "Dag 1", "Dag 2" etc.)
 * Uses calendar days, not 24-hour periods
 */
function getDayNumber(date, startDate) {
    // Normalize both dates to midnight for proper calendar day comparison
    const dateAtMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const startAtMidnight = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());

    const diffTime = dateAtMidnight.getTime() - startAtMidnight.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1;
}

/**
 * Initialize schedule tab - set current time as default and recommendations
 */
function initSchedule() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const currentTime = `${hours}:${minutes}`;

    const timeInput = document.getElementById('scheduleTime');
    if (timeInput) {
        timeInput.value = currentTime;
    }

    // Update folds recommendation and autolys from calculator
    updateFoldsRecommendation();
    updateAutolysFromCalculator();

    // Initialize time direction hint
    toggleTimeDirection();
}

/**
 * Toggle between forward (start time) and backward (end time) calculation
 */
window.toggleTimeDirection = function() {
    const direction = document.querySelector('input[name="timeDirection"]:checked')?.value;
    const hint = document.getElementById('timeDirectionHint');
    const timeInput = document.getElementById('scheduleTime');
    const timeLabel = document.getElementById('scheduleTimeLabel');

    // Update label based on direction
    if (timeLabel) {
        if (direction === 'forward') {
            timeLabel.innerHTML = '🕐 När vill du baka?';
        } else {
            timeLabel.innerHTML = '🎯 När ska brödet vara klart?';
        }
    }

    if (hint && timeInput) {
        const time = timeInput.value || '08:00';

        // Get rough estimate of total time (use calculated or default 10h)
        const estimatedHours = SourdoughApp.calculatedTime || 10;

        if (direction === 'forward') {
            // Calculate estimated end time
            const [hours, minutes] = time.split(':').map(Number);
            const endHours = (hours + Math.round(estimatedHours)) % 24;
            const endTime = `${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

            hint.innerHTML = `Börja kl <strong>${time}</strong> → Klart ca kl <strong>${endTime}</strong>`;
        } else {
            // Calculate estimated start time
            const [hours, minutes] = time.split(':').map(Number);
            let startHours = hours - Math.round(estimatedHours);
            if (startHours < 0) startHours += 24;
            const startTime = `${String(startHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

            hint.innerHTML = `Börja ca kl <strong>${startTime}</strong> → Klart kl <strong>${time}</strong>`;
        }
    }

    // Update schedule if we already have data
    tryAutoGenerateSchedule();
};

/**
 * Navigate to schedule tab and scroll to top
 */
window.goToScheduleTab = function() {
    // Switch to schedule tab
    if (typeof window.switchTab === 'function') {
        window.switchTab('schedule');
    }

    // Scroll to top after a short delay to ensure tab has switched
    setTimeout(() => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });

        // Auto-generate schedule when switching to tab
        tryAutoGenerateSchedule();
    }, 100);
};

/**
 * Try to auto-generate schedule (won't show error if no data)
 */
function tryAutoGenerateSchedule() {
    // ALWAYS ensure time input is set (even with default values)
    const timeInput = document.getElementById('scheduleTime');
    if (timeInput && !timeInput.value) {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        timeInput.value = `${hours}:${minutes}`;
    }

    const dataSource = document.querySelector('input[name="scheduleDataSource"]:checked')?.value;
    const emptyState = document.getElementById('schedule-empty-state');
    const scheduleDisplay = document.getElementById('schedule-display');

    // Auto-calculate if user has values (including defaults!) but hasn't calculated yet
    if (dataSource === 'calculated' && !SourdoughApp.calculatedTime) {
        const flour = parseFloat(document.getElementById('flour')?.value);
        const water = parseFloat(document.getElementById('water')?.value);

        if (flour && water && typeof window.calculateTime === 'function') {
            // Silently calculate in background with existing values (even if default)
            window.calculateTime();
        }
    }

    // Check if we have data to generate from
    if (dataSource === 'calculated' && !SourdoughApp.calculatedTime) {
        // No calculation done yet - show empty state
        if (emptyState) {
            emptyState.style.display = 'block';
        }
        // Clear any existing schedule
        if (scheduleDisplay) {
            // Keep empty state visible but clear schedule content
            const existingSchedule = scheduleDisplay.querySelector('.schedule-timeline');
            if (existingSchedule) {
                scheduleDisplay.innerHTML = '';
                if (emptyState) {
                    scheduleDisplay.appendChild(emptyState);
                }
            }
        }
        return;
    }

    // Generate schedule (will hide empty state)
    generateBakingSchedule(true); // Pass true to indicate auto-generation
}

/**
 * Setup listener for when schedule tab becomes active
 */
function setupTabSwitchListener() {
    const scheduleTabButton = document.getElementById('schedule-tab-button');
    if (scheduleTabButton) {
        scheduleTabButton.addEventListener('click', () => {
            // Scroll to top first
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });

            // Show contextual hint if user came from journey selection
            showContextualHint();

            // Generate schedule (tryAutoGenerateSchedule handles time init and auto-calc)
            setTimeout(() => {
                tryAutoGenerateSchedule();
            }, 100);
        });
    }
}

/**
 * Setup live update listeners for schedule inputs
 */
function setupScheduleLiveUpdates() {
    // Time input
    const timeInput = document.getElementById('scheduleTime');
    if (timeInput) {
        timeInput.addEventListener('change', () => {
            toggleTimeDirection(); // Update hint with new time
            tryAutoGenerateSchedule();
        });
        // Also update hint when user is typing
        timeInput.addEventListener('input', () => {
            toggleTimeDirection();
        });
    }

    // Time direction
    document.querySelectorAll('input[name="timeDirection"]').forEach(radio => {
        radio.addEventListener('change', () => toggleTimeDirection());
    });

    // Data source
    document.querySelectorAll('input[name="scheduleDataSource"]').forEach(radio => {
        radio.addEventListener('change', () => tryAutoGenerateSchedule());
    });

    // Autolys checkbox
    const autolysCheckbox = document.getElementById('scheduleAutolys');
    if (autolysCheckbox) {
        autolysCheckbox.addEventListener('change', () => tryAutoGenerateSchedule());
    }

    // Autolys time
    const autolysTime = document.getElementById('autolysTime');
    if (autolysTime) {
        autolysTime.addEventListener('change', () => tryAutoGenerateSchedule());
    }

    // Number of folds
    const folds = document.getElementById('scheduleFolds');
    if (folds) {
        folds.addEventListener('change', () => tryAutoGenerateSchedule());
    }

    // Number of loaves
    const numLoaves = document.getElementById('scheduleNumLoavesMain');
    if (numLoaves) {
        numLoaves.addEventListener('change', () => {
            updateScheduleBreadEmojis();
            updateTotalDoughWeight();
            tryAutoGenerateSchedule();
        });
        numLoaves.addEventListener('input', () => {
            updateScheduleBreadEmojis();
            updateTotalDoughWeight();
        });
    }

    // Baking method
    document.querySelectorAll('input[name="bakingMethod"]').forEach(radio => {
        radio.addEventListener('change', () => tryAutoGenerateSchedule());
    });

    // Manual inputs
    const manualInputs = ['manualBulkTime', 'manualColdProof', 'manualColdProofTime', 'manualNumLoaves', 'manualLoafWeight'];
    manualInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('change', () => {
                const dataSource = document.querySelector('input[name="scheduleDataSource"]:checked')?.value;
                if (dataSource === 'manual') {
                    tryAutoGenerateSchedule();
                }
            });
        }
    });
}

/**
 * Update folds recommendation based on hydration from calculator
 */
function updateFoldsRecommendation() {
    const flour = parseFloat(document.getElementById('flour')?.value) || 500;
    const water = parseFloat(document.getElementById('water')?.value) || 350;
    const hydration = (water / flour) * 100;

    let recommendedFolds = 3;
    if (hydration > 80) {
        recommendedFolds = 5;
    } else if (hydration > 75) {
        recommendedFolds = 4;
    }

    const foldsSelect = document.getElementById('scheduleFolds');
    const foldsRecommendation = document.getElementById('foldsRecommendation');

    if (foldsSelect && foldsRecommendation) {
        foldsSelect.value = recommendedFolds;
        foldsRecommendation.textContent = `Rekommenderat: ${recommendedFolds} (${hydration.toFixed(0)}% hydrering)`;
    }

    // Also update autolys setting from calculator
    updateAutolysFromCalculator();
}

/**
 * Update autolys checkbox and time from calculator settings
 */
function updateAutolysFromCalculator() {
    const autolyseValue = document.getElementById('autolyse')?.value;
    const scheduleAutolysCheckbox = document.getElementById('scheduleAutolys');
    const autolysTimeSelect = document.getElementById('autolysTime');
    const autolysTimeGroup = document.getElementById('autolysTimeGroup');

    if (!scheduleAutolysCheckbox || !autolysTimeSelect || !autolysTimeGroup) return;

    // Check if using calculated values
    const dataSource = document.querySelector('input[name="scheduleDataSource"]:checked')?.value;
    if (dataSource !== 'calculated') return;

    if (autolyseValue === 'no') {
        // No autolys selected in calculator
        scheduleAutolysCheckbox.checked = false;
        autolysTimeGroup.style.display = 'none';
    } else {
        // Autolys selected - enable and set time
        scheduleAutolysCheckbox.checked = true;
        autolysTimeGroup.style.display = 'block';

        // Map calculator values to schedule values
        if (autolyseValue === '30') {
            autolysTimeSelect.value = '30';
        } else if (autolyseValue === '60') {
            autolysTimeSelect.value = '60';
        } else if (autolyseValue === '120') {
            autolysTimeSelect.value = '90'; // Closest match
        }
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initSchedule();
        setupScheduleLiveUpdates();
        setupTabSwitchListener();
    });
} else {
    initSchedule();
    setupScheduleLiveUpdates();
    setupTabSwitchListener();
}

// Export for use from calculator
window.updateFoldsRecommendation = updateFoldsRecommendation;

/**
 * Toggle between calculated and manual schedule inputs
 */
window.toggleScheduleInputs = function() {
    const dataSource = document.querySelector('input[name="scheduleDataSource"]:checked')?.value;
    const manualInputs = document.getElementById('manualScheduleInputs');

    if (manualInputs) {
        manualInputs.style.display = dataSource === 'manual' ? 'block' : 'none';
    }

    // If switching to calculated values, update autolys from calculator
    if (dataSource === 'calculated') {
        updateAutolysFromCalculator();
    }
};

/**
 * Show loading state in schedule display
 */
function showScheduleLoading() {
    const display = document.getElementById('schedule-display');
    const emptyState = document.getElementById('schedule-empty-state');

    if (emptyState) {
        emptyState.style.display = 'none';
    }

    display.innerHTML = `
        <div class="schedule-loading">
            <div class="loading-spinner"></div>
            <p style="font-size: var(--text-base); font-weight: 600;">Skapar ditt bakschema...</p>
        </div>
    `;
    display.style.display = 'block';
}

/**
 * Show toast notification
 */
function showToast(message, duration = 3000) {
    // Remove any existing toast
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) {
        existingToast.remove();
    }

    // Create new toast
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerHTML = `<span>✓</span> <span>${message}</span>`;
    document.body.appendChild(toast);

    // Remove after duration
    setTimeout(() => {
        toast.remove();
    }, duration);
}

/**
 * Generate complete baking schedule with all steps and times
 * @param {boolean} autoGenerate - If true, suppress error alerts (for auto-generation)
 */
window.generateBakingSchedule = function(autoGenerate = false) {
    // Show loading state
    showScheduleLoading();

    // Use setTimeout to allow loading state to render
    setTimeout(() => {
        generateScheduleInternal(autoGenerate);
    }, 50);
}

function generateScheduleInternal(autoGenerate = false) {
    // Clear any previously checked steps when generating new schedule
    clearCheckedSteps();

    // Check data source
    const dataSource = document.querySelector('input[name="scheduleDataSource"]:checked')?.value;

    // Get time and direction
    const timeInput = document.getElementById('scheduleTime');
    const inputTime = timeInput.value;

    if (!inputTime) {
        if (!autoGenerate) {
            showInlineMessage('⏰ Välj en tid för att generera ditt bakschema!', 'warning');
        }
        return;
    }

    const timeDirection = document.querySelector('input[name="timeDirection"]:checked')?.value || 'forward';

    // Get values based on data source
    let bulkTime, coldProof, numLoaves, weightPerLoaf, flour, water, hydration;

    if (dataSource === 'calculated') {
        // Check if calculation has been done
        if (!SourdoughApp.calculatedTime) {
            if (!autoGenerate) {
                showInlineMessage(
                    '📊 Du har inte beräknat någon deg än!<br><br><strong>Välj antingen:</strong><br>• Gå till <strong>Beräkna jästid</strong>-fliken och beräkna först, eller<br>• Välj <strong>"Ange egna värden"</strong> här nedan.',
                    'warning'
                );
            }
            return;
        }

        // Get values from calculator
        bulkTime = SourdoughApp.calculatedTime; // hours
        coldProof = parseFloat(document.getElementById('coldProof')?.value) || 0;
        flour = parseFloat(document.getElementById('flour')?.value) || 500;
        water = parseFloat(document.getElementById('water')?.value) || 350;
        hydration = (water / flour) * 100;
        numLoaves = parseFloat(document.getElementById('scheduleNumLoavesMain')?.value) || 2;

        const starter = parseFloat(document.getElementById('starter')?.value) || 100;
        const salt = parseFloat(document.getElementById('salt')?.value) || 10;
        const totalWeight = flour + water + starter + salt;
        weightPerLoaf = totalWeight / numLoaves;

    } else {
        // Get manual values
        bulkTime = parseFloat(document.getElementById('manualBulkTime')?.value) || 5;
        coldProof = document.getElementById('manualColdProof')?.checked
            ? parseFloat(document.getElementById('manualColdProofTime')?.value) || 0
            : 0;
        numLoaves = parseFloat(document.getElementById('manualNumLoaves')?.value) || 1;
        weightPerLoaf = parseFloat(document.getElementById('manualLoafWeight')?.value) || 800;

        // Estimate reasonable values for missing data
        flour = 500;
        water = 350;
        hydration = 70; // Default assumption
    }

    // Get schedule preferences
    const useAutolys = document.getElementById('scheduleAutolys')?.checked || false;
    const autolysTime = parseInt(document.getElementById('autolysTime')?.value) || 60;
    const numFolds = parseInt(document.getElementById('scheduleFolds')?.value) || 3;
    const bakingMethod = document.querySelector('input[name="bakingMethod"]:checked')?.value || 'dutch-oven';

    const foldInterval = 30; // minutes
    const totalFoldingTime = ((numFolds - 1) * foldInterval) / 60; // hours

    // Calculate baking times
    const bakingTimePerLoaf = Math.round(20 + (weightPerLoaf - 500) / 100 * 5);
    const bakingTimeCovered = Math.round(bakingTimePerLoaf * 0.6);
    const bakingTimeUncovered = bakingTimePerLoaf - bakingTimeCovered;

    // Calculate total time needed (in minutes)
    let totalTimeMinutes = 0;
    if (useAutolys) totalTimeMinutes += autolysTime;
    totalTimeMinutes += 30; // Rest after starter
    totalTimeMinutes += 30; // Rest after salt
    totalTimeMinutes += (numFolds - 1) * foldInterval; // Folding period
    totalTimeMinutes += (bulkTime - totalFoldingTime) * 60; // Bulk rest
    totalTimeMinutes += 10; // Preshape
    totalTimeMinutes += 25; // Bench rest
    totalTimeMinutes += 15; // Final shape
    if (coldProof > 0) totalTimeMinutes += coldProof * 60; // Cold proof
    totalTimeMinutes += bakingTimePerLoaf; // Baking

    // Calculate start time based on direction
    let startDate;
    const [hours, minutes] = inputTime.split(':').map(Number);

    if (timeDirection === 'forward') {
        // Start at the given time
        startDate = new Date();
        startDate.setHours(hours, minutes, 0, 0);
    } else {
        // Work backwards from end time
        const endDate = new Date();
        endDate.setHours(hours, minutes, 0, 0);
        startDate = new Date(endDate.getTime() - totalTimeMinutes * 60000);
    }

    // Build schedule
    const schedule = [];
    let currentTime = new Date(startDate);

    // Step 1: Autolys (if selected)
    if (useAutolys) {
        const autolysDescription = dataSource === 'calculated'
            ? `Blanda mjöl (${flour}g) och vatten (${water}g). Täck över och låt vila i ${autolysTime} min för bättre glutenutveckling.`
            : `Blanda mjöl och vatten. Täck över och låt vila i ${autolysTime} min för bättre glutenutveckling.`;

        schedule.push({
            time: formatTime(currentTime),
            dateTime: new Date(currentTime),
            step: 'Autolys',
            icon: '💧',
            description: autolysDescription,
            duration: autolysTime,
            optional: false
        });

        currentTime = addMinutes(currentTime, autolysTime);
    }

    // Step 2: Add starter
    const starterAmount = dataSource === 'calculated'
        ? parseFloat(document.getElementById('starter')?.value) || 100
        : Math.round(flour * 0.2); // 20% of flour as default

    // Dynamic description based on autolys
    let starterDescription;
    if (dataSource === 'calculated') {
        if (useAutolys) {
            // With autolys: just mix starter into existing dough
            starterDescription = `Blanda in ${starterAmount}g aktiv surdegsstart. Blanda ordentligt tills degen är jämn.`;
        } else {
            // Without autolys: mix starter in water, then add flour
            starterDescription = `Blanda ${starterAmount}g aktiv surdegsstart i ${water}g vatten. Tillsätt sedan ${flour}g mjöl och arbeta ihop till en deg.`;
        }
    } else {
        starterDescription = `Blanda in din aktiva surdegsstart. Blanda ordentligt tills degen är jämn.`;
    }

    schedule.push({
        time: formatTime(currentTime),
        dateTime: new Date(currentTime),
        step: 'Blanda in surdegsstarten',
        icon: '🌾',
        description: starterDescription,
        duration: 10
        // No bulkPhase - bulk starts AFTER this step
    });

    currentTime = addMinutes(currentTime, 30); // Rest after starter

    // Step 3: Add salt
    const saltAmount = dataSource === 'calculated'
        ? parseFloat(document.getElementById('salt')?.value) || 10
        : Math.round(flour * 0.02); // 2% of flour as default

    schedule.push({
        time: formatTime(currentTime),
        dateTime: new Date(currentTime),
        step: 'Saltet ska i',
        icon: '🧂',
        description: dataSource === 'calculated'
            ? `Strö över ${saltAmount}g salt och arbeta in det genom att vicka och dra i degen.`
            : `Strö över saltet och arbeta in det genom att vicka och dra i degen.`,
        duration: 10,
        bulkPhase: 'start' // Mark as START of bulk fermentation (timer starts here)
    });

    currentTime = addMinutes(currentTime, 30); // Rest after salt

    // BULK FERMENTATION START - Save this time for timer (after salt rest)
    const bulkStartTime = new Date(currentTime);

    // Step 4: Stretch & folds
    for (let i = 1; i <= numFolds; i++) {
        let foldDescription = `Gör en stretch & fold: Lyft och vik degen från varje sida (4 vikningar totalt). Täck över.`;

        // Add explanation for first fold
        if (i === 1) {
            const hydrationRounded = Math.round(hydration);
            const hydrationLevel = hydration > 80 ? 'mycket hög' : hydration > 75 ? 'hög' : 'medel';
            foldDescription = `Gör en stretch & fold: Lyft och vik degen från varje sida (4 vikningar totalt). Täck över.<br><br><strong>💡 Varför ${numFolds} vikningar?</strong><br>Din deg har ${hydrationRounded}% hydrering (${hydrationLevel}), vilket kräver ${numFolds} vikningar för att bygga tillräcklig struktur och styrka. Känns degen slapp kan du göra ett extra vik.`;
        }

        schedule.push({
            time: formatTime(currentTime),
            dateTime: new Date(currentTime),
            step: `Vikning ${i} av ${numFolds}`,
            icon: '🙌',
            description: foldDescription,
            duration: 5,
            bulkPhase: 'active' // Part of bulk fermentation
        });

        if (i < numFolds) {
            currentTime = addMinutes(currentTime, foldInterval);
        }
    }

    // Step 5: Bulk fermentation rest
    const restTime = bulkTime - totalFoldingTime;
    currentTime = addMinutes(currentTime, restTime * 60);
    schedule.push({
        time: formatTime(currentTime),
        dateTime: new Date(currentTime),
        step: 'Bulkjäsning klar',
        icon: '✅',
        description: `Degen ska nu ha vuxit med 50-75% och vara mjuk och luftig med synliga bubblor.`,
        duration: 0,
        milestone: true,
        bulkPhase: 'end' // Mark as end of bulk fermentation
    });

    // Step 6: Preshape - BULK FERMENTATION END
    const bulkEndTime = new Date(currentTime);

    schedule.push({
        time: formatTime(currentTime),
        dateTime: new Date(currentTime),
        step: 'Preshape',
        icon: '📐',
        description: numLoaves > 1
            ? `Använd inte mjöl. Blöt händerna lätt så du inte fastnar i degen. Vänd ut degen på bänken och dela i ${numLoaves} delar. Använd degskrapa eller händerna för att runddriva till runda bollar – detta skapar spänning i degen.`
            : `Använd inte mjöl. Blöt händerna lätt så du inte fastnar i degen. Vänd ut degen på bänken. Använd degskrapa eller händerna för att runddriva till en rund boll – detta skapar spänning i degen.`,
        duration: 10
    });

    // Step 7: Bench rest
    currentTime = addMinutes(currentTime, 25);
    schedule.push({
        time: formatTime(currentTime),
        dateTime: new Date(currentTime),
        step: 'Final shape',
        icon: '🥖',
        description: `Forma ${numLoaves > 1 ? 'varje deg' : 'degen'} till ${numLoaves > 1 ? 'önskade former' : 'önskad form'}. Lägg i jäskorgar med sömmen uppåt.`,
        duration: 15
    });

    currentTime = addMinutes(currentTime, 15);

    // Step 8: Cold proof (if used)
    if (coldProof > 0) {
        schedule.push({
            time: formatTime(currentTime),
            dateTime: new Date(currentTime),
            step: 'In i kylen',
            icon: '❄️',
            description: `Täck över korgarna och ställ in i kylskåpet för ${coldProof}h kalljäsning.`,
            duration: 0,
            milestone: true
        });

        currentTime = addHours(currentTime, coldProof);

        schedule.push({
            time: formatTime(currentTime),
            dateTime: new Date(currentTime),
            step: 'Kalljäsning klar',
            icon: '✅',
            description: `Ta ut bröden från kylen. De kan gå direkt i ugnen (behöver inte värmas till rumstemperatur).`,
            duration: 0,
            milestone: true
        });
    }

    // Step 9: Preheat oven
    const preheatTime = 60; // minutes
    const ovenStartTime = new Date(currentTime.getTime() - preheatTime * 60000);

    const ovenDescription = bakingMethod === 'dutch-oven'
        ? `Sätt ugnen på 250°C med ${numLoaves > 1 ? 'grytor' : 'gryta'} inne (Dutch oven).`
        : `Sätt ugnen på 250°C och förbered ångfunktionen (vattenskål eller ångugn).`;

    schedule.push({
        time: formatTime(ovenStartTime),
        dateTime: new Date(ovenStartTime),
        step: 'Värm upp ugnen',
        icon: '🔥',
        description: ovenDescription,
        duration: preheatTime,
        important: true,
        bulkPhase: coldProof === 0 ? 'active' : undefined // Dark green if no cold proof (oven during bulk)
    });

    // Step 10: Baking
    const bakingDescription = bakingMethod === 'dutch-oven'
        ? `Vänd ut ${numLoaves > 1 ? 'bröden' : 'brödet'} på bakplåtspapper, snitta, in i ${numLoaves > 1 ? 'grytorna' : 'grytan'}. Sätt på lock och in i ugnen. Sänk till 230°C.`
        : `Vänd ut ${numLoaves > 1 ? 'bröden' : 'brödet'} på bakplåtspapper, snitta, in i ugnen med ånga. Sänk till 240°C.`;

    schedule.push({
        time: formatTime(currentTime),
        dateTime: new Date(currentTime),
        step: 'In i ugnen med ånga',
        icon: '🍞',
        description: bakingDescription,
        duration: bakingTimeCovered,
        important: true
    });

    currentTime = addMinutes(currentTime, bakingTimeCovered);

    const steamRemovalDescription = bakingMethod === 'dutch-oven'
        ? `Ta bort locket från ${numLoaves > 1 ? 'grytorna' : 'grytan'}. Sänk till 220°C.`
        : `Stäng av ångfunktionen och ta bort vattenskålen. Sänk till 210°C.`;

    schedule.push({
        time: formatTime(currentTime),
        dateTime: new Date(currentTime),
        step: 'Ta bort ånga/lock',
        icon: '💨',
        description: steamRemovalDescription,
        duration: bakingTimeUncovered
    });

    currentTime = addMinutes(currentTime, bakingTimeUncovered);

    schedule.push({
        time: formatTime(currentTime),
        dateTime: new Date(currentTime),
        step: 'Ur ugnen - KLART!',
        icon: '🎉',
        description: `${numLoaves > 1 ? 'Bröden är' : 'Brödet är'} färdigt! Låt svalna på galler i minst 1 timme innan du skär.`,
        duration: 0,
        milestone: true,
        important: true
    });

    // Sort schedule by dateTime to handle out-of-order steps (like oven preheat)
    schedule.sort((a, b) => a.dateTime - b.dateTime);

    // Display schedule with bulk fermentation times for timer integration
    displaySchedule(schedule, startDate, currentTime, timeDirection, bulkStartTime, bulkEndTime, autoGenerate);

    // Announce to screen readers
    announceToScreenReader('Bakschema skapat! Totalt ' + schedule.length + ' steg.');
};

/**
 * Generate bulk fermentation timer section for schedule
 * @param {Date} bulkStartTime - Start time of bulk fermentation
 * @param {Date} bulkEndTime - End time of bulk fermentation
 * @param {number} bulkDurationHours - Duration in hours
 * @param {string} position - 'start' or 'end' to show different views
 */
function generateBulkTimerSection(bulkStartTime, bulkEndTime, bulkDurationHours, position = 'start') {
    const bulkDurationMinutes = Math.round(bulkDurationHours * 60);
    const hours = Math.floor(bulkDurationMinutes / 60);
    const minutes = bulkDurationMinutes % 60;
    const durationText = hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;

    // Check if timer is active (either running or paused)
    const isTimerRunning = SourdoughApp && (SourdoughApp.timerInterval !== null || SourdoughApp.isPaused);
    const isTimerPaused = SourdoughApp && SourdoughApp.isPaused;

    // Calculate paused time display
    let pausedTimeDisplay = '';
    if (isTimerPaused && SourdoughApp.remainingTime) {
        const remaining = SourdoughApp.remainingTime;
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
        pausedTimeDisplay = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    // If showing at the end, don't show anything (timer is sticky and visible throughout)
    if (position === 'end') {
        return '';
    }

    // Start position - show timer interface (sticky only when running)

    return `
        <div style="position: ${isTimerRunning ? 'sticky' : 'static'}; top: var(--space-2); z-index: 100; margin: var(--space-4) 0; padding: var(--space-3); background: linear-gradient(to bottom, rgba(159, 176, 148, 0.15), rgba(159, 176, 148, 0.08)); backdrop-filter: blur(8px); border: 3px solid var(--green-dark); border-radius: var(--radius-md); box-shadow: var(--shadow-md);">
            <div style="display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-2);">
                <span style="font-size: 24px;">⏰</span>
                <div style="flex: 1;">
                    <h4 style="color: var(--green-dark); font-size: var(--text-base); margin: 0; font-weight: 700;">
                        Bulkjäsningstimer
                    </h4>
                    <p style="color: var(--green-medium); font-size: var(--text-sm); margin: 4px 0 0 0;">
                        ${formatTime(bulkStartTime)} → ${formatTime(bulkEndTime)} (${durationText})
                    </p>
                    <p style="color: var(--green-dark); font-size: var(--text-xs); margin: 6px 0 0 0; font-weight: 500; opacity: 0.85;">
                        Timern följer bulkjäsningen – alla steg med mörkgrön bakgrund
                    </p>
                </div>
            </div>

            ${isTimerRunning ? `
                <div id="bulk-timer-active" style="padding: var(--space-2); background: white; border-radius: var(--radius-sm); border: 2px solid var(--green-light);">
                    <div style="display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); margin-bottom: var(--space-2);">
                        <div style="flex: 1;">
                            <div id="timer-in-schedule" style="font-size: var(--text-2xl); font-weight: 700; color: var(--green-dark); font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;">
                                ${isTimerPaused && pausedTimeDisplay ? pausedTimeDisplay : '<!-- Timer countdown will be synced here -->'}
                            </div>
                            <div style="font-size: var(--text-sm); color: var(--green-medium); margin-top: 2px;">
                                av ${durationText}
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; gap: var(--space-1);">
                            <button
                                id="scheduleTimerStartBtn"
                                onclick="if(!this.disabled) { window.resumeTimer(); window.updateTimerButtons(); }"
                                title="Starta från pausad tid"
                                style="background: transparent; color: var(--green-medium); border: none; padding: 4px; font-size: 20px; transition: all 0.2s; line-height: 1; ${!isTimerPaused ? 'opacity: 0.3; cursor: not-allowed; pointer-events: none;' : 'cursor: pointer;'}"
                                onmouseover="if(!this.disabled) this.style.transform='scale(1.2)'"
                                onmouseout="if(!this.disabled) this.style.transform='scale(1)'"
                                ${!isTimerPaused ? 'disabled="true"' : ''}
                            >
                                ▶️
                            </button>
                            <button
                                id="scheduleTimerPauseBtn"
                                onclick="if(!this.disabled) { window.stopTimer(); window.updateTimerButtons(); }"
                                title="Pausa timer"
                                style="background: transparent; color: var(--warm-accent); border: none; padding: 4px; font-size: 20px; transition: all 0.2s; line-height: 1; ${isTimerPaused ? 'opacity: 0.3; cursor: not-allowed; pointer-events: none;' : 'cursor: pointer;'}"
                                onmouseover="if(!this.disabled) this.style.transform='scale(1.2)'"
                                onmouseout="if(!this.disabled) this.style.transform='scale(1)'"
                                ${isTimerPaused ? 'disabled="true"' : ''}
                            >
                                ⏸️
                            </button>
                            <button
                                onclick="window.restartTimer();"
                                title="Starta om från början"
                                style="background: transparent; color: var(--green-dark); border: none; padding: 4px; font-size: 20px; cursor: pointer; transition: all 0.2s; line-height: 1;"
                                onmouseover="this.style.transform='scale(1.2)'"
                                onmouseout="this.style.transform='scale(1)'"
                            >
                                🔄
                            </button>
                            <button
                                onclick="window.removeBulkTimer();"
                                title="Ta bort timer"
                                style="background: transparent; color: #dc3545; border: none; padding: 4px; font-size: 20px; cursor: pointer; transition: all 0.2s; line-height: 1;"
                                onmouseover="this.style.transform='scale(1.2)'"
                                onmouseout="this.style.transform='scale(1)'"
                            >
                                ❌
                            </button>
                        </div>
                    </div>
                </div>
            ` : `
                <div style="text-align: center;">
                    <button
                        onclick="startBulkTimerFromSchedule(${bulkDurationHours})"
                        style="background: var(--green-dark); color: white; border: none; padding: var(--space-2) var(--space-3); border-radius: var(--radius-sm); font-size: var(--text-sm); font-weight: 600; cursor: pointer; transition: all 0.2s; box-shadow: var(--shadow-sm); width: 100%;"
                        onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='var(--shadow-md)'"
                        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='var(--shadow-sm)'"
                    >
                        ⏰ Starta timer (${durationText})
                    </button>
                    <p style="color: var(--green-medium); font-size: var(--text-xs); margin-top: var(--space-1); font-style: italic;">
                        Starta när du blandat in surdegsstarten
                    </p>
                </div>
            `}
        </div>
    `;
}

/**
 * Display the generated schedule
 */
function displaySchedule(schedule, startTime, endTime, timeDirection = 'forward', bulkStartTime = null, bulkEndTime = null, autoGenerate = false) {
    const display = document.getElementById('schedule-display');

    // Calculate total time
    const totalHours = Math.round((endTime - startTime) / (1000 * 60 * 60) * 10) / 10;

    // Update time-based hint if planning backward
    if (timeDirection === 'backward') {
        updateTimebasedHint(startTime, endTime);
    }

    // Calculate bulk fermentation duration for timer
    let bulkDurationHours = 0;
    if (bulkStartTime && bulkEndTime) {
        bulkDurationHours = (bulkEndTime - bulkStartTime) / (1000 * 60 * 60);
    }

    const directionNote = timeDirection === 'backward'
        ? `<p style="font-size: var(--text-sm); opacity: 0.85; margin-top: var(--space-1);">⏪ Beräknat bakåt från när brödet ska vara klart</p>`
        : '';

    let html = `
        <div style="background: linear-gradient(135deg, #7a8c6f 0%, #5d6e52 100%); color: white; padding: var(--space-4); border-radius: var(--radius-md); margin-bottom: var(--space-4); text-align: center; border-top: 3px solid var(--warm-accent);">
            <h3 style="font-size: var(--text-xl); margin-bottom: var(--space-2);">
                🕐 ${formatTime(startTime)} → ${formatTime(endTime)}
            </h3>
            <p style="font-size: var(--text-base); opacity: 0.9;">
                Total tid: <strong>${totalHours}h</strong>
            </p>
            ${directionNote}
        </div>

        <div class="schedule-timeline">
    `;

    // Add Day 1 header at the start
    const startWeekday = startTime.toLocaleDateString('sv-SE', { weekday: 'long' });
    const startDate = startTime.toLocaleDateString('sv-SE', { day: 'numeric', month: 'long' });

    html += `
        <div style="margin: var(--space-4) 0; padding: var(--space-3); background: linear-gradient(135deg, var(--green-lighter), var(--green-light)); border-radius: var(--radius-md); text-align: center; box-shadow: var(--shadow-sm);">
            <div style="font-size: var(--text-xl); font-weight: 700; color: white; margin-bottom: var(--space-1);">
                📅 Dag 1
            </div>
            <div style="font-size: var(--text-base); color: white; opacity: 0.95;">
                ${startWeekday.charAt(0).toUpperCase() + startWeekday.slice(1)} ${startDate}
            </div>
        </div>
    `;

    let currentDay = startTime.toDateString();

    schedule.forEach((step, index) => {
        const itemClass = step.milestone ? 'schedule-milestone' : step.important ? 'schedule-important' : 'schedule-item';
        const optional = step.optional ? ' <span style="font-size: var(--text-sm); opacity: 0.7;">(valfritt)</span>' : '';

        // Check if we've moved to a new day
        const stepDay = step.dateTime.toDateString();
        if (stepDay !== currentDay) {
            const dayNumber = getDayNumber(step.dateTime, startTime);
            const weekday = step.dateTime.toLocaleDateString('sv-SE', { weekday: 'long' });
            const date = step.dateTime.toLocaleDateString('sv-SE', { day: 'numeric', month: 'long' });

            html += `
                <div style="margin: var(--space-5) 0; padding: var(--space-3); background: linear-gradient(135deg, var(--green-lighter), var(--green-light)); border-radius: var(--radius-md); text-align: center; box-shadow: var(--shadow-sm);">
                    <div style="font-size: var(--text-xl); font-weight: 700; color: white; margin-bottom: var(--space-1);">
                        📅 Dag ${dayNumber}
                    </div>
                    <div style="font-size: var(--text-base); color: white; opacity: 0.95;">
                        ${weekday.charAt(0).toUpperCase() + weekday.slice(1)} ${date}
                    </div>
                </div>
            `;
            currentDay = stepDay;
        }

        // Calculate time since last step
        let timeSinceLastStep = '';
        if (index > 0) {
            const prevStep = schedule[index - 1];
            const diffMinutes = Math.round((step.dateTime - prevStep.dateTime) / (1000 * 60));

            if (diffMinutes > 0) {
                const hours = Math.floor(diffMinutes / 60);
                const mins = diffMinutes % 60;
                if (hours > 0) {
                    timeSinceLastStep = hours === 1 ? `+1h ${mins}min` : `+${hours}h${mins > 0 ? ` ${mins}min` : ''}`;
                } else {
                    timeSinceLastStep = `+${mins}min`;
                }
            }
        }

        // Format time with date if different day from start
        const displayTime = formatTimeWithDate(step.dateTime, startTime);

        const stepId = `step-${index}`;
        const isChecked = isStepChecked(stepId);
        const checkedClass = isChecked ? 'schedule-step-checked' : '';

        // Add bulk fermentation timer BEFORE start of bulk phase
        if (step.bulkPhase === 'start' && bulkStartTime && bulkEndTime) {
            html += generateBulkTimerSection(bulkStartTime, bulkEndTime, bulkDurationHours, 'start');
        }

        // Dark green background for bulk fermentation steps (darker for WCAG contrast)
        const bulkStyling = step.bulkPhase ?
            'background: linear-gradient(135deg, rgb(70, 85, 62), rgb(85, 100, 75)); border: 2px solid var(--green-dark);' : '';

        // White text for bulk steps (WCAG compliant contrast on dark green)
        const bulkTextColor = step.bulkPhase ? 'color: white;' : '';

        // Add bulk-step class for special checked styling
        const bulkClass = step.bulkPhase ? 'bulk-step' : '';

        html += `
            <div class="${itemClass} ${checkedClass} ${bulkClass}" style="position: relative; padding-left: 90px; margin-bottom: var(--space-4);" data-step-id="${stepId}">
                ${!step.milestone ? '<div class="schedule-line"></div>' : ''}

                <!-- Checkbox -->
                <div style="position: absolute; left: 0; top: 0;">
                    <input
                        type="checkbox"
                        id="${stepId}"
                        ${isChecked ? 'checked' : ''}
                        onchange="toggleStepCheck('${stepId}')"
                        style="width: 24px; height: 24px; cursor: pointer; margin-top: 2px;"
                        aria-label="Bocka av ${step.step}">
                </div>

                <div class="schedule-icon" style="left: 32px;">${step.icon}</div>
                <div class="schedule-content" style="${bulkStyling}">
                    <div style="display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-1); flex-wrap: wrap;">
                        <strong style="font-size: var(--text-lg); ${bulkTextColor || 'color: var(--green-dark);'}">${displayTime}</strong>
                        ${timeSinceLastStep ? `<span style="font-size: var(--text-sm); color: var(--warm-accent); font-weight: 600; background: rgba(212, 165, 116, 0.15); padding: 2px 8px; border-radius: 12px;">${timeSinceLastStep}</span>` : ''}
                        <span style="${bulkTextColor || 'color: var(--green-medium);'} font-size: var(--text-base);">${step.step}${optional}</span>
                    </div>
                    <p style="${bulkTextColor || 'color: var(--text-color);'} line-height: 1.6; font-size: var(--text-base);">
                        ${step.description}
                    </p>
                    ${step.duration > 0 ? `<p style="${bulkTextColor ? 'color: rgba(255,255,255,0.9);' : 'color: var(--green-medium);'} font-size: var(--text-sm); margin-top: var(--space-1);"><em>Åtgärd tar: ~${step.duration} min</em></p>` : ''}
                </div>
            </div>
        `;

        // Add bulk fermentation timer summary at END of bulk phase
        if (step.bulkPhase === 'end' && bulkStartTime && bulkEndTime) {
            html += generateBulkTimerSection(bulkStartTime, bulkEndTime, bulkDurationHours, 'end');
        }
    });

    html += `</div>`;

    // Hide empty state and show schedule
    const emptyState = document.getElementById('schedule-empty-state');
    if (emptyState) {
        emptyState.style.display = 'none';
    }

    // Add fade-in animation
    display.classList.add('schedule-updating');

    // Update content
    display.innerHTML = html;
    display.style.display = 'block';

    // Trigger animation
    setTimeout(() => {
        display.classList.remove('schedule-updating');
        display.classList.add('schedule-updated');

        // Show success toast (only if not auto-generated, e.g. timer operations)
        if (!autoGenerate) {
            showToast('Schema uppdaterat');
        }

        // Remove animation class after it completes
        setTimeout(() => {
            display.classList.remove('schedule-updated');
        }, 500);
    }, 100);
}

/**
 * Helper functions
 */
function addMinutes(date, minutes) {
    return new Date(date.getTime() + minutes * 60000);
}

function addHours(date, hours) {
    return new Date(date.getTime() + hours * 60 * 60000);
}

function parseTime(timeString) {
    // Parse "HH:MM" format and return Date object for today
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
}

/**
 * Check if a step is checked in localStorage
 */
function isStepChecked(stepId) {
    try {
        const checkedSteps = JSON.parse(localStorage.getItem('scheduleCheckedSteps') || '[]');
        return checkedSteps.includes(stepId);
    } catch (e) {
        console.error('Error reading checked steps:', e);
        return false;
    }
}

/**
 * Toggle step check status and save to localStorage
 */
window.toggleStepCheck = function(stepId) {
    try {
        const checkedSteps = JSON.parse(localStorage.getItem('scheduleCheckedSteps') || '[]');
        const index = checkedSteps.indexOf(stepId);

        if (index > -1) {
            // Remove from checked list
            checkedSteps.splice(index, 1);
        } else {
            // Add to checked list
            checkedSteps.push(stepId);
        }

        localStorage.setItem('scheduleCheckedSteps', JSON.stringify(checkedSteps));

        // Update visual state
        const stepElement = document.querySelector(`[data-step-id="${stepId}"]`);
        const checkbox = document.getElementById(stepId);

        // Check if this is "Bulkjäsning klar" and timer is running
        const stepText = stepElement?.querySelector('.schedule-content span')?.textContent || '';
        const isTimerRunning = SourdoughApp && SourdoughApp.timerInterval !== null;

        if (checkbox && checkbox.checked && stepText.includes('Bulkjäsning klar') && isTimerRunning) {
            // Ask if user wants to stop the timer
            const shouldStopTimer = confirm(
                '✅ Bulkjäsningen klar!\n\nSka jag stänga av timern?'
            );

            if (shouldStopTimer && typeof window.stopTimer === 'function') {
                window.stopTimer();

                // Hide the sticky timer from schedule
                const bulkTimerActive = document.getElementById('bulk-timer-active');
                if (bulkTimerActive && bulkTimerActive.parentElement) {
                    bulkTimerActive.parentElement.style.display = 'none';
                }

                // Show toast notification
                if (typeof window.showActionToast === 'function') {
                    window.showActionToast({
                        emoji: '✅',
                        text: 'Timer stoppad - Dags för preshape!'
                    }, 3000);
                }
            }
        }

        if (stepElement && checkbox) {
            if (checkbox.checked) {
                stepElement.classList.add('schedule-step-checked');
            } else {
                stepElement.classList.remove('schedule-step-checked');
            }
        }

        // Announce to screen reader (reuse stepText from above)
        if (checkbox && checkbox.checked) {
            announceToScreenReader(`${stepText || 'Steg'} markerat som klart`);
        } else {
            announceToScreenReader(`${stepText} avmarkerat`);
        }
    } catch (e) {
        console.error('Error toggling step check:', e);
    }
}

/**
 * Clear all checked steps from localStorage
 */
function clearCheckedSteps() {
    try {
        localStorage.removeItem('scheduleCheckedSteps');
    } catch (e) {
        console.error('Error clearing checked steps:', e);
    }
}

/**
 * Show contextual hint based on user journey selection
 */
function showContextualHint() {
    const userJourney = localStorage.getItem('userJourney');
    const journeyTimestamp = localStorage.getItem('userJourneyTimestamp');
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);

    // Don't show hint if journey is too old or doesn't exist
    if (!userJourney || !journeyTimestamp || journeyTimestamp < fiveMinutesAgo) {
        return;
    }

    const hintContainer = document.getElementById('journeyHint');
    const beginnerHint = document.getElementById('beginnerHint');
    const timebasedHint = document.getElementById('timebasedHint');
    const experiencedHint = document.getElementById('experiencedHint');

    if (!hintContainer) return;

    // Hide all hints first
    if (beginnerHint) beginnerHint.style.display = 'none';
    if (timebasedHint) timebasedHint.style.display = 'none';
    if (experiencedHint) experiencedHint.style.display = 'none';

    // Show appropriate hint based on journey
    if (userJourney === 'full-schedule' && beginnerHint) {
        beginnerHint.style.display = 'block';
        hintContainer.style.display = 'block';
    } else if (userJourney === 'backward-planning' && timebasedHint) {
        timebasedHint.style.display = 'block';
        hintContainer.style.display = 'block';
    } else if (userJourney === 'timer-only' && experiencedHint) {
        experiencedHint.style.display = 'block';
        hintContainer.style.display = 'block';
    }

    // Auto-hide after 8 seconds with fade-out effect
    setTimeout(() => {
        if (hintContainer) {
            hintContainer.style.transition = 'opacity 0.5s ease';
            hintContainer.style.opacity = '0';
            setTimeout(() => {
                hintContainer.style.display = 'none';
                hintContainer.style.opacity = '1'; // Reset for next time
            }, 500);
        }
    }, 8000);
}

/**
 * Update time-based hint with actual start and end times
 */
function updateTimebasedHint(startTime, endTime) {
    const timebasedHintText = document.getElementById('timebasedHintText');
    if (timebasedHintText && startTime && endTime) {
        const startStr = formatTime(startTime);
        const endStr = formatTime(endTime);
        timebasedHintText.innerHTML = `
            För att ha brödet klart kl <strong>${endStr}</strong>, börja baka kl <strong>${startStr}</strong>.
            Schemat visar alla steg bakåt från din färdigtid.
        `;
    }
}

/**
 * Start bulk fermentation timer from schedule
 */
window.startBulkTimerFromSchedule = function(durationHours) {
    console.log('startBulkTimerFromSchedule called with duration:', durationHours);

    // SourdoughApp is already imported at the top of this file
    if (!SourdoughApp) {
        console.error('SourdoughApp not available');
        showInlineMessage('⚠️ Timer-funktionen är inte tillgänglig. Vänligen ladda om sidan.', 'error');
        return;
    }

    // Set the calculated time for the timer
    SourdoughApp.calculatedTime = durationHours;

    // Start the timer using the existing startTimer function
    if (typeof window.startTimer === 'function') {
        window.startTimer();

        // Show toast notification
        if (typeof window.showActionToast === 'function') {
            window.showActionToast({
                emoji: '⏰',
                text: `Bulkjäsningstimer startad! ${Math.round(durationHours * 60)} minuter till preshape.`
            }, 4000);
        }

        // Regenerate schedule to show active timer
        setTimeout(() => {
            if (typeof window.generateBakingSchedule === 'function') {
                window.generateBakingSchedule(true);
            }
        }, 500);

        announceToScreenReader(`Bulkjäsningstimer startad för ${Math.round(durationHours * 60)} minuter.`);
    } else {
        console.error('startTimer function not available');
        showInlineMessage('❌ Kunde inte starta timer. Vänligen försök igen.', 'error');
    }
}

/**
 * Remove bulk fermentation timer completely
 */
window.removeBulkTimer = function() {
    // Save current scroll position
    const scrollPosition = window.scrollY || window.pageYOffset;

    // Stop timer if running
    if (SourdoughApp.timerInterval) {
        clearInterval(SourdoughApp.timerInterval);
    }

    // Reset timer state
    SourdoughApp.timerInterval = null;
    SourdoughApp.isPaused = false;
    SourdoughApp.remainingTime = 0;
    SourdoughApp.endTime = null;

    // Regenerate schedule without timer
    if (typeof window.generateBakingSchedule === 'function') {
        window.generateBakingSchedule(true);
    }

    // Restore scroll position after a brief delay to allow DOM to update
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            window.scrollTo(0, scrollPosition);
        });
    });

    announceToScreenReader('Bulkjäsningstimer borttagen.');
}

/**
 * Update timer button states without regenerating entire schedule
 */
window.updateTimerButtons = function() {
    const startBtn = document.getElementById('scheduleTimerStartBtn');
    const pauseBtn = document.getElementById('scheduleTimerPauseBtn');
    const timerDisplay = document.getElementById('timer-in-schedule');

    const isPaused = SourdoughApp && SourdoughApp.isPaused;

    if (startBtn && pauseBtn) {
        // Update start button
        if (isPaused) {
            startBtn.disabled = false;
            startBtn.style.opacity = '1';
            startBtn.style.cursor = 'pointer';
            startBtn.style.pointerEvents = 'auto';
        } else {
            startBtn.disabled = true;
            startBtn.style.opacity = '0.3';
            startBtn.style.cursor = 'not-allowed';
            startBtn.style.pointerEvents = 'none';
        }

        // Update pause button
        if (isPaused) {
            pauseBtn.disabled = true;
            pauseBtn.style.opacity = '0.3';
            pauseBtn.style.cursor = 'not-allowed';
            pauseBtn.style.pointerEvents = 'none';
        } else {
            pauseBtn.disabled = false;
            pauseBtn.style.opacity = '1';
            pauseBtn.style.cursor = 'pointer';
            pauseBtn.style.pointerEvents = 'auto';
        }

        // Update timer display if paused
        if (isPaused && timerDisplay && SourdoughApp.remainingTime) {
            const remaining = SourdoughApp.remainingTime;
            const hours = Math.floor(remaining / (1000 * 60 * 60));
            const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
            timerDisplay.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }
    }
}

/**
 * Update bread emojis in schedule
 */
function updateScheduleBreadEmojis() {
    const numLoaves = parseFloat(document.getElementById('scheduleNumLoavesMain')?.value) || 2;
    const breadEmojisElement = document.getElementById('breadEmojisSchedule');
    if (breadEmojisElement) {
        breadEmojisElement.textContent = '🍞'.repeat(Math.min(numLoaves, 10)); // Max 10 emojis for display
    }
}

/**
 * Update total dough weight display
 */
function updateTotalDoughWeight() {
    const dataSource = document.querySelector('input[name="scheduleDataSource"]:checked')?.value;
    const totalWeightElement = document.getElementById('totalWeightValue');
    
    if (!totalWeightElement) return;

    if (dataSource === 'calculated') {
        // Get values from calculator
        const flour = parseFloat(document.getElementById('flour')?.value) || 0;
        const water = parseFloat(document.getElementById('water')?.value) || 0;
        const starter = parseFloat(document.getElementById('starter')?.value) || 0;
        const salt = parseFloat(document.getElementById('salt')?.value) || 0;
        const totalWeight = flour + water + starter + salt;
        
        if (totalWeight > 0) {
            const numLoaves = parseFloat(document.getElementById('scheduleNumLoavesMain')?.value) || 2;
            const weightPerLoaf = Math.round(totalWeight / numLoaves);
            totalWeightElement.innerHTML = `${totalWeight}g (${weightPerLoaf}g/st)`;
        } else {
            totalWeightElement.textContent = '—';
        }
    } else {
        // Manual mode - show from manual inputs
        const numLoaves = parseFloat(document.getElementById('manualNumLoaves')?.value) || 1;
        const weightPerLoaf = parseFloat(document.getElementById('manualLoafWeight')?.value) || 800;
        const totalWeight = numLoaves * weightPerLoaf;
        totalWeightElement.innerHTML = `${totalWeight}g (${weightPerLoaf}g/st)`;
    }
}

// Initialize loaf counter buttons
setTimeout(() => {
    const loafButtons = document.querySelectorAll('.loaf-btn');
    loafButtons.forEach(button => {
        button.addEventListener('click', function() {
            const target = this.getAttribute('data-target');
            const input = document.getElementById(target);
            if (!input) return;

            const currentValue = parseInt(input.value) || 2;
            const isPlus = this.classList.contains('loaf-btn-plus');
            const newValue = isPlus ? Math.min(currentValue + 1, 10) : Math.max(currentValue - 1, 1);

            input.value = newValue;

            // Update display button if it exists
            const displayButton = document.getElementById('scheduleNumLoavesDisplay');
            if (displayButton) {
                displayButton.textContent = newValue;
                displayButton.setAttribute('aria-label', `Antal bröd: ${newValue}`);
            }

            updateScheduleBreadEmojis();
            updateTotalDoughWeight();
            tryAutoGenerateSchedule();
        });
    });

    // Initial update
    updateScheduleBreadEmojis();
    updateTotalDoughWeight();
}, 100);
