import { SourdoughApp } from './constants.js';
import { formatTime } from './timer.js';
import { announceToScreenReader } from './display.js';
function showInlineMessage(message, type = 'info', containerId = 'scheduleOutput', duration = 0) {
    const container = document.getElementById(containerId);
    if (!container)
        return;
    const existing = container.querySelector('.inline-message');
    if (existing) {
        existing.remove();
    }
    const icons = {
        warning: '⚠️',
        error: '❌',
        success: '✅',
        info: 'ℹ️'
    };
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
    container.insertBefore(messageEl, container.firstChild);
    messageEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    announceToScreenReader(message);
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
function formatTimeWithDate(date, referenceDate) {
    const sameDay = date.toDateString() === referenceDate.toDateString();
    if (sameDay) {
        return formatTime(date);
    }
    else {
        const weekday = date.toLocaleDateString('sv-SE', { weekday: 'long' });
        const dayMonth = date.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
        const time = formatTime(date);
        return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)} ${dayMonth}, ${time}`;
    }
}
function getDayNumber(date, startDate) {
    const dateAtMidnight = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const startAtMidnight = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const diffTime = dateAtMidnight.getTime() - startAtMidnight.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1;
}
export function initSchedule() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const currentTime = `${hours}:${minutes}`;
    const timeInput = document.getElementById('scheduleTime');
    if (timeInput) {
        timeInput.value = currentTime;
    }
    updateFoldsRecommendation();
    updateAutolysFromCalculator();
    window.toggleTimeDirection();
}
window.toggleTimeDirection = function () {
    const direction = document.querySelector('input[name="timeDirection"]:checked')?.value;
    const hint = document.getElementById('timeDirectionHint');
    const timeInput = document.getElementById('scheduleTime');
    const timeLabel = document.getElementById('scheduleTimeLabel');
    if (timeLabel) {
        if (direction === 'forward') {
            timeLabel.innerHTML = '🕐 När vill du baka?';
        }
        else {
            timeLabel.innerHTML = '🎯 När ska brödet vara klart?';
        }
    }
    if (hint && timeInput) {
        const time = timeInput.value || '08:00';
        const estimatedHours = SourdoughApp.calculatedTime || 10;
        if (direction === 'forward') {
            const [hours, minutes] = time.split(':').map(Number);
            const endHours = (hours + Math.round(estimatedHours)) % 24;
            const endTime = `${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
            hint.innerHTML = `Börja kl <strong>${time}</strong> → Klart ca kl <strong>${endTime}</strong>`;
        }
        else {
            const [hours, minutes] = time.split(':').map(Number);
            let startHours = hours - Math.round(estimatedHours);
            if (startHours < 0)
                startHours += 24;
            const startTime = `${String(startHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
            hint.innerHTML = `Börja ca kl <strong>${startTime}</strong> → Klart kl <strong>${time}</strong>`;
        }
    }
    tryAutoGenerateSchedule();
};
window.goToScheduleTab = function () {
    if (typeof window.switchTab === 'function') {
        window.switchTab('schedule');
    }
    setTimeout(() => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
        tryAutoGenerateSchedule();
    }, 100);
};
function tryAutoGenerateSchedule() {
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
    if (dataSource === 'calculated' && !SourdoughApp.calculatedTime) {
        const flour = parseFloat(document.getElementById('flour')?.value || '0');
        const water = parseFloat(document.getElementById('water')?.value || '0');
        if (flour && water && typeof window.calculateTime === 'function') {
            window.calculateTime();
        }
    }
    if (dataSource === 'calculated' && !SourdoughApp.calculatedTime) {
        if (emptyState) {
            emptyState.style.display = 'block';
        }
        if (scheduleDisplay) {
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
    window.generateBakingSchedule(true);
}
function setupTabSwitchListener() {
    const scheduleTabButton = document.getElementById('schedule-tab-button');
    if (scheduleTabButton) {
        scheduleTabButton.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
            showContextualHint();
            setTimeout(() => {
                tryAutoGenerateSchedule();
            }, 100);
        });
    }
}
function setupScheduleLiveUpdates() {
    const timeInput = document.getElementById('scheduleTime');
    if (timeInput) {
        timeInput.addEventListener('change', () => {
            window.toggleTimeDirection();
            tryAutoGenerateSchedule();
        });
        timeInput.addEventListener('input', () => {
            window.toggleTimeDirection();
        });
    }
    document.querySelectorAll('input[name="timeDirection"]').forEach(radio => {
        radio.addEventListener('change', () => window.toggleTimeDirection());
    });
    document.querySelectorAll('input[name="scheduleDataSource"]').forEach(radio => {
        radio.addEventListener('change', () => tryAutoGenerateSchedule());
    });
    const autolysCheckbox = document.getElementById('scheduleAutolys');
    if (autolysCheckbox) {
        autolysCheckbox.addEventListener('change', () => tryAutoGenerateSchedule());
    }
    const autolysTime = document.getElementById('autolysTime');
    if (autolysTime) {
        autolysTime.addEventListener('change', () => tryAutoGenerateSchedule());
    }
    const folds = document.getElementById('scheduleFolds');
    if (folds) {
        folds.addEventListener('change', () => tryAutoGenerateSchedule());
    }
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
    document.querySelectorAll('input[name="bakingMethod"]').forEach(radio => {
        radio.addEventListener('change', () => tryAutoGenerateSchedule());
    });
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
function updateFoldsRecommendation() {
    const flour = parseFloat(document.getElementById('flour')?.value || '500');
    const water = parseFloat(document.getElementById('water')?.value || '350');
    const hydration = (water / flour) * 100;
    let recommendedFolds = 3;
    if (hydration > 80) {
        recommendedFolds = 5;
    }
    else if (hydration > 75) {
        recommendedFolds = 4;
    }
    const foldsSelect = document.getElementById('scheduleFolds');
    const foldsRecommendation = document.getElementById('foldsRecommendation');
    if (foldsSelect && foldsRecommendation) {
        foldsSelect.value = String(recommendedFolds);
        foldsRecommendation.textContent = `Rekommenderat: ${recommendedFolds} (${hydration.toFixed(0)}% hydrering)`;
    }
    updateAutolysFromCalculator();
}
function updateAutolysFromCalculator() {
    const autolyseValue = document.getElementById('autolyse')?.value;
    const scheduleAutolysCheckbox = document.getElementById('scheduleAutolys');
    const autolysTimeSelect = document.getElementById('autolysTime');
    const autolysTimeGroup = document.getElementById('autolysTimeGroup');
    if (!scheduleAutolysCheckbox || !autolysTimeSelect || !autolysTimeGroup)
        return;
    const dataSource = document.querySelector('input[name="scheduleDataSource"]:checked')?.value;
    if (dataSource !== 'calculated')
        return;
    if (autolyseValue === 'no') {
        scheduleAutolysCheckbox.checked = false;
        autolysTimeGroup.style.display = 'none';
    }
    else {
        scheduleAutolysCheckbox.checked = true;
        autolysTimeGroup.style.display = 'block';
        if (autolyseValue === '30') {
            autolysTimeSelect.value = '30';
        }
        else if (autolyseValue === '60') {
            autolysTimeSelect.value = '60';
        }
        else if (autolyseValue === '120') {
            autolysTimeSelect.value = '90';
        }
    }
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initSchedule();
        setupScheduleLiveUpdates();
        setupTabSwitchListener();
    });
}
else {
    initSchedule();
    setupScheduleLiveUpdates();
    setupTabSwitchListener();
}
window.updateFoldsRecommendation = updateFoldsRecommendation;
window.toggleScheduleInputs = function () {
    const dataSource = document.querySelector('input[name="scheduleDataSource"]:checked')?.value;
    const manualInputs = document.getElementById('manualScheduleInputs');
    if (manualInputs) {
        manualInputs.style.display = dataSource === 'manual' ? 'block' : 'none';
    }
    if (dataSource === 'calculated') {
        updateAutolysFromCalculator();
    }
};
function showScheduleLoading() {
    const display = document.getElementById('schedule-display');
    const emptyState = document.getElementById('schedule-empty-state');
    if (emptyState) {
        emptyState.style.display = 'none';
    }
    if (display) {
        display.innerHTML = `
            <div class="schedule-loading">
                <div class="loading-spinner"></div>
                <p style="font-size: var(--text-base); font-weight: 600;">Skapar ditt bakschema...</p>
            </div>
        `;
        display.style.display = 'block';
    }
}
function showToast(message, duration = 3000) {
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) {
        existingToast.remove();
    }
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerHTML = `<span>✓</span> <span>${message}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, duration);
}
window.generateBakingSchedule = function (autoGenerate = false) {
    showScheduleLoading();
    setTimeout(() => {
        generateScheduleInternal(autoGenerate);
    }, 50);
};
function generateScheduleInternal(autoGenerate = false) {
    clearCheckedSteps();
    const dataSource = document.querySelector('input[name="scheduleDataSource"]:checked')?.value;
    const timeInput = document.getElementById('scheduleTime');
    const inputTime = timeInput?.value || '';
    if (!inputTime) {
        if (!autoGenerate) {
            showInlineMessage('⏰ Välj en tid för att generera ditt bakschema!', 'warning');
        }
        return;
    }
    const timeDirection = (document.querySelector('input[name="timeDirection"]:checked')?.value || 'forward');
    let bulkTime, coldProof, numLoaves, weightPerLoaf, flour, water, hydration;
    if (dataSource === 'calculated') {
        if (!SourdoughApp.calculatedTime) {
            if (!autoGenerate) {
                showInlineMessage('📊 Du har inte beräknat någon deg än!<br><br><strong>Välj antingen:</strong><br>• Gå till <strong>Beräkna jästid</strong>-fliken och beräkna först, eller<br>• Välj <strong>"Ange egna värden"</strong> här nedan.', 'warning');
            }
            return;
        }
        bulkTime = SourdoughApp.calculatedTime;
        coldProof = parseFloat(document.getElementById('coldProof')?.value || '0');
        flour = parseFloat(document.getElementById('flour')?.value || '500');
        water = parseFloat(document.getElementById('water')?.value || '350');
        hydration = (water / flour) * 100;
        numLoaves = parseFloat(document.getElementById('scheduleNumLoavesMain')?.value || '2');
        const starter = parseFloat(document.getElementById('starter')?.value || '100');
        const salt = parseFloat(document.getElementById('salt')?.value || '10');
        const totalWeight = flour + water + starter + salt;
        weightPerLoaf = totalWeight / numLoaves;
    }
    else {
        bulkTime = parseFloat(document.getElementById('manualBulkTime')?.value || '5');
        coldProof = document.getElementById('manualColdProof')?.checked
            ? parseFloat(document.getElementById('manualColdProofTime')?.value || '0')
            : 0;
        numLoaves = parseFloat(document.getElementById('manualNumLoaves')?.value || '1');
        weightPerLoaf = parseFloat(document.getElementById('manualLoafWeight')?.value || '800');
        flour = 500;
        water = 350;
        hydration = 70;
    }
    const useAutolys = document.getElementById('scheduleAutolys')?.checked || false;
    const autolysTime = parseInt(document.getElementById('autolysTime')?.value || '60');
    const numFolds = parseInt(document.getElementById('scheduleFolds')?.value || '3');
    const bakingMethod = (document.querySelector('input[name="bakingMethod"]:checked')?.value || 'dutch-oven');
    const foldInterval = 30;
    const totalFoldingTime = ((numFolds - 1) * foldInterval) / 60;
    const bakingTimePerLoaf = Math.round(20 + (weightPerLoaf - 500) / 100 * 5);
    const bakingTimeCovered = Math.round(bakingTimePerLoaf * 0.6);
    const bakingTimeUncovered = bakingTimePerLoaf - bakingTimeCovered;
    let totalTimeMinutes = 0;
    if (useAutolys)
        totalTimeMinutes += autolysTime;
    totalTimeMinutes += 30;
    totalTimeMinutes += 30;
    totalTimeMinutes += (numFolds - 1) * foldInterval;
    totalTimeMinutes += (bulkTime - totalFoldingTime) * 60;
    totalTimeMinutes += 10;
    totalTimeMinutes += 25;
    totalTimeMinutes += 15;
    if (coldProof > 0)
        totalTimeMinutes += coldProof * 60;
    totalTimeMinutes += bakingTimePerLoaf;
    let startDate;
    const [hours, minutes] = inputTime.split(':').map(Number);
    if (timeDirection === 'forward') {
        startDate = new Date();
        startDate.setHours(hours, minutes, 0, 0);
    }
    else {
        const endDate = new Date();
        endDate.setHours(hours, minutes, 0, 0);
        startDate = new Date(endDate.getTime() - totalTimeMinutes * 60000);
    }
    const schedule = [];
    let currentTime = new Date(startDate);
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
    const starterAmount = dataSource === 'calculated'
        ? parseFloat(document.getElementById('starter')?.value || '100')
        : Math.round(flour * 0.2);
    let starterDescription;
    if (dataSource === 'calculated') {
        if (useAutolys) {
            starterDescription = `Blanda in ${starterAmount}g aktiv surdegsstart. Blanda ordentligt tills degen är jämn.`;
        }
        else {
            starterDescription = `Blanda ${starterAmount}g aktiv surdegsstart i ${water}g vatten. Tillsätt sedan ${flour}g mjöl och arbeta ihop till en deg.`;
        }
    }
    else {
        starterDescription = `Blanda in din aktiva surdegsstart. Blanda ordentligt tills degen är jämn.`;
    }
    schedule.push({
        time: formatTime(currentTime),
        dateTime: new Date(currentTime),
        step: 'Blanda in surdegsstarten',
        icon: '🌾',
        description: starterDescription,
        duration: 10
    });
    currentTime = addMinutes(currentTime, 30);
    const saltAmount = dataSource === 'calculated'
        ? parseFloat(document.getElementById('salt')?.value || '10')
        : Math.round(flour * 0.02);
    schedule.push({
        time: formatTime(currentTime),
        dateTime: new Date(currentTime),
        step: 'Saltet ska i',
        icon: '🧂',
        description: dataSource === 'calculated'
            ? `Strö över ${saltAmount}g salt och arbeta in det genom att vicka och dra i degen.`
            : `Strö över saltet och arbeta in det genom att vicka och dra i degen.`,
        duration: 10,
        bulkPhase: 'start'
    });
    currentTime = addMinutes(currentTime, 30);
    const bulkStartTime = new Date(currentTime);
    for (let i = 1; i <= numFolds; i++) {
        let foldDescription = `Gör en stretch & fold: Lyft och vik degen från varje sida (4 vikningar totalt). Täck över.`;
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
            bulkPhase: 'active'
        });
        if (i < numFolds) {
            currentTime = addMinutes(currentTime, foldInterval);
        }
    }
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
        bulkPhase: 'end'
    });
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
    const preheatTime = 60;
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
        bulkPhase: coldProof === 0 ? 'active' : undefined
    });
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
    schedule.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime());
    displaySchedule(schedule, startDate, currentTime, timeDirection, bulkStartTime, bulkEndTime, autoGenerate);
    announceToScreenReader('Bakschema skapat! Totalt ' + schedule.length + ' steg.');
}
function generateBulkTimerSection(bulkStartTime, bulkEndTime, bulkDurationHours, position = 'start') {
    const bulkDurationMinutes = Math.round(bulkDurationHours * 60);
    const hours = Math.floor(bulkDurationMinutes / 60);
    const minutes = bulkDurationMinutes % 60;
    const durationText = hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;
    const isTimerRunning = SourdoughApp && (SourdoughApp.timerInterval !== null || SourdoughApp.isPaused);
    const isTimerPaused = SourdoughApp && SourdoughApp.isPaused;
    let pausedTimeDisplay = '';
    if (isTimerPaused && SourdoughApp.remainingTime) {
        const remaining = SourdoughApp.remainingTime;
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
        pausedTimeDisplay = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    if (position === 'end') {
        return '';
    }
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
function displaySchedule(schedule, startTime, endTime, timeDirection = 'forward', bulkStartTime = null, bulkEndTime = null, autoGenerate = false) {
    const display = document.getElementById('schedule-display');
    if (!display)
        return;
    const totalHours = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60) * 10) / 10;
    if (timeDirection === 'backward') {
        updateTimebasedHint(startTime, endTime);
    }
    let bulkDurationHours = 0;
    if (bulkStartTime && bulkEndTime) {
        bulkDurationHours = (bulkEndTime.getTime() - bulkStartTime.getTime()) / (1000 * 60 * 60);
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
        let timeSinceLastStep = '';
        if (index > 0) {
            const prevStep = schedule[index - 1];
            const diffMinutes = Math.round((step.dateTime.getTime() - prevStep.dateTime.getTime()) / (1000 * 60));
            if (diffMinutes > 0) {
                const hours = Math.floor(diffMinutes / 60);
                const mins = diffMinutes % 60;
                if (hours > 0) {
                    timeSinceLastStep = hours === 1 ? `+1h ${mins}min` : `+${hours}h${mins > 0 ? ` ${mins}min` : ''}`;
                }
                else {
                    timeSinceLastStep = `+${mins}min`;
                }
            }
        }
        const displayTime = formatTimeWithDate(step.dateTime, startTime);
        const stepId = `step-${index}`;
        const isChecked = isStepChecked(stepId);
        const checkedClass = isChecked ? 'schedule-step-checked' : '';
        if (step.bulkPhase === 'start' && bulkStartTime && bulkEndTime) {
            html += generateBulkTimerSection(bulkStartTime, bulkEndTime, bulkDurationHours, 'start');
        }
        const bulkStyling = step.bulkPhase ?
            'background: linear-gradient(135deg, rgb(70, 85, 62), rgb(85, 100, 75)); border: 2px solid var(--green-dark);' : '';
        const bulkTextColor = step.bulkPhase ? 'color: white;' : '';
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
        if (step.bulkPhase === 'end' && bulkStartTime && bulkEndTime) {
            html += generateBulkTimerSection(bulkStartTime, bulkEndTime, bulkDurationHours, 'end');
        }
    });
    html += `</div>`;
    const emptyState = document.getElementById('schedule-empty-state');
    if (emptyState) {
        emptyState.style.display = 'none';
    }
    display.classList.add('schedule-updating');
    display.innerHTML = html;
    display.style.display = 'block';
    setTimeout(() => {
        display.classList.remove('schedule-updating');
        display.classList.add('schedule-updated');
        if (!autoGenerate) {
            showToast('Schema uppdaterat');
        }
        setTimeout(() => {
            display.classList.remove('schedule-updated');
        }, 500);
    }, 100);
}
function addMinutes(date, minutes) {
    return new Date(date.getTime() + minutes * 60000);
}
function addHours(date, hours) {
    return new Date(date.getTime() + hours * 60 * 60000);
}
function isStepChecked(stepId) {
    try {
        const checkedSteps = JSON.parse(localStorage.getItem('scheduleCheckedSteps') || '[]');
        return checkedSteps.includes(stepId);
    }
    catch (e) {
        console.error('Error reading checked steps:', e);
        return false;
    }
}
window.toggleStepCheck = function (stepId) {
    try {
        const checkedSteps = JSON.parse(localStorage.getItem('scheduleCheckedSteps') || '[]');
        const index = checkedSteps.indexOf(stepId);
        if (index > -1) {
            checkedSteps.splice(index, 1);
        }
        else {
            checkedSteps.push(stepId);
        }
        localStorage.setItem('scheduleCheckedSteps', JSON.stringify(checkedSteps));
        const stepElement = document.querySelector(`[data-step-id="${stepId}"]`);
        const checkbox = document.getElementById(stepId);
        const stepText = stepElement?.querySelector('.schedule-content span')?.textContent || '';
        const isTimerRunning = SourdoughApp && SourdoughApp.timerInterval !== null;
        if (checkbox && checkbox.checked && stepText.includes('Bulkjäsning klar') && isTimerRunning) {
            const shouldStopTimer = confirm('✅ Bulkjäsningen klar!\n\nSka jag stänga av timern?');
            if (shouldStopTimer && typeof window.stopTimer === 'function') {
                window.stopTimer();
                const bulkTimerActive = document.getElementById('bulk-timer-active');
                if (bulkTimerActive && bulkTimerActive.parentElement) {
                    bulkTimerActive.parentElement.style.display = 'none';
                }
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
            }
            else {
                stepElement.classList.remove('schedule-step-checked');
            }
        }
        if (checkbox && checkbox.checked) {
            announceToScreenReader(`${stepText || 'Steg'} markerat som klart`);
        }
        else {
            announceToScreenReader(`${stepText} avmarkerat`);
        }
    }
    catch (e) {
        console.error('Error toggling step check:', e);
    }
};
function clearCheckedSteps() {
    try {
        localStorage.removeItem('scheduleCheckedSteps');
    }
    catch (e) {
        console.error('Error clearing checked steps:', e);
    }
}
function showContextualHint() {
    const userJourney = localStorage.getItem('userJourney');
    const journeyTimestamp = localStorage.getItem('userJourneyTimestamp');
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    if (!userJourney || !journeyTimestamp || parseInt(journeyTimestamp) < fiveMinutesAgo) {
        return;
    }
    const hintContainer = document.getElementById('journeyHint');
    const beginnerHint = document.getElementById('beginnerHint');
    const timebasedHint = document.getElementById('timebasedHint');
    const experiencedHint = document.getElementById('experiencedHint');
    if (!hintContainer)
        return;
    if (beginnerHint)
        beginnerHint.style.display = 'none';
    if (timebasedHint)
        timebasedHint.style.display = 'none';
    if (experiencedHint)
        experiencedHint.style.display = 'none';
    if (userJourney === 'full-schedule' && beginnerHint) {
        beginnerHint.style.display = 'block';
        hintContainer.style.display = 'block';
    }
    else if (userJourney === 'backward-planning' && timebasedHint) {
        timebasedHint.style.display = 'block';
        hintContainer.style.display = 'block';
    }
    else if (userJourney === 'timer-only' && experiencedHint) {
        experiencedHint.style.display = 'block';
        hintContainer.style.display = 'block';
    }
    setTimeout(() => {
        if (hintContainer) {
            hintContainer.style.transition = 'opacity 0.5s ease';
            hintContainer.style.opacity = '0';
            setTimeout(() => {
                hintContainer.style.display = 'none';
                hintContainer.style.opacity = '1';
            }, 500);
        }
    }, 8000);
}
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
window.startBulkTimerFromSchedule = function (durationHours) {
    console.log('startBulkTimerFromSchedule called with duration:', durationHours);
    if (!SourdoughApp) {
        console.error('SourdoughApp not available');
        showInlineMessage('⚠️ Timer-funktionen är inte tillgänglig. Vänligen ladda om sidan.', 'error');
        return;
    }
    SourdoughApp.calculatedTime = durationHours;
    if (typeof window.startTimer === 'function') {
        window.startTimer();
        if (typeof window.showActionToast === 'function') {
            window.showActionToast({
                emoji: '⏰',
                text: `Bulkjäsningstimer startad! ${Math.round(durationHours * 60)} minuter till preshape.`
            }, 4000);
        }
        setTimeout(() => {
            if (typeof window.generateBakingSchedule === 'function') {
                window.generateBakingSchedule(true);
            }
        }, 500);
        announceToScreenReader(`Bulkjäsningstimer startad för ${Math.round(durationHours * 60)} minuter.`);
    }
    else {
        console.error('startTimer function not available');
        showInlineMessage('❌ Kunde inte starta timer. Vänligen försök igen.', 'error');
    }
};
window.removeBulkTimer = function () {
    const scrollPosition = window.scrollY || window.pageYOffset;
    if (SourdoughApp.timerInterval) {
        clearInterval(SourdoughApp.timerInterval);
    }
    SourdoughApp.timerInterval = null;
    SourdoughApp.isPaused = false;
    SourdoughApp.remainingTime = 0;
    SourdoughApp.endTime = null;
    if (typeof window.generateBakingSchedule === 'function') {
        window.generateBakingSchedule(true);
    }
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            window.scrollTo(0, scrollPosition);
        });
    });
    announceToScreenReader('Bulkjäsningstimer borttagen.');
};
window.updateTimerButtons = function () {
    const startBtn = document.getElementById('scheduleTimerStartBtn');
    const pauseBtn = document.getElementById('scheduleTimerPauseBtn');
    const timerDisplay = document.getElementById('timer-in-schedule');
    const isPaused = SourdoughApp && SourdoughApp.isPaused;
    if (startBtn && pauseBtn) {
        if (isPaused) {
            startBtn.disabled = false;
            startBtn.style.opacity = '1';
            startBtn.style.cursor = 'pointer';
            startBtn.style.pointerEvents = 'auto';
        }
        else {
            startBtn.disabled = true;
            startBtn.style.opacity = '0.3';
            startBtn.style.cursor = 'not-allowed';
            startBtn.style.pointerEvents = 'none';
        }
        if (isPaused) {
            pauseBtn.disabled = true;
            pauseBtn.style.opacity = '0.3';
            pauseBtn.style.cursor = 'not-allowed';
            pauseBtn.style.pointerEvents = 'none';
        }
        else {
            pauseBtn.disabled = false;
            pauseBtn.style.opacity = '1';
            pauseBtn.style.cursor = 'pointer';
            pauseBtn.style.pointerEvents = 'auto';
        }
        if (isPaused && timerDisplay && SourdoughApp.remainingTime) {
            const remaining = SourdoughApp.remainingTime;
            const hours = Math.floor(remaining / (1000 * 60 * 60));
            const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
            timerDisplay.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }
    }
};
function updateScheduleBreadEmojis() {
    const numLoaves = parseFloat(document.getElementById('scheduleNumLoavesMain')?.value || '2');
    const breadEmojisElement = document.getElementById('breadEmojisSchedule');
    if (breadEmojisElement) {
        breadEmojisElement.textContent = '🍞'.repeat(Math.min(numLoaves, 10));
    }
}
function updateTotalDoughWeight() {
    const dataSource = document.querySelector('input[name="scheduleDataSource"]:checked')?.value;
    const totalWeightElement = document.getElementById('totalWeightValue');
    if (!totalWeightElement)
        return;
    if (dataSource === 'calculated') {
        const flour = parseFloat(document.getElementById('flour')?.value || '0');
        const water = parseFloat(document.getElementById('water')?.value || '0');
        const starter = parseFloat(document.getElementById('starter')?.value || '0');
        const salt = parseFloat(document.getElementById('salt')?.value || '0');
        const totalWeight = flour + water + starter + salt;
        if (totalWeight > 0) {
            const numLoaves = parseFloat(document.getElementById('scheduleNumLoavesMain')?.value || '2');
            const weightPerLoaf = Math.round(totalWeight / numLoaves);
            totalWeightElement.innerHTML = `${totalWeight}g (${weightPerLoaf}g/st)`;
        }
        else {
            totalWeightElement.textContent = '—';
        }
    }
    else {
        const numLoaves = parseFloat(document.getElementById('manualNumLoaves')?.value || '1');
        const weightPerLoaf = parseFloat(document.getElementById('manualLoafWeight')?.value || '800');
        const totalWeight = numLoaves * weightPerLoaf;
        totalWeightElement.innerHTML = `${totalWeight}g (${weightPerLoaf}g/st)`;
    }
}
setTimeout(() => {
    const loafButtons = document.querySelectorAll('.loaf-btn');
    loafButtons.forEach(button => {
        button.addEventListener('click', function () {
            const target = this.getAttribute('data-target');
            if (!target)
                return;
            const input = document.getElementById(target);
            if (!input)
                return;
            const currentValue = parseInt(input.value) || 2;
            const isPlus = this.classList.contains('loaf-btn-plus');
            const newValue = isPlus ? Math.min(currentValue + 1, 10) : Math.max(currentValue - 1, 1);
            input.value = String(newValue);
            const displayButton = document.getElementById('scheduleNumLoavesDisplay');
            if (displayButton) {
                displayButton.textContent = String(newValue);
                displayButton.setAttribute('aria-label', `Antal bröd: ${newValue}`);
            }
            updateScheduleBreadEmojis();
            updateTotalDoughWeight();
            tryAutoGenerateSchedule();
        });
    });
    updateScheduleBreadEmojis();
    updateTotalDoughWeight();
}, 100);
//# sourceMappingURL=schedule.js.map