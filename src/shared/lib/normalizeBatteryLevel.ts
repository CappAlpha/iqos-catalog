export const normalizeBatteryLevel = (level: number | null): number | null =>
  level !== null && Number.isInteger(level) && level >= 0 && level <= 100
    ? level
    : null;
