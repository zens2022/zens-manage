import { Injectable } from '@angular/core';
import { ZensAppData } from '../../models/asset.model';

@Injectable({
  providedIn: 'root'
})
export class DriveStorageService {
  private readonly DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
  private readonly UPLOAD_API_BASE = 'https://www.googleapis.com/upload/drive/v3';

  /**
   * 搜尋指定檔名之檔案
   */
  async findFile(token: string, filename: string): Promise<{ id: string; name: string } | null> {
    const query = encodeURIComponent(`name = '${filename}' and trashed = false`);
    const url = `${this.DRIVE_API_BASE}/files?q=${query}&fields=files(id,name,modifiedTime)&spaces=drive`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (res.status === 401) {
      throw new Error('UNAUTHORIZED');
    }

    if (!res.ok) {
      throw new Error(`Drive search failed: ${res.statusText}`);
    }

    const data = await res.json();
    if (data.files && data.files.length > 0) {
      return data.files[0];
    }
    return null;
  }

  /**
   * 下載檔案內容 (JSON)
   */
  async downloadFile(token: string, fileId: string): Promise<ZensAppData> {
    const url = `${this.DRIVE_API_BASE}/files/${fileId}?alt=media`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (res.status === 401) {
      throw new Error('UNAUTHORIZED');
    }

    if (!res.ok) {
      throw new Error(`Drive download failed: ${res.statusText}`);
    }

    return await res.json();
  }

  /**
   * 建立新檔案 (Multipart upload)
   */
  async createFile(token: string, filename: string, content: ZensAppData): Promise<{ id: string }> {
    const metadata = {
      name: filename,
      mimeType: 'application/json'
    };

    const boundary = '-------zens_drive_boundary_' + Date.now();
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      JSON.stringify(content, null, 2) +
      closeDelimiter;

    const res = await fetch(`${this.UPLOAD_API_BASE}/files?uploadType=multipart`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`
      },
      body: multipartRequestBody
    });

    if (res.status === 401) {
      throw new Error('UNAUTHORIZED');
    }

    if (!res.ok) {
      throw new Error(`Drive createFile failed: ${res.statusText}`);
    }

    return await res.json();
  }

  /**
   * 更新現有檔案內容
   */
  async updateFile(token: string, fileId: string, content: ZensAppData): Promise<void> {
    const res = await fetch(`${this.UPLOAD_API_BASE}/files/${fileId}?uploadType=media`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(content, null, 2)
    });

    if (res.status === 401) {
      throw new Error('UNAUTHORIZED');
    }

    if (!res.ok) {
      throw new Error(`Drive updateFile failed: ${res.statusText}`);
    }
  }
}
