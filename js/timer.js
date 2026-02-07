import { SourdoughApp } from './constants.js';
import { announceToScreenReader } from './display.js';

/**
 * Format time for display
 */
export function formatTime(date) {
    return date.toLocaleTimeString('sv-SE', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Play kitchen timer ringing sound
 */
function playKitchenTimerSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();

        // Create a ringing pattern: ring ring ring, pause, ring ring ring
        const ringPattern = [
            { start: 0, duration: 0.15 },      // Ring 1
            { start: 0.25, duration: 0.15 },   // Ring 2
            { start: 0.5, duration: 0.15 },    // Ring 3
            { start: 1.0, duration: 0.15 },    // Ring 4
            { start: 1.25, duration: 0.15 },   // Ring 5
            { start: 1.5, duration: 0.15 },    // Ring 6
        ];

        ringPattern.forEach(ring => {
            // Create oscillator for each ring
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            // Set frequency for a kitchen timer bell sound (slightly higher pitch)
            oscillator.frequency.setValueAtTime(1200, audioContext.currentTime + ring.start);

            // Envelope: quick attack, medium sustain, quick release
            gainNode.gain.setValueAtTime(0, audioContext.currentTime + ring.start);
            gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + ring.start + 0.01); // Attack
            gainNode.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + ring.start + ring.duration - 0.05); // Sustain
            gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + ring.start + ring.duration); // Release

            // Start and stop oscillator
            oscillator.start(audioContext.currentTime + ring.start);
            oscillator.stop(audioContext.currentTime + ring.start + ring.duration);
        });
    } catch (e) {
        console.error('Kunde inte spela timer-ljud:', e);
        // Fallback: vibration if supported
        if ('vibrate' in navigator) {
            navigator.vibrate([200, 100, 200, 100, 200]);
        }
        announceToScreenReader('Timern har gått ut! Degen är redo att formas.');
    }
}

/**
 * Start timer
 */
export function startTimer() {
    const now = new Date();
    SourdoughApp.endTime = new Date(now.getTime() + SourdoughApp.calculatedTime * 60 * 60 * 1000);
    SourdoughApp.isPaused = false;

    // Update UI
    document.getElementById('startTimerBtn').style.display = 'none';
    document.getElementById('timerDisplay').classList.add('active');

    // Format and display times
    document.getElementById('startTime').textContent = formatTime(now);
    document.getElementById('finishTime').textContent = formatTime(SourdoughApp.endTime);

    // Start countdown
    updateTimer();
    SourdoughApp.timerInterval = setInterval(updateTimer, 1000);

    // Update button states
    document.getElementById('startTimerBtn').setAttribute('aria-hidden', 'true');
    document.getElementById('pauseBtn').style.display = 'inline-block';
    document.getElementById('resumeBtn').style.display = 'none';
    document.getElementById('restartBtn').style.display = 'none';

    // Announce to screen readers
    announceToScreenReader(`Timer startad. Degen är klar klockan ${formatTime(SourdoughApp.endTime)}.`);

    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
    }
}

/**
 * Pause timer (keeps display visible)
 */
export function stopTimer() {
    console.log('stopTimer called, interval ID:', SourdoughApp.timerInterval); // Debug log

    if (SourdoughApp.timerInterval) {
        const intervalId = SourdoughApp.timerInterval;
        clearInterval(intervalId);
        SourdoughApp.timerInterval = null;
        console.log('Interval cleared, ID was:', intervalId); // Debug log

        // Save remaining time
        const now = new Date();
        SourdoughApp.remainingTime = SourdoughApp.endTime - now;
        SourdoughApp.isPaused = true;
        console.log('Remaining time saved:', SourdoughApp.remainingTime, 'isPaused:', SourdoughApp.isPaused); // Debug log
    } else {
        console.warn('No interval to clear!'); // Debug log
    }

    // Update button visibility with error checking
    const pauseBtn = document.getElementById('pauseBtn');
    const resumeBtn = document.getElementById('resumeBtn');
    const restartBtn = document.getElementById('restartBtn');

    if (pauseBtn) pauseBtn.style.display = 'none';
    if (resumeBtn) resumeBtn.style.display = 'inline-block';
    if (restartBtn) restartBtn.style.display = 'inline-block';

    console.log('Buttons updated'); // Debug log

    // Announce to screen readers
    announceToScreenReader('Timer pausad.');
}

/**
 * Resume timer from paused state
 */
export function resumeTimer() {
    if (SourdoughApp.isPaused && SourdoughApp.remainingTime > 0) {
        const now = new Date();
        SourdoughApp.endTime = new Date(now.getTime() + SourdoughApp.remainingTime);
        SourdoughApp.isPaused = false;

        // Start countdown
        updateTimer();
        SourdoughApp.timerInterval = setInterval(updateTimer, 1000);

        // Update button visibility
        document.getElementById('pauseBtn').style.display = 'inline-block';
        document.getElementById('resumeBtn').style.display = 'none';
        document.getElementById('restartBtn').style.display = 'none';

        // Update finish time display
        document.getElementById('finishTime').textContent = formatTime(SourdoughApp.endTime);

        // Announce to screen readers
        announceToScreenReader('Timer återupptagen.');
    }
}

/**
 * Restart timer from beginning
 */
export function restartTimer() {
    // Stop current timer if running
    if (SourdoughApp.timerInterval) {
        clearInterval(SourdoughApp.timerInterval);
        SourdoughApp.timerInterval = null;
    }

    // Reset state
    SourdoughApp.isPaused = false;
    SourdoughApp.remainingTime = 0;

    // Start fresh timer
    startTimer();

    // Announce to screen readers
    announceToScreenReader('Timer startad om från början.');
}

/**
 * Update timer countdown
 */
function updateTimer() {
    // Debug: check if we should even be updating
    if (SourdoughApp.isPaused) {
        console.warn('updateTimer called but timer is paused! Should not happen.');
        return;
    }

    const now = new Date();
    const remaining = SourdoughApp.endTime - now;
    const totalDuration = SourdoughApp.calculatedTime * 60 * 60 * 1000; // Total time in ms

    if (remaining <= 0) {
        // Timer finished
        clearInterval(SourdoughApp.timerInterval);
        SourdoughApp.timerInterval = null;

        document.getElementById('countdownTime').textContent = '00:00:00';
        document.getElementById('countdown').classList.add('finished');

        // Play sound
        playKitchenTimerSound();

        // Show notification if permission granted
        if ("Notification" in window && Notification.permission === "granted") {
            new Notification("🍞 Surdegen är klar!", {
                body: "Din deg har jäst klart och är redo att formas!",
                icon: "logo.PNG",
                requireInteraction: true
            });
        }

        announceToScreenReader('Timern har gått ut! Degen är redo att formas.', 5000);
        return;
    }

    // Calculate remaining time
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

    // Display countdown
    const countdownElement = document.getElementById('countdownTime');
    countdownElement.textContent =
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    // Update aria-label for screen readers
    countdownElement.setAttribute('aria-label',
        `${hours} ${hours === 1 ? 'timme' : 'timmar'}, ${minutes} ${minutes === 1 ? 'minut' : 'minuter'}, ${seconds} ${seconds === 1 ? 'sekund' : 'sekunder'} återstår`);

    // Update circular progress
    const progress = remaining / totalDuration;
    const circumference = 565.48; // 2 * PI * 90
    const offset = circumference * (1 - progress);
    document.getElementById('countdownProgress').style.strokeDashoffset = offset;
}
