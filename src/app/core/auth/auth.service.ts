import { Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { UserProfile } from '../../models/asset.model';

declare const google: any;

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly TOKEN_KEY = 'zens_google_token';
  private readonly USER_KEY = 'zens_google_user';
  private readonly EXPIRES_AT_KEY = 'zens_google_token_expires_at';

  readonly accessToken = signal<string | null>(this.getStoredToken());
  readonly currentUser = signal<UserProfile | null>(this.getStoredUser());
  readonly isLoggedIn = signal<boolean>(!!this.getStoredToken());

  private tokenClient: any = null;

  constructor() {
    this.checkTokenValidity();
  }

  /**
   * 初始化 Google Token Client
   */
  async ensureClientInitialized(): Promise<boolean> {
    if (this.tokenClient) return true;
    if (typeof window === 'undefined') return false;

    // 等待 Google Identity Services 腳本載入
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
   * 觸發 Google OAuth 登入彈窗
   */
  async login(): Promise<void> {
    const initialized = await this.ensureClientInitialized();
    if (!initialized) {
      alert('Google 服務載入失敗或正在載入中，請稍後再試。');
      return;
    }
    // 請求 Token
    this.tokenClient.requestAccessToken({ prompt: 'consent' });
  }

  /**
   * 登出並清除本機授權資訊
   */
  logout(): void {
    const token = this.accessToken();
    if (token && (window as any).google?.accounts?.oauth2) {
      (window as any).google.accounts.oauth2.revoke(token, () => {
        console.log('Google token revoked');
      });
    }

    sessionStorage.removeItem(this.TOKEN_KEY);
    sessionStorage.removeItem(this.USER_KEY);
    sessionStorage.removeItem(this.EXPIRES_AT_KEY);

    this.accessToken.set(null);
    this.currentUser.set(null);
    this.isLoggedIn.set(false);
  }

  private handleTokenSuccess(tokenResponse: any): void {
    const token = tokenResponse.access_token;
    const expiresIn = Number(tokenResponse.expires_in) || 3600;
    const expiresAt = Date.now() + (expiresIn - 60) * 1000;

    sessionStorage.setItem(this.TOKEN_KEY, token);
    sessionStorage.setItem(this.EXPIRES_AT_KEY, expiresAt.toString());

    this.accessToken.set(token);
    this.isLoggedIn.set(true);

    // 載入使用者個人資訊
    this.fetchUserProfile(token);
  }

  private async fetchUserProfile(token: string): Promise<void> {
    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const profile: UserProfile = {
          email: data.email || '',
          name: data.name || data.email || 'Google User',
          picture: data.picture || ''
        };
        sessionStorage.setItem(this.USER_KEY, JSON.stringify(profile));
        this.currentUser.set(profile);
      }
    } catch (err) {
      console.warn('Failed to fetch Google profile', err);
    }
  }

  private checkTokenValidity(): void {
    const expiresAtStr = sessionStorage.getItem(this.EXPIRES_AT_KEY);
    if (expiresAtStr) {
      const expiresAt = parseInt(expiresAtStr, 10);
      if (Date.now() > expiresAt) {
        this.logout();
      }
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
