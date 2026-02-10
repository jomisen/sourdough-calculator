export function showCelebrationModal(onRestart, onSchedule) {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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
    if (!prefersReducedMotion) {
        triggerConfetti();
    }
    playCelebrationSound();
    const btnSchedule = overlay.querySelector('#btn-schedule');
    const btnRestart = overlay.querySelector('#btn-restart');
    const btnClose = overlay.querySelector('#btn-close');
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
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', handleEscape);
        }
    };
    document.addEventListener('keydown', handleEscape);
    const focusableElements = overlay.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    firstElement?.focus();
    overlay.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement?.focus();
                }
            }
            else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement?.focus();
                }
            }
        }
    });
}
function triggerConfetti() {
    if (typeof window.confetti !== 'function') {
        console.warn('Confetti library not loaded');
        return;
    }
    const confetti = window.confetti;
    const colors = [
        '#7a8c6f',
        '#9fb094',
        '#f8a571',
        '#c8a7d6',
        '#FFD700'
    ];
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
function playCelebrationSound() {
    try {
        if (!window.AudioContext && !window.webkitAudioContext) {
            return;
        }
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioContext = new AudioContext();
        const notes = [261.63, 329.63, 392.00];
        const now = audioContext.currentTime;
        notes.forEach((freq, index) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator.frequency.value = freq;
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0, now + index * 0.2);
            gainNode.gain.linearRampToValueAtTime(0.1, now + index * 0.2 + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + index * 0.2 + 0.3);
            oscillator.start(now + index * 0.2);
            oscillator.stop(now + index * 0.2 + 0.3);
        });
    }
    catch (error) {
        console.debug('Could not play celebration sound:', error);
    }
}
export function animateStepCompletion(stepElement) {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
        stepElement.classList.add('step-completed');
        return;
    }
    stepElement.classList.add('step-completing');
    setTimeout(() => {
        stepElement.classList.remove('step-completing');
        stepElement.classList.add('step-completed');
    }, 400);
}
export function animateProgressBar(fillElement, newPercent) {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
        fillElement.style.width = `${newPercent}%`;
        return;
    }
    fillElement.style.width = `${newPercent}%`;
}
export function addActivePulse(stepElement) {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
        return;
    }
    stepElement.classList.add('step-active-pulse');
}
export function removeActivePulse(stepElement) {
    stepElement.classList.remove('step-active-pulse');
}
//# sourceMappingURL=guide-animations.js.map