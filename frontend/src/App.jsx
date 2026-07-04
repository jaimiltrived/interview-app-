import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import ResumeUpload from './pages/ResumeUpload';
import InterviewRoom from './pages/InterviewRoom';
import FeedbackReport from './pages/FeedbackReport';

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [userProfile, setUserProfile] = useState({
    name: 'Jane Doe',
    role: 'Software Engineer',
    skills: ['JavaScript', 'System Design', 'Web APIs'],
    experience: '2 Years',
    questions: []
  });
  
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [showSetup, setShowSetup] = useState(false);
  const [setupFields, setSetupFields] = useState({ name: 'Jane Doe', role: 'Software Engineer' });
  const [dbStatus, setDbStatus] = useState({ databaseConnected: false, storageMode: 'Checking...' });

  // Load profile and history
  useEffect(() => {
    // Check DB Status
    fetch('/api/status')
      .then(r => r.json())
      .then(data => setDbStatus(data))
      .catch(e => console.warn('Backend server connection failed:', e));

    const savedName = localStorage.getItem('coach_user_name');
    const savedRole = localStorage.getItem('coach_user_role');
    const savedSkills = localStorage.getItem('coach_user_skills');

    if (savedName) {
      const parsedSkills = savedSkills ? JSON.parse(savedSkills) : ['React.js', 'JavaScript', 'CSS Grid'];
      setUserProfile(prev => ({
        ...prev,
        name: savedName,
        role: savedRole || 'Software Engineer',
        skills: parsedSkills
      }));
      setSetupFields({ name: savedName, role: savedRole || 'Software Engineer' });
    } else {
      setShowSetup(true);
    }
    
    fetchHistory();
  }, []);

  const fetchHistory = () => {
    fetch('/api/history')
      .then(r => r.json())
      .then(data => setSessionHistory(data))
      .catch(err => {
        console.warn('Could not load history from backend, falling back to localState.', err);
      });
  };

  const handleSaveSetup = () => {
    if (!setupFields.name.trim()) {
      alert('Please enter your name.');
      return;
    }

    let defaultSkills = ['Algorithms', 'Problem Solving', 'System Design'];
    if (setupFields.role.toLowerCase().includes('react') || setupFields.role.toLowerCase().includes('frontend')) {
      defaultSkills = ['React.js', 'JavaScript', 'CSS Grid', 'Tailwind CSS'];
    } else if (setupFields.role.toLowerCase().includes('laravel') || setupFields.role.toLowerCase().includes('php') || setupFields.role.toLowerCase().includes('backend')) {
      defaultSkills = ['PHP', 'Laravel', 'MySQL', 'REST APIs'];
    }

    localStorage.setItem('coach_user_name', setupFields.name);
    localStorage.setItem('coach_user_role', setupFields.role);
    localStorage.setItem('coach_user_skills', JSON.stringify(defaultSkills));

    setUserProfile({
      name: setupFields.name,
      role: setupFields.role,
      skills: defaultSkills,
      experience: '2 Years',
      questions: []
    });

    setShowSetup(false);
    setCurrentPage('dashboard');
  };

  // Switch and trigger updates
  const handlePageSwitch = (pageId) => {
    if (pageId === 'dashboard') {
      fetchHistory();
    }
    setCurrentPage(pageId);
  };

  const handleStartDirectInterview = () => {
    const defaultQuestions = [
      "Could you start by introducing yourself and walking me through your background and key strengths?",
      "Can you describe a challenging technical problem you encountered in a recent project, and how you went about resolving it?",
      "How do you prioritize tasks and manage your time when dealing with tight deadlines and competing requirements?"
    ];
    setUserProfile(prev => ({ ...prev, questions: defaultQuestions }));
    setCurrentPage('interview');
  };

  const handleShowHistoricalReport = (sessionId) => {
    setSelectedReportId(sessionId);
    setCurrentPage('report');
  };

  return (
    <>
      <div className="glow-orb orb-1"></div>
      <div className="glow-orb orb-2"></div>

      <div className="app-container">
        {/* Sidebar Left */}
        <Sidebar 
          currentPage={currentPage} 
          switchPage={handlePageSwitch} 
          userProfile={userProfile} 
        />

        {/* Content Right */}
        <main className="main-content">
          {currentPage === 'dashboard' && (
            <Dashboard 
              userProfile={userProfile}
              sessionHistory={sessionHistory}
              startDirectInterview={handleStartDirectInterview}
              switchPage={handlePageSwitch}
              showHistoricalReport={handleShowHistoricalReport}
            />
          )}

          {currentPage === 'resume' && (
            <ResumeUpload 
              userProfile={userProfile}
              setUserProfile={setUserProfile}
              switchPage={handlePageSwitch}
            />
          )}

          {currentPage === 'interview' && (
            <InterviewRoom 
              userProfile={userProfile}
              switchPage={handlePageSwitch}
              onFinish={() => {
                fetchHistory();
                setSelectedReportId('latest'); // Tell report component to fetch the newly completed session
                setCurrentPage('report');
              }}
            />
          )}

          {currentPage === 'report' && (
            <FeedbackReport 
              selectedId={selectedReportId}
              sessionHistory={sessionHistory}
              switchPage={handlePageSwitch}
            />
          )}
        </main>
      </div>

      {/* Setup Dialog */}
      {showSetup && (
        <div className="setup-overlay">
          <div className="glass-card setup-card" style={{ maxWidth: '460px', width: '90%' }}>
            <h2 className="mb-4" style={{ fontFamily: 'Outfit, sans-serif', fontSize: '24px', fontWeight: '800' }}>
              Configure AI Interview Profile
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>
              Enter your target details to customize questions and test your audio/video devices.
            </p>

            <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '25px' }}>
              <div>
                <label className="detail-label" style={{ marginBottom: '5px', display: 'block' }}>Your Name</label>
                <input 
                  type="text" 
                  value={setupFields.name}
                  onChange={(e) => setSetupFields({ ...setupFields, name: e.target.value })}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'white', fontSize: '14px', outline: 'none' }}
                />
              </div>
              <div>
                <label className="detail-label" style={{ marginBottom: '5px', display: 'block' }}>Target Job / Role</label>
                <input 
                  type="text" 
                  value={setupFields.role}
                  onChange={(e) => setSetupFields({ ...setupFields, role: e.target.value })}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', color: 'white', fontSize: '14px', outline: 'none' }}
                />
              </div>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)', fontSize: '12px', color: 'var(--text-muted)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>DB Status:</span>
                  <span style={{ color: dbStatus.databaseConnected ? 'var(--success)' : 'var(--warning)', fontWeight: 'bold' }}>
                    {dbStatus.databaseConnected ? 'MySQL Connected' : 'Mock Mode (Offline DB)'}
                  </span>
                </div>
                <span>Server Fallback is active. The application will store sessions in memory if MySQL server is offline.</span>
              </div>
            </div>

            <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleSaveSetup}>
              Save & Proceed <i className="fa-solid fa-chevron-right"></i>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
