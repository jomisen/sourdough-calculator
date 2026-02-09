/**
 * Timer and notification functionality
 */

import { SourdoughApp } from './constants.js';
import { announceToScreenReader } from './display.js';

/**
 * Format time for display
 */
export function formatTime(date: Date): string {
    return date.toLocaleTimeString('sv-SE', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Play kitchen timer ringing sound
 */
function playKitchenTimerSound(): void {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioContext();

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
export function startTimer(): void {
    const now = new Date();
    SourdoughApp.endTime = new Date(now.getTime() + SourdoughApp.calculatedTime * 60 * 60 * 1000);
    SourdoughApp.isPaused = false;

    // Update UI
    const startTimerBtn = document.getElementById('startTimerBtn');
    if (startTimerBtn) {
        startTimerBtn.style.display = 'none';
        startTimerBtn.setAttribute('aria-hidden', 'true');
    }

    const timerDisplay = document.getElementById('timerDisplay');
    if (timerDisplay) {
        timerDisplay.classList.add('active');
    }

    // Format and display times
    const startTimeEl = document.getElementById('startTime');
    const finishTimeEl = document.getElementById('finishTime');
    if (startTimeEl) startTimeEl.textContent = formatTime(now);
    if (finishTimeEl && SourdoughApp.endTime) finishTimeEl.textContent = formatTime(SourdoughApp.endTime);

    // Show total time in timer display (after timer-display is visible)
    // Use setTimeout to ensure DOM has updated after classList.add
    setTimeout(() => {
        const totalTimeElement = document.getElementById('totalTimeInTimer');
        if (totalTimeElement) {
            const totalTime = formatDuration(SourdoughApp.calculatedTime * 60 * 60 * 1000);
            totalTimeElement.textContent = `av ${totalTime}`;
        }
    }, 0);

    // Start countdown
    updateTimer();
    SourdoughApp.timerInterval = window.setInterval(updateTimer, 1000);

    // Update button states
    const pauseBtn = document.getElementById('pauseBtn');
    const resumeBtn = document.getElementById('resumeBtn');
    const restartBtn = document.getElementById('restartBtn');

    if (pauseBtn) pauseBtn.style.display = 'inline-block';
    if (resumeBtn) resumeBtn.style.display = 'none';
    if (restartBtn) restartBtn.style.display = 'none';

    // Announce to screen readers
    if (SourdoughApp.endTime) {
        announceToScreenReader(`Timer startad. Degen är klar klockan ${formatTime(SourdoughApp.endTime)}.`);
    }

    // Request notification permission
    if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
    }
}

/**
 * Format duration in milliseconds to readable string
 */
function formatDuration(milliseconds: number): string {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
        return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
}

/**
 * Pause timer (keeps display visible)
 */
export function stopTimer(): void {
    console.log('stopTimer called, interval ID:', SourdoughApp.timerInterval); // Debug log

    if (SourdoughApp.timerInterval) {
        const intervalId = SourdoughApp.timerInterval;
        clearInterval(intervalId);
        SourdoughApp.timerInterval = null;
        console.log('Interval cleared, ID was:', intervalId); // Debug log

        // Save remaining time
        const now = new Date();
        if (SourdoughApp.endTime) {
            SourdoughApp.remainingTime = SourdoughApp.endTime.getTime() - now.getTime();
        }
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

    // Update Resume button with remaining time
    if (resumeBtn) {
        resumeBtn.style.display = 'inline-block';
        const remainingTime = formatDuration(SourdoughApp.remainingTime);
        resumeBtn.innerHTML = `
            ⏯️ Fortsätt<br>
            <small style="font-size: var(--text-sm); opacity: 0.85; font-weight: 400; line-height: 1.3;">${remainingTime} kvar</small>
        `;
        resumeBtn.setAttribute('aria-label', `Fortsätt timer, ${remainingTime} kvar`);
    }

    // Update Restart button with total time
    if (restartBtn) {
        restartBtn.style.display = 'inline-block';
        const totalTime = formatDuration(SourdoughApp.calculatedTime * 60 * 60 * 1000);
        restartBtn.innerHTML = `
            🔄 Börja om<br>
            <small style="font-size: var(--text-sm); opacity: 0.85; font-weight: 400; line-height: 1.3;">från ${totalTime}</small>
        `;
        restartBtn.setAttribute('aria-label', `Starta om timer från ${totalTime}`);
    }

    console.log('Buttons updated'); // Debug log

    // Announce to screen readers
    const remainingTime = formatDuration(SourdoughApp.remainingTime);
    announceToScreenReader(`Timer pausad. ${remainingTime} återstår.`);
}

/**
 * Resume timer from paused state
 */
export function resumeTimer(): void {
    if (SourdoughApp.isPaused && SourdoughApp.remainingTime > 0) {
        const now = new Date();
        SourdoughApp.endTime = new Date(now.getTime() + SourdoughApp.remainingTime);
        SourdoughApp.isPaused = false;

        // Start countdown
        updateTimer();
        SourdoughApp.timerInterval = window.setInterval(updateTimer, 1000);

        // Update button visibility and restore pause button text
        const pauseBtn = document.getElementById('pauseBtn');
        if (pauseBtn) {
            pauseBtn.style.display = 'inline-block';
            pauseBtn.innerHTML = '⏸️ Pausa timer';
            pauseBtn.setAttribute('aria-label', 'Pausa timer');
        }

        const resumeBtn = document.getElementById('resumeBtn');
        const restartBtn = document.getElementById('restartBtn');
        if (resumeBtn) resumeBtn.style.display = 'none';
        if (restartBtn) restartBtn.style.display = 'none';

        // Update finish time display
        const finishTimeEl = document.getElementById('finishTime');
        if (finishTimeEl && SourdoughApp.endTime) {
            finishTimeEl.textContent = formatTime(SourdoughApp.endTime);
        }

        // Show total time in timer display
        const totalTimeElement = document.getElementById('totalTimeInTimer');
        if (totalTimeElement) {
            const totalTime = formatDuration(SourdoughApp.calculatedTime * 60 * 60 * 1000);
            totalTimeElement.textContent = `av ${totalTime}`;
        }

        // Announce to screen readers
        announceToScreenReader('Timer återupptagen.');
    }
}

/**
 * Restart timer from beginning
 */
export function restartTimer(): void {
    // Stop current timer if running
    if (SourdoughApp.timerInterval) {
        clearInterval(SourdoughApp.timerInterval);
        SourdoughApp.timerInterval = null;
    }

    // Reset state
    SourdoughApp.isPaused = false;
    SourdoughApp.remainingTime = 0;

    // Remove finished class if present
    const countdown = document.getElementById('countdown');
    if (countdown) {
        countdown.classList.remove('finished');
    }

    // Start fresh timer
    startTimer();

    // Announce to screen readers
    announceToScreenReader('Timer startad om från början.');
}

/**
 * Update timer countdown
 */
function updateTimer(): void {
    // Debug: check if we should even be updating
    if (SourdoughApp.isPaused) {
        console.warn('updateTimer called but timer is paused! Should not happen.');
        return;
    }

    if (!SourdoughApp.endTime) {
        console.error('updateTimer called but endTime is null!');
        return;
    }

    const now = new Date();
    const remaining = SourdoughApp.endTime.getTime() - now.getTime();
    const totalDuration = SourdoughApp.calculatedTime * 60 * 60 * 1000; // Total time in ms

    if (remaining <= 0) {
        // Timer finished
        if (SourdoughApp.timerInterval) {
            clearInterval(SourdoughApp.timerInterval);
            SourdoughApp.timerInterval = null;
        }

        const countdownTimeEl = document.getElementById('countdownTime');
        const countdownEl = document.getElementById('countdown');
        if (countdownTimeEl) countdownTimeEl.textContent = '00:00:00';
        if (countdownEl) countdownEl.classList.add('finished');

        // Update total time display when finished
        const totalTimeElement = document.getElementById('totalTimeInTimer');
        if (totalTimeElement) {
            totalTimeElement.textContent = 'KLART!';
            totalTimeElement.style.color = 'var(--green-dark)';
            totalTimeElement.style.fontWeight = '700';
        }

        // Update schedule timer if present (sticky timer)
        const scheduleTimerElement = document.getElementById('timer-in-schedule');
        if (scheduleTimerElement) {
            scheduleTimerElement.textContent = '00:00:00';
        }

        // Update buttons when timer finishes
        const pauseBtn = document.getElementById('pauseBtn');
        const resumeBtn = document.getElementById('resumeBtn');
        const restartBtn = document.getElementById('restartBtn');

        if (pauseBtn) pauseBtn.style.display = 'none';
        if (resumeBtn) resumeBtn.style.display = 'none';
        if (restartBtn) {
            restartBtn.style.display = 'inline-block';
            restartBtn.innerHTML = '✅ Stäng av & Återställ';
            restartBtn.setAttribute('aria-label', 'Stäng av timer och återställ');
        }

        // Also update schedule timer buttons if present
        if (typeof (window as any).updateTimerButtons === 'function') {
            (window as any).updateTimerButtons();
        }

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
    const countdownText = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    if (countdownElement) {
        countdownElement.textContent = countdownText;

        // Update aria-label for screen readers
        countdownElement.setAttribute('aria-label',
            `${hours} ${hours === 1 ? 'timme' : 'timmar'}, ${minutes} ${minutes === 1 ? 'minut' : 'minuter'}, ${seconds} ${seconds === 1 ? 'sekund' : 'sekunder'} återstår`);
    }

    // Update circular progress
    const progress = remaining / totalDuration;
    const circumference = 565.48; // 2 * PI * 90
    const offset = circumference * (1 - progress);
    const progressEl = document.getElementById('countdownProgress') as SVGCircleElement | null;
    if (progressEl) {
        progressEl.style.strokeDashoffset = String(offset);
    }

    // Sync with schedule timer display if present (sticky timer)
    const scheduleTimerElement = document.getElementById('timer-in-schedule');
    if (scheduleTimerElement) {
        scheduleTimerElement.textContent = countdownText;
    }
}
