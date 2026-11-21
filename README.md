# Zens Manage - 個人雲端資產管理系統 (Serverless & E2EE Edition)

一個現代化、高隱私、零後端 (Serverless / No-Backend) 的個人資產追蹤與財務管理系統。使用 **Angular 21**、**Angular Material** 構建，透過 **Google Identity Services (OAuth 2.0)** 登入，並以使用者的個人 **Google Drive** 作為永久雲端儲存中心。

全系統實施 **端到端加密 (E2EE)**：所有資產資料在本地暫存 (LocalStorage) 及雲端檔案皆以 **AES-GCM 256 位元** 加密存儲，唯有登入您本人的 Google 帳號才能解鎖還原。

🌐 **線上正式版**：[https://zens2022.github.io/zens-manage/](https://zens2022.github.io/zens-manage/)

---

## 📋 目錄
- [🌟 系統特色](#-系統特色)
- [🛠️ 技術架構](#️-技術架構)
- [🔐 端到端加密與安全機制](#-端到端加密與安全機制)
- [🚀 快速開始 (Quick Start)](#-快速開始-quick-start)
- [⚙️ Google Cloud Console 設定指南](#️-google-cloud-console-設定指南)
- [🚢 部署方式](#-部署方式)
  - [1. GitHub Pages (自動化 CI/CD)](#1-github-pages-自動化-cicd)
  - [2. 本地 Docker 容器化部署](#2-本地-docker-容器化部署)
- [📁 專案結構](#-專案結構)

---

## 🌟 系統特色

* 🔒 **端到端加密 (End-to-End Encryption)**：以 Google 唯一使用者標識透過 PBKDF2 衍生專屬 AES-GCM 256 金鑰，本地與雲端檔案皆為密文，即使檔案外洩也無法被第三方解密。
* 🛡️ **強制登入與自動銷毀快取**：全系統需登入才可存取；登出或 OAuth Token 過期時自動徹底銷毀本地暫存與金鑰，不留任何痕跡。
* ⚡ **本地優先 (Local-First)**：讀寫操作優先於瀏覽器端 LocalStorage 毫秒級執行，介面反應零延遲。
* 🔄 **智慧雙向同步與防洗白保護**：
  * 當本地為空時，自動從 Google Drive 下載最新資產還原，防止意外覆寫洗空雲端資料。
  * 支援 3.5 秒自動防抖背景同步與右上角手動強制同步。
* 📈 **互動式趨勢分析圖 (ECharts)**：視覺化呈現資產成長曲線，支援點擊圖表節點直接平滑滾動跳轉至下方明細並展開播放高亮動畫。
* 📑 **歷史明細一鍵帶入**：新增資產記錄時可直接一鍵帶入上次項目名稱，大幅節省記帳時間。
* 📡 **離線韌性 (Offline Capability)**：自動偵測連線狀態，離線時資料妥善加密保存在本機，恢復網路時自動補傳同步。

---

## 🛠️ 技術架構

| 領域 | 技術 / 工具 | 說明 |
| :--- | :--- | :--- |
| **前端框架** | Angular 21 (Signals, Standalone Components, RxJS) | 現代化響應式狀態管理與組件化架構 |
| **UI 元件庫** | Angular Material (MDC Components) | 現代化簡約質感介面 |
| **安全加密** | Web Crypto API (`window.crypto.subtle`) | 原生高強度 AES-GCM 256 + PBKDF2 (SHA-256) |
| **身分驗證** | Google Identity Services (GIS SDK - OAuth 2.0) | 安全無密碼登入驗證 |
| **雲端存儲** | Google Drive API v3 (REST) | 僅要求 `drive.file` 最低權限，專屬保存 `zens_assets_v1.json` |
| **圖表視覺化** | Apache ECharts | 互動式資產歷史趨勢分析圖表 |
| **CI/CD & 部署** | GitHub Actions / GitHub Pages / Docker (Nginx Alpine) | 全自動雲端部署與輕量容器化支援 |

---

## 🔐 端到端加密與安全機制

```
[Google OAuth 登入] 
       │
       ▼
取得使用者固定標識 (sub + email) ──► PBKDF2 (100,000 次疊代) ──► 衍生 AES-GCM 256-bit 金鑰
                                                                     │
       ┌─────────────────────────────────────────────────────────────┴────────────────────────────────┐
       ▼                                                                                              ▼
【本機暫存加密】                                                                                【雲端同步加密】
LocalStorage 存儲 JSON 密文:                                                                    Google Drive 上傳 JSON 密文:
{                                                                                              {
  "zensEncrypted": true,                                                                         "zensEncrypted": true,
  "iv": "<Base64_IV>",                                                                           "iv": "<Base64_IV>",
  "ciphertext": "<Base64_Ciphertext>"                                                            "ciphertext": "<Base64_Ciphertext>"
}                                                                                              }
```

* **跨裝置無縫相容**：無論在手機、筆電或平板，只要使用同一 Google 帳號登入，系統即衍生出完全相同的金鑰，可自動解密雲端同步的資產記錄。
* **安全沙盒**：金鑰僅保留於當前瀏覽器 Session 記憶體中，登出或過期立即銷毀。

---

## 🚀 快速開始 (Quick Start)

### 1. 環境需求
* **Node.js**: `v20.x` 或 `v22.x` 以上 (建議 LTS 版本)
* **npm**: `v10.x` 或 `v11.x`

### 2. 安裝與本地啟動
```bash
# 複製儲存庫
git clone https://github.com/zens2022/zens-manage.git
cd zens-manage

# 安裝依賴
npm install

# 啟動開發伺服器
npm start
```
開啟瀏覽器訪問 `http://localhost:4200` 即可預覽。

### 3. 生產環境建置
```bash
npm run build -- --base-href /zens-manage/
```
編譯產物將輸出於 `dist/zens-manage/browser/` 目錄。

---

## ⚙️ Google Cloud Console 設定指南

若要自建或設定您自己的 Google OAuth 登入與 Drive 同步：

1. 前往 [Google Cloud Console](https://console.cloud.google.com/) 建立專案。
2. 至 **API 和服務** > **已啟用的 API 和服務**，搜尋並啟用 **Google Drive API**。
3. 設定 **OAuth 同意畫面**：
   * **使用者類型**：外部 (External)
   * **應用程式首頁 / 隱私權政策**：填入您的網址（例如 `https://zens2022.github.io/zens-manage/`）
   * **已授權網域**：填入網域名稱（例如 `zens2022.github.io`，勿帶 `https://` 或斜線）
   * **授權範圍 (Scopes)**：加入 `https://www.googleapis.com/auth/drive.file`、`.../userinfo.profile`、`.../userinfo.email`
   * **測試使用者**：加入您的 Google 信箱（例如 `your-email@gmail.com`）。*(維持測試中狀態免官方人工審查)*
4. 至 **憑證** (Credentials) > **建立憑證** > **OAuth 2.0 用戶端 ID**：
   * **應用程式類型**：網頁應用程式 (Web application)
   * **已獲授權的 JavaScript 來源**：
     * 本地測試：`http://localhost:4200`
     * 線上環境：`https://zens2022.github.io` *(⚠️ 注意：Google 規範來源只能包含協定與網域，絕對不能帶路徑或結尾斜線)*
5. 複製生成的 **Client ID**，填入 `src/environments/environment.ts` 與 `environment.prod.ts` 的 `googleClientId`。

---

## 🚢 部署方式

### 1. GitHub Pages (自動化 CI/CD)
本專案已配置完整 GitHub Actions 工作流程 ([.github/workflows/deploy.yml](.github/workflows/deploy.yml))：
1. 在 GitHub 倉庫點選 **Settings** > **Pages**。
2. 將 **Build and deployment > Source** 設定為 **`GitHub Actions`**。
3. 只要 Push 代碼至 `main` 或 `migration` 分支，即會自動觸發打包建置，並安全發布至 GitHub Pages！

### 2. 本地 Docker 容器化部署
專案根目錄內建 `docker/` 目錄，內含 Multi-stage Dockerfile 與 Nginx 最佳化配置：
```bash
# 啟動容器 (預設映射至主機 Port 3000)
docker compose -f docker/docker-compose.yml up --build -d

# 停止容器
docker compose -f docker/docker-compose.yml down
```
啟動後瀏覽 `http://localhost:3000` 即可存取。

---

## 📁 專案結構

```
zens-manage/
├── .github/workflows/deploy.yml    # GitHub Pages 自動化 CI/CD 工作流程
├── docker/                         # Dockerfile, nginx.conf, docker-compose.yml
├── src/
│   ├── app/
│   │   ├── core/                   # 核心基礎服務層
│   │   │   ├── auth/               # Google OAuth 2.0 身分驗證服務
│   │   │   ├── crypto/             # AES-GCM 256 位元端到端加解密服務
│   │   │   ├── network/            # 網路連線狀態即時監聽服務
│   │   │   ├── storage/            # LocalStorage 與 Google Drive 雲端存取
│   │   │   └── sync/               # 雙向智慧同步與防洗白協調器 (SyncManager)
│   │   ├── features/assets/        # 資產業務功能模組
│   │   │   ├── components/         # 獨立拆分之 Presentational Components
│   │   │   │   ├── asset-chart/    # ECharts 資產趨勢圖表元件
│   │   │   │   ├── asset-dialog/   # 新增/編輯資產對話框
│   │   │   │   ├── asset-table/    # 資產列表表格、分頁與展開明細元件
│   │   │   │   └── auth-lock/      # 未登入安全鎖定與引導登入卡片
│   │   │   ├── asset-page.component.ts/html/scss  # 資產主頁面容器 (Smart Container)
│   │   ├── models/                 # 全域資料模型定義 (TypeScript Interfaces)
│   │   ├── shared/components/      # 通用元件 (Header 導覽列與同步狀態燈)
│   │   ├── app.ts / app.html       # 應用程式根佈局元件
│   │   └── app.routes.ts           # 路由設定
│   ├── environments/               # 環境配置檔 (Client ID、Drive 檔名等)
│   ├── index.html                  # 應用程式入口 HTML
│   └── styles.scss                 # 全域樣式與 Material 主題配置
├── angular.json                    # Angular CLI 配置 (已最佳化 bundle 預算)
├── package.json                    # 專案依賴與 NPM Scripts
└── README.md                       # 專案完整說明文件
```
