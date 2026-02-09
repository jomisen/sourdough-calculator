/**
 * Analytics tracking using GoatCounter
 */

import { calculateHydration } from './calculator.js';

declare global {
    interface Window {
        goatcounter?: {
            count: (params: { path: string; title: string; event: boolean }) => void;
        };
    }
}

/**
 * Track calculator usage in GoatCounter
 */
export function trackCalculatorUsed(): void {
    if (!window.goatcounter) return;

    const temp = (document.getElementById('temperature') as HTMLInputElement).value;
    const flour = parseFloat((document.getElementById('flour') as HTMLInputElement).value) || 0;
    const water = parseFloat((document.getElementById('water') as HTMLInputElement).value) || 0;
    const starter = parseFloat((document.getElementById('starter') as HTMLInputElement).value) || 0;

    // Calculate percentages for tracking
    const hydration = calculateHydration(water, flour).toFixed(0);
    const starterPercent = flour > 0 ? ((starter / flour) * 100).toFixed(0) : '0';

    window.goatcounter.count({
        path: '/event/calculator-used',
        title: `Kalkylator använd: ${temp}°C, ${starterPercent}% surdeg, ${hydration}% hydrering`,
        event: true
    });
}

/**
 * Track timer start in GoatCounter
 */
export function trackTimerStarted(): void {
    if (!window.goatcounter) return;

    window.goatcounter.count({
        path: '/event/timer-started',
        title: 'Timer startad',
        event: true
    });
}
