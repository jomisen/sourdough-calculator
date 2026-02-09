import { FERMENTATION_CONSTANTS } from './constants.js';
export function calculateHydration(water, flour) {
    return flour > 0 ? (water / flour) * 100 : 0;
}
export function getInputValues() {
    const advancedEnabled = document.getElementById('advancedToggle')?.checked || false;
    return {
        temp: parseFloat(document.getElementById('temperature').value),
        flour: parseFloat(document.getElementById('flour').value),
        water: parseFloat(document.getElementById('water').value),
        starter: parseFloat(document.getElementById('starter').value),
        salt: parseFloat(document.getElementById('salt').value),
        advancedEnabled,
        coldProof: advancedEnabled ? (parseFloat(document.getElementById('coldProof').value) || 0) : 0,
        fridgeTemp: advancedEnabled ? (parseFloat(document.getElementById('fridgeTemp').value) || 4) : 4,
        flourType: advancedEnabled ? (document.getElementById('flourType')?.value || 'mixed') : 'white',
        feedingRatio: advancedEnabled ? (document.getElementById('feedingRatio')?.value || '1:5:5') : '1:5:5',
        peakStatus: advancedEnabled ? (document.getElementById('peakStatus')?.value || 'normal') : 'normal',
        autolyse: advancedEnabled ? (document.getElementById('autolyse')?.value || 'no') : 'no'
    };
}
export function calculateBakersPercentages(inputs) {
    return {
        starterPercent: (inputs.starter / inputs.flour) * 100,
        hydration: calculateHydration(inputs.water, inputs.flour),
        saltPercent: (inputs.salt / inputs.flour) * 100
    };
}
export function calculateTemperatureFactor(temp) {
    return Math.pow(FERMENTATION_CONSTANTS.TEMP_FACTOR, FERMENTATION_CONSTANTS.BASE_TEMP - temp);
}
export function calculateStarterFactor(starterPercent) {
    return Math.pow(FERMENTATION_CONSTANTS.STARTER_FACTOR, (starterPercent - FERMENTATION_CONSTANTS.BASE_STARTER) / 5);
}
export function calculateFlourFactor(flourType, flour) {
    if (flourType === 'white') {
        return 1.0;
    }
    else if (flourType === 'whole') {
        return 0.85;
    }
    else if (flourType === 'mixed') {
        const wholeGrainAmount = parseFloat(document.getElementById('wholeGrainAmount')?.value || '0') || 0;
        const wholeGrainPercent = Math.min(wholeGrainAmount / flour, 1.0);
        const whitePercent = 1.0 - wholeGrainPercent;
        return (whitePercent * 1.0) + (wholeGrainPercent * 0.85);
    }
    return 1.0;
}
export function calculateAdvancedFactors(inputs) {
    if (!inputs.advancedEnabled) {
        return { peakFactor: 1.0, ratioFactor: 1.0, autolyseFactor: 1.0 };
    }
    let peakFactor = 1.0;
    if (inputs.peakStatus === 'rising')
        peakFactor = 1.15;
    else if (inputs.peakStatus === 'peak')
        peakFactor = 0.9;
    else if (inputs.peakStatus === 'falling')
        peakFactor = 1.2;
    let ratioFactor = 1.0;
    if (inputs.feedingRatio === '1:1:1')
        ratioFactor = 1.1;
    else if (inputs.feedingRatio === '1:2:2')
        ratioFactor = 1.05;
    else if (inputs.feedingRatio === '1:5:5')
        ratioFactor = 1.02;
    else if (inputs.feedingRatio === '1:10:10')
        ratioFactor = 0.9;
    const autolyseFactor = inputs.autolyse !== 'no' ? 0.95 : 1.0;
    return { peakFactor, ratioFactor, autolyseFactor };
}
export function calculateColdProofAdjustment(coldProof, fridgeTemp, bulkTime) {
    if (coldProof <= 0) {
        return { coldProofEquivalent: 0, bulkAdjustment: 0, totalAdjustedTime: bulkTime };
    }
    const coldFermentRate = 0.10 * Math.pow(1.20, fridgeTemp - 4);
    const coldProofEquivalent = coldProof * coldFermentRate;
    let bulkAdjustment = 0;
    if (fridgeTemp > 7 && coldProofEquivalent > 2) {
        bulkAdjustment = Math.min(coldProofEquivalent * 0.3, bulkTime * 0.2, 2);
    }
    return {
        coldProofEquivalent,
        bulkAdjustment,
        totalAdjustedTime: Math.max(3, bulkTime - bulkAdjustment)
    };
}
export function calculateFoldingSchedule(hydration) {
    let folds = 3;
    if (hydration > 75)
        folds = 4;
    if (hydration > 80)
        folds = 5;
    if (hydration > 85)
        folds = 6;
    const foldInterval = hydration > 80 ? 15 : (hydration > 75 ? 18 : 20);
    const times = [];
    for (let i = 0; i < folds; i++) {
        times.push(i * foldInterval);
    }
    return { times, count: folds };
}
export function calculateBakingTime(totalWeight, numLoaves) {
    const weightPerLoaf = totalWeight / numLoaves;
    const bakingTimeBase = 40;
    const weightFactor = weightPerLoaf / 1000;
    const totalBakeTime = Math.round(bakingTimeBase * Math.sqrt(weightFactor));
    const steamTime = Math.round(totalBakeTime * 0.55);
    return {
        preheatTime: 60,
        steamTime,
        totalBakeTime
    };
}
//# sourceMappingURL=calculator.js.map