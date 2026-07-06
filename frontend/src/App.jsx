import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import ResumeUpload from './pages/ResumeUpload';
import InterviewRoom from './pages/InterviewRoom';
import FeedbackReport from './pages/FeedbackReport';
import Login from './pages/Login';
import Register from './pages/Register';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('coach_jwt_token'));
  const [authView, setAuthView] = useState('login'); // 'login' or 'register'
  
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [userProfile, setUserProfile] = useState({
    name: localStorage.getItem('coach_user_name') || 'Candidate',
    role: localStorage.getItem('coach_user_role') || 'Software Engineer',
    skills: ['React.js', 'JavaScript', 'CSS Grid'],
    experience: '2 Years',
    questions: []
  });
  
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [dbStatus, setDbStatus] = useState({ databaseConnected: false, storageMode: 'Checking...' });

  // Load profile and history when token changes
  useEffect(() => {
    // Check DB Status
    fetch('/api/status')
      .then(r => r.json())
      .then(data => setDbStatus(data))
      .catch(e => console.warn('Backend server connection failed:', e));

    if (token) {
      fetchProfile(token);
      fetchHistory(token);
    }
  }, [token]);

  const fetchProfile = (jwtToken) => {
    fetch('/api/profile', {
      headers: { 'Authorization': `Bearer ${jwtToken}` }
    })
      .then(r => {
        if (r.status === 401) {
          handleLogout();
          throw new Error('Unauthorized');
        }
        return r.json();
      })
      .then(data => {
        if (data && data.name) {
          setUserProfile(prev => ({
            ...prev,
            name: data.name,
            role: data.role || prev.role,
            skills: data.skills && data.skills.length > 0 ? data.skills : prev.skills,
            experience: data.experience || prev.experience,
            questions: data.questions && data.questions.length > 0 ? data.questions : prev.questions
          }));
        }
      })
      .catch(e => console.warn('Could not fetch user profile details:', e));
  };

  const fetchHistory = (jwtToken) => {
    fetch('/api/history', {
      headers: { 'Authorization': `Bearer ${jwtToken || token}` }
    })
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          setSessionHistory(data);
        }
      })
      .catch(err => {
        console.warn('Could not load history from backend, falling back to localState.', err);
      });
  };

  const handleLoginSuccess = (user, jwtToken) => {
    setToken(jwtToken);
    setUserProfile(prev => ({
      ...prev,
      name: user.name,
      role: localStorage.getItem('coach_user_role') || 'Software Engineer'
    }));
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('coach_jwt_token');
    localStorage.removeItem('coach_user_name');
    localStorage.removeItem('coach_user_email');
    setToken(null);
    setAuthView('login');
    setCurrentPage('dashboard');
  };

  // Switch and trigger updates
  const handlePageSwitch = (pageId) => {
    if (pageId === 'dashboard' && token) {
      fetchHistory(token);
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

  if (!token) {
    return (
      <>
        <div className="glow-orb orb-1"></div>
        <div className="glow-orb orb-2"></div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px' }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 20px', borderRadius: '20px', border: '1px solid var(--border-color)', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '30px', display: 'flex', gap: '15px' }}>
            <div>
              DB Status:{' '}
              <span style={{ color: dbStatus.databaseConnected ? 'var(--success)' : 'var(--warning)', fontWeight: 'bold' }}>
                {dbStatus.databaseConnected ? 'MySQL Connected' : 'Mock Mode (Offline DB)'}
              </span>
            </div>
            <span>|</span>
            <div>
              Storage: <span style={{ color: 'white', fontWeight: 'bold' }}>{dbStatus.storageMode || 'Checking...'}</span>
            </div>
          </div>
          {authView === 'login' ? (
            <Login 
              onLoginSuccess={handleLoginSuccess} 
              switchToRegister={() => setAuthView('register')} 
            />
          ) : (
            <Register 
              onRegisterSuccess={() => setAuthView('login')} 
              switchToLogin={() => setAuthView('login')} 
            />
          )}
        </div>
      </>
    );
  }

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
          onLogout={handleLogout}
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
                if (token) fetchHistory(token);
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
    </>
  );
}
