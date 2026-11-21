import { Injectable } from '@angular/core';

export interface EncryptedPayload {
  zensEncrypted: true;
  version: 1;
  iv: string; // Base64
  ciphertext: string; // Base64
}

@Injectable({
  providedIn: 'root'
})
export class CryptoService {
  private cryptoKey: CryptoKey | null = null;
  private readonly APP_SALT = 'zens_manage_salt_v1_2026';

  /**
   * 是否已具備加密金鑰
   */
  hasKey(): boolean {
    return this.cryptoKey !== null;
  }

  /**
   * 根據 Google User ID (sub) 與 Email 衍生 AES-GCM 256 位元金鑰
   */
  async initKey(googleSub: string, email: string): Promise<void> {
    if (typeof window === 'undefined' || !window.crypto?.subtle) {
      console.warn('Web Crypto API not available in current environment');
      return;
    }

    const secretMaterial = `${googleSub}::${email}::${this.APP_SALT}`;
    const enc = new TextEncoder();
    const rawKey = enc.encode(secretMaterial);
    const salt = enc.encode(this.APP_SALT);

    // 匯入基礎密鑰
    const baseKey = await window.crypto.subtle.importKey(
      'raw',
      rawKey,
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    // 衍生 AES-GCM 256 位元密鑰
    this.cryptoKey = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * 清除記憶體中的加密金鑰
   */
  clearKey(): void {
    this.cryptoKey = null;
  }

  /**
   * 加密資料物件或字串，回傳包含 iv 與 ciphertext 的 JSON 字串
   */
  async encrypt(data: any): Promise<string> {
    if (!this.cryptoKey) {
      throw new Error('未初始化加密金鑰，無法執行加密');
    }

    const plainText = typeof data === 'string' ? data : JSON.stringify(data);
    const enc = new TextEncoder();
    const encodedData = enc.encode(plainText);

    // 產生 12 位元組隨機 IV
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const cipherBuffer = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv
      },
      this.cryptoKey,
      encodedData
    );

    const payload: EncryptedPayload = {
      zensEncrypted: true,
      version: 1,
      iv: this.bufferToBase64(iv.buffer),
      ciphertext: this.bufferToBase64(cipherBuffer)
    };

    return JSON.stringify(payload, null, 2);
  }

  /**
   * 解密字串或物件，支援舊版未加密資料的向下相容
   */
  async decrypt<T = any>(payload: string | any): Promise<T> {
    let parsed: any;
    if (typeof payload === 'string') {
      try {
        parsed = JSON.parse(payload);
      } catch {
        return payload as T;
      }
    } else {
      parsed = payload;
    }

    // 若不是本系統加密格式，直接視為未加密舊格式相容回傳
    if (!parsed || !parsed.zensEncrypted || !parsed.iv || !parsed.ciphertext) {
      return parsed as T;
    }

    if (!this.cryptoKey) {
      throw new Error('加密金鑰尚未就緒，無法解密資產資料');
    }

    const iv = this.base64ToBuffer(parsed.iv);
    const ciphertext = this.base64ToBuffer(parsed.ciphertext);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: new Uint8Array(iv)
      },
      this.cryptoKey,
      ciphertext
    );

    const dec = new TextDecoder();
    const decryptedText = dec.decode(decryptedBuffer);

    try {
      return JSON.parse(decryptedText) as T;
    } catch {
      return decryptedText as unknown as T;
    }
  }

  private bufferToBase64(buffer: ArrayBufferLike): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  private base64ToBuffer(base64: string): ArrayBuffer {
    const binary = window.atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}
