# 🚀 快速開始指南

這是一個 5 分鐘快速上手指南，幫助你快速運行 Zens Manage 專案。

## ⚡ 最快速的方式

### 步驟 1: 克隆專案

```bash
git clone <repository-url>
cd zens-manage
```

### 步驟 2: 啟動後端

```bash
cd backend
npm install
npm run dev
```

✅ 後端服務運行在 `http://localhost:3000`

### 步驟 3: 啟動前端（新終端）

```bash
cd frontend
npm install
npm run dev
```

✅ 前端應用運行在 `http://localhost:5173`

### 步驟 4: 登入系統

1. 打開瀏覽器訪問 `http://localhost:5173`
2. 使用預設管理員帳號登入：
   - 用戶名: `admin`
   - 密碼: `admin123`

🎉 完成！你現在可以開始使用系統了。

## 📝 接下來做什麼？

### 創建第一個用戶

1. 點擊頂部導航的「Users」
2. 點擊「New User」按鈕
3. 填寫用戶資訊並保存

### 添加資產記錄

1. 點擊頂部導航的「Assets」
2. 點擊「New Asset」按鈕
3. 選擇日期並添加資產項目
4. 保存後可以在圖表中看到趨勢

## 🧪 運行測試

### 後端測試

```bash
cd backend
npm test
```

預期結果：
```
Test Suites: 2 passed, 2 total
Tests:       12 passed, 12 total
```

### 前端測試

```bash
cd frontend
npm test
```

預期結果：
```
Test Suites: 3 passed, 3 total
Tests:       3 passed, 3 total
```

## 🐛 遇到問題？

### 後端無法啟動

**問題**: `Error: listen EADDRINUSE: address already in use :::3000`

**解決**:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3000 | xargs kill -9
```

### 前端無法連接後端

**檢查清單**:
- [ ] 後端服務是否運行在 3000 端口？
- [ ] 瀏覽器控制台是否有 CORS 錯誤？
- [ ] 檢查 `vite.config.js` 的 proxy 設置

### 測試失敗

**解決步驟**:
1. 刪除 `node_modules` 和 `package-lock.json`
2. 重新安裝依賴: `npm install`
3. 確認 Node.js 版本 >= 18

## 📚 詳細文檔

- [完整 README](./README.md)
- [後端文檔](./backend/README.md)
- [前端文檔](./frontend/README.md)

## 💡 開發技巧

### 熱更新

- **後端**: 使用 Nodemon，保存文件自動重啟
- **前端**: 使用 Vite HMR，保存文件即時更新

### 查看資料庫

```bash
cd backend
sqlite3 data/database.sqlite
.tables
SELECT * FROM Users;
.exit
```

### API 測試

使用 curl 測試 API：

```bash
# 登入
curl -X POST http://localhost:3000/api/user/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# 獲取用戶列表（需要 token）
curl -X GET http://localhost:3000/api/user/list \
  -H "Authorization: Bearer <your-token>"
```

## 🎯 下一步學習

1. 閱讀 [API 文檔](./README.md#api-文檔)
2. 了解 [資料庫模型](./backend/README.md#資料庫模型)
3. 查看 [組件說明](./frontend/README.md#組件說明)
4. 學習 [測試編寫](./backend/README.md#測試)

---

**需要幫助？** 查看 [常見問題](./README.md#常見問題) 或提交 Issue。
