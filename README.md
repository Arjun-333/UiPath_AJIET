# PROJECT AUTONOMIA
## Autonomous AI Media Company for UiPath Community AJIET

Welcome to **Project Autonomia** — the autonomous digital media organization for **UiPath Community AJIET**, directed by **Arjun** (Founder & CEO) in partnership with **AURI** (Autonomous UiPath Robotic Intelligence).

---

## Leadership & Official Department Roster

### Executive Leadership (Floor 0)
- **Arjun**: Founder, CEO & Overall Main Director
- **AURI**: Official Mascot & Executive AI Interface to CEO Arjun
- **Marcus Vance**: Chief Operations Officer (Workflow Sequencing & Operations Coordinator)

---

### Technology & Infrastructure Department (Floor 5)
- **Pratham**: Chief Technology Officer & Technical Architecture Lead
- **Mallika**: Lead API & Database Systems Manager
- **Vaibhav**: DevOps & Infrastructure Security Supervisor
- **Faazil**: Lead System Administrator & Storage Infrastructure Engineer

---

### Media & Creative Department (Floor 1 & Social Media)
- **Darshan**: Lead Video Director & Production Head (FFmpeg Video Compositor)
- **Shrinithi**: Lead Scriptwriter & Content Strategist (Tutorial & Promo Narration)
- **Vaishnavi**: Thumbnail & Creative Visual Designer (1280x720 High-CTR Visuals)
- **Shreyank**: Video Editor & Motion Graphics Specialist (9:16 Vertical Instagram Reels)

---

### Documentation & Campus Operations Department (Floor 4)
- **Iffah**: Lead Documentation & Campus Outreach Lead (Managing Automate Campus Quest Emails & Campaigns)
- **Jiya**: Research & Technical Documentation Specialist (UiPath Documentation & Knowledge Base)
- **Srijana**: Quality & Compliance Inspector (Audio/Video Sync & Standards Inspection)

---

## AURI Mascot Source of Truth
- **Reference Image**: Located at `frontend/public/assets/branding/auri-reference.png` (and `orbi-reference.png`).
- **8 Dynamic States**: `idle`, `walking`, `waving`, `thinking`, `working`, `celebrating`, `waiting`, `error`.
- Driven in real time by backend WebSockets matching organizational events.

---

## Quickstart Guide

### 1. Launch Autonomia
```bash
./run_autonomia.sh
```

### 2. Open the Virtual Headquarters
Visit in your browser:
```
http://localhost:8080/app/
```

---

## Manual Running Instructions

If you prefer to set up and run the backend and frontend manually (without `./run_autonomia.sh`):

### 1. First-Time Setup
```bash
# Create & activate Python virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 2. Option A — Production Build (Single Server)
Build the frontend bundle and serve everything from FastAPI on port `8080`:
```bash
# 1. Build the frontend
cd frontend
npm run build
cd ..

# 2. Initialize the database
source .venv/bin/activate
python3 -c "import asyncio; from backend.app.database.session import init_db; asyncio.run(init_db())"

# 3. Start the FastAPI server
uvicorn backend.app.main:app --host 0.0.0.0 --port 8080
```
Open `http://localhost:8080/app/` in your browser.

### 3. Option B — Development Mode (Hot Reload)
Run the backend and Vite dev server in two separate terminals:

**Terminal 1 (Backend API & WebSockets):**
```bash
source .venv/bin/activate
uvicorn backend.app.main:app --host 0.0.0.0 --port 8080 --reload
```

**Terminal 2 (Frontend Dev Server):**
```bash
cd frontend
npm run dev
```

### 4. Issue Directives as CEO Arjun
From the CEO Command Centre, issue natural-language instructions:
- `"Create a YouTube video explaining UiPath Document Understanding"`
- `"Prepare three Instagram Reels from our latest YouTube video"`
- `"Schedule the next video for Friday at 6 PM"`
- `"Send a reminder email to all registered Automate Campus Quest students"`

---

## Automated Test Verification
Run all backend, multi-agent, and legacy email test suites:
```bash
source .venv/bin/activate
pytest -v
```
