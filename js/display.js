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
 */
export function generateRecipeCardsHTML(foldingSchedule, bakingTimes, hydration, numLoaves) {
    const { folds, foldInterval, totalFoldingTime } = foldingSchedule;
    const { weightPerLoaf, bakingTimeTotal, bakingTimeCovered, bakingTimeUncovered } = bakingTimes;
    const foldIntervalText = `var ${foldInterval}:e minut under första ${totalFoldingTime}h`;

    return `
        <div class="recipe-cards">
            <div class="recipe-card">
                <h3><span class="icon">🙌</span> Vikning av degen</h3>
                <div class="recipe-card-content">
                    <strong>${folds} stretch & folds</strong><br>
                    <span style="color: var(--green-medium); font-size: var(--text-sm);">
                        <strong style="color: var(--green-dark);">Varför ${folds} vikningar?</strong><br>
                        Din deg har <strong>${hydration.toFixed(0)}% hydrering</strong> ${hydration > 80 ? '(mycket blöt)' : hydration > 75 ? '(blöt)' : '(medel)'}
                        → ${hydration > 80 ? 'extra vikningar behövs för styrka' : hydration > 75 ? 'fler vikningar för struktur' : 'standard antal vikningar'}.<br><br>
                        <strong>Så här gör du:</strong><br>
                        Vik degen ${foldIntervalText}, sedan låt degen vila ostörd.
                        Vikningarna utvecklar glutennätverket och ger degen struktur att hålla formen.
                    </span>
                </div>
            </div>

            <div class="recipe-card">
                <h3><span class="icon">🔥</span> Gräddning</h3>

                <div class="recipe-card-content" style="margin-bottom: var(--space-4);">
                    <label for="numLoaves" style="display: block; margin-bottom: var(--space-2); font-size: var(--text-base); font-weight: 700;">Antal bröd att forma:</label>
                    <div style="display: flex; align-items: center; gap: var(--space-3);">
                        <div class="input-wrapper" style="max-width: 200px;">
                            <input
                                type="number"
                                id="numLoaves"
                                value="${numLoaves}"
                                min="1"
                                max="10"
                                step="1"
                                style="font-size: var(--text-lg);">
                            <span class="unit" style="font-size: var(--text-base);">st</span>
                        </div>
                        <div id="breadEmojis" style="font-size: 24px; line-height: 1;">${'🍞'.repeat(numLoaves)}</div>
                    </div>
                    <div style="margin-top: var(--space-2); padding: var(--space-2); background: rgba(159, 176, 148, 0.15); border-radius: var(--radius-sm); font-size: var(--text-sm); color: var(--green-dark); font-weight: 600;">
                        ${numLoaves} bröd à ${Math.round(weightPerLoaf)}g = ${bakingTimeTotal} min gräddning/bröd
                    </div>
                </div>

                <div style="border-top: 2px solid var(--green-lighter); padding-top: var(--space-3); margin-top: var(--space-3);">
                    <h4 style="color: var(--green-dark); font-size: var(--text-base); margin-bottom: var(--space-2); display: flex; align-items: center; gap: var(--space-1); font-weight: 700;">
                        <span>🔥</span> Dutch Oven
                    </h4>
                    <div class="baking-instructions">
                        <div class="baking-step">Förvärm ugn till 250°C med gryta i ugnen</div>
                        <div class="baking-step">Baka med lock: 230°C i ${bakingTimeCovered} min</div>
                        <div class="baking-step">Baka utan lock: 220°C i ${bakingTimeUncovered} min</div>
                        <div class="baking-step"><strong>Total: ~${bakingTimeTotal} min/bröd</strong></div>
                    </div>
                </div>

                <div style="border-top: 2px solid var(--green-lighter); padding-top: var(--space-3); margin-top: var(--space-3);">
                    <h4 style="color: var(--green-dark); font-size: var(--text-base); margin-bottom: var(--space-2); display: flex; align-items: center; gap: var(--space-1); font-weight: 700;">
                        <span>💨</span> Öppen bakning
                    </h4>
                    <div class="baking-instructions">
                        <div class="baking-step">Förvärm ugn till 250°C</div>
                        <div class="baking-step">Baka med ånga: 240°C i ${bakingTimeCovered} min</div>
                        <div class="baking-step">Baka utan ånga: 210°C i ${bakingTimeUncovered} min</div>
                        <div class="baking-step"><strong>Total: ~${bakingTimeTotal} min/bröd</strong></div>
                        <div class="baking-step" style="color: var(--green-medium); font-style: italic; font-size: var(--text-xs);">Kräver bakugn med ångfunktion</div>
                    </div>
                </div>
            </div>
        </div>
    `;
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

    document.getElementById('hydrationPercent').textContent = `${hydrationPercent}%`;
    document.getElementById('starterPercent').textContent = `${starterPercent}%`;
    document.getElementById('saltPercent').textContent = `${saltPercent}%`;
    document.getElementById('totalWeight').textContent = `${totalWeight}g`;
}
