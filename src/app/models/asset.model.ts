export interface AssetItem {
  id: string;
  name: string;
  value: number;
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
  email: string;
  name: string;
  picture: string;
}
