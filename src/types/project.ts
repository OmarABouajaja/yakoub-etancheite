export interface Project {
  id: string;
  title_fr: string;
  title_ar: string;
  image_before: string;
  image_after: string;
  location_gov: string;
}

export interface QuoteFormData {
  problemType: 'roof' | 'wall' | 'pool' | 'basement' | null;
  surfaceArea: number;
  isUrgent: boolean;
  name: string;
  phone: string;
}
