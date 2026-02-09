/**
 * Format time as hours and minutes
 */
export function formatHoursMinutes(time) {
    const hours = Math.floor(time);
    const minutes = Math.round((time - hours) * 60);
    return { hours, minutes };
}

/**
 * Generate time display text
 */
export function generateTimeDisplayText(time, coldProof) {
    const { hours, minutes } = formatHoursMinutes(time);
    let timeText = `Bulkjäsning:<br>${hours}h ${minutes}min`;
    if (coldProof > 0) {
        timeText += ` + ${coldProof}h kalljäsning`;
    }
    return timeText;
}

/**
 * Generate time range info text
 */
export function generateTimeRangeInfo(minTime, maxTime, coldProof, fridgeTemp, coldProofEquivalent, bulkAdjustment) {
    const { hours: minHours, minutes: minMinutes } = formatHoursMinutes(minTime);
    const { hours: maxHours, minutes: maxMinutes } = formatHoursMinutes(maxTime);

    let timeInfo = `Intervall bulkjäsning: ${minHours}h ${minMinutes}min - ${maxHours}h ${maxMinutes}min`;

    if (coldProof > 0) {
        const totalMin = Math.floor(minTime + coldProof);
        const totalMax = Math.ceil(maxTime + coldProof);
        const equivalentHours = coldProofEquivalent.toFixed(1);
        const fermentRate = ((coldProofEquivalent / coldProof) * 100).toFixed(0);

        timeInfo += `<br><strong>Total tid (bulk + kall): ${totalMin}-${totalMax}h</strong>`;
        timeInfo += `<br><span style="font-size: var(--text-sm); opacity: 0.85;">Kalljäsning vid ${fridgeTemp}°C motsvarar ~${equivalentHours}h jäsning (${fermentRate}% hastighet)</span>`;

        if (bulkAdjustment > 0) {
            timeInfo += `<br><span style="font-size: var(--text-sm); color: #c9a875;">💡 Varmt kylskåp - bulkjäsningen förkortad med ${bulkAdjustment.toFixed(1)}h</span>`;
        } else if (fridgeTemp <= 6) {
            timeInfo += `<br><span style="font-size: var(--text-sm); opacity: 0.75;">✅ Perfekt kyltemp - ingen justering av bulkjäsning behövs</span>`;
        }
    }

    return timeInfo;
}

/**
 * Generate recipe cards HTML
 * Note: Folding and baking instructions moved to schedule tab
 */
export function generateRecipeCardsHTML(foldingSchedule, bakingTimes, hydration, numLoaves) {
    // Cards removed - information now in schedule tab
    return '';
}

/**
 * Generate contextual info text based on temperature and starter percentage
 */
export function generateInfoText(temp, starterPercent) {
    let info = '';

    if (temp < 20) {
        info = '❄️ Låg temperatur ger långsam jäsning och mer komplex smak. Perfekt för över natten!';
    } else if (temp > 26) {
        info = '🌡️ Hög temperatur ger snabb jäsning. Håll koll så degen inte överjäser!';
    } else {
        info = '✅ Perfekt temperatur för jäsning. Degen kommer utvecklas fint!';
    }

    if (starterPercent > 30) {
        info += ' Mycket surdeg i degen ger snabb jäsning och syrligare smak.';
    } else if (starterPercent < 15) {
        info += ' Lite surdeg ger långsammare jäsning och mildare smak.';
    }

    return info;
}

/**
 * Announce messages to screen readers
 */
export function announceToScreenReader(message, duration = 3000) {
    const announcement = document.getElementById('sr-announcements');
    announcement.textContent = message;

    // Clear after a delay to allow screen readers to read the message
    // Default 3 seconds gives enough time for most screen readers
    setTimeout(() => {
        announcement.textContent = '';
    }, duration);
}

/**
 * Update bread emojis display
 */
export function updateBreadEmojis() {
    const numLoaves = parseFloat(document.getElementById('numLoaves')?.value) || 1;
    const breadEmojisElement = document.getElementById('breadEmojis');
    if (breadEmojisElement) {
        breadEmojisElement.textContent = '🍞'.repeat(numLoaves);
    }
}

/**
 * Update whole grain percentage display
 */
export function updateWholeGrainPercent() {
    const flour = parseFloat(document.getElementById('flour')?.value) || 0;
    const wholeGrainAmount = parseFloat(document.getElementById('wholeGrainAmount')?.value) || 0;
    const percent = flour > 0 ? Math.min((wholeGrainAmount / flour) * 100, 100) : 0;
    const percentElement = document.getElementById('wholeGrainPercent');
    if (percentElement) {
        percentElement.textContent = `${percent.toFixed(0)}%`;
    }
}

/**
 * Update recipe summary
 */
export function updateRecipeSummary() {
    const flour = parseFloat(document.getElementById('flour')?.value) || 0;
    const water = parseFloat(document.getElementById('water')?.value) || 0;
    const starter = parseFloat(document.getElementById('starter')?.value) || 0;
    const salt = parseFloat(document.getElementById('salt')?.value) || 0;

    const totalWeight = flour + water + starter + salt;
    const hydrationPercent = flour > 0 ? ((water / flour) * 100).toFixed(0) : 0;
    const starterPercent = flour > 0 ? ((starter / flour) * 100).toFixed(0) : 0;
    const saltPercent = flour > 0 ? ((salt / flour) * 100).toFixed(1) : 0;

    // Update percentage displays
    document.getElementById('flourPercent').textContent = '100%';
    document.getElementById('waterPercent').textContent = `${hydrationPercent}% hydrering`;
    document.getElementById('starterPercent').textContent = `${starterPercent}%`;
    document.getElementById('saltPercent').textContent = `${saltPercent}%`;
    document.getElementById('totalWeight').textContent = `${totalWeight}g`;

    // Update hydration input field if it exists
    const hydrationInput = document.getElementById('hydrationInput');
    if (hydrationInput && hydrationPercent > 0) {
        hydrationInput.value = hydrationPercent;
    }
}
