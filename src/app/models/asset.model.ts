export type AssetCategory = 'cash' | 'investment' | 'other' | 'none';

export interface AssetItem {
  id: string;
  name: string;
  value: number;
  category?: AssetCategory;
}

export interface AssetRecord {
  id: string;
  date: string; // YYYY-MM-DD
  items: AssetItem[];
  total: number;
  createdAt: string;
  updatedAt: string;
}

export interface ZensAppData {
  schemaVersion: number;
  lastModified: string;
  deviceId: string;
  assets: AssetRecord[];
  settings?: {
    currency?: string;
    autoSyncDebounceMs?: number;
  };
}

export type SyncStatus = 'synced' | 'pending' | 'syncing' | 'offline' | 'error';

export interface UserProfile {
  id?: string;
  email: string;
  name: string;
  picture: string;
}

export const ASSET_CATEGORIES: { id: AssetCategory; label: string; icon: string; color: string }[] = [
  { id: 'cash', label: 'Cash', icon: 'account_balance', color: '#1976d2' },
  { id: 'investment', label: 'Investment', icon: 'trending_up', color: '#388e3c' },
  { id: 'other', label: 'Other', icon: 'category', color: '#f57c00' },
  { id: 'none', label: 'Uncategorized', icon: 'help_outline', color: '#757575' }
];

export function getCategoryLabel(category?: AssetCategory): string {
  switch (category) {
    case 'cash': return 'Cash';
    case 'investment': return 'Investment';
    case 'other': return 'Other';
    default: return 'Uncategorized';
  }
}
