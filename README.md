# 🚀 AI-Powered Meeting-to-Action Assistant

An intelligent, professional productivity web application designed to automatically convert messy meeting transcripts and discussions into structured summaries, formal decisions, prioritized action items, and actionable clarifications using **Google Gemini AI**.

Built with **HTML5, CSS3, Vanilla JavaScript, Node.js, and Express.js**, storing all data persistantly using **Browser LocalStorage**. Ideal for team standups, sprint reviews, client syncs, and academic viva project submissions.

---

## 🌟 Key Features

1. **AI-Powered Meeting Extraction**:
   - **Executive Summary**: Comprehensive meeting overview and high-level outcomes.
   - **Meeting Objectives**: Primary targets and agenda goals.
   - **Discussion Points**: Key topics mapped with detailed summaries.
   - **Formal Decisions**: Documented consensus with responsible owners.
   - **Action Items**: Task title, detailed description, designated assignee, target deadline, and priority.

2. **Smart Ambiguity Detection & Clarification Engine**:
   - Actively identifies incomplete or vague action items in transcripts (e.g., *"Someone should prepare the presentation"* or *"Finish the report soon"*).
   - Generates targeted clarification questions: *"Who should be responsible for preparing the presentation?"* or *"What is the exact target completion date?"*.
   - Never hallucinates or invents missing names or deadlines.
   - Dedicated **Clarifications Center** allows one-click resolution that automatically updates the corresponding action items across the workspace.

3. **Multi-Format Document Upload**:
   - Support for uploading `.txt`, `.pdf`, and `.docx` meeting notes or transcripts.
   - Server-side parsing using `pdf-parse` and `mammoth` with instant text extraction into the workspace.

4. **Interactive Action Items Tracker**:
   - Global task table tracking deliverables across all meetings.
   - Real-time filtering by status (`Pending`, `In Progress`, `Completed`), priority (`High`, `Medium`, `Low`), and meeting source.
   - Search by task title, description, or assigned owner.
   - Automated **Overdue Task Highlighting** for missed deadlines.
   - Full CRUD capability (create, edit, delete, and update status).

5. **Meeting History & Persistence**:
   - Saved locally in browser `LocalStorage` (no database required).
   - Searchable history cards with instant metrics.
   - Full reports can be reopened, edited, or deleted at any time.

6. **Export & Sharing**:
   - **Download PDF**: Formatted, print-ready executive meeting intelligence reports.
   - **Export CSV**: Download structured action items directly for import into Excel, Google Sheets, or Jira.

7. **One-Click Sample Meeting**:
   - Pre-loaded with a realistic 3-participant sprint planning transcript demonstrating all capabilities, specifically including an unassigned presentation task and a vague deadline.

---

## 🛠️ Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | HTML5, CSS3, Vanilla JavaScript | Modern Notion/Linear-inspired SaaS UI with zero frontend frameworks |
| **Backend** | Node.js, Express.js | Lightweight REST API server serving endpoints and static assets |
| **AI Integration** | Google Gemini API (`@google/generative-ai` & `@google/genai`) | Gemini model processing transcripts with strict JSON schema validation |
| **File Parsing** | `multer`, `pdf-parse`, `mammoth` | Extraction of text from TXT, PDF, and DOCX documents |
| **Storage** | Browser `LocalStorage` | Client-side persistent storage without database dependencies |
| **PDF Generation** | `html2pdf.js` / Print CSS | Clean client-side PDF export with executive layout |

---

## 📂 Project Structure

```
meeting-assistant/
│
├── backend/
│   ├── server.js            # Express server & API endpoints (/api/analyze, /api/upload, /api/health)
│   ├── gemini.js            # Gemini AI prompt orchestration, JSON parsing & fallback engine
│   └── fileParser.js        # TXT, PDF, and DOCX buffer text extraction
│
├── public/
│   ├── index.html           # Single-Page Application (Dashboard, New Meeting, Report, Tasks, Clarifications)
│   ├── style.css            # Custom CSS styling (Notion/Linear theme, purple/blue accents, responsive)
│   ├── script.js            # Frontend logic, LocalStorage controller, API caller & modals
│   └── sampleData.js        # Sample meeting data with 3 participants and ambiguity test cases
│
├── .env                     # Backend environment variables (Gemini API Key, Port)
├── .env.example             # Example environment template
├── package.json             # Node dependencies and execution scripts
└── README.md                # Documentation and viva preparation guide
```

---

## ⚡ Quick Start & Setup Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- A modern web browser (Chrome, Edge, Firefox, Safari)
- *(Optional)* A free Google Gemini API Key from [Google AI Studio](https://aistudio.google.com/)

### Step 1: Install Dependencies
Open a terminal in the project directory and run:
```bash
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
# Windows PowerShell
Copy-Item .env.example .env

# Mac / Linux
cp .env.example .env
```
Open `.env` in any text editor:
```env
PORT=3000
GEMINI_API_KEY=your_actual_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
```
> **Note for Testing / Viva**: If you don't enter an API key, the application includes an intelligent local fallback parser that automatically simulates Gemini's extraction and ambiguity detection so that demos and viva evaluations run without interruption.

### Step 3: Start the Application
Run the start command:
```bash
npm start
```
Or for live-reload development:
```bash
npm run dev
```

### Step 4: Open in Your Browser
Navigate to:
```
http://localhost:3000
```

---

## 🎯 How to Use the Application

### 1. Exploring the Dashboard
- Upon opening, you will see real-time statistics: Total Meetings, Total Action Items, Completed Tasks, Pending Tasks, and Unresolved Ambiguities.
- A progress bar tracks overall completion rate across all recorded tasks.
- The **Upcoming & Urgent Deadlines** section highlights tasks requiring immediate attention, marking overdue dates in red.

### 2. Analyzing a Meeting
1. Navigate to **New Meeting** in the sidebar.
2. Click the **"Load Sample Meeting"** button to instantly pre-fill a realistic 3-participant transcript, or paste your own meeting notes.
   - Alternatively, drag & drop a `.txt`, `.pdf`, or `.docx` document to extract text automatically.
3. Click the prominent **"ANALYZE MEETING WITH AI"** button.
4. Watch the animated progress tracker as Gemini AI extracts summaries, decisions, action items, and ambiguities.

### 3. Reviewing the Meeting Report
- Read through the **Executive Summary**, **Meeting Objectives**, **Key Discussion Points**, and **Decisions Made**.
- Review the **Action Items** table with priority and status tags.
- Observe the **Ambiguity Detection** section flagging statements where an assignee or deadline was missing in the discussion.
- Use the action bar buttons to:
  - **Save Meeting** to your local workspace.
  - **Edit Report** to adjust text directly.
  - **Download PDF** for a printable executive document.
  - **Export CSV** to save action items.

### 4. Resolving Ambiguities in the Clarification Center
1. Navigate to **Clarifications** in the sidebar.
2. View detected ambiguities (e.g., *"Someone should prepare the presentation"*).
3. Click **"Resolve Ambiguity"**.
4. Enter the missing owner (e.g., `Sarah Chen`), set a deadline date, and submit.
5. Notice how the linked action item is automatically updated in the Action Items table and Report!

### 5. Managing Action Items
- Navigate to **Action Items** to view all deliverables across meetings.
- Filter by status (`Pending`, `In Progress`, `Completed`) or priority (`High`, `Medium`, `Low`).
- Change status inline using the status dropdown or edit tasks directly.

---

## 🎓 Viva & Academic Evaluation Points

When presenting this project for an evaluation or viva, highlight these architectural strengths:

1. **Why No Frontend Framework (React/Angular)?**
   - Built with pure Vanilla JavaScript to maintain maximum performance, zero build-step overhead, and complete transparency of DOM manipulations and event-driven architectures.
2. **Deterministic Gemini AI Prompt Engineering**:
   - The backend utilizes strict system instructions combined with `responseMimeType: 'application/json'` to enforce structured schemas.
   - Includes post-processing logic to strip markdown code blocks and handle edge-case formatting.
3. **Strict Non-Hallucination Policy**:
   - Prompts explicitly instruct Gemini **never to invent missing names or deadlines**. Missing data is cataloged into a separate `ambiguities` schema to prompt human-in-the-loop clarification.
4. **Relational Integrity with LocalStorage**:
   - Maintains references between meetings (`meetingId`), action items (`id`), and ambiguities (`relatedTaskId`), allowing changes in the Clarifications view to cascade into the Action Items tracker.
5. **Resilient Offline / Demo Grace**:
   - Features a built-in fallback parser ensuring that even if internet connection drops or API quota is exceeded during an exam, the demonstration functions seamlessly.

---

## 📄 License
This project is open-source and created for educational and professional demonstration purposes.
