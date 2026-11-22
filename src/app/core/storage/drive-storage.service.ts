import { Injectable, inject } from '@angular/core';
import { ZensAppData } from '../../models/asset.model';
import { CryptoService } from '../crypto/crypto.service';

@Injectable({
  providedIn: 'root'
})
export class DriveStorageService {
  private cryptoService = inject(CryptoService);

  private readonly DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
  private readonly UPLOAD_API_BASE = 'https://www.googleapis.com/upload/drive/v3';

  /**
   * Search for a file with the specified filename
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
   * Download file content and automatically decrypt with AES
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

    const rawData = await res.json();
    // Decrypt via CryptoService (backward compatible for unencrypted files)
    return await this.cryptoService.decrypt<ZensAppData>(rawData);
  }

  /**
   * Create new file (AES encrypted content with multipart upload)
   */
  async createFile(token: string, filename: string, content: ZensAppData): Promise<{ id: string }> {
    const metadata = {
      name: filename,
      mimeType: 'application/json'
    };

    // Encrypt content
    const encryptedBody = await this.cryptoService.encrypt(content);

    const boundary = '-------zens_drive_boundary_' + Date.now();
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      encryptedBody +
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
   * Update existing file content (AES encrypted content)
   */
  async updateFile(token: string, fileId: string, content: ZensAppData): Promise<void> {
    // Encrypt content
    const encryptedBody = await this.cryptoService.encrypt(content);

    const res = await fetch(`${this.UPLOAD_API_BASE}/files/${fileId}?uploadType=media`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: encryptedBody
    });

    if (res.status === 401) {
      throw new Error('UNAUTHORIZED');
    }

    if (!res.ok) {
      throw new Error(`Drive updateFile failed: ${res.statusText}`);
    }
  }
}
