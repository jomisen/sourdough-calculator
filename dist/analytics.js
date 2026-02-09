import { calculateHydration } from './calculator.js';
export function trackCalculatorUsed() {
    if (!window.goatcounter)
        return;
    const temp = document.getElementById('temperature').value;
    const flour = parseFloat(document.getElementById('flour').value) || 0;
    const water = parseFloat(document.getElementById('water').value) || 0;
    const starter = parseFloat(document.getElementById('starter').value) || 0;
    const hydration = calculateHydration(water, flour).toFixed(0);
    const starterPercent = flour > 0 ? ((starter / flour) * 100).toFixed(0) : '0';
    window.goatcounter.count({
        path: '/event/calculator-used',
        title: `Kalkylator använd: ${temp}°C, ${starterPercent}% surdeg, ${hydration}% hydrering`,
        event: true
    });
}
export function trackTimerStarted() {
    if (!window.goatcounter)
        return;
    window.goatcounter.count({
        path: '/event/timer-started',
        title: 'Timer startad',
        event: true
    });
}
//# sourceMappingURL=analytics.js.map