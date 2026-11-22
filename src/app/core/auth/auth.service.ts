import { Injectable, signal, inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { UserProfile } from '../../models/asset.model';
import { CryptoService } from '../crypto/crypto.service';
import { LocalStorageService } from '../storage/local-storage.service';

declare const google: any;

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private cryptoService = inject(CryptoService);
  private localService = inject(LocalStorageService);

  private readonly TOKEN_KEY = 'zens_google_token';
  private readonly USER_KEY = 'zens_google_user';
  private readonly EXPIRES_AT_KEY = 'zens_google_token_expires_at';

  readonly accessToken = signal<string | null>(this.getStoredToken());
  readonly currentUser = signal<UserProfile | null>(this.getStoredUser());
  readonly isLoggedIn = signal<boolean>(false);

  private tokenClient: any = null;
  private tokenCheckInterval: any = null;

  constructor() {
    this.restoreSessionOrLogout();
    this.startTokenExpiryWatch();
  }

  /**
   * Check current session. If valid, initialize crypto key and restore login state; otherwise clear local cache.
   */
  private async restoreSessionOrLogout(): Promise<void> {
    const token = this.getStoredToken();
    const user = this.getStoredUser();
    const expiresAtStr = typeof window !== 'undefined' ? sessionStorage.getItem(this.EXPIRES_AT_KEY) : null;

    if (token && user && expiresAtStr) {
      const expiresAt = parseInt(expiresAtStr, 10);
      if (Date.now() < expiresAt) {
        // Token is still valid, derive key and load local encrypted data
        if (user.id) {
          await this.cryptoService.initKey(user.id, user.email);
          await this.localService.loadEncryptedData();
        }
        this.accessToken.set(token);
        this.currentUser.set(user);
        this.isLoggedIn.set(true);
        return;
      }
    }

    // If no token or expired, logout and wipe local cache
    this.logout();
  }

  /**
   * Start token expiry polling. Once expired, immediately clear local cache.
   */
  private startTokenExpiryWatch(): void {
    if (typeof window === 'undefined') return;
    if (this.tokenCheckInterval) {
      clearInterval(this.tokenCheckInterval);
    }
    this.tokenCheckInterval = setInterval(() => {
      this.checkTokenValidity();
    }, 10000); // Check every 10 seconds
  }

  /**
   * Initialize Google Token Client
   */
  async ensureClientInitialized(): Promise<boolean> {
    if (this.tokenClient) return true;
    if (typeof window === 'undefined') return false;

    let attempts = 0;
    while (!(window as any).google?.accounts?.oauth2 && attempts < 20) {
      await new Promise(resolve => setTimeout(resolve, 200));
      attempts++;
    }

    if (!(window as any).google?.accounts?.oauth2) {
      console.error('Google Identity Services script failed to load.');
      return false;
    }

    this.tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: environment.googleClientId,
      scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
      callback: (tokenResponse: any) => {
        if (tokenResponse && tokenResponse.access_token) {
          this.handleTokenSuccess(tokenResponse);
        }
      },
      error_callback: (err: any) => {
        console.error('Google OAuth error:', err);
      }
    });

    return true;
  }

  /**
   * Trigger Google OAuth login popup
   */
  async login(): Promise<void> {
    const initialized = await this.ensureClientInitialized();
    if (!initialized) {
      alert('Google service failed to load or is loading. Please try again in a moment.');
      return;
    }
    this.tokenClient.requestAccessToken({ prompt: 'consent' });
  }

  /**
   * Logout and clear all local cached data and encryption keys
   */
  logout(): void {
    const token = this.accessToken();
    if (token && typeof window !== 'undefined' && (window as any).google?.accounts?.oauth2) {
      try {
        (window as any).google.accounts.oauth2.revoke(token, () => {
          console.log('Google token revoked');
        });
      } catch (e) {
        console.warn('Revoke token error', e);
      }
    }

    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(this.TOKEN_KEY);
      sessionStorage.removeItem(this.USER_KEY);
      sessionStorage.removeItem(this.EXPIRES_AT_KEY);
    }

    // Clear encryption key
    this.cryptoService.clearKey();

    // Clear local cached data
    this.localService.clearData();

    this.accessToken.set(null);
    this.currentUser.set(null);
    this.isLoggedIn.set(false);
  }

  private async handleTokenSuccess(tokenResponse: any): Promise<void> {
    const token = tokenResponse.access_token;
    const expiresIn = Number(tokenResponse.expires_in) || 3600;
    const expiresAt = Date.now() + (expiresIn - 60) * 1000;

    if (typeof window !== 'undefined') {
      sessionStorage.setItem(this.TOKEN_KEY, token);
      sessionStorage.setItem(this.EXPIRES_AT_KEY, expiresAt.toString());
    }

    this.accessToken.set(token);

    // Fetch user profile and initialize encryption key
    await this.fetchUserProfile(token);
    this.isLoggedIn.set(true);
  }

  private async fetchUserProfile(token: string): Promise<void> {
    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const profile: UserProfile = {
          id: data.sub || '',
          email: data.email || '',
          name: data.name || data.email || 'Google User',
          picture: data.picture || ''
        };
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(this.USER_KEY, JSON.stringify(profile));
        }
        this.currentUser.set(profile);

        // Derive AES key based on unique sub and email
        if (profile.id) {
          await this.cryptoService.initKey(profile.id, profile.email);
          await this.localService.loadEncryptedData();
        }
      } else if (res.status === 401) {
        this.logout();
      }
    } catch (err) {
      console.warn('Failed to fetch Google profile', err);
    }
  }

  private checkTokenValidity(): void {
    if (typeof window === 'undefined') return;
    const expiresAtStr = sessionStorage.getItem(this.EXPIRES_AT_KEY);
    if (expiresAtStr) {
      const expiresAt = parseInt(expiresAtStr, 10);
      if (Date.now() > expiresAt) {
        console.warn('[Auth] Google OAuth Token expired, auto clearing cache and logging out');
        this.logout();
      }
    } else if (this.isLoggedIn()) {
      this.logout();
    }
  }

  private getStoredToken(): string | null {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(this.TOKEN_KEY);
  }

  private getStoredUser(): UserProfile | null {
    if (typeof window === 'undefined') return null;
    const str = sessionStorage.getItem(this.USER_KEY);
    if (!str) return null;
    try {
      return JSON.parse(str);
    } catch {
      return null;
    }
  }
}
