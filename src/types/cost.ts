export type CostTreatment = 'capital' | 'maintenance';
export type SystemCostCategory = 'installation' | 'maintenance' | 'repair' | 'upgrade' | 'other';

export type SystemCost = {
  id: string;
  date: string;
  category: SystemCostCategory;
  description: string;
  amount: number;
  costTreatment: CostTreatment;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};
