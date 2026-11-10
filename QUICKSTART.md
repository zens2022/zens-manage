# 🚀 快速上手指南 (Quick Start)

本指南協助您在 3 分鐘內啟動全新的 **Zens Manage (Angular 20 Serverless)** 應用程式。

---

## ⚡ 本地開發啟動 (Local Development)

### 步驟 1: 安裝依賴套件
在專案根目錄執行：
```bash
npm install
```

### 步驟 2: 啟動開發伺服器
```bash
npm start
```

### 步驟 3: 瀏覽器訪問
開啟瀏覽器前往：
```
http://localhost:4200
```

---

## 💾 舊資料匯入 (5 秒無縫移轉)

若您先前使用過舊版本，我們已將 Docker Volume 中的 26 筆歷史資產資料完整備份於 `backup_data/exported_assets.json`。

1. 打開 `http://localhost:4200`。
2. 點擊右上角「**資料備份與匯入**」選單 > 選擇「**匯入 JSON 備份檔**」。
3. 選取本機 `backup_data/exported_assets.json`。
4. 歷史資產記錄與圖表將立即完整呈現！

---

## ☁️ Google Drive 雲端同步設定

1. 於 [Google Cloud Console](https://console.cloud.google.com/) 建立 Web Client ID。
2. 開通 **Google Drive API**。
3. 將 Client ID 貼入 `src/environments/environment.ts`。
4. 點擊網頁右上角的「**Google 登入**」，即可享受即時背景自動備份！

---

## 🐳 Docker 快速啟動
```bash
docker-compose -f docker/docker-compose.yml up --build -d
```
訪問 `http://localhost:3000` 即可使用。
