# Zens Manage - Docker Deployment Guide

This project adopts a serverless / no-backend architecture; all static assets are served through Nginx.

## File Descriptions
- `Dockerfile`: Multi-stage build script.
  - Stage 1 (Builder): Uses Node.js 20 to build the Angular application.
  - Stage 2 (Production): Uses Nginx Alpine to deliver an ultra-lightweight static web server.
- `nginx.conf`: Nginx configuration handling SPA routing fallback (`try_files`), caching, and security headers.
- `docker-compose.yml`: Compose file for local container execution.

## Quick Start
```bash
docker-compose -f docker/docker-compose.yml up --build -d
```
Once started, open `http://localhost:3000` in your browser.
