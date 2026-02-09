/**
 * Unit tests for core fermentation calculation logic
 */

import { describe, it, expect } from 'vitest';
import {
    calculateHydration,
    calculateBakersPercentages,
    calculateTemperatureFactor,
    calculateStarterFactor,
    calculateFlourFactor,
    calculateAdvancedFactors,
    calculateColdProofAdjustment,
    calculateFoldingSchedule,
    calculateBakingTime
} from './calculator.js';
import type { FermentationInputs } from './types.js';

describe('calculateHydration', () => {
    it('should calculate correct hydration percentage', () => {
        expect(calculateHydration(750, 1000)).toBe(75);
        expect(calculateHydration(800, 1000)).toBe(80);
        expect(calculateHydration(850, 1000)).toBe(85);
    });

    it('should return 0 when flour is 0', () => {
        expect(calculateHydration(750, 0)).toBe(0);
    });

    it('should handle decimal values', () => {
        expect(calculateHydration(375, 500)).toBe(75);
    });
});

describe('calculateBakersPercentages', () => {
    it('should calculate correct baker\'s percentages', () => {
        const inputs: FermentationInputs = {
            temp: 22,
            flour: 1000,
            water: 750,
            starter: 200,
            salt: 20,
            advancedEnabled: false,
            coldProof: 0,
            fridgeTemp: 4,
            flourType: 'white',
            feedingRatio: '1:5:5',
            peakStatus: 'normal',
            autolyse: 'no'
        };

        const result = calculateBakersPercentages(inputs);

        expect(result.starterPercent).toBe(20); // 200/1000 * 100
        expect(result.hydration).toBe(75); // 750/1000 * 100
        expect(result.saltPercent).toBe(2); // 20/1000 * 100
    });
});

describe('calculateTemperatureFactor', () => {
    it('should return 1.0 at base temperature (22°C)', () => {
        const factor = calculateTemperatureFactor(22);
        expect(factor).toBeCloseTo(1.0, 5);
    });

    it('should increase fermentation time at lower temperatures', () => {
        const factor20 = calculateTemperatureFactor(20);
        const factor22 = calculateTemperatureFactor(22);
        expect(factor20).toBeGreaterThan(factor22); // Slower = higher factor
    });

    it('should decrease fermentation time at higher temperatures', () => {
        const factor24 = calculateTemperatureFactor(24);
        const factor22 = calculateTemperatureFactor(22);
        expect(factor24).toBeLessThan(factor22); // Faster = lower factor
    });

    it('should handle extreme temperatures', () => {
        expect(calculateTemperatureFactor(15)).toBeGreaterThan(1);
        expect(calculateTemperatureFactor(30)).toBeLessThan(1);
    });
});

describe('calculateStarterFactor', () => {
    it('should return 1.0 at base starter percentage (20%)', () => {
        const factor = calculateStarterFactor(20);
        expect(factor).toBeCloseTo(1.0, 5);
    });

    it('should increase fermentation time with less starter', () => {
        const factor10 = calculateStarterFactor(10);
        const factor20 = calculateStarterFactor(20);
        expect(factor10).toBeGreaterThan(factor20); // Less starter = slower
    });

    it('should decrease fermentation time with more starter', () => {
        const factor30 = calculateStarterFactor(30);
        const factor20 = calculateStarterFactor(20);
        expect(factor30).toBeLessThan(factor20); // More starter = faster
    });
});

describe('calculateFlourFactor', () => {
    it('should return 1.0 for white flour', () => {
        const factor = calculateFlourFactor('white', 1000);
        expect(factor).toBe(1.0);
    });

    it('should return 0.85 for whole grain flour', () => {
        const factor = calculateFlourFactor('whole', 1000);
        expect(factor).toBe(0.85);
    });

    it('should return value between 0.85 and 1.0 for mixed flour', () => {
        // Mock DOM element for wholeGrainAmount input
        const mockInput = document.createElement('input');
        mockInput.id = 'wholeGrainAmount';
        mockInput.value = '500'; // 50% whole grain
        document.body.appendChild(mockInput);

        const factor = calculateFlourFactor('mixed', 1000);
        expect(factor).toBeGreaterThanOrEqual(0.85);
        expect(factor).toBeLessThanOrEqual(1.0);
        expect(factor).toBeCloseTo(0.925, 2); // (0.5 * 1.0) + (0.5 * 0.85) = 0.925

        // Cleanup
        document.body.removeChild(mockInput);
    });
});

describe('calculateAdvancedFactors', () => {
    it('should return all factors as 1.0 when advanced is disabled', () => {
        const inputs: FermentationInputs = {
            temp: 22,
            flour: 1000,
            water: 750,
            starter: 200,
            salt: 20,
            advancedEnabled: false,
            coldProof: 0,
            fridgeTemp: 4,
            flourType: 'white',
            feedingRatio: '1:5:5',
            peakStatus: 'normal',
            autolyse: 'no'
        };

        const factors = calculateAdvancedFactors(inputs);
        expect(factors.peakFactor).toBe(1.0);
        expect(factors.ratioFactor).toBe(1.0);
        expect(factors.autolyseFactor).toBe(1.0);
    });

    it('should apply peak status factor when at peak', () => {
        const inputs: FermentationInputs = {
            temp: 22,
            flour: 1000,
            water: 750,
            starter: 200,
            salt: 20,
            advancedEnabled: true,
            coldProof: 0,
            fridgeTemp: 4,
            flourType: 'white',
            feedingRatio: '1:5:5',
            peakStatus: 'peak',
            autolyse: 'no'
        };

        const factors = calculateAdvancedFactors(inputs);
        expect(factors.peakFactor).toBe(0.9); // Peak is optimal = faster
    });

    it('should apply autolyse factor when enabled', () => {
        const inputs: FermentationInputs = {
            temp: 22,
            flour: 1000,
            water: 750,
            starter: 200,
            salt: 20,
            advancedEnabled: true,
            coldProof: 0,
            fridgeTemp: 4,
            flourType: 'white',
            feedingRatio: '1:5:5',
            peakStatus: 'normal',
            autolyse: '60'
        };

        const factors = calculateAdvancedFactors(inputs);
        expect(factors.autolyseFactor).toBe(0.95); // Autolyse speeds up fermentation
    });
});

describe('calculateColdProofAdjustment', () => {
    it('should return zero adjustment when no cold proof', () => {
        const adjustment = calculateColdProofAdjustment(0, 4, 5);
        expect(adjustment.coldProofEquivalent).toBe(0);
        expect(adjustment.bulkAdjustment).toBe(0);
        expect(adjustment.totalAdjustedTime).toBe(5);
    });

    it('should calculate cold proof equivalent at fridge temp', () => {
        const adjustment = calculateColdProofAdjustment(12, 4, 5);
        expect(adjustment.coldProofEquivalent).toBeGreaterThan(0);
        expect(adjustment.coldProofEquivalent).toBeLessThan(12); // Slower in fridge
    });

    it('should not reduce bulk time too much', () => {
        const adjustment = calculateColdProofAdjustment(24, 10, 6);
        expect(adjustment.totalAdjustedTime).toBeGreaterThanOrEqual(3); // Minimum 3h bulk
    });

    it('should adjust more for warmer fridge temps', () => {
        const cold4 = calculateColdProofAdjustment(12, 4, 5);
        const cold8 = calculateColdProofAdjustment(12, 8, 5);
        expect(cold8.coldProofEquivalent).toBeGreaterThan(cold4.coldProofEquivalent);
    });
});

describe('calculateFoldingSchedule', () => {
    it('should recommend 3 folds for low hydration', () => {
        const schedule = calculateFoldingSchedule(65);
        expect(schedule.count).toBe(3);
    });

    it('should recommend 4 folds for medium-high hydration', () => {
        const schedule = calculateFoldingSchedule(78);
        expect(schedule.count).toBe(4);
    });

    it('should recommend 5 folds for high hydration', () => {
        const schedule = calculateFoldingSchedule(82);
        expect(schedule.count).toBe(5);
    });

    it('should recommend 6 folds for very high hydration', () => {
        const schedule = calculateFoldingSchedule(90);
        expect(schedule.count).toBe(6);
    });

    it('should generate correct number of fold times', () => {
        const schedule = calculateFoldingSchedule(75);
        expect(schedule.times).toHaveLength(schedule.count);
    });

    it('should space folds evenly', () => {
        const schedule = calculateFoldingSchedule(75);
        // Check that times are increasing
        for (let i = 1; i < schedule.times.length; i++) {
            expect(schedule.times[i]).toBeGreaterThan(schedule.times[i - 1]);
        }
    });
});

describe('calculateBakingTime', () => {
    it('should calculate reasonable baking time for standard loaf', () => {
        const times = calculateBakingTime(1970, 1); // ~1kg loaf (with starter, salt, water)
        expect(times.totalBakeTime).toBeGreaterThan(30);
        expect(times.totalBakeTime).toBeLessThan(60);
    });

    it('should always have preheat time of 60 minutes', () => {
        const times = calculateBakingTime(2000, 1);
        expect(times.preheatTime).toBe(60);
    });

    it('should have steam time as ~55% of total bake time', () => {
        const times = calculateBakingTime(2000, 1);
        const expectedSteam = Math.round(times.totalBakeTime * 0.55);
        expect(times.steamTime).toBe(expectedSteam);
    });

    it('should increase baking time for heavier loaves', () => {
        const small = calculateBakingTime(1500, 1);
        const large = calculateBakingTime(2500, 1);
        expect(large.totalBakeTime).toBeGreaterThan(small.totalBakeTime);
    });

    it('should handle multiple loaves', () => {
        const times = calculateBakingTime(4000, 2); // 2kg total, 2 loaves
        expect(times.totalBakeTime).toBeGreaterThan(0);
    });
});
