import { GUIDE_STEPS } from './guide-content.js';
import { loadGuideState, resetGuideState, completeStep, setActiveStep, setActiveTimer, clearActiveTimer, isTimerComplete, calculateProgress, getProgressEmoji, isStepCompleted, isStepActive } from './guide-state.js';
import { showCelebrationModal, animateProgressBar, addActivePulse, removeActivePulse } from './guide-animations.js';
import { calculateBakingTime } from '../calculator.js';
export class BeginnerGuide {
    constructor() {
        this.state = loadGuideState();
        this.container = document.getElementById('guide-tab');
        this.stepsContainer = document.getElementById('guide-steps-container');
        this.progressFill = document.getElementById('guideProgressFill');
        this.progressText = document.getElementById('guideProgressText');
    }
    init() {
        if (!this.container || !this.stepsContainer) {
            console.warn('Guide containers not found');
            return;
        }
        this.renderSteps();
        this.updateProgress();
        this.setupEventListeners();
        this.setupResetButton();
        setTimeout(() => this.updateStep2Calculations(), 100);
        setTimeout(() => this.updateStep3BulkTime(), 100);
        if (this.state.activeTimer && isTimerComplete(this.state)) {
            this.onTimerComplete();
        }
        if (typeof window !== 'undefined') {
            window.beginnerGuide = this;
        }
    }
    renderSteps() {
        if (!this.stepsContainer)
            return;
        this.stepsContainer.innerHTML = GUIDE_STEPS.map((step) => {
            const completed = isStepCompleted(this.state, step.id);
            const active = isStepActive(this.state, step.id);
            const stateClass = completed ? 'step-completed' :
                active ? 'step-active' : 'step-available';
            const stateIcon = completed ? '✅' :
                active ? '🔵' : '⭕';
            const ariaExpanded = active ? 'true' : 'false';
            const ariaDisabled = 'false';
            return `
                <div class="guide-step ${stateClass}" data-step-id="${step.id}">
                    <button
                        class="guide-step-header"
                        aria-expanded="${ariaExpanded}"
                        aria-controls="step-content-${step.id}"
                        aria-disabled="${ariaDisabled}"
                        id="step-header-${step.id}">
                        <div class="step-header-left">
                            <span class="step-number">${step.id + 1}</span>
                            <span class="step-icon">${step.icon}</span>
                            <div class="step-title-group">
                                <div class="step-phase">${step.phase}</div>
                                <h3 class="step-title">${step.title}</h3>
                            </div>
                        </div>
                        <div class="step-header-right">
                            <span class="step-duration">${step.duration}</span>
                            <span class="step-state-icon">${stateIcon}</span>
                            <svg class="step-chevron" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/>
                            </svg>
                        </div>
                    </button>

                    <div
                        class="guide-step-content ${active ? 'show' : ''}"
                        id="step-content-${step.id}"
                        role="region"
                        aria-labelledby="step-header-${step.id}">
                        ${this.renderStepContent(step)}
                    </div>
                </div>
            `;
        }).join('');
        const activeStepEl = this.stepsContainer.querySelector(`[data-step-id="${this.state.currentStep}"]`);
        if (activeStepEl) {
            addActivePulse(activeStepEl);
        }
    }
    renderStepContent(step) {
        return `
            <div class="step-content-inner">
                <p class="step-description">${step.description}</p>

                ${step.content}

                ${step.tips && step.tips.length > 0 ? `
                    <div class="step-tips">
                        <h5>✨ Tips</h5>
                        <ul>
                            ${step.tips.map(tip => `<li>${tip}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}

                ${step.warnings && step.warnings.length > 0 ? `
                    <div class="step-warnings">
                        <h5>⚠️ Viktigt att tänka på</h5>
                        <ul>
                            ${step.warnings.map(warning => `<li>${warning}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}

                <div class="step-actions">
                    ${step.hasTimer ? `
                        <button class="btn-timer" data-step-id="${step.id}" data-duration="${step.timerDurationHours}">
                            ⏱️ Starta timer (${step.timerDurationHours}h)
                        </button>
                    ` : ''}

                    ${!isStepCompleted(this.state, step.id) ? `
                        <button class="btn-complete-step" data-step-id="${step.id}">
                            ✓ Markera som klar
                        </button>
                    ` : `
                        <div class="step-completed-badge">
                            ✅ Steg klart!
                        </div>
                    `}
                </div>
            </div>
        `;
    }
    setupEventListeners() {
        if (!this.stepsContainer)
            return;
        this.stepsContainer.addEventListener('click', (e) => {
            const target = e.target;
            const header = target.closest('.guide-step-header');
            if (header) {
                const stepEl = header.closest('.guide-step');
                const stepId = parseInt(stepEl.dataset.stepId || '0');
                this.toggleStep(stepId);
            }
        });
        this.stepsContainer.addEventListener('click', (e) => {
            const target = e.target;
            if (target.classList.contains('btn-complete-step')) {
                const stepId = parseInt(target.dataset.stepId || '0');
                this.completeStepHandler(stepId);
            }
        });
        this.stepsContainer.addEventListener('click', (e) => {
            const target = e.target;
            if (target.classList.contains('btn-timer')) {
                const stepId = parseInt(target.dataset.stepId || '0');
                const duration = parseFloat(target.dataset.duration || '0');
                this.startStepTimer(stepId, duration);
            }
        });
        this.stepsContainer.addEventListener('input', (e) => {
            const target = e.target;
            if (target.id === 'wheat-flour-input' ||
                target.id === 'spelt-flour-input') {
                this.updateStep2Calculations();
            }
        });
        this.stepsContainer.addEventListener('change', (e) => {
            const target = e.target;
            if (target.id === 'hydration-select') {
                this.updateStep2Calculations();
            }
        });
        this.stepsContainer.addEventListener('input', (e) => {
            const target = e.target;
            if (target.id === 'bulk-temperature' || target.id === 'bulk-temperature-slider') {
                this.updateStep3BulkTime();
                const tempInput = document.getElementById('bulk-temperature');
                const tempSlider = document.getElementById('bulk-temperature-slider');
                if (tempInput && tempSlider) {
                    const value = target.value;
                    tempInput.value = value;
                    tempSlider.value = value;
                }
            }
        });
        this.stepsContainer.addEventListener('keydown', (e) => {
            this.handleKeyboardNav(e);
        });
    }
    setupResetButton() {
        const resetBtn = document.getElementById('btn-reset-guide');
        if (!resetBtn)
            return;
        resetBtn.addEventListener('click', () => {
            this.resetGuide();
        });
    }
    toggleStep(stepId) {
        const stepEl = this.stepsContainer?.querySelector(`[data-step-id="${stepId}"]`);
        const content = stepEl?.querySelector('.guide-step-content');
        const header = stepEl?.querySelector('.guide-step-header');
        if (!content || !header)
            return;
        const isExpanded = content.classList.contains('show');
        this.stepsContainer?.querySelectorAll('.guide-step-content').forEach(c => {
            c.classList.remove('show');
        });
        this.stepsContainer?.querySelectorAll('.guide-step-header').forEach(h => {
            h.setAttribute('aria-expanded', 'false');
        });
        this.stepsContainer?.querySelectorAll('.guide-step').forEach(s => {
            removeActivePulse(s);
        });
        if (!isExpanded) {
            content.classList.add('show');
            header.setAttribute('aria-expanded', 'true');
            setActiveStep(this.state, stepId);
            if (stepEl) {
                addActivePulse(stepEl);
            }
            setTimeout(() => {
                header?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }, 650);
        }
    }
    completeStepHandler(stepId) {
        this.state = completeStep(this.state, stepId);
        this.renderSteps();
        this.updateProgress();
        this.state.completedSteps.forEach(completedStepId => {
            const stepEl = this.stepsContainer?.querySelector(`[data-step-id="${completedStepId}"]`);
            const content = stepEl?.querySelector('.guide-step-content');
            const header = stepEl?.querySelector('.guide-step-header');
            if (content && header) {
                content.classList.add('show');
                header.setAttribute('aria-expanded', 'true');
            }
        });
        this.announceToScreenReader(`Steg ${stepId + 1} markerat som klart`);
        const nextStepId = stepId + 1;
        if (nextStepId <= 7) {
            setTimeout(() => {
                const nextStepEl = this.stepsContainer?.querySelector(`[data-step-id="${nextStepId}"]`);
                const nextHeader = nextStepEl?.querySelector('.guide-step-header');
                if (nextHeader) {
                    nextHeader.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }, 650);
        }
        if (this.state.completedSteps.length === 8) {
            setTimeout(() => this.showCelebration(), 500);
        }
    }
    updateStep2Calculations() {
        const wheatInput = document.getElementById('wheat-flour-input');
        const speltInput = document.getElementById('spelt-flour-input');
        const hydrationSelect = document.getElementById('hydration-select');
        if (!wheatInput || !speltInput || !hydrationSelect)
            return;
        const wheatFlour = parseFloat(wheatInput.value) || 0;
        const speltFlour = parseFloat(speltInput.value) || 0;
        const hydration = parseFloat(hydrationSelect.value) || 70;
        const totalFlour = wheatFlour + speltFlour;
        const water = Math.round(totalFlour * (hydration / 100));
        const waterAmountSpan = document.getElementById('water-amount');
        const waterInstruction = document.getElementById('water-amount-instruction');
        const wheatInstruction = document.getElementById('wheat-amount-instruction');
        const speltInstruction = document.getElementById('spelt-amount-instruction');
        if (waterAmountSpan)
            waterAmountSpan.textContent = water.toString();
        if (waterInstruction)
            waterInstruction.textContent = `${water}g vatten`;
        if (wheatInstruction)
            wheatInstruction.textContent = `${wheatFlour}g vetemjöl`;
        if (speltInstruction)
            speltInstruction.textContent = `${speltFlour}g fullkornsmjöl`;
        this.updateStep3Calculations(totalFlour);
    }
    updateStep3Calculations(totalFlour) {
        const starter = Math.round(totalFlour * 0.20);
        const salt = Math.round(totalFlour * 0.02);
        const starterAmountSpan = document.getElementById('starter-amount');
        const starterInstruction = document.getElementById('starter-amount-instruction');
        if (starterAmountSpan)
            starterAmountSpan.textContent = starter.toString();
        if (starterInstruction)
            starterInstruction.textContent = `${starter}g surdegsstart`;
        const saltAmountSpan = document.getElementById('salt-amount');
        const saltInstruction = document.getElementById('salt-amount-instruction');
        if (saltAmountSpan)
            saltAmountSpan.textContent = salt.toString();
        if (saltInstruction)
            saltInstruction.textContent = `${salt}g salt`;
        this.updateStep5Calculations(totalFlour);
    }
    updateStep5Calculations(totalFlour) {
        const loafCount = Math.max(1, Math.round(totalFlour / 500));
        const loafCountSpan = document.getElementById('loaf-count');
        const loafCountInstruction = document.getElementById('loaf-count-instruction');
        const totalFlourWeight = document.getElementById('total-flour-weight');
        if (loafCountSpan)
            loafCountSpan.textContent = loafCount.toString();
        if (loafCountInstruction)
            loafCountInstruction.textContent = loafCount.toString();
        if (totalFlourWeight)
            totalFlourWeight.textContent = totalFlour.toString();
        this.updateStep7BakingTime(totalFlour, loafCount);
    }
    updateStep7BakingTime(totalFlour, numLoaves) {
        const waterAmountSpan = document.getElementById('water-amount');
        const waterAmount = waterAmountSpan ? parseFloat(waterAmountSpan.textContent || '0') : Math.round(totalFlour * 0.70);
        const starter = Math.round(totalFlour * 0.20);
        const salt = Math.round(totalFlour * 0.02);
        const totalWeight = totalFlour + waterAmount + starter + salt;
        const weightPerLoaf = Math.round(totalWeight / numLoaves);
        const bakingTimes = calculateBakingTime(totalWeight, numLoaves);
        const timeWithoutLid = Math.round(bakingTimes.totalBakeTime - 20);
        const totalBakingTime = bakingTimes.totalBakeTime;
        const loafWeightSpan = document.getElementById('loaf-weight');
        const bakingTimeNoLid = document.getElementById('baking-time-no-lid');
        const totalBakingTimeSpan = document.getElementById('total-baking-time');
        const bakingTimeInstruction = document.getElementById('baking-time-instruction');
        if (loafWeightSpan)
            loafWeightSpan.textContent = weightPerLoaf.toString();
        if (bakingTimeNoLid)
            bakingTimeNoLid.textContent = timeWithoutLid.toString();
        if (totalBakingTimeSpan)
            totalBakingTimeSpan.textContent = totalBakingTime.toString();
        if (bakingTimeInstruction)
            bakingTimeInstruction.textContent = timeWithoutLid.toString();
    }
    updateStep3BulkTime() {
        const tempInput = document.getElementById('bulk-temperature');
        if (!tempInput)
            return;
        const temp = parseFloat(tempInput.value) || 22;
        const BASE_TIME = 5;
        const BASE_TEMP = 22;
        const TEMP_FACTOR = 1.15;
        const bulkTimeHours = BASE_TIME * Math.pow(TEMP_FACTOR, BASE_TEMP - temp);
        const roundedHours = Math.round(bulkTimeHours * 2) / 2;
        const hours = Math.floor(roundedHours);
        const minutes = (roundedHours - hours) * 60;
        let timeText = `${hours} timmar`;
        if (minutes > 0) {
            timeText = `${hours} timmar ${Math.round(minutes)} minuter`;
        }
        const totalMinutes = roundedHours * 60;
        const usedMinutes = 30 + (4 * 20);
        const remainingMinutes = Math.max(0, totalMinutes - usedMinutes);
        const remainingHours = Math.floor(remainingMinutes / 60);
        const remainingMins = Math.round(remainingMinutes % 60);
        let remainingText = '';
        if (remainingHours > 0 && remainingMins > 0) {
            remainingText = `${remainingHours} timmar ${remainingMins} minuter`;
        }
        else if (remainingHours > 0) {
            remainingText = `${remainingHours} timmar`;
        }
        else {
            remainingText = `${remainingMins} minuter`;
        }
        const bulkTimeSpan = document.getElementById('bulk-time-recommendation');
        const bulkTimeTimer = document.getElementById('bulk-time-timer');
        const remainingRestTime = document.getElementById('remaining-rest-time');
        if (bulkTimeSpan)
            bulkTimeSpan.textContent = timeText;
        if (bulkTimeTimer)
            bulkTimeTimer.textContent = timeText;
        if (remainingRestTime)
            remainingRestTime.textContent = remainingText;
    }
    startStepTimer(stepId, durationHours) {
        if (typeof window.SourdoughApp !== 'undefined') {
            window.SourdoughApp.calculatedTime = durationHours;
        }
        if (typeof window.startTimer === 'function') {
            window.startTimer();
        }
        this.state = setActiveTimer(this.state, stepId, durationHours);
        this.showToast({
            emoji: '⏱️',
            text: `Timer startad för ${durationHours} timmar`
        });
        this.setupTimerCompletionCallback(stepId);
    }
    setupTimerCompletionCallback(_stepId) {
        const checkInterval = setInterval(() => {
            if (isTimerComplete(this.state)) {
                clearInterval(checkInterval);
                this.onTimerComplete();
            }
        }, 60000);
        this.state._timerCheckInterval = checkInterval;
    }
    onTimerComplete() {
        if (!this.state.activeTimer)
            return;
        const stepId = this.state.activeTimer.stepId;
        this.showToast({
            emoji: '✅',
            text: `Timer klar för steg ${stepId + 1}!`
        });
        this.announceToScreenReader(`Timer klar för steg ${stepId + 1}`);
        this.state = clearActiveTimer(this.state);
        this.completeStepHandler(stepId);
    }
    updateProgress() {
        const percent = calculateProgress(this.state);
        const emoji = getProgressEmoji(percent);
        if (this.progressFill) {
            animateProgressBar(this.progressFill, percent);
        }
        if (this.progressText) {
            this.progressText.textContent = `${emoji} ${this.state.completedSteps.length} av 8 steg klara (${percent}%)`;
        }
    }
    showCelebration() {
        showCelebrationModal(() => this.resetGuide(), () => this.linkToSchedule());
    }
    resetGuide() {
        this.state = resetGuideState();
        this.renderSteps();
        this.updateProgress();
        this.showToast({
            emoji: '🔄',
            text: 'Guiden har återställts'
        });
    }
    linkToSchedule() {
        if (typeof window.SourdoughApp !== 'undefined') {
            const inputs = document.getElementById('inputs');
            if (inputs) {
                inputs.querySelector('[name="flour"]').value = '500';
                inputs.querySelector('[name="water"]').value = '375';
                inputs.querySelector('[name="starter"]').value = '100';
                inputs.querySelector('[name="salt"]').value = '10';
            }
            if (typeof window.calculateTime === 'function') {
                window.calculateTime();
            }
            if (typeof window.switchTab === 'function') {
                window.switchTab('schedule');
            }
            this.showToast({
                emoji: '📅',
                text: 'Schema skapat med nybörjarvärden!'
            });
        }
    }
    handleKeyboardNav(e) {
        const target = e.target;
        if (!target.classList.contains('guide-step-header'))
            return;
        const currentStep = target.closest('.guide-step');
        const currentIndex = parseInt(currentStep.dataset.stepId || '0');
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                this.focusStep(currentIndex + 1);
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.focusStep(currentIndex - 1);
                break;
            case 'Home':
                e.preventDefault();
                this.focusStep(0);
                break;
            case 'End':
                e.preventDefault();
                this.focusStep(7);
                break;
            case 'Enter':
            case ' ':
                e.preventDefault();
                this.toggleStep(currentIndex);
                break;
        }
    }
    focusStep(stepId) {
        if (stepId < 0 || stepId > 7)
            return;
        const stepEl = this.stepsContainer?.querySelector(`[data-step-id="${stepId}"]`);
        const header = stepEl?.querySelector('.guide-step-header');
        header?.focus();
    }
    showToast(message) {
        if (typeof window.showActionToast === 'function') {
            window.showActionToast(message);
        }
    }
    announceToScreenReader(message) {
        if (typeof window.announceToScreenReader === 'function') {
            window.announceToScreenReader(message);
        }
    }
}
export function initBeginnerGuide() {
    const guide = new BeginnerGuide();
    guide.init();
    return guide;
}
//# sourceMappingURL=guide.js.map