export type EnergySystemType = 'solar' | 'battery' | 'grid' | 'generator' | 'other';

export type EnergySystem = {
  id: string;
  name: string;
  type: EnergySystemType;
  capacityWatts?: number;
  createdAt: string;
  updatedAt: string;
};
