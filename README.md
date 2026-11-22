# Zens Manage - Personal Cloud Asset Management System (Serverless & E2EE Edition)

A modern, privacy-first, serverless / no-backend personal asset tracking and wealth management system. Built with **Angular 21** and **Angular Material**, authenticating through **Google Identity Services (OAuth 2.0)** and utilizing each user's personal **Google Drive** as the persistent cloud storage backend.

The entire system enforces **End-to-End Encryption (E2EE)**: all asset records—both locally in browser storage (LocalStorage) and in Google Drive cloud files—are encrypted with **AES-GCM 256-bit** encryption. Only you, authenticated with your Google account, can derive the key and unlock the data.

🌐 **Live Application**: [https://zens2022.github.io/zens-manage/](https://zens2022.github.io/zens-manage/)

---

## 📋 Table of Contents
- [🌟 Key Features](#-key-features)
- [🛠️ Architecture & Tech Stack](#️-architecture--tech-stack)
- [🔐 End-to-End Encryption & Security](#-end-to-end-encryption--security)
- [🚀 Quick Start](#-quick-start)
- [⚙️ Google Cloud Console Configuration Guide](#️-google-cloud-console-configuration-guide)
- [🚢 Deployment Options](#-deployment-options)
  - [1. GitHub Pages (Automated CI/CD)](#1-github-pages-automated-cicd)
  - [2. Local Docker Container Deployment](#2-local-docker-container-deployment)
- [📁 Project Structure](#-project-structure)

---

## 🌟 Key Features

* 🔒 **End-to-End Encryption (E2EE)**: Derives a dedicated AES-GCM 256-bit key from unique Google user identifiers via PBKDF2 (100,000 iterations). Both local storage and cloud backups are encrypted ciphertext; unauthorized third parties cannot decrypt your records.
* 🛡️ **Enforced Authentication & Auto-Wipe**: System access requires authentication. Upon logout or OAuth token expiration, all local caches, decrypted states, and derived keys are immediately and completely wiped from memory.
* ⚡ **Local-First Architecture**: Read/write operations execute instantly against LocalStorage with sub-millisecond response times, providing zero UI latency.
* 🔄 **Smart Bidirectional Sync & Anti-Wipe Guard**:
  * Automatically downloads cloud data when local storage is empty to prevent accidental overwrites or data loss.
  * Supports 3.5s debounced background auto-upload and manual force-sync from the top navigation bar.
* 📈 **Interactive Dual Charts (ECharts)**:
  * **Total Net Worth Trend**: Visualizes long-term growth curve, calculating change amounts and percentage variations compared to previous periods.
  * **Asset Category Trend**: Tracks accumulation and relative percentage share across "Cash, Investment, Other, Uncategorized" over time with interactive legend filtering.
  * Clicking any chart node smoothly scrolls and flashes the corresponding table row below.
* 🏷️ **Asset Categorization & Badges**: Each entry supports category tagging (Cash, Investment, Other, Uncategorized), presented as colored badges with full backward compatibility for older records.
* 📑 **One-Click Item Carryover**: When adding a new record, automatically load previous item names and categories with zeroed values to streamline entry.
* 📡 **Offline Resilience**: Monitors online/offline states in real time. When offline, data is safely encrypted locally and queued for automatic sync once the connection is restored.

---

## 🛠️ Architecture & Tech Stack

| Domain | Technology / Tool | Description |
| :--- | :--- | :--- |
| **Frontend Framework** | Angular 21 (Signals, Standalone Components, RxJS) | Modern reactive state management and modular architecture |
| **UI Component Library** | Angular Material (MDC Components) | Clean, responsive Material Design system |
| **Cryptography** | Web Crypto API (`window.crypto.subtle`) | Native high-performance AES-GCM 256 + PBKDF2 (SHA-256) |
| **Authentication** | Google Identity Services (GIS SDK - OAuth 2.0) | Secure, passwordless login |
| **Cloud Storage** | Google Drive API v3 (REST) | Requests least-privilege `drive.file` scope to store `zens_assets_v1.json` |
| **Data Visualization** | Apache ECharts | Interactive asset trend and category breakdown charts |
| **CI/CD & Deployment** | GitHub Actions / GitHub Pages / Docker (Nginx Alpine) | Automated cloud deployment and lightweight containerization |

---

## 🔐 End-to-End Encryption & Security

```
[Google OAuth Login] 
       │
       ▼
Extract user identity (sub + email) ──► PBKDF2 (100,000 iterations) ──► AES-GCM 256-bit Key
                                                                                │
       ┌────────────────────────────────────────────────────────────────────────┴────────────────────────────────┐
       ▼                                                                                                         ▼
【Local Storage Encryption】                                                                           【Cloud Sync Encryption】
LocalStorage JSON Payload:                                                                               Google Drive JSON Payload:
{                                                                                                        {
  "zensEncrypted": true,                                                                                   "zensEncrypted": true,
  "iv": "<Base64_IV>",                                                                                     "iv": "<Base64_IV>",
  "ciphertext": "<Base64_Ciphertext>"                                                                      "ciphertext": "<Base64_Ciphertext>"
}                                                                                                        }
```

* **Seamless Cross-Device Compatibility**: Logging in with the same Google account across phone, tablet, or PC derives the identical cryptographic key to automatically decrypt your synced cloud records.
* **In-Memory Key Security**: Encryption keys reside strictly in browser memory session and are never transmitted over the network or saved in unencrypted form.

---

## 🚀 Quick Start

### 1. Requirements
* **Node.js**: `v20.x` or `v22.x`+ (LTS recommended)
* **npm**: `v10.x` or `v11.x`

### 2. Installation & Local Development
```bash
# Clone the repository
git clone https://github.com/zens2022/zens-manage.git
cd zens-manage

# Install dependencies
npm install

# Start development server
npm start
```
Open `http://localhost:4200` in your browser.

### 3. Production Build
```bash
npm run build -- --base-href /zens-manage/
```
Build output will be generated under `dist/zens-manage/browser/`.

---

## ⚙️ Google Cloud Console Configuration Guide

To set up your own Google OAuth login and Google Drive sync:

1. Open [Google Cloud Console](https://console.cloud.google.com/) and create a project.
2. Go to **APIs & Services** > **Enabled APIs & Services**, search for and enable **Google Drive API**.
3. Configure the **OAuth Consent Screen**:
   * **User Type**: External
   * **Application Home Page / Privacy Policy**: Enter your domain (e.g. `https://zens2022.github.io/zens-manage/`)
   * **Authorized Domains**: Add your domain (e.g. `zens2022.github.io` without protocol or trailing slash)
   * **Scopes**: Add `https://www.googleapis.com/auth/drive.file`, `.../userinfo.profile`, and `.../userinfo.email`
   * **Test Users**: Add your Google email address (`your-email@gmail.com`). *(Keeping in Testing mode requires no Google verification)*
4. Go to **Credentials** > **Create Credentials** > **OAuth 2.0 Client ID**:
   * **Application Type**: Web application
   * **Authorized JavaScript origins**:
     * Local testing: `http://localhost:4200`
     * Production: `https://zens2022.github.io` *(Note: Must not contain paths or trailing slashes)*
5. Copy the generated **Client ID** and update `src/environments/environment.ts` and `environment.prod.ts` (`googleClientId`).

---

## 🚢 Deployment Options

### 1. GitHub Pages (Automated CI/CD)
The repository includes a ready-to-use GitHub Actions workflow ([.github/workflows/deploy.yml](.github/workflows/deploy.yml)):
1. In your GitHub repository, go to **Settings** > **Pages**.
2. Under **Build and deployment > Source**, select **`GitHub Actions`**.
3. Pushing commits to the `main` branch will automatically build and publish to GitHub Pages.

### 2. Local Docker Container Deployment
A complete multi-stage Docker environment is provided under `docker/`:
```bash
# Build and run containers (mapped to host port 3000)
docker compose -f docker/docker-compose.yml up --build -d

# Stop containers
docker compose -f docker/docker-compose.yml down
```
Access the application at `http://localhost:3000`.

---

## 📁 Project Structure

```
zens-manage/
├── .github/workflows/deploy.yml    # GitHub Pages automated CI/CD workflow
├── docker/                         # Dockerfile, nginx.conf, docker-compose.yml
├── src/
│   ├── app/
│   │   ├── core/                   # Core application services
│   │   │   ├── auth/               # Google OAuth 2.0 authentication service
│   │   │   ├── crypto/             # AES-GCM 256-bit Web Crypto E2EE service
│   │   │   ├── network/            # Real-time online/offline network monitor
│   │   │   ├── storage/            # LocalStorage & Google Drive REST storage
│   │   │   └── sync/               # Bidirectional sync coordinator (SyncManager)
│   │   ├── features/assets/        # Asset domain module
│   │   │   ├── components/         # Presentational components
│   │   │   │   ├── asset-chart/          # ECharts total net worth trend chart
│   │   │   │   ├── asset-category-chart/ # ECharts asset category distribution chart
│   │   │   │   ├── asset-dialog/         # Create/edit asset record dialog
│   │   │   │   ├── asset-table/          # Asset table with pagination & category badges
│   │   │   │   └── auth-lock/            # Unauthenticated security lock screen
│   │   │   ├── asset-page.component.ts/html/scss  # Main asset smart container
│   │   ├── models/                 # Global TypeScript models and constants
│   │   ├── shared/components/      # Shared components (Header & sync status light)
│   │   ├── app.ts / app.html       # Root application shell
│   │   └── app.routes.ts           # Application routing
│   ├── environments/               # Environment configuration files
│   ├── index.html                  # Main HTML entry point
│   └── styles.scss                 # Global styling and Material theme configuration
├── angular.json                    # Angular CLI configuration
├── package.json                    # Dependencies and npm scripts
└── README.md                       # Comprehensive project documentation
```
