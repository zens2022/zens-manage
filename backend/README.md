# Zens Manage - Backend

Node.js API 服務，使用 Koa 框架構建。

## 📚 技術棧

- **框架**: Koa.js v3.1.1
- **資料庫**: SQLite v5.1.7
- **ORM**: Sequelize v6.37.1
- **認證**: JWT (jsonwebtoken v9.0.3)
- **密碼加密**: bcryptjs v3.0.3
- **測試**: Jest v30.2.0 + Supertest v7.2.2
- **開發工具**: Nodemon v3.1.11
- **CORS**: @koa/cors v5.0.0

## 📁 目錄結構

```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # 資料庫配置
│   ├── controllers/
│   │   ├── userController.js    # 用戶控制器
│   │   └── assetController.js   # 資產控制器
│   ├── middleware/
│   │   ├── auth.js              # JWT 認證中間件
│   │   └── errorHandler.js      # 錯誤處理中間件
│   ├── models/
│   │   ├── User.js              # 用戶模型
│   │   ├── Asset.js             # 資產模型
│   │   └── AssetItem.js         # 資產項目模型
│   ├── repositories/
│   │   └── userRepository.js    # 用戶資料存取層
│   ├── routes/
│   │   ├── userRoutes.js        # 用戶路由
│   │   └── assetRoutes.js       # 資產路由
│   ├── services/
│   │   └── userService.js       # 用戶業務邏輯
│   └── app.js                   # 應用入口
├── tests/
│   ├── user.test.js             # 用戶 API 測試
│   └── asset.test.js            # 資產 API 測試
├── data/
│   └── database.sqlite          # SQLite 資料庫文件（自動生成）
├── jest.config.js               # Jest 配置
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

服務將在 `http://localhost:3000` 啟動，並使用 Nodemon 自動重啟。

### 生產模式

```bash
npm start
```

### 運行測試

```bash
npm test
```

## 🔐 認證機制

### JWT Token

所有需要認證的 API 都需要在請求 Header 中包含 JWT Token：

```
Authorization: Bearer <token>
```

### 白名單路由

以下路由不需要認證：
- `POST /api/user/login`

### Token 生成

登入成功後，系統會返回包含以下資訊的 Token：
- `id`: 用戶 ID
- `username`: 用戶名
- 有效期：24 小時

## 📡 API 端點

### 用戶管理 API

#### 登入
```
POST /api/user/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**回應**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "admin",
    "status": "active",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### 獲取用戶列表
```
GET /api/user/list?keyword=admin
Authorization: Bearer <token>
```

#### 創建用戶
```
POST /api/user/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "newuser",
  "password": "password123",
  "status": "active"
}
```

#### 更新用戶
```
POST /api/user/update
Authorization: Bearer <token>
Content-Type: application/json

{
  "id": 2,
  "username": "updateduser"
}
```

#### 變更用戶狀態
```
POST /api/user/change-status
Authorization: Bearer <token>
Content-Type: application/json

{
  "id": 2,
  "status": "disabled"
}
```

#### 刪除用戶
```
POST /api/user/delete
Authorization: Bearer <token>
Content-Type: application/json

{
  "id": 2
}
```

**注意**: 
- 管理員帳號（username: 'admin'）不可停用或刪除
- 用戶必須先停用才能刪除

### 資產管理 API

#### 獲取資產列表
```
GET /api/asset/list?page=1&limit=10&userId=1
Authorization: Bearer <token>
```

**查詢參數**:
- `page`: 頁碼（預設: 1）
- `limit`: 每頁筆數（預設: 10）
- `userId`: 用戶 ID（可選，管理員可查看所有用戶）

**回應**:
```json
{
  "data": [
    {
      "id": 1,
      "date": "2025-01-01",
      "userId": 1,
      "subtotal": 150000,
      "User": {
        "id": 1,
        "username": "admin"
      },
      "items": [
        {"id": 1, "name": "股票", "value": 100000},
        {"id": 2, "name": "現金", "value": 50000}
      ]
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

#### 創建資產記錄
```
POST /api/asset/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "date": "2025-01-01",
  "items": [
    {"name": "股票", "value": 100000},
    {"name": "現金", "value": 50000}
  ]
}
```

#### 更新資產記錄
```
PUT /api/asset/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "date": "2025-01-02",
  "items": [
    {"name": "股票", "value": 120000},
    {"name": "現金", "value": 60000}
  ]
}
```

#### 刪除資產記錄
```
DELETE /api/asset/:id
Authorization: Bearer <token>
```

#### 獲取最後一次的資產項目
```
GET /api/asset/last-items
Authorization: Bearer <token>
```

用於表單預填充，返回當前用戶最後一次記錄的資產項目名稱。

## 🗄️ 資料庫模型

### User（用戶）

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | INTEGER | 主鍵，自動遞增 |
| username | STRING | 用戶名，唯一 |
| password | STRING | 密碼（bcrypt 加密） |
| status | ENUM | 狀態：'active' 或 'disabled' |
| createdAt | DATE | 創建時間 |
| updatedAt | DATE | 更新時間 |

### Asset（資產）

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | INTEGER | 主鍵，自動遞增 |
| date | DATEONLY | 資產記錄日期 |
| userId | INTEGER | 外鍵，關聯 User |
| createdAt | DATE | 創建時間 |
| updatedAt | DATE | 更新時間 |

### AssetItem（資產項目）

| 欄位 | 類型 | 說明 |
|------|------|------|
| id | INTEGER | 主鍵，自動遞增 |
| assetId | INTEGER | 外鍵，關聯 Asset |
| name | STRING | 項目名稱（如：股票、現金） |
| value | DECIMAL | 項目金額 |
| createdAt | DATE | 創建時間 |
| updatedAt | DATE | 更新時間 |

### 關聯關係

- User `hasMany` Asset
- Asset `belongsTo` User
- Asset `hasMany` AssetItem (級聯刪除)
- AssetItem `belongsTo` Asset

## 🧪 測試

### 測試配置

測試使用記憶體資料庫（`:memory:`），每次測試前會重置資料庫狀態。

### 測試覆蓋

**user.test.js** (7 個測試):
- ✅ 列出用戶
- ✅ 創建用戶
- ✅ 用戶登入
- ✅ 更新用戶
- ✅ 變更用戶狀態
- ✅ 防止停用用戶登入
- ✅ 刪除用戶

**asset.test.js** (5 個測試):
- ✅ 創建資產記錄
- ✅ 列出資產（含小計計算）
- ✅ 獲取最後項目
- ✅ 更新資產記錄
- ✅ 刪除資產記錄（含級聯刪除驗證）

### 運行特定測試

```bash
# 只測試用戶 API
npm test tests/user.test.js

# 只測試資產 API
npm test tests/asset.test.js

# 查看測試覆蓋率
npm test -- --coverage
```

## 🔧 配置

### 資料庫配置

位於 `src/config/database.js`：

```javascript
const dbPath = process.env.NODE_ENV === 'test'
    ? ':memory:'  // 測試環境使用記憶體資料庫
    : path.resolve(__dirname, '../../data/database.sqlite');
```

### JWT 密鑰

位於 `src/middleware/auth.js`：

```javascript
const SECRET_KEY = process.env.JWT_SECRET || 'zens-manage-secret';
```

**生產環境建議**: 設置環境變數 `JWT_SECRET`

### 預設管理員

首次啟動時自動創建：
- 用戶名: `admin`
- 密碼: `admin123`（bcrypt 加密）
- 狀態: `active`

## 🐛 錯誤處理

### 全域錯誤處理中間件

位於 `src/middleware/errorHandler.js`，捕獲所有未處理的錯誤。

### 常見錯誤碼

| 狀態碼 | 說明 |
|--------|------|
| 200 | 成功 |
| 201 | 創建成功 |
| 400 | 請求錯誤 |
| 401 | 未授權 |
| 403 | 禁止訪問 |
| 404 | 資源不存在 |
| 500 | 服務器錯誤 |

## 📝 開發注意事項

### ES6 模組

專案使用 ES6 模組（`type: "module"`），所有 import/export 必須包含 `.js` 副檔名。

### 密碼安全

- 所有密碼使用 bcrypt 加密（salt rounds: 10）
- 創建和更新用戶時自動加密密碼
- 登入時使用 `bcrypt.compare()` 驗證

### 權限控制

- 管理員（username: 'admin'）有特殊保護
- 普通用戶只能查看和操作自己的資產
- 管理員可以查看所有用戶的資產

### 資料庫遷移

目前使用 `sequelize.sync()` 自動同步模型。生產環境建議使用 Sequelize Migrations。

## 🔍 除錯

### 啟用 Sequelize 日誌

修改 `src/config/database.js`：

```javascript
logging: console.log  // 顯示所有 SQL 查詢
```

### 查看資料庫內容

使用 SQLite 工具查看 `data/database.sqlite`：

```bash
sqlite3 data/database.sqlite
.tables
SELECT * FROM Users;
```

## 📦 依賴說明

### 生產依賴
- `koa`: Web 框架
- `koa-bodyparser`: 請求體解析
- `koa-router`: 路由管理
- `koa-static`: 靜態文件服務
- `@koa/cors`: CORS 支援
- `sequelize`: ORM
- `sqlite3`: SQLite 驅動
- `jsonwebtoken`: JWT 生成和驗證
- `bcryptjs`: 密碼加密

### 開發依賴
- `nodemon`: 開發時自動重啟
- `jest`: 測試框架
- `supertest`: HTTP 測試
- `cross-env`: 跨平台環境變數設置

## 🚀 效能優化建議

1. **資料庫索引**: 為常查詢欄位添加索引
2. **分頁**: 使用 `limit` 和 `offset` 避免一次加載大量資料
3. **快取**: 考慮使用 Redis 快取頻繁查詢的資料
4. **連接池**: Sequelize 預設已配置連接池

## 📄 授權

ISC License

---

**維護者**: Zens Team  
**最後更新**: 2026-02-15
