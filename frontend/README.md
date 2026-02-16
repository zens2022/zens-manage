# Zens Manage - Frontend

React 應用程式，使用 Vite 和 Material-UI 構建。

## 📚 技術棧

- **框架**: React v19.2.0
- **建置工具**: Vite v7.2.4
- **UI 框架**: Material-UI (MUI) v7.3.7
- **圖表庫**: Recharts v3.7.0
- **路由**: React Router v7.13.0
- **日期處理**: Moment.js v2.30.1
- **測試**: Jest v30.2.0 + React Testing Library v16.3.2
- **狀態管理**: React Hooks (useState, useEffect)

## 📁 目錄結構

```
frontend/
├── src/
│   ├── components/              # 可重用組件
│   │   ├── AssetChart.jsx      # 資產趨勢圖表
│   │   ├── AssetDialog.jsx     # 資產編輯對話框
│   │   ├── Layout.jsx          # 應用佈局
│   │   └── UserDialog.jsx      # 用戶編輯對話框
│   ├── pages/                   # 頁面組件
│   │   ├── Login.jsx           # 登入頁面
│   │   ├── UserManagement.jsx  # 用戶管理頁面
│   │   └── AssetPage.jsx       # 資產管理頁面
│   ├── services/                # API 服務
│   │   └── assetService.js     # 資產 API 服務
│   ├── tests/                   # 測試文件
│   │   ├── Login.test.jsx      # 登入頁面測試
│   │   ├── UserManagement.test.jsx  # 用戶管理測試
│   │   └── AssetPage.test.jsx  # 資產頁面測試
│   ├── utils/                   # 工具函數
│   │   └── api.js              # API 請求封裝
│   ├── App.jsx                  # 主應用組件
│   ├── App.css                  # 應用樣式
│   ├── main.jsx                 # 應用入口
│   └── index.css                # 全域樣式
├── public/                      # 靜態資源
├── jest.config.js               # Jest 配置
├── jest.setup.js                # Jest 設置文件
├── .babelrc                     # Babel 配置
├── vite.config.js               # Vite 配置
└── package.json
```

## 🚀 快速開始

### 安裝依賴

```bash
npm install
```

### 開發模式

```bash
npm run dev
```

應用將在 `http://localhost:5173` 啟動，支援熱模組替換（HMR）。

### 生產建置

```bash
npm run build
```

建置後的文件將輸出到 `dist/` 目錄。

### 預覽生產建置

```bash
npm run preview
```

### 運行測試

```bash
npm test
```

### 代碼檢查

```bash
npm run lint
```

## 🎨 頁面說明

### 1. 登入頁面 (Login.jsx)

**路由**: `/login`

**功能**:
- 用戶名和密碼輸入
- 表單驗證
- 登入錯誤提示
- 自動跳轉（已登入用戶）

**使用的組件**:
- Material-UI: Box, TextField, Button, Paper, Alert
- 漸層背景設計

### 2. 用戶管理頁面 (UserManagement.jsx)

**路由**: `/users`

**功能**:
- 用戶列表展示（表格形式）
- 搜尋用戶（即時搜尋）
- 創建新用戶
- 編輯用戶資訊
- 啟用/停用用戶狀態（Switch 切換）
- 刪除用戶（需先停用）
- 管理員保護（admin 不可停用/刪除）

**使用的組件**:
- Material-UI: Table, Switch, IconButton, Chip, Snackbar
- UserDialog（自定義對話框）

**權限**:
- 需要登入
- 所有已認證用戶可訪問

### 3. 資產管理頁面 (AssetPage.jsx)

**路由**: `/`

**功能**:
- 資產記錄列表（分頁顯示）
- 創建新資產記錄
- 編輯現有記錄
- 刪除記錄
- 按用戶過濾（管理員可查看所有用戶）
- 資產趨勢圖表
- 自動計算小計
- 表單預填充（使用最後一次的項目）

**使用的組件**:
- Material-UI: Table, Select, Pagination, Card
- AssetChart（折線圖）
- AssetDialog（編輯對話框）

**權限**:
- 需要登入
- 普通用戶只能查看自己的資產
- 管理員可查看所有用戶的資產

## 🧩 組件說明

### AssetChart.jsx

**用途**: 展示資產趨勢折線圖

**Props**:
```javascript
{
  data: Array<{
    date: string,
    subtotal: number
  }>
}
```

**特點**:
- 使用 Recharts 繪製
- 響應式設計
- 自動格式化日期和金額
- 漸層填充效果

### AssetDialog.jsx

**用途**: 資產記錄的創建/編輯對話框

**Props**:
```javascript
{
  open: boolean,
  onClose: function,
  onSave: function,
  asset: object | null,
  lastItems: Array<{name: string, value: string}>
}
```

**功能**:
- 動態添加/刪除資產項目
- 日期選擇器
- 表單驗證
- 自動計算小計
- 預填充最後一次的項目名稱

### UserDialog.jsx

**用途**: 用戶的創建/編輯對話框

**Props**:
```javascript
{
  open: boolean,
  onClose: function,
  onSave: function,
  user: object | null
}
```

**功能**:
- 用戶名輸入
- 密碼輸入（創建時必填，編輯時可選）
- 狀態選擇
- 表單驗證

### Layout.jsx

**用途**: 應用主佈局

**功能**:
- 頂部導航欄
- 側邊欄菜單
- 登出功能
- 響應式設計

## 🔐 認證流程

### 登入流程

1. 用戶輸入用戶名和密碼
2. 調用 `/api/user/login` API
3. 成功後將用戶資訊（含 token）存入 localStorage
4. 跳轉到資產頁面

### Token 管理

**存儲位置**: `localStorage`

**存儲格式**:
```javascript
{
  id: 1,
  username: "admin",
  status: "active",
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**使用方式**:
```javascript
// utils/api.js
const user = JSON.parse(localStorage.getItem('user'));
const token = user ? user.token : '';
headers: {
  'Authorization': `Bearer ${token}`
}
```

### 自動登出

當 API 返回 401 狀態碼時：
1. 清除 localStorage
2. 跳轉到登入頁面

## 📡 API 服務

### api.js (通用 API 工具)

**功能**:
- 封裝 fetch 請求
- 自動添加 JWT Token
- 統一錯誤處理
- 自動處理 401 跳轉

**使用範例**:
```javascript
import api from '../utils/api';

// GET 請求
const users = await api.get('/api/user/list');

// POST 請求
const result = await api.post('/api/user/create', {
  username: 'newuser',
  password: 'password123'
});
```

### assetService.js (資產專用服務)

**提供的方法**:
- `list(page, limit, userId)`: 獲取資產列表
- `create(data)`: 創建資產
- `update(id, data)`: 更新資產
- `delete(id)`: 刪除資產
- `getLastItems()`: 獲取最後項目

## 🧪 測試

### 測試配置

- **測試框架**: Jest
- **測試工具**: React Testing Library
- **測試環境**: jsdom

### 測試文件

**Login.test.jsx**:
- ✅ 渲染登入表單

**AssetPage.test.jsx**:
- ✅ 渲染資產頁面
- ✅ 加載資產數據

**UserManagement.test.jsx**:
- ✅ 基本測試

### Mock 設置

**jest.setup.js** 提供:
- TextEncoder/TextDecoder polyfill
- window.matchMedia mock
- localStorage mock

### 運行測試

```bash
# 運行所有測試
npm test

# 運行特定測試
npm test -- Login.test.jsx

# 查看覆蓋率
npm test -- --coverage

# 監視模式
npm test -- --watch
```

## 🎨 樣式設計

### 設計系統

**主色調**:
- 主色: `#1e3c72` (深藍)
- 輔色: `#2a5298` (中藍)
- 成功: `#4caf50` (綠色)
- 錯誤: `#f44336` (紅色)

**漸層效果**:
```css
background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)
```

### Material-UI 主題

使用 MUI 預設主題，部分組件使用自定義樣式：

```javascript
sx={{
  background: 'linear-gradient(45deg, #1e3c72 30%, #2a5298 90%)',
  boxShadow: '0 3px 5px 2px rgba(30, 60, 114, .3)',
}}
```

### 響應式設計

- 使用 MUI 的 Grid 和 Container
- 支援手機、平板、桌面
- 斷點: xs, sm, md, lg, xl

## 🔧 配置文件

### vite.config.js

```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000'  // API 代理
    }
  }
})
```

### jest.config.js

```javascript
export default {
  testEnvironment: 'jsdom',
  transform: {
    "^.+\\.(js|jsx)$": "babel-jest",
  },
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy"
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testMatch: ["<rootDir>/src/tests/**/*.test.{js,jsx}"]
};
```

## 📦 建置優化

### 生產建置優化

Vite 自動進行：
- 代碼分割（Code Splitting）
- Tree Shaking
- 資源壓縮
- CSS 提取

### 建置輸出

```
dist/
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── [other-chunks].js
└── index.html
```

## 🐛 常見問題

### Q: 登入後頁面空白？

A: 檢查瀏覽器控制台，確認：
1. Backend 服務是否運行
2. API 請求是否成功
3. localStorage 是否正確存儲用戶資訊

### Q: 圖表不顯示？

A: 確認：
1. 資產數據是否正確加載
2. 數據格式是否符合 Recharts 要求
3. 瀏覽器控制台是否有錯誤

### Q: 測試失敗？

A: 
1. 清除 node_modules 重新安裝
2. 確認 Node.js 版本 >= 18
3. 檢查 jest.setup.js 是否正確配置

### Q: 熱更新不工作？

A: 
1. 重啟 Vite 開發服務器
2. 清除瀏覽器快取
3. 檢查文件是否在 src/ 目錄下

## 🚀 效能優化建議

1. **懶加載**: 使用 React.lazy() 分割路由
2. **Memo**: 使用 React.memo() 避免不必要的重渲染
3. **虛擬滾動**: 大列表使用虛擬滾動
4. **圖片優化**: 使用 WebP 格式，添加 lazy loading
5. **Bundle 分析**: 使用 `vite-bundle-visualizer`

## 📱 瀏覽器支援

- Chrome (最新版)
- Firefox (最新版)
- Safari (最新版)
- Edge (最新版)

## 🔍 除錯技巧

### React DevTools

安裝 React DevTools 瀏覽器擴展，可以：
- 查看組件樹
- 檢查 Props 和 State
- 追蹤組件更新

### 網路請求

使用瀏覽器開發者工具的 Network 標籤：
- 查看 API 請求和回應
- 檢查請求 Headers
- 驗證 Token 是否正確

### Console 日誌

在關鍵位置添加 console.log：
```javascript
console.log('User data:', user);
console.log('API response:', response);
```

## 📄 授權

ISC License

---

**維護者**: Zens Team  
**最後更新**: 2026-02-15
