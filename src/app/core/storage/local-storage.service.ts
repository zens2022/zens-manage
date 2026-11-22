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
      // 若為加密資料，未登入前暫不載入明文
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
   * 當登入成功、金鑰衍生完成後，解密本地儲存的加密快取
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
      console.warn('[LocalStorage] 解密本機暫存失敗或格式不符，重設為空資料', err);
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
   * 覆寫整份 AppData (包含更新 lastModified 與 AES 加密寫入本機快取)
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
        console.error('[LocalStorage] 加密儲存失敗', err);
      });
    } else {
      // 未初始化金鑰時不儲存明文
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  /**
   * 清除本地所有資產暫存
   */
  clearData(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.STORAGE_KEY);
    }
    this.appData.set(this.createEmptyData());
  }

  /**
   * 取得按日期降序排列的資產清單
   */
  getAssets(): AssetRecord[] {
    return [...this.appData().assets].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  getAssetById(id: string): AssetRecord | undefined {
    return this.appData().assets.find(a => a.id === id);
  }

  /**
   * 取得最後一次填寫的資產記錄之明細結構 (用於自動帶入上次名稱)
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
   * 新增或更新單筆資產記錄
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
   * 刪除單筆記錄
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
   * 匯入外部 JSON 資料 (例如舊系統 exported_assets.json)
   */
  importData(importedData: Partial<ZensAppData>): boolean {
    if (!importedData || !Array.isArray(importedData.assets)) {
      throw new Error('無效的備份資料格式：缺少 assets 陣列');
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
