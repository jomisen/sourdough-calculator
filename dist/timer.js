import { SourdoughApp } from './constants.js';
import { announceToScreenReader } from './display.js';
export function formatTime(date) {
    return date.toLocaleTimeString('sv-SE', {
        hour: '2-digit',
        minute: '2-digit'
    });
}
function playKitchenTimerSound() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioContext = new AudioContext();
        const ringPattern = [
            { start: 0, duration: 0.15 },
            { start: 0.25, duration: 0.15 },
            { start: 0.5, duration: 0.15 },
            { start: 1.0, duration: 0.15 },
            { start: 1.25, duration: 0.15 },
            { start: 1.5, duration: 0.15 },
        ];
        ringPattern.forEach(ring => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator.frequency.setValueAtTime(1200, audioContext.currentTime + ring.start);
            gainNode.gain.setValueAtTime(0, audioContext.currentTime + ring.start);
            gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + ring.start + 0.01);
            gainNode.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + ring.start + ring.duration - 0.05);
            gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + ring.start + ring.duration);
            oscillator.start(audioContext.currentTime + ring.start);
            oscillator.stop(audioContext.currentTime + ring.start + ring.duration);
        });
    }
    catch (e) {
        console.error('Kunde inte spela timer-ljud:', e);
        if ('vibrate' in navigator) {
            navigator.vibrate([200, 100, 200, 100, 200]);
        }
        announceToScreenReader('Timern har gått ut! Degen är redo att formas.');
    }
}
export function startTimer() {
    const now = new Date();
    SourdoughApp.endTime = new Date(now.getTime() + SourdoughApp.calculatedTime * 60 * 60 * 1000);
    SourdoughApp.isPaused = false;
    const startTimerBtn = document.getElementById('startTimerBtn');
    if (startTimerBtn) {
        startTimerBtn.style.display = 'none';
        startTimerBtn.setAttribute('aria-hidden', 'true');
    }
    const timerDisplay = document.getElementById('timerDisplay');
    if (timerDisplay) {
        timerDisplay.classList.add('active');
    }
    const startTimeEl = document.getElementById('startTime');
    const finishTimeEl = document.getElementById('finishTime');
    if (startTimeEl)
        startTimeEl.textContent = formatTime(now);
    if (finishTimeEl && SourdoughApp.endTime)
        finishTimeEl.textContent = formatTime(SourdoughApp.endTime);
    setTimeout(() => {
        const totalTimeElement = document.getElementById('totalTimeInTimer');
        if (totalTimeElement) {
            const totalTime = formatDuration(SourdoughApp.calculatedTime * 60 * 60 * 1000);
            totalTimeElement.textContent = `av ${totalTime}`;
        }
    }, 0);
    updateTimer();
    SourdoughApp.timerInterval = window.setInterval(updateTimer, 1000);
    const pauseBtn = document.getElementById('pauseBtn');
    const resumeBtn = document.getElementById('resumeBtn');
    const restartBtn = document.getElementById('restartBtn');
    if (pauseBtn)
        pauseBtn.style.display = 'inline-block';
    if (resumeBtn)
        resumeBtn.style.display = 'none';
    if (restartBtn)
        restartBtn.style.display = 'none';
    if (SourdoughApp.endTime) {
        announceToScreenReader(`Timer startad. Degen är klar klockan ${formatTime(SourdoughApp.endTime)}.`);
    }
    if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
    }
}
function formatDuration(milliseconds) {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) {
        return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
}
export function stopTimer() {
    console.log('stopTimer called, interval ID:', SourdoughApp.timerInterval);
    if (SourdoughApp.timerInterval) {
        const intervalId = SourdoughApp.timerInterval;
        clearInterval(intervalId);
        SourdoughApp.timerInterval = null;
        console.log('Interval cleared, ID was:', intervalId);
        const now = new Date();
        if (SourdoughApp.endTime) {
            SourdoughApp.remainingTime = SourdoughApp.endTime.getTime() - now.getTime();
        }
        SourdoughApp.isPaused = true;
        console.log('Remaining time saved:', SourdoughApp.remainingTime, 'isPaused:', SourdoughApp.isPaused);
    }
    else {
        console.warn('No interval to clear!');
    }
    const pauseBtn = document.getElementById('pauseBtn');
    const resumeBtn = document.getElementById('resumeBtn');
    const restartBtn = document.getElementById('restartBtn');
    if (pauseBtn)
        pauseBtn.style.display = 'none';
    if (resumeBtn) {
        resumeBtn.style.display = 'inline-block';
        const remainingTime = formatDuration(SourdoughApp.remainingTime);
        resumeBtn.innerHTML = `
            ⏯️ Fortsätt<br>
            <small style="font-size: var(--text-sm); opacity: 0.85; font-weight: 400; line-height: 1.3;">${remainingTime} kvar</small>
        `;
        resumeBtn.setAttribute('aria-label', `Fortsätt timer, ${remainingTime} kvar`);
    }
    if (restartBtn) {
        restartBtn.style.display = 'inline-block';
        const totalTime = formatDuration(SourdoughApp.calculatedTime * 60 * 60 * 1000);
        restartBtn.innerHTML = `
            🔄 Börja om<br>
            <small style="font-size: var(--text-sm); opacity: 0.85; font-weight: 400; line-height: 1.3;">från ${totalTime}</small>
        `;
        restartBtn.setAttribute('aria-label', `Starta om timer från ${totalTime}`);
    }
    console.log('Buttons updated');
    const remainingTime = formatDuration(SourdoughApp.remainingTime);
    announceToScreenReader(`Timer pausad. ${remainingTime} återstår.`);
}
export function resumeTimer() {
    if (SourdoughApp.isPaused && SourdoughApp.remainingTime > 0) {
        const now = new Date();
        SourdoughApp.endTime = new Date(now.getTime() + SourdoughApp.remainingTime);
        SourdoughApp.isPaused = false;
        updateTimer();
        SourdoughApp.timerInterval = window.setInterval(updateTimer, 1000);
        const pauseBtn = document.getElementById('pauseBtn');
        if (pauseBtn) {
            pauseBtn.style.display = 'inline-block';
            pauseBtn.innerHTML = '⏸️ Pausa timer';
            pauseBtn.setAttribute('aria-label', 'Pausa timer');
        }
        const resumeBtn = document.getElementById('resumeBtn');
        const restartBtn = document.getElementById('restartBtn');
        if (resumeBtn)
            resumeBtn.style.display = 'none';
        if (restartBtn)
            restartBtn.style.display = 'none';
        const finishTimeEl = document.getElementById('finishTime');
        if (finishTimeEl && SourdoughApp.endTime) {
            finishTimeEl.textContent = formatTime(SourdoughApp.endTime);
        }
        const totalTimeElement = document.getElementById('totalTimeInTimer');
        if (totalTimeElement) {
            const totalTime = formatDuration(SourdoughApp.calculatedTime * 60 * 60 * 1000);
            totalTimeElement.textContent = `av ${totalTime}`;
        }
        announceToScreenReader('Timer återupptagen.');
    }
}
export function restartTimer() {
    if (SourdoughApp.timerInterval) {
        clearInterval(SourdoughApp.timerInterval);
        SourdoughApp.timerInterval = null;
    }
    SourdoughApp.isPaused = false;
    SourdoughApp.remainingTime = 0;
    const countdown = document.getElementById('countdown');
    if (countdown) {
        countdown.classList.remove('finished');
    }
    startTimer();
    announceToScreenReader('Timer startad om från början.');
}
function updateTimer() {
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
    const totalDuration = SourdoughApp.calculatedTime * 60 * 60 * 1000;
    if (remaining <= 0) {
        if (SourdoughApp.timerInterval) {
            clearInterval(SourdoughApp.timerInterval);
            SourdoughApp.timerInterval = null;
        }
        const countdownTimeEl = document.getElementById('countdownTime');
        const countdownEl = document.getElementById('countdown');
        if (countdownTimeEl)
            countdownTimeEl.textContent = '00:00:00';
        if (countdownEl)
            countdownEl.classList.add('finished');
        const totalTimeElement = document.getElementById('totalTimeInTimer');
        if (totalTimeElement) {
            totalTimeElement.textContent = 'KLART!';
            totalTimeElement.style.color = 'var(--green-dark)';
            totalTimeElement.style.fontWeight = '700';
        }
        const scheduleTimerElement = document.getElementById('timer-in-schedule');
        if (scheduleTimerElement) {
            scheduleTimerElement.textContent = '00:00:00';
        }
        const pauseBtn = document.getElementById('pauseBtn');
        const resumeBtn = document.getElementById('resumeBtn');
        const restartBtn = document.getElementById('restartBtn');
        if (pauseBtn)
            pauseBtn.style.display = 'none';
        if (resumeBtn)
            resumeBtn.style.display = 'none';
        if (restartBtn) {
            restartBtn.style.display = 'inline-block';
            restartBtn.innerHTML = '✅ Stäng av & Återställ';
            restartBtn.setAttribute('aria-label', 'Stäng av timer och återställ');
        }
        if (typeof window.updateTimerButtons === 'function') {
            window.updateTimerButtons();
        }
        playKitchenTimerSound();
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
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
    const countdownElement = document.getElementById('countdownTime');
    const countdownText = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    if (countdownElement) {
        countdownElement.textContent = countdownText;
        countdownElement.setAttribute('aria-label', `${hours} ${hours === 1 ? 'timme' : 'timmar'}, ${minutes} ${minutes === 1 ? 'minut' : 'minuter'}, ${seconds} ${seconds === 1 ? 'sekund' : 'sekunder'} återstår`);
    }
    const progress = remaining / totalDuration;
    const circumference = 565.48;
    const offset = circumference * (1 - progress);
    const progressEl = document.getElementById('countdownProgress');
    if (progressEl) {
        progressEl.style.strokeDashoffset = String(offset);
    }
    const scheduleTimerElement = document.getElementById('timer-in-schedule');
    if (scheduleTimerElement) {
        scheduleTimerElement.textContent = countdownText;
    }
}
//# sourceMappingURL=timer.js.map