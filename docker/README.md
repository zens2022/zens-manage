# Zens Manage - Docker Deployment

本資料夾存放專案的容器化設定檔，支援快速部署與資料持久化。

## 檔案說明
- `Dockerfile`: 多階段建置 (Multi-stage build) 腳本。
  - 第一階段：建置前端 React 靜態檔案。
  - 第二階段：部署 Koa 後端並將前端檔案映射至 `public/`。
- `docker-compose.yml`: 定義服務、埠口映射與 Volume。
- `.dockerignore`: 排除不必要的檔案以縮小映像檔體積。

## 快速啟動 (Quick Start)
確保您已安裝 Docker 與 Docker Compose，然後在專案根目錄執行：

```bash
# 啟動服務 (自動處理前後端建置與啟動)
docker-compose -f docker/docker-compose.yml up --build -d
```

服務啟動後，可存取 `http://localhost:3000`。

## 環境變數 (Environment Variables)
可在 `docker-compose.yml` 中調整：
- `JWT_SECRET`: JWT 加密密鑰 (建議生產環境修改)。
- `PORT`: 後端服務監聽埠口。

## 持久化說明
- 預設會建立名為 `zens_data` 的 Volume。
- 映射至容器內的 `/app/backend/data`。
- SQLite 資料庫 `database.sqlite` 將存放於此，確保容器移除後資料不丟失。
