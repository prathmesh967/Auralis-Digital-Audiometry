// Score calculator for 3D sound localization tests

import { Sound3DPosition, SoundTestResult } from './audioEngine3D';

export interface SpatialAccuracy {
  frontal: number;
  lateral: number;
  upperLateral: number;
  lowerLateral: number;
}

export interface TestScore {
  overallAccuracy: number;
  averageLatency: number;
  frontalBias: number;
  lateralDelay: number;
  spatialAccuracy: SpatialAccuracy;
  quadrantAnalysis: {
    frontLeft: number;
    frontRight: number;
    backLeft: number;
    backRight: number;
  };
}

function positionToDirection(position: Sound3DPosition): string {
  const { x, z } = position;

  if (z > 0.5) return 'front';
  if (z < -0.5) return 'back';
  if (x > 0.5) return 'right';
  if (x < -0.5) return 'left';

  return 'center';
}

function calculateQuadrant(position: Sound3DPosition): string {
  const frontBack = position.z > 0 ? 'front' : 'back';
  const leftRight = position.x < 0 ? 'left' : 'right';
  return `${frontBack}${leftRight.charAt(0).toUpperCase()}${leftRight.slice(1)}`;
}

export function calculateTestScore(results: SoundTestResult[]): TestScore {
  if (results.length === 0) {
    return {
      overallAccuracy: 0,
      averageLatency: 0,
      frontalBias: 0,
      lateralDelay: 0,
      spatialAccuracy: { frontal: 0, lateral: 0, upperLateral: 0, lowerLateral: 0 },
      quadrantAnalysis: { frontLeft: 0, frontRight: 0, backLeft: 0, backRight: 0 },
    };
  }

  // Overall accuracy
  const correctCount = results.filter((r) => r.correct).length;
  const overallAccuracy = (correctCount / results.length) * 100;

  // Average latency
  const averageLatency = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;

  // Analyze frontal vs lateral bias
  const frontalResults = results.filter((r) => Math.abs(r.position.z) > 0.5);
  const lateralResults = results.filter((r) => Math.abs(r.position.x) > 0.5);

  const frontalAccuracy =
    frontalResults.length > 0
      ? (frontalResults.filter((r) => r.correct).length / frontalResults.length) * 100
      : 0;
  const lateralAccuracy =
    lateralResults.length > 0
      ? (lateralResults.filter((r) => r.correct).length / lateralResults.length) * 100
      : 0;

  const frontalBias = frontalAccuracy - lateralAccuracy;

  // Lateral delay - average latency for lateral vs frontal sounds
  const frontalLatency =
    frontalResults.length > 0
      ? frontalResults.reduce((sum, r) => sum + r.responseTime, 0) / frontalResults.length
      : 0;
  const lateralLatency =
    lateralResults.length > 0
      ? lateralResults.reduce((sum, r) => sum + r.responseTime, 0) / lateralResults.length
      : 0;

  const lateralDelay = lateralLatency - frontalLatency;

  // Quadrant analysis
  const frontLeft = results
    .filter((r) => r.position.x < 0 && r.position.z > 0.5)
    .filter((r) => r.correct).length;
  const frontRight = results
    .filter((r) => r.position.x > 0 && r.position.z > 0.5)
    .filter((r) => r.correct).length;
  const backLeft = results
    .filter((r) => r.position.x < 0 && r.position.z < -0.5)
    .filter((r) => r.correct).length;
  const backRight = results
    .filter((r) => r.position.x > 0 && r.position.z < -0.5)
    .filter((r) => r.correct).length;

  // Spatial accuracy breakdown
  const directionalAccuracy: { [key: string]: number } = {};
  ['front', 'back', 'left', 'right'].forEach((dir) => {
    const dirResults = results.filter((r) => positionToDirection(r.position) === dir);
    if (dirResults.length > 0) {
      directionalAccuracy[dir] = (dirResults.filter((r) => r.correct).length / dirResults.length) * 100;
    }
  });

  return {
    overallAccuracy,
    averageLatency,
    frontalBias,
    lateralDelay,
    spatialAccuracy: {
      frontal: directionalAccuracy['front'] || 0,
      lateral: directionalAccuracy['left'] || 0,
      upperLateral: directionalAccuracy['left'] || 0,
      lowerLateral: directionalAccuracy['right'] || 0,
    },
    quadrantAnalysis: {
      frontLeft,
      frontRight,
      backLeft,
      backRight,
    },
  };
}

export function getPerceptionInsight(score: TestScore): string {
  if (score.overallAccuracy >= 90) {
    return 'Excellent spatial perception. Your hearing is highly localized.';
  }
  if (score.overallAccuracy >= 75) {
    return 'Good spatial awareness. Minor challenges in specific quadrants.';
  }
  if (score.overallAccuracy >= 60) {
    return 'Moderate localization ability. Consider focusing on frontal/lateral accuracy.';
  }
  return 'Spatial perception needs improvement. Practice with different sound angles.';
}
