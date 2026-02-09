/**
 * Type definitions for Sourdough Calculator
 */

export type FlourType = 'white' | 'whole' | 'mixed';
export type FeedingRatio = '1:1:1' | '1:2:2' | '1:5:5' | '1:10:10';
export type PeakStatus = 'rising' | 'peak' | 'falling' | 'normal';
export type AutolyseOption = 'no' | '30' | '60' | '120';

export interface FermentationInputs {
    // Basic inputs
    temp: number;
    flour: number;
    water: number;
    starter: number;
    salt: number;

    // Advanced settings
    advancedEnabled: boolean;
    coldProof: number;
    fridgeTemp: number;
    flourType: FlourType;
    feedingRatio: FeedingRatio;
    peakStatus: PeakStatus;
    autolyse: AutolyseOption;
}

export interface BakersPercentages {
    starterPercent: number;
    hydration: number;
    saltPercent: number;
}

export interface AdvancedFactors {
    peakFactor: number;
    ratioFactor: number;
    autolyseFactor: number;
}

export interface ColdProofAdjustment {
    coldProofEquivalent: number;
    bulkAdjustment: number;
    totalAdjustedTime: number;
}

export interface FoldingSchedule {
    times: number[];
    count: number;
}

export interface BakingTimes {
    preheatTime: number;
    steamTime: number;
    totalBakeTime: number;
}

export interface FermentationConstants {
    BASE_TIME: number;
    BASE_TEMP: number;
    TEMP_FACTOR: number;
    BASE_STARTER: number;
    STARTER_FACTOR: number;
    BASE_HYDRATION: number;
    HYDRATION_FACTOR: number;
    MIN_FOLDS: number;
    MAX_FOLDS: number;
    MIN_TIME: number;
    MAX_TIME: number;
}
