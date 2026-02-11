/**
 * Beginner Guide Main Orchestrator
 * Manages guide functionality, accordion, and integrations
 */

import { GUIDE_STEPS, GuideStep } from './guide-content.js';
import {
    GuideState,
    loadGuideState,
    resetGuideState,
    completeStep,
    setActiveStep,
    setActiveTimer,
    clearActiveTimer,
    isTimerComplete,
    calculateProgress,
    getProgressEmoji,
    isStepCompleted,
    isStepActive
} from './guide-state.js';
import {
    showCelebrationModal,
    animateProgressBar,
    addActivePulse,
    removeActivePulse
} from './guide-animations.js';

export class BeginnerGuide {
    private state: GuideState;
    private container: HTMLElement | null;
    private stepsContainer: HTMLElement | null;
    private progressFill: HTMLElement | null;
    private progressText: HTMLElement | null;

    constructor() {
        this.state = loadGuideState();
        this.container = document.getElementById('guide-tab');
        this.stepsContainer = document.getElementById('guide-steps-container');
        this.progressFill = document.getElementById('guideProgressFill');
        this.progressText = document.getElementById('guideProgressText');
    }

    /**
     * Initialize guide
     */
    init(): void {
        if (!this.container || !this.stepsContainer) {
            console.warn('Guide containers not found');
            return;
        }

        this.renderSteps();
        this.updateProgress();
        this.setupEventListeners();
        this.setupResetButton();

        // Initialize Step 2 calculations
        setTimeout(() => this.updateStep2Calculations(), 100);

        // Initialize Step 3 bulk time calculation
        setTimeout(() => this.updateStep3BulkTime(), 100);

        // Check for timer completion on init
        if (this.state.activeTimer && isTimerComplete(this.state)) {
            this.onTimerComplete();
        }

        // Export to window for debugging
        if (typeof window !== 'undefined') {
            (window as any).beginnerGuide = this;
        }
    }

    /**
     * Render all guide steps
     */
    private renderSteps(): void {
        if (!this.stepsContainer) return;

        this.stepsContainer.innerHTML = GUIDE_STEPS.map((step) => {
            const completed = isStepCompleted(this.state, step.id);
            const active = isStepActive(this.state, step.id);

            // Step state classes
            const stateClass = completed ? 'step-completed' :
                              active ? 'step-active' : 'step-available';

            // Step icon with state indicator
            const stateIcon = completed ? '✅' :
                            active ? '🔵' : '⭕';

            // ARIA attributes
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

        // Add active pulse to current step
        const activeStepEl = this.stepsContainer.querySelector(`[data-step-id="${this.state.currentStep}"]`) as HTMLElement;
        if (activeStepEl) {
            addActivePulse(activeStepEl);
        }
    }

    /**
     * Render step content
     */
    private renderStepContent(step: GuideStep): string {
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

    /**
     * Setup event listeners
     */
    private setupEventListeners(): void {
        if (!this.stepsContainer) return;

        // Step header clicks (toggle expand)
        this.stepsContainer.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            const header = target.closest('.guide-step-header') as HTMLElement;

            if (header) {
                const stepEl = header.closest('.guide-step') as HTMLElement;
                const stepId = parseInt(stepEl.dataset.stepId || '0');
                this.toggleStep(stepId);
            }
        });

        // Complete step buttons
        this.stepsContainer.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (target.classList.contains('btn-complete-step')) {
                const stepId = parseInt(target.dataset.stepId || '0');
                this.completeStepHandler(stepId);
            }
        });

        // Timer buttons
        this.stepsContainer.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (target.classList.contains('btn-timer')) {
                const stepId = parseInt(target.dataset.stepId || '0');
                const duration = parseFloat(target.dataset.duration || '0');
                this.startStepTimer(stepId, duration);
            }
        });

        // Step 2 calculator inputs
        this.stepsContainer.addEventListener('input', (e) => {
            const target = e.target as HTMLElement;
            if (target.id === 'wheat-flour-input' ||
                target.id === 'spelt-flour-input') {
                this.updateStep2Calculations();
            }
        });

        this.stepsContainer.addEventListener('change', (e) => {
            const target = e.target as HTMLElement;
            if (target.id === 'hydration-select') {
                this.updateStep2Calculations();
            }
        });

        // Step 3 temperature slider
        this.stepsContainer.addEventListener('input', (e) => {
            const target = e.target as HTMLInputElement;
            if (target.id === 'bulk-temperature' || target.id === 'bulk-temperature-slider') {
                this.updateStep3BulkTime();

                // Sync slider and input
                const tempInput = document.getElementById('bulk-temperature') as HTMLInputElement;
                const tempSlider = document.getElementById('bulk-temperature-slider') as HTMLInputElement;
                if (tempInput && tempSlider) {
                    const value = target.value;
                    tempInput.value = value;
                    tempSlider.value = value;
                }
            }
        });

        // Keyboard navigation
        this.stepsContainer.addEventListener('keydown', (e) => {
            this.handleKeyboardNav(e as KeyboardEvent);
        });
    }

    /**
     * Setup reset button
     */
    private setupResetButton(): void {
        const resetBtn = document.getElementById('btn-reset-guide');
        if (!resetBtn) return;

        resetBtn.addEventListener('click', () => {
            this.resetGuide();
        });
    }

    /**
     * Toggle step expand/collapse
     */
    private toggleStep(stepId: number): void {
        const stepEl = this.stepsContainer?.querySelector(`[data-step-id="${stepId}"]`);
        const content = stepEl?.querySelector('.guide-step-content');
        const header = stepEl?.querySelector('.guide-step-header');

        if (!content || !header) return;

        const isExpanded = content.classList.contains('show');

        // Close all steps first (single-open accordion)
        this.stepsContainer?.querySelectorAll('.guide-step-content').forEach(c => {
            c.classList.remove('show');
        });
        this.stepsContainer?.querySelectorAll('.guide-step-header').forEach(h => {
            h.setAttribute('aria-expanded', 'false');
        });

        // Remove all pulses
        this.stepsContainer?.querySelectorAll('.guide-step').forEach(s => {
            removeActivePulse(s as HTMLElement);
        });

        // Toggle current step
        if (!isExpanded) {
            content.classList.add('show');
            header.setAttribute('aria-expanded', 'true');
            setActiveStep(this.state, stepId);

            // Add pulse to active step
            if (stepEl) {
                addActivePulse(stepEl as HTMLElement);
            }

            // Smooth scroll to header (start of step)
            setTimeout(() => {
                header?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }, 650); // Wait for expand animation (600ms) to complete
        }
    }

    /**
     * Complete step handler
     */
    private completeStepHandler(stepId: number): void {
        this.state = completeStep(this.state, stepId);

        // Re-render steps
        this.renderSteps();
        this.updateProgress();

        // Keep completed step open (don't collapse it)
        const completedStepEl = this.stepsContainer?.querySelector(`[data-step-id="${stepId}"]`);
        const completedContent = completedStepEl?.querySelector('.guide-step-content');
        const completedHeader = completedStepEl?.querySelector('.guide-step-header');

        if (completedContent && completedHeader) {
            completedContent.classList.add('show');
            completedHeader.setAttribute('aria-expanded', 'true');
        }

        // Announce to screen reader
        this.announceToScreenReader(`Steg ${stepId + 1} markerat som klart`);

        // Scroll to next step (now active/expanded after render)
        const nextStepId = stepId + 1;
        if (nextStepId <= 7) {
            setTimeout(() => {
                const nextStepEl = this.stepsContainer?.querySelector(`[data-step-id="${nextStepId}"]`);
                const nextHeader = nextStepEl?.querySelector('.guide-step-header') as HTMLElement;

                if (nextHeader) {
                    nextHeader.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'  // Scroll to TOP of element
                    });
                }
            }, 650); // Wait for expand animation (600ms) to complete
        }

        // Show celebration if all steps complete
        if (this.state.completedSteps.length === 8) {
            setTimeout(() => this.showCelebration(), 500);
        }
    }

    /**
     * Update Step 2 autolys calculations
     */
    private updateStep2Calculations(): void {
        const wheatInput = document.getElementById('wheat-flour-input') as HTMLInputElement;
        const speltInput = document.getElementById('spelt-flour-input') as HTMLInputElement;
        const hydrationSelect = document.getElementById('hydration-select') as HTMLSelectElement;

        if (!wheatInput || !speltInput || !hydrationSelect) return;

        const wheatFlour = parseFloat(wheatInput.value) || 0;
        const speltFlour = parseFloat(speltInput.value) || 0;
        const hydration = parseFloat(hydrationSelect.value) || 70;

        const totalFlour = wheatFlour + speltFlour;
        const water = Math.round(totalFlour * (hydration / 100));

        // Update water amount displays
        const waterAmountSpan = document.getElementById('water-amount');
        const waterInstruction = document.getElementById('water-amount-instruction');
        const wheatInstruction = document.getElementById('wheat-amount-instruction');
        const speltInstruction = document.getElementById('spelt-amount-instruction');

        if (waterAmountSpan) waterAmountSpan.textContent = water.toString();
        if (waterInstruction) waterInstruction.textContent = `${water}g vatten`;
        if (wheatInstruction) wheatInstruction.textContent = `${wheatFlour}g vetemjöl`;
        if (speltInstruction) speltInstruction.textContent = `${speltFlour}g fullkornsmjöl`;

        // Also update Step 3 calculations
        this.updateStep3Calculations(totalFlour);
    }

    /**
     * Update Step 3 starter and salt calculations
     */
    private updateStep3Calculations(totalFlour: number): void {
        const starter = Math.round(totalFlour * 0.20); // 20% of flour
        const salt = Math.round(totalFlour * 0.02);    // 2% of flour

        // Update starter amount displays
        const starterAmountSpan = document.getElementById('starter-amount');
        const starterInstruction = document.getElementById('starter-amount-instruction');

        if (starterAmountSpan) starterAmountSpan.textContent = starter.toString();
        if (starterInstruction) starterInstruction.textContent = `${starter}g surdegsstart`;

        // Update salt amount displays
        const saltAmountSpan = document.getElementById('salt-amount');
        const saltInstruction = document.getElementById('salt-amount-instruction');

        if (saltAmountSpan) saltAmountSpan.textContent = salt.toString();
        if (saltInstruction) saltInstruction.textContent = `${salt}g salt`;

        // Also update Step 5 calculations
        this.updateStep5Calculations(totalFlour);
    }

    /**
     * Update Step 5 loaf count calculation
     */
    private updateStep5Calculations(totalFlour: number): void {
        // Calculate number of loaves: ~500g flour per loaf
        const loafCount = Math.max(1, Math.round(totalFlour / 500));

        // Update loaf count displays
        const loafCountSpan = document.getElementById('loaf-count');
        const loafCountInstruction = document.getElementById('loaf-count-instruction');
        const totalFlourWeight = document.getElementById('total-flour-weight');

        if (loafCountSpan) loafCountSpan.textContent = loafCount.toString();
        if (loafCountInstruction) loafCountInstruction.textContent = loafCount.toString();
        if (totalFlourWeight) totalFlourWeight.textContent = totalFlour.toString();
    }

    /**
     * Update Step 3 bulk fermentation time based on temperature
     */
    private updateStep3BulkTime(): void {
        const tempInput = document.getElementById('bulk-temperature') as HTMLInputElement;
        if (!tempInput) return;

        const temp = parseFloat(tempInput.value) || 22;

        // Calculate bulk time using same formula as main calculator
        // Base: 5 hours at 22°C, factor 1.15 per degree
        const BASE_TIME = 5;
        const BASE_TEMP = 22;
        const TEMP_FACTOR = 1.15;

        const bulkTimeHours = BASE_TIME * Math.pow(TEMP_FACTOR, BASE_TEMP - temp);
        const roundedHours = Math.round(bulkTimeHours * 2) / 2; // Round to nearest 0.5

        // Format time text
        const hours = Math.floor(roundedHours);
        const minutes = (roundedHours - hours) * 60;
        let timeText = `${hours} timmar`;
        if (minutes > 0) {
            timeText = `${hours} timmar ${Math.round(minutes)} minuter`;
        }

        // Calculate remaining rest time (total - 30 min first rest - 80 min folds)
        const totalMinutes = roundedHours * 60;
        const usedMinutes = 30 + (4 * 20); // 30 min + 4 folds × 20 min = 110 min
        const remainingMinutes = Math.max(0, totalMinutes - usedMinutes);
        const remainingHours = Math.floor(remainingMinutes / 60);
        const remainingMins = Math.round(remainingMinutes % 60);

        let remainingText = '';
        if (remainingHours > 0 && remainingMins > 0) {
            remainingText = `${remainingHours} timmar ${remainingMins} minuter`;
        } else if (remainingHours > 0) {
            remainingText = `${remainingHours} timmar`;
        } else {
            remainingText = `${remainingMins} minuter`;
        }

        // Update displays
        const bulkTimeSpan = document.getElementById('bulk-time-recommendation');
        const bulkTimeTimer = document.getElementById('bulk-time-timer');
        const remainingRestTime = document.getElementById('remaining-rest-time');

        if (bulkTimeSpan) bulkTimeSpan.textContent = timeText;
        if (bulkTimeTimer) bulkTimeTimer.textContent = timeText;
        if (remainingRestTime) remainingRestTime.textContent = remainingText;
    }

    /**
     * Start timer for step
     */
    startStepTimer(stepId: number, durationHours: number): void {
        // Integration with global timer from timer.ts
        if (typeof (window as any).SourdoughApp !== 'undefined') {
            (window as any).SourdoughApp.calculatedTime = durationHours;
        }

        // Start timer (from timer.ts)
        if (typeof (window as any).startTimer === 'function') {
            (window as any).startTimer();
        }

        // Save timer state
        this.state = setActiveTimer(this.state, stepId, durationHours);

        // Show toast
        this.showToast({
            emoji: '⏱️',
            text: `Timer startad för ${durationHours} timmar`
        });

        // Setup completion callback
        this.setupTimerCompletionCallback(stepId);
    }

    /**
     * Setup timer completion callback
     */
    private setupTimerCompletionCallback(_stepId: number): void {
        const checkInterval = setInterval(() => {
            if (isTimerComplete(this.state)) {
                clearInterval(checkInterval);
                this.onTimerComplete();
            }
        }, 60000); // Check every minute

        // Store interval for cleanup
        (this.state as any)._timerCheckInterval = checkInterval;
    }

    /**
     * Handle timer completion
     */
    private onTimerComplete(): void {
        if (!this.state.activeTimer) return;

        const stepId = this.state.activeTimer.stepId;

        this.showToast({
            emoji: '✅',
            text: `Timer klar för steg ${stepId + 1}!`
        });

        this.announceToScreenReader(`Timer klar för steg ${stepId + 1}`);

        // Clear timer
        this.state = clearActiveTimer(this.state);

        // Auto-complete step
        this.completeStepHandler(stepId);
    }

    /**
     * Update progress bar
     */
    private updateProgress(): void {
        const percent = calculateProgress(this.state);
        const emoji = getProgressEmoji(percent);

        if (this.progressFill) {
            animateProgressBar(this.progressFill, percent);
        }

        if (this.progressText) {
            this.progressText.textContent = `${emoji} ${this.state.completedSteps.length} av 8 steg klara (${percent}%)`;
        }
    }

    /**
     * Show celebration modal
     */
    private showCelebration(): void {
        showCelebrationModal(
            () => this.resetGuide(),
            () => this.linkToSchedule()
        );
    }

    /**
     * Reset guide
     */
    private resetGuide(): void {
        this.state = resetGuideState();
        this.renderSteps();
        this.updateProgress();

        this.showToast({
            emoji: '🔄',
            text: 'Guiden har återställts'
        });
    }

    /**
     * Link to schedule tab with beginner values
     */
    private linkToSchedule(): void {
        // Pre-fill calculator with beginner values
        if (typeof (window as any).SourdoughApp !== 'undefined') {
            const inputs = document.getElementById('inputs') as HTMLFormElement;
            if (inputs) {
                (inputs.querySelector('[name="flour"]') as HTMLInputElement).value = '500';
                (inputs.querySelector('[name="water"]') as HTMLInputElement).value = '375';
                (inputs.querySelector('[name="starter"]') as HTMLInputElement).value = '100';
                (inputs.querySelector('[name="salt"]') as HTMLInputElement).value = '10';
            }

            // Calculate time
            if (typeof (window as any).calculateTime === 'function') {
                (window as any).calculateTime();
            }

            // Switch to schedule tab
            if (typeof (window as any).switchTab === 'function') {
                (window as any).switchTab('schedule');
            }

            this.showToast({
                emoji: '📅',
                text: 'Schema skapat med nybörjarvärden!'
            });
        }
    }

    /**
     * Keyboard navigation
     */
    private handleKeyboardNav(e: KeyboardEvent): void {
        const target = e.target as HTMLElement;
        if (!target.classList.contains('guide-step-header')) return;

        const currentStep = target.closest('.guide-step') as HTMLElement;
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

    /**
     * Focus specific step
     */
    private focusStep(stepId: number): void {
        if (stepId < 0 || stepId > 7) return;

        const stepEl = this.stepsContainer?.querySelector(`[data-step-id="${stepId}"]`);
        const header = stepEl?.querySelector('.guide-step-header') as HTMLElement;
        header?.focus();
    }

    /**
     * Show toast notification
     */
    private showToast(message: { emoji: string; text: string }): void {
        if (typeof (window as any).showActionToast === 'function') {
            (window as any).showActionToast(message);
        }
    }

    /**
     * Announce to screen reader
     */
    private announceToScreenReader(message: string): void {
        if (typeof (window as any).announceToScreenReader === 'function') {
            (window as any).announceToScreenReader(message);
        }
    }
}

/**
 * Initialize beginner guide
 */
export function initBeginnerGuide(): BeginnerGuide {
    const guide = new BeginnerGuide();
    guide.init();
    return guide;
}
