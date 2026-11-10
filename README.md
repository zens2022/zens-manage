# Zens Manage - 個人雲端資產管理系統 (Serverless Edition)

一個現代化、高隱私、零後端 (Serverless / No-Backend) 的個人資產追蹤與管理系統。使用 **Angular 20**、**Angular Material** 構建，透過 **Google Identity Services (OAuth 2.0)** 登入，並以使用者的個人 **Google Drive** 作為永久雲端儲存中心，支援本機 **LocalStorage** 離線操作與自動防抖背景同步。

---

## 📋 目錄
- [系統特色](#系統特色)
- [技術架構](#技術架構)
- [核心功能](#核心功能)
- [快速開始](#快速開始)
- [Google Cloud Console 設定指南](#google-cloud-console-設定指南)
- [舊資料轉移與備份](#舊資料轉移與備份)
- [Docker 容器化部署](#docker-容器化部署)
- [專案結構](#專案結構)

---

## 🌟 系統特色
* 🔒 **極致隱私保護 (Zero-Knowledge)**：純客戶端運作，伺服器不保存任何使用者憑證、密碼或資產數據。
* ⚡ **本地優先 (Local-First)**：讀寫操作優先於瀏覽器端 LocalStorage 執行，介面反應達到毫秒級速度。
* ☁️ **Google Drive 雲端同步**：個人資料儲存於私密 Google Drive（檔名 `zens_assets_v1.json`），僅請求 `drive.file` 最低權限。
* ⏱️ **背景防抖自動同步 (Debounce Save)**：編輯後 3.5 秒自動背景覆寫上傳，無干擾且節省網路頻寬。
* 📡 **離線可用性 (Offline Capability)**：自動偵測網路狀態，斷網時操作存於本機，恢復連線後自動上傳。
* 🐳 **輕量化容器 (Nginx Alpine)**：打包為純靜態 Nginx 映像檔，體積小、啟動快。

---

## 🛠️ 技術架構
* **前端框架**: Angular 20 (TypeScript, RxJS, Signals)
* **UI 元件庫**: Angular Material
* **身分驗證**: Google Identity Services (GIS SDK - OAuth 2.0 Token Client)
* **雲端儲存**: Google Drive API v3 (REST)
* **本地儲存**: Web Storage API (LocalStorage)
* **圖表庫**: ECharts (資產趨勢折線圖)
* **容器服務**: Docker + Nginx (Alpine)

---

## 💡 核心功能
1. **資產記錄清單**:
   * 按日期降序排列歷史記錄。
   * **明細展開/收合**: 點擊列可即時展開各項目名稱與金額。
   * 分頁器切換每頁顯示筆數。
2. **新增/編輯資產彈窗**:
   * 日期選擇與項目即時增刪。
   * **自動帶入上次項目 (Load Last Items)**: 新增資產時可一鍵帶入上一次記錄的資產項目清單，省去重複輸入。
   * 即時計算小計總額 (Total)。
3. **資產趨勢分析圖**:
   * 自動以 ECharts 繪製資產總額曲線圖，支援千分位數值格式化與流暢響應式縮放。
4. **雲端狀態指示燈與備份**:
   * 即時顯示同步狀態 (`已上雲`、`待同步`、`同步中`、`離線模式`、`同步異常`)。
   * 提供「立即強制同步」按鈕。
   * 支援手動「匯出 JSON」與「匯入 JSON 備份檔」。

---

## 🚀 快速開始

### 1. 本地開發環境需求
* **Node.js**: v18.0.0 以上 (建議 v20 或 v24)
* **npm**: v9.0.0 以上
* **Angular CLI**: v20 / v21

### 2. 安裝與啟動
```bash
# 安裝依賴
npm install

# 啟動開發伺服器
npm start
```
開啟瀏覽器訪問 `http://localhost:4200`。

---

## ⚙️ Google Cloud Console 設定指南

要啟用 Google Drive 雲端同步功能，需至 [Google Cloud Console](https://console.cloud.google.com/) 建立 OAuth 用戶端：
1. 建立或選擇 GCP 專案。
2. 至 **API 和服務** > **已啟用的 API 和服務**，搜尋並啟用 **Google Drive API**。
3. 設定 **OAuth 同意畫面**：
   * User Type: 外部 (External)
   * 授權範圍 (Scopes)：新增 `https://www.googleapis.com/auth/drive.file`、`.../auth/userinfo.profile`、`.../auth/userinfo.email`。
   * 測試使用者：新增您的 Google 帳號。
4. 至 **憑證** (Credentials) > **建立憑證** > **OAuth 2.0 用戶端 ID**：
   * 應用程式類型：**網頁應用程式 (Web application)**
   * **已授權的 JavaScript 來源**：加入 `http://localhost:4200` 及正式上線網址（例如 `http://localhost:3000`）。
5. 複製生成的 **Client ID**，填入 `src/environments/environment.ts` 與 `src/environments/environment.prod.ts` 中的 `googleClientId`。

---

## 💾 舊資料轉移與備份

原系統中的 SQLite 資料庫已安全備份並轉存至 `backup_data/exported_assets.json`。

### 如何匯入歷史資料：
1. 開啟本系統頁面並登入 Google。
2. 點擊右上角「資料備份與匯入」圖示（或點擊首頁引導按鈕）。
3. 選擇「匯入 JSON 備份檔」，選取您的 `exported_assets.json`。
4. 系統將即時載入歷史記錄並自動排程備份至您的 Google Drive！

---

## 🐳 Docker 容器化部署

本專案提供 Multi-stage Dockerfile 與 Nginx 靜態託管設定。

### 本地 Docker 啟動
```bash
docker-compose -f docker/docker-compose.yml up --build -d
```
啟動後即可透過 `http://localhost:3000` 存取應用程式。

---

## 📁 專案結構
```
zens-manage/
├── docker/                     # Dockerfile, nginx.conf, docker-compose.yml
├── src/
│   ├── app/
│   │   ├── core/               # 核心服務 (Auth, LocalStorage, DriveStorage, SyncManager, Network)
│   │   ├── features/           # 業務功能 (AssetPage, AssetChart, AssetDialog)
│   │   ├── models/             # 資料模型 (AssetRecord, AssetItem, ZensAppData)
│   │   ├── shared/             # 通用元件 (Header, SyncIndicator)
│   │   ├── app.ts / app.html   # 主版面元件
│   │   └── app.routes.ts       # 路由配置
│   ├── environments/           # 環境變數 (Google Client ID 設定)
│   ├── index.html              # 主頁面 (載入 GIS SDK、字型)
│   └── styles.scss             # Angular Material 主題與全域樣式
├── angular.json                # Angular CLI 設定
├── package.json
├── migration-project-spec.md   # 遷移規格書
└── README.md
```
