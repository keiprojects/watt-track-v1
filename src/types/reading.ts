export type ReadingDirection = 'generated' | 'consumed';

export type EnergyReading = {
  id: string;
  systemId?: string;
  watts: number;
  durationMinutes: number;
  direction: ReadingDirection;
  recordedAt: string;
  notes?: string;
};
