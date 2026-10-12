# AI Document Editor - Practical Project

**Course/Practical Project**: AI Document Editor with Bidirectional State Management  
**Authors**:
1. **Vinayak Vishwanath Gaikwad** (Reg: 2023BCS022, Roll: B11)
2. **Vedant Milind Khete** (Reg: 2023BCS024, Roll: B12)

---

## Prerequisites
1. **Keep Docker Desktop running in the background** on your computer.

---

## One-Time Setup (First Time Only)

### 1. Install Doppler CLI & Authenticate
Open a PowerShell terminal in the project root:
```powershell
winget install Doppler.doppler
doppler login
doppler setup --project project-practical --config dev
```
*(Accept the browser login prompt to authorize your computer).*

### 2. Install Dependencies
Install packages in both directories:
```powershell
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

---

## Running the Project

Open two terminal windows:

### Terminal 1 (Backend)
```powershell
cd backend
npm run dev
```
- Starts at: `http://localhost:5000`
- Automatically injects cloud secrets via Doppler.
- Automatically initializes MongoDB and Redis containers via Docker.

### Terminal 2 (Frontend)
```powershell
cd frontend
npm run dev
```
- Starts at: `http://localhost:3000`

---

## Key Features
- **Editorial Typography**: Georgia serif typography on the canvas, monochromatic stone aesthetic.
- **AI Drafting Copilot**: Powered by Gemini 2.5 Flash with multi-key rate-limit rotation.
- **Visual Diff Inspection**: Redline block/line difference preview (green for insertions, red for deletions) with Accept/Reject actions.
- **Multi-Tenant User Isolation**: Users only see and modify their own authored documents.
- **Password Recovery**: 6-digit OTP delivered via Brevo Transactional Email (or logged to terminal console).
- **Background PDF Export**: BullMQ queue with Puppeteer headless document exporter.
