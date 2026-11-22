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
   * Check if encryption key is ready
   */
  hasKey(): boolean {
    return this.cryptoKey !== null;
  }

  /**
   * Derive AES-GCM 256-bit key based on Google User ID (sub) and Email
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

    // Import base key
    const baseKey = await window.crypto.subtle.importKey(
      'raw',
      rawKey,
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    // Derive AES-GCM 256-bit key
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
   * Clear encryption key in memory
   */
  clearKey(): void {
    this.cryptoKey = null;
  }

  /**
   * Encrypt data object or string, returning a JSON string with iv and ciphertext
   */
  async encrypt(data: any): Promise<string> {
    if (!this.cryptoKey) {
      throw new Error('Encryption key not initialized. Cannot perform encryption.');
    }

    const plainText = typeof data === 'string' ? data : JSON.stringify(data);
    const enc = new TextEncoder();
    const encodedData = enc.encode(plainText);

    // Generate 12-byte random IV
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
   * Decrypt payload, supporting backward compatibility for unencrypted data
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

    // If not encrypted format, return directly for backward compatibility
    if (!parsed || !parsed.zensEncrypted || !parsed.iv || !parsed.ciphertext) {
      return parsed as T;
    }

    if (!this.cryptoKey) {
      throw new Error('Encryption key not ready. Cannot decrypt asset data.');
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
