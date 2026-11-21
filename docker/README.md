# Zens Manage - Docker 部署說明

本專案採用純前端 (Serverless / No-Backend) 架構，所有靜態資產透過 Nginx 提供服務。

## 檔案說明
- `Dockerfile`: 多階段建置 (Multi-stage build) 腳本。
  - 第一階段 (Builder)：使用 Node.js 20 建置 Angular 應用程式。
  - 第二階段 (Production)：使用 Nginx Alpine 提供極致輕量的靜態網頁服務。
- `nginx.conf`: Nginx 設定檔，處理 SPA 路由導向 (`try_files`) 與靜態快取最佳化。
- `docker-compose.yml`: 本地快速啟動容器設定檔。

## 快速啟動 (Quick Start)
```bash
docker-compose -f docker/docker-compose.yml up --build -d
```
服務啟動後，請在瀏覽器中開啟 `http://localhost:3000`。
