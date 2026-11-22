import { Injectable, signal, inject } from '@angular/core';
import { AssetItem, AssetRecord, ZensAppData } from '../../models/asset.model';
import { CryptoService } from '../crypto/crypto.service';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {
  private cryptoService = inject(CryptoService);

  private readonly STORAGE_KEY = 'zens_assets_app_data';
  private readonly DEVICE_ID_KEY = 'zens_device_id';

  readonly appData = signal<ZensAppData>(this.loadInitialData());

  constructor() {
    this.ensureDeviceId();
  }

  private ensureDeviceId(): string {
    if (typeof window === 'undefined') return 'server_device';
    let id = localStorage.getItem(this.DEVICE_ID_KEY);
    if (!id) {
      id = 'dev_' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem(this.DEVICE_ID_KEY, id);
    }
    return id;
  }

  getDeviceId(): string {
    return this.ensureDeviceId();
  }

  private loadInitialData(): ZensAppData {
    if (typeof window === 'undefined') {
      return this.createEmptyData();
    }
    const raw = localStorage.getItem(this.STORAGE_KEY);
    if (!raw) {
      return this.createEmptyData();
    }
    try {
      const parsed = JSON.parse(raw);
      // If encrypted, do not load plaintext before login
      if (parsed && parsed.zensEncrypted) {
        return this.createEmptyData();
      }
      if (!parsed.assets || !Array.isArray(parsed.assets)) {
        parsed.assets = [];
      }
      return parsed;
    } catch {
      return this.createEmptyData();
    }
  }

  /**
   * Decrypt locally stored cached data upon successful login and key derivation
   */
  async loadEncryptedData(): Promise<void> {
    if (typeof window === 'undefined') return;
    const raw = localStorage.getItem(this.STORAGE_KEY);
    if (!raw) return;

    try {
      const decrypted = await this.cryptoService.decrypt<ZensAppData>(raw);
      if (decrypted && Array.isArray(decrypted.assets)) {
        this.appData.set(decrypted);
      }
    } catch (err) {
      console.warn('[LocalStorage] Failed to decrypt local storage or invalid format, resetting to empty data', err);
      this.clearData();
    }
  }

  createEmptyData(): ZensAppData {
    return {
      schemaVersion: 1,
      lastModified: '',
      deviceId: this.ensureDeviceId(),
      assets: []
    };
  }

  getData(): ZensAppData {
    return this.appData();
  }

  /**
   * Overwrite entire AppData (update lastModified and encrypt to local storage)
   */
  saveData(data: ZensAppData, updateTimestamp: boolean = true): void {
    if (updateTimestamp) {
      data.lastModified = new Date().toISOString();
      data.deviceId = this.getDeviceId();
    }
    this.appData.set({ ...data });

    if (typeof window === 'undefined') return;

    if (this.cryptoService.hasKey()) {
      this.cryptoService.encrypt(data).then(encryptedStr => {
        localStorage.setItem(this.STORAGE_KEY, encryptedStr);
      }).catch(err => {
        console.error('[LocalStorage] Failed to encrypt data', err);
      });
    } else {
      // Do not store plaintext when key is not initialized
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  /**
   * Clear all local asset caches
   */
  clearData(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.STORAGE_KEY);
    }
    this.appData.set(this.createEmptyData());
  }

  /**
   * Get asset records sorted by date descending
   */
  getAssets(): AssetRecord[] {
    return [...this.appData().assets].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  getAssetById(id: string): AssetRecord | undefined {
    return this.appData().assets.find(a => a.id === id);
  }

  /**
   * Get items from the latest record (used to auto-fill previous items)
   */
  getLastItems(): AssetItem[] {
    const sorted = [...this.appData().assets].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (sorted.length > 0 && sorted[0].items && sorted[0].items.length > 0) {
      return sorted[0].items.map(i => ({
        id: 'item_' + Math.random().toString(36).substring(2, 9),
        name: i.name,
        value: 0,
        category: i.category || 'none'
      }));
    }
    return [
      { id: 'item_' + Math.random().toString(36).substring(2, 9), name: '', value: 0, category: 'none' }
    ];
  }

  /**
   * Create or update a single asset record
   */
  saveAsset(record: Omit<AssetRecord, 'id' | 'createdAt' | 'updatedAt' | 'total'> & { id?: string }): AssetRecord {
    const currentData = this.getData();
    const now = new Date().toISOString();

    const items = record.items.map(item => ({
      id: item.id || 'item_' + Math.random().toString(36).substring(2, 9),
      name: item.name.trim(),
      value: Number(item.value) || 0,
      category: item.category || 'none'
    }));

    const total = items.reduce((sum, item) => sum + item.value, 0);

    let savedRecord: AssetRecord;

    if (record.id) {
      const index = currentData.assets.findIndex(a => a.id === record.id);
      if (index !== -1) {
        savedRecord = {
          ...currentData.assets[index],
          date: record.date,
          items,
          total,
          updatedAt: now
        };
        currentData.assets[index] = savedRecord;
      } else {
        savedRecord = {
          id: record.id,
          date: record.date,
          items,
          total,
          createdAt: now,
          updatedAt: now
        };
        currentData.assets.push(savedRecord);
      }
    } else {
      savedRecord = {
        id: 'asset_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        date: record.date,
        items,
        total,
        createdAt: now,
        updatedAt: now
      };
      currentData.assets.push(savedRecord);
    }

    this.saveData(currentData, true);
    return savedRecord;
  }

  /**
   * Delete a single record
   */
  deleteAsset(id: string): boolean {
    const currentData = this.getData();
    const beforeCount = currentData.assets.length;
    currentData.assets = currentData.assets.filter(a => a.id !== id);
    if (currentData.assets.length !== beforeCount) {
      this.saveData(currentData, true);
      return true;
    }
    return false;
  }

  /**
   * Import external JSON backup (e.g. exported_assets.json)
   */
  importData(importedData: Partial<ZensAppData>): boolean {
    if (!importedData || !Array.isArray(importedData.assets)) {
      throw new Error('Invalid backup data format: missing assets array');
    }

    const assets: AssetRecord[] = importedData.assets.map((a: any) => ({
      id: String(a.id || 'asset_' + Math.random().toString(36).substring(2, 8)),
      date: a.date,
      items: (a.items || []).map((it: any) => ({
        id: String(it.id || 'item_' + Math.random().toString(36).substring(2, 8)),
        name: it.name || '',
        value: Number(it.value) || 0,
        category: it.category || 'none'
      })),
      total: Number(a.total) || 0,
      createdAt: a.createdAt || new Date().toISOString(),
      updatedAt: a.updatedAt || new Date().toISOString()
    }));

    const mergedData: ZensAppData = {
      schemaVersion: 1,
      lastModified: new Date().toISOString(),
      deviceId: this.getDeviceId(),
      assets
    };

    this.saveData(mergedData, true);
    return true;
  }
}
