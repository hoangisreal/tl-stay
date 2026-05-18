import type { ListingCategory } from '../services/listingService.ts';

export interface CategoryDef {
  key: ListingCategory;
  label: string;
  icon: string;
}

export const CATEGORIES: CategoryDef[] = [
  { key: 'beach', label: 'Biển', icon: '🏖️' },
  { key: 'mountain', label: 'Núi', icon: '🏔️' },
  { key: 'city', label: 'Thành thị', icon: '🏙️' },
  { key: 'cabin', label: 'Cabin', icon: '🪵' },
  { key: 'countryside', label: 'Nông thôn', icon: '🌾' },
  { key: 'lakeside', label: 'Ven hồ', icon: '🏞️' },
  { key: 'tropical', label: 'Nhiệt đới', icon: '🌴' },
  { key: 'pool', label: 'Có hồ bơi', icon: '🏊' },
  { key: 'design', label: 'Thiết kế', icon: '✨' },
];
