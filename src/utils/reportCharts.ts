import { BiometricData } from './DemoBiometricSimulator';
import { CuePlayEvent } from '../services/SessionEngine';

export type TrendKey = 'heartRate' | 'movement' | 'temperature' | 'sleepStage';

export interface TimeSeries {
  labels: string[];
  data: number[];
  timestamps: number[];
  cueIndexMap: Record<number, CuePlayEvent[]>;
}

const stageLevels: Record<BiometricData['sleepStage'], number> = {
  Awake: 4,
  REM: 3,
  Light: 2,
  Deep: 1,
};

export const stageLegend = [
  { label: 'Awake', value: stageLevels.Awake },
  { label: 'REM', value: stageLevels.REM },
  { label: 'Light', value: stageLevels.Light },
  { label: 'Deep', value: stageLevels.Deep },
];

export const formatStageLabel = (value: string) => {
  const rounded = Math.round(Number(value));
  const entry = stageLegend.find(stage => stage.value === rounded);
  return entry ? entry.label : value;
};

export const buildTimeSeries = (
  logs: BiometricData[],
  cues: CuePlayEvent[],
  key: TrendKey,
): TimeSeries => {
  const sortedLogs = [...logs].sort((a, b) => a.timestamp - b.timestamp);
  const timestamps = sortedLogs.map(log => log.timestamp);
  const labels = buildLabels(timestamps);

  const data = sortedLogs.map(log => {
    if (key === 'sleepStage') {
      return stageLevels[log.sleepStage];
    }
    return log[key];
  });

  const cueIndexMap = mapCuesToIndices(timestamps, cues);

  return {
    labels,
    data,
    timestamps,
    cueIndexMap,
  };
};

export const getCueIndices = (cueIndexMap: Record<number, CuePlayEvent[]>): number[] =>
  Object.keys(cueIndexMap).map(Number);

export const buildHideListForDots = (cueIndices: number[], dataLength: number) => {
  if (cueIndices.length === 0) return undefined;
  const cueSet = new Set(cueIndices);
  return Array.from({ length: dataLength })
    .map((_, idx) => (cueSet.has(idx) ? -1 : idx))
    .filter(idx => idx >= 0);
};

const buildLabels = (timestamps: number[]): string[] => {
  if (timestamps.length === 0) return [];
  const start = timestamps[0];
  const interval = Math.max(1, Math.floor(timestamps.length / 6));

  return timestamps.map((ts, index) => {
    if (index === 0 || index === timestamps.length - 1 || index % interval === 0) {
      const minutes = Math.round((ts - start) / 60000);
      return `${minutes}m`;
    }
    return '';
  });
};

const mapCuesToIndices = (timestamps: number[], cues: CuePlayEvent[]) => {
  const cueIndexMap: Record<number, CuePlayEvent[]> = {};
  if (timestamps.length === 0 || cues.length === 0) return cueIndexMap;

  cues.forEach(cue => {
    const nearestIndex = findNearestIndex(timestamps, cue.timestamp);
    if (nearestIndex !== -1) {
      if (!cueIndexMap[nearestIndex]) {
        cueIndexMap[nearestIndex] = [];
      }
      cueIndexMap[nearestIndex].push(cue);
    }
  });

  return cueIndexMap;
};

const findNearestIndex = (timestamps: number[], target: number) => {
  let nearestIndex = -1;
  let smallestDelta = Number.MAX_SAFE_INTEGER;

  timestamps.forEach((ts, index) => {
    const delta = Math.abs(ts - target);
    if (delta < smallestDelta) {
      smallestDelta = delta;
      nearestIndex = index;
    }
  });

  return nearestIndex;
};
