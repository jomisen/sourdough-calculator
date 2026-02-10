/**
 * Beginner Guide Animations
 * Handles celebrations, confetti, and sounds
 */

/**
 * Show celebration modal when all steps are completed
 */
export function showCelebrationModal(onRestart: () => void, onSchedule: () => void): void {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'celebration-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-labelledby', 'celebration-title');
    overlay.setAttribute('aria-modal', 'true');

    overlay.innerHTML = `
        <div class="celebration-modal">
            <div class="celebration-header">
                <span class="celebration-emoji">🎉🍞✨</span>
                <h2 id="celebration-title">DU GJORDE DET!</h2>
            </div>

            <div class="celebration-content">
                <p class="celebration-message">
                    Du har bakat ditt första surdegsbröd från grunden!<br>
                    Detta är en riktig prestation. 🏆
                </p>

                <div class="celebration-badge">
                    <span class="badge-icon">🏆</span>
                    <span class="badge-text">Surdegsmästare</span>
                </div>

                <div class="celebration-stats">
                    <p>Du har genomfört alla <strong>8 steg</strong> i surdegsprocessen:</p>
                    <ul>
                        <li>✅ Förberett surdegsstart</li>
                        <li>✅ Gjort autolys</li>
                        <li>✅ Bulkjäst degen</li>
                        <li>✅ Testat degen</li>
                        <li>✅ Format brödet</li>
                        <li>✅ Kalljäst i kylskåp</li>
                        <li>✅ Gräddat brödet</li>
                        <li>✅ Låtit svalna och njutit!</li>
                    </ul>
                </div>
            </div>

            <div class="celebration-actions">
                <button class="btn-celebration-primary" id="btn-schedule">
                    📅 Skapa bakschema
                </button>
                <button class="btn-celebration-secondary" id="btn-restart">
                    🔄 Börja om
                </button>
                <button class="btn-celebration-close" id="btn-close" aria-label="Stäng">
                    ✕
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    // Trigger confetti if motion not reduced
    if (!prefersReducedMotion) {
        triggerConfetti();
    }

    // Play celebration sound (optional)
    playCelebrationSound();

    // Event listeners
    const btnSchedule = overlay.querySelector('#btn-schedule') as HTMLButtonElement;
    const btnRestart = overlay.querySelector('#btn-restart') as HTMLButtonElement;
    const btnClose = overlay.querySelector('#btn-close') as HTMLButtonElement;

    const closeModal = () => {
        overlay.remove();
    };

    btnSchedule?.addEventListener('click', () => {
        closeModal();
        onSchedule();
    });

    btnRestart?.addEventListener('click', () => {
        closeModal();
        onRestart();
    });

    btnClose?.addEventListener('click', closeModal);

    // Close on escape
    const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);

    // Focus trap
    const focusableElements = overlay.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    firstElement?.focus();

    overlay.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement?.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement?.focus();
                }
            }
        }
    });
}

/**
 * Trigger confetti animation
 * Uses canvas-confetti library (loaded from CDN in HTML)
 */
function triggerConfetti(): void {
    // Check if confetti library is loaded
    if (typeof (window as any).confetti !== 'function') {
        console.warn('Confetti library not loaded');
        return;
    }

    const confetti = (window as any).confetti;

    // Brand colors for confetti
    const colors = [
        '#7a8c6f', // green-medium
        '#9fb094', // green-light
        '#f8a571', // warm-accent
        '#c8a7d6', // purple-light
        '#FFD700'  // gold for celebration
    ];

    // Fire confetti from two sides
    const duration = 3000;
    const animationEnd = Date.now() + duration;

    const fire = () => {
        confetti({
            particleCount: 5,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.6 },
            colors: colors
        });

        confetti({
            particleCount: 5,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.6 },
            colors: colors
        });

        if (Date.now() < animationEnd) {
            requestAnimationFrame(fire);
        }
    };

    fire();
}

/**
 * Play celebration sound (optional, graceful degradation)
 */
function playCelebrationSound(): void {
    try {
        // Check if Web Audio API is supported
        if (!window.AudioContext && !(window as any).webkitAudioContext) {
            return;
        }

        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioContext();

        // Play a simple three-note fanfare (C-E-G)
        const notes = [261.63, 329.63, 392.00]; // C4, E4, G4
        const now = audioContext.currentTime;

        notes.forEach((freq, index) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = freq;
            oscillator.type = 'sine';

            // Volume envelope
            gainNode.gain.setValueAtTime(0, now + index * 0.2);
            gainNode.gain.linearRampToValueAtTime(0.1, now + index * 0.2 + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + index * 0.2 + 0.3);

            oscillator.start(now + index * 0.2);
            oscillator.stop(now + index * 0.2 + 0.3);
        });
    } catch (error) {
        // Graceful degradation - sound is optional
        console.debug('Could not play celebration sound:', error);
    }
}

/**
 * Animate step completion checkmark
 */
export function animateStepCompletion(stepElement: HTMLElement): void {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
        // Just add completed class without animation
        stepElement.classList.add('step-completed');
        return;
    }

    // Add animation class
    stepElement.classList.add('step-completing');

    // After animation, switch to completed state
    setTimeout(() => {
        stepElement.classList.remove('step-completing');
        stepElement.classList.add('step-completed');
    }, 400);
}

/**
 * Animate progress bar update
 */
export function animateProgressBar(fillElement: HTMLElement, newPercent: number): void {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
        // Instant update
        fillElement.style.width = `${newPercent}%`;
        return;
    }

    // Smooth transition (CSS handles this)
    fillElement.style.width = `${newPercent}%`;
}

/**
 * Add pulsing animation to active step
 */
export function addActivePulse(stepElement: HTMLElement): void {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
        return;
    }

    stepElement.classList.add('step-active-pulse');
}

/**
 * Remove pulsing animation
 */
export function removeActivePulse(stepElement: HTMLElement): void {
    stepElement.classList.remove('step-active-pulse');
}
