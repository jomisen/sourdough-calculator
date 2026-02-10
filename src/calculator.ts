/**
 * Core fermentation calculation logic
 */

import { FERMENTATION_CONSTANTS } from './constants.js';
import type {
    FermentationInputs,
    BakersPercentages,
    AdvancedFactors,
    ColdProofAdjustment,
    FoldingSchedule,
    BakingTimes,
    FlourType,
    FeedingRatio,
    PeakStatus,
    AutolyseOption
} from './types.js';

/**
 * Calculate hydration percentage
 */
export function calculateHydration(water: number, flour: number): number {
    return flour > 0 ? (water / flour) * 100 : 0;
}

/**
 * Read all input values from the form
 */
export function getInputValues(): FermentationInputs {
    const advancedEnabled = (document.getElementById('advancedToggle') as HTMLInputElement | null)?.checked || false;

    return {
        // Basic inputs
        temp: parseFloat((document.getElementById('temperature') as HTMLInputElement).value),
        flour: parseFloat((document.getElementById('flour') as HTMLInputElement).value),
        water: parseFloat((document.getElementById('water') as HTMLInputElement).value),
        starter: parseFloat((document.getElementById('starter') as HTMLInputElement).value),
        salt: parseFloat((document.getElementById('salt') as HTMLInputElement).value),

        // Advanced settings
        advancedEnabled,
        coldProof: advancedEnabled ? (parseFloat((document.getElementById('coldProof') as HTMLInputElement).value) || 0) : 0,
        fridgeTemp: advancedEnabled ? (parseFloat((document.getElementById('fridgeTemp') as HTMLInputElement).value) || 4) : 4,
        flourType: advancedEnabled ? ((document.getElementById('flourType') as HTMLSelectElement | null)?.value as FlourType || 'mixed') : 'white',
        feedingRatio: advancedEnabled ? ((document.getElementById('feedingRatio') as HTMLSelectElement | null)?.value as FeedingRatio || '1:5:5') : '1:5:5',
        peakStatus: advancedEnabled ? ((document.getElementById('peakStatus') as HTMLSelectElement | null)?.value as PeakStatus || 'normal') : 'normal',
        autolyse: advancedEnabled ? ((document.getElementById('autolyse') as HTMLSelectElement | null)?.value as AutolyseOption || 'no') : 'no'
    };
}

/**
 * Calculate baker's percentages
 */
export function calculateBakersPercentages(inputs: FermentationInputs): BakersPercentages {
    return {
        starterPercent: (inputs.starter / inputs.flour) * 100,
        hydration: calculateHydration(inputs.water, inputs.flour),
        saltPercent: (inputs.salt / inputs.flour) * 100
    };
}

/**
 * Calculate temperature factor
 * Higher temp = faster fermentation, lower temp = slower
 */
export function calculateTemperatureFactor(temp: number): number {
    return Math.pow(
        FERMENTATION_CONSTANTS.TEMP_FACTOR,
        FERMENTATION_CONSTANTS.BASE_TEMP - temp
    );
}

/**
 * Calculate starter factor
 * More starter = faster fermentation
 */
export function calculateStarterFactor(starterPercent: number): number {
    return Math.pow(
        FERMENTATION_CONSTANTS.STARTER_FACTOR,
        (starterPercent - FERMENTATION_CONSTANTS.BASE_STARTER) / 5
    );
}

/**
 * Calculate flour type factor
 * Whole grain ferments faster than white flour
 */
export function calculateFlourFactor(flourType: FlourType, flour: number): number {
    if (flourType === 'white') {
        return 1.0;
    } else if (flourType === 'whole') {
        return 0.85; // Faster with whole grain
    } else if (flourType === 'mixed') {
        const wholeGrainAmount = parseFloat((document.getElementById('wholeGrainAmount') as HTMLInputElement | null)?.value || '0') || 0;
        const wholeGrainPercent = Math.min(wholeGrainAmount / flour, 1.0);
        const whitePercent = 1.0 - wholeGrainPercent;

        // Weighted average: white (1.0) and whole grain (0.85)
        return (whitePercent * 1.0) + (wholeGrainPercent * 0.85);
    }
    return 1.0;
}

/**
 * Calculate advanced factors (peak status, feeding ratio, autolys)
 */
export function calculateAdvancedFactors(inputs: FermentationInputs): AdvancedFactors {
    if (!inputs.advancedEnabled) {
        return { peakFactor: 1.0, ratioFactor: 1.0, autolyseFactor: 1.0 };
    }

    // Peak status factor
    let peakFactor = 1.0;
    if (inputs.peakStatus === 'rising') peakFactor = 1.15;      // Not at peak yet
    else if (inputs.peakStatus === 'peak') peakFactor = 0.9;    // Optimal
    else if (inputs.peakStatus === 'falling') peakFactor = 1.2; // Past optimal

    // Feeding ratio factor
    let ratioFactor = 1.0;
    if (inputs.feedingRatio === '1:1:1') ratioFactor = 1.1;     // Less vigorous
    else if (inputs.feedingRatio === '1:2:2') ratioFactor = 1.05;
    else if (inputs.feedingRatio === '1:5:5') ratioFactor = 1.02;
    else if (inputs.feedingRatio === '1:10:10') ratioFactor = 0.9; // Very vigorous

    // Autolyse factor
    const autolyseFactor = inputs.autolyse !== 'no' ? 0.95 : 1.0;

    return { peakFactor, ratioFactor, autolyseFactor };
}

/**
 * Calculate cold proofing adjustment
 */
export function calculateColdProofAdjustment(coldProof: number, fridgeTemp: number, bulkTime: number): ColdProofAdjustment {
    if (coldProof <= 0) {
        return { coldProofEquivalent: 0, bulkAdjustment: 0, totalAdjustedTime: bulkTime };
    }

    // Fermentation rate based on fridge temp
    // 4°C = 10%, increases exponentially
    const coldFermentRate = 0.10 * Math.pow(1.20, fridgeTemp - 4);
    const coldProofEquivalent = coldProof * coldFermentRate;

    let bulkAdjustment = 0;
    // Only adjust bulk time slightly for warm fridges
    // Cold proofing CANNOT replace bulk fermentation!
    if (fridgeTemp > 7 && coldProofEquivalent > 2) {
        // Only reduce bulk by max 20% or 2h, whichever is less
        bulkAdjustment = Math.min(coldProofEquivalent * 0.3, bulkTime * 0.2, 2);
    }

    return {
        coldProofEquivalent,
        bulkAdjustment,
        totalAdjustedTime: Math.max(3, bulkTime - bulkAdjustment)
    };
}

/**
 * Calculate folding schedule based on hydration
 */
export function calculateFoldingSchedule(hydration: number): FoldingSchedule {
    let folds = 3;
    if (hydration > 75) folds = 4;
    if (hydration > 80) folds = 5;
    if (hydration > 85) folds = 6;

    const foldInterval = hydration > 80 ? 15 : (hydration > 75 ? 18 : 20);

    const times: number[] = [];
    for (let i = 0; i < folds; i++) {
        times.push(i * foldInterval);
    }

    return { times, count: folds };
}

/**
 * Calculate baking time based on weight per loaf
 */
export function calculateBakingTime(totalWeight: number, numLoaves: number): BakingTimes {
    const weightPerLoaf = totalWeight / numLoaves;
    const bakingTimeBase = 40; // Base time for ~1kg loaf
    const weightFactor = weightPerLoaf / 1000;
    const totalBakeTime = Math.round(bakingTimeBase * Math.sqrt(weightFactor));
    const steamTime = Math.round(totalBakeTime * 0.55);

    return {
        preheatTime: 60,
        steamTime,
        totalBakeTime
    };
}
