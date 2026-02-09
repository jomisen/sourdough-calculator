export function validateRecipeWarnings(flour, water, starter, salt) {
    const warnings = [];
    if (!flour || flour === 0 || !water || !starter || !salt) {
        return warnings;
    }
    const hydration = (water / flour) * 100;
    const starterPercent = (starter / flour) * 100;
    const saltPercent = (salt / flour) * 100;
    if (hydration < 50) {
        warnings.push({
            icon: '💧',
            message: 'Mycket låg hydrering (<50%). Degen blir extremt torr och svår att arbeta med.',
            severity: 'warning'
        });
    }
    else if (hydration > 100) {
        warnings.push({
            icon: '🌊',
            message: 'Mycket hög hydrering (>100%). Degen blir extremt blöt och svårhanterlig.',
            severity: 'warning'
        });
    }
    if (starterPercent > 40) {
        warnings.push({
            icon: '⚠️',
            message: 'Mycket hög surdegsandel (>40%). Risk för överjäsning och sur smak.',
            severity: 'warning'
        });
    }
    else if (starterPercent < 5) {
        warnings.push({
            icon: '🐌',
            message: 'Mycket låg surdegsandel (<5%). Jäsningen kommer ta väldigt lång tid (15+ timmar).',
            severity: 'warning'
        });
    }
    if (saltPercent > 3) {
        warnings.push({
            icon: '🧂',
            message: 'Mycket salt (>3%). Brödet kan bli för salt och jäsningen bromsas kraftigt.',
            severity: 'warning'
        });
    }
    else if (saltPercent < 1) {
        warnings.push({
            icon: '😐',
            message: 'Lite salt (<1%). Brödet kan bli smaklöst och jäsa för snabbt.',
            severity: 'warning'
        });
    }
    if (hydration > 80 && starterPercent > 25) {
        warnings.push({
            icon: '🚀',
            message: 'Kombination av hög hydrering (>80%) och mycket surdeg (>25%) ger MYCKET snabb jäsning. Håll noga koll!',
            severity: 'caution'
        });
    }
    if (hydration < 60 && starterPercent < 10) {
        warnings.push({
            icon: '⏰',
            message: 'Kombination av låg hydrering (<60%) och lite surdeg (<10%) ger MYCKET långsam jäsning.',
            severity: 'info'
        });
    }
    return warnings;
}
export function displayWarnings(warnings) {
    const oldWarning = document.getElementById('recipe-warnings');
    if (oldWarning) {
        oldWarning.remove();
    }
    if (!warnings || warnings.length === 0) {
        return;
    }
    const warningBox = document.createElement('div');
    warningBox.id = 'recipe-warnings';
    warningBox.className = 'recipe-warnings';
    warningBox.setAttribute('role', 'alert');
    warningBox.setAttribute('aria-live', 'polite');
    const warningsHTML = warnings
        .filter(w => w && w.icon && w.message && w.severity)
        .map(w => `
            <li class="warning-item warning-item--${w.severity}">
                <span class="warning-icon" aria-hidden="true">${w.icon}</span>
                <span class="warning-text">${w.message}</span>
            </li>
        `).join('');
    if (!warningsHTML) {
        return;
    }
    warningBox.innerHTML = `
        <div class="warning-header">
            <span class="warning-title" style="display: flex; align-items: center; gap: 6px;">⚠️ Kontrollera dina värden</span>
        </div>
        <ul class="warning-list">
            ${warningsHTML}
        </ul>
        <p class="warning-footer">
            Kalkylatorn beräknar ändå - detta är bara vägledning.
        </p>
    `;
    const resultSection = document.getElementById('result');
    if (resultSection && resultSection.parentNode) {
        try {
            resultSection.parentNode.insertBefore(warningBox, resultSection);
            setTimeout(() => {
                if (warningBox && warningBox.scrollIntoView) {
                    warningBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
            }, 100);
        }
        catch (error) {
            console.error('Failed to insert warning box:', error);
            resultSection.appendChild(warningBox);
        }
    }
    else {
        console.warn('Could not find result section to insert warnings');
    }
    const message = warnings.map(w => w.message).join('. ');
    const announcement = document.getElementById('sr-announcements');
    if (announcement) {
        announcement.textContent = `Varningar: ${message}`;
        setTimeout(() => {
            announcement.textContent = '';
        }, 5000);
    }
}
export function validateInputs() {
    const inputs = [
        { id: 'temperature', min: 15, max: 30, name: 'Temperatur', unit: '°C' },
        { id: 'starter', min: 10, max: 2000, name: 'Surdegsstart', unit: 'g' },
        { id: 'flour', min: 100, max: 10000, name: 'Mjöl', unit: 'g' },
        { id: 'water', min: 50, max: 10000, name: 'Vatten', unit: 'g' },
        { id: 'salt', min: 0, max: 500, name: 'Salt', unit: 'g' }
    ];
    let isValid = true;
    for (const input of inputs) {
        const element = document.getElementById(input.id);
        if (!element)
            continue;
        const value = parseFloat(element.value);
        const errorId = `${input.id}-error`;
        let errorElement = document.getElementById(errorId);
        if (isNaN(value) || value < input.min || value > input.max) {
            element.classList.add('invalid');
            element.setAttribute('aria-invalid', 'true');
            element.setAttribute('aria-describedby', errorId);
            if (!errorElement) {
                errorElement = document.createElement('span');
                errorElement.id = errorId;
                errorElement.className = 'error-message';
                errorElement.setAttribute('role', 'alert');
                element.parentElement?.appendChild(errorElement);
            }
            if (isNaN(value)) {
                errorElement.textContent = `${input.name} måste vara ett tal`;
            }
            else if (value < input.min) {
                errorElement.textContent = `Minst ${input.min}${input.unit}`;
            }
            else {
                errorElement.textContent = `Max ${input.max}${input.unit}`;
            }
            isValid = false;
        }
        else {
            element.classList.remove('invalid');
            element.removeAttribute('aria-invalid');
            element.removeAttribute('aria-describedby');
            if (errorElement) {
                errorElement.remove();
            }
        }
    }
    return isValid;
}
//# sourceMappingURL=validation.js.map