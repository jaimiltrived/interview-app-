# AI Interview Preparation Coach (React + Express + MySQL)

An interactive web platform that acts as a personal AI Interview Coach. It mock-parses resumes, generates tailored interview prompts based on technology skills, tracks candidate video feeds, renders real-time audio volume visualizers, transcribes candidate responses, and compiles final performance reports.

---

## 📂 Project Structure

```text
interview-app/
├── backend/
│   ├── config/
│   │   └── db.js          # MySQL connection pool & automatic table seeding
│   ├── routes/
│   │   └── api.js         # REST endpoints for all 85 mock & live APIs
│   ├── package.json       # Node API packages (Express, MySQL2, Swagger)
│   └── server.js          # Express entrypoint & Swagger docs mounting
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AudioVisualizer.jsx  # Web Audio API canvas visualizer
│   │   │   └── Sidebar.jsx          # Left navigation bar
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx        # Analytics overview & log grids
│   │   │   ├── FeedbackReport.jsx   # SVG overall scores & Chart.js graph
│   │   │   ├── InterviewRoom.jsx    # Webcam feed, Speech synthesis, and Recognition
│   │   │   └── ResumeUpload.jsx     # File drops & parser stats
│   │   ├── App.jsx        # Routing context and profile settings
│   │   ├── index.css      # Core styles & dark theme glassmorphism cards
│   │   └── main.jsx       # React DOM mount anchor
│   ├── index.html         # HTML template loading FontAwesome icons
│   ├── package.json       # Frontend dev packages (Vite, React, Chart.js)
│   └── vite.config.js     # Dev server port proxy to port 5000
│
├── .gitignore             # Standard git exclusions (node_modules, builds)
└── README.md              # Project documentation
```

---

## 🚀 How to Run Locally

### 1. Database Setup (Optional)
The backend uses **MySQL** as its database.
* Default connection settings: host `localhost:3306`, user `root`, empty password `""`.
* **Auto-Initialization**: On boot, the server checks if the database exists. It automatically creates the database (`interview_coach`) and tables (`resumes`, `sessions`, `users`, `job_roles`, `interview_types`, `notifications`) if they are missing. It also seeds initial job roles and interview types.
* **Database Fallback**: If MySQL is not running locally, the server logs a warning and **automatically falls back to In-Memory storage**. The application remains fully functional and testable!

### 2. Start Express Backend API
Open a terminal in the `backend/` directory:
```bash
cd backend
npm install
npm start
```
* API starts at: `http://localhost:5000`
* **Swagger API Documentation**: Visit `http://localhost:5000/api-docs` to view and interactively test all 85 endpoints!

### 3. Start Vite + React Frontend
Open a second terminal in the `frontend/` directory:
```bash
cd frontend
npm install
npm run dev
```
* React dev server starts at: `http://localhost:5173`
* Open `http://localhost:5173` in your browser.

---

## 🛠️ Web APIs Integrated
* **HTML5 MediaDevices Webcam**: Streams video preview into canvas containers.
* **Mock Face Landmark Tracking Overlay**: Custom canvas drawing representing bounding box targets and smile detection.
* **Web Audio API Analyser**: Reads microphone input frequencies and draws live waveforms.
* **Web Speech Synthesis (TTS)**: The robotic voice coach reads questions aloud.
* **Web Speech Recognition (STT)**: Transcribes speech, measures speaking speed (WPM), and flags filler words ("um", "like", "so").
* **Chart.js**: Compiles bar-and-line graphs representing pacing and eye-alignment.
