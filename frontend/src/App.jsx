import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import ResumeUpload from './pages/ResumeUpload';
import InterviewRoom from './pages/InterviewRoom';
import FeedbackReport from './pages/FeedbackReport';
import QuestionLibrary from './pages/QuestionLibrary';
import AdminDashboard from './pages/AdminDashboard';
import LandingPage from './pages/LandingPage';
import InterviewSetup from './pages/InterviewSetup';
import Login from './pages/Login';
import Register from './pages/Register';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('coach_jwt_token'));
  const [authView, setAuthView] = useState('landing'); // 'landing' or 'login' or 'register'
  
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [userProfile, setUserProfile] = useState({
    name: localStorage.getItem('coach_user_name') || 'Sarah',
    role: localStorage.getItem('coach_user_role') || 'Senior Product Designer',
    userRole: localStorage.getItem('coach_user_system_role') || 'candidate',
    skills: ['React.js', 'JavaScript', 'CSS Grid', 'System Design'],
    experience: '5 Years',
    questions: []
  });
  
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [sessionHistory, setSessionHistory] = useState([]);
  const [dbStatus, setDbStatus] = useState({ databaseConnected: false, storageMode: 'Checking...' });

  // Default avatar image that matches the screenshots
  const avatarUrl = userProfile.name === 'Sarah'
    ? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200' // Sarah
    : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200'; // Default Male

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
          if (data.userRole) {
            localStorage.setItem('coach_user_system_role', data.userRole);
          }
          setUserProfile(prev => ({
            ...prev,
            name: data.name,
            role: data.role || prev.role,
            userRole: data.userRole || prev.userRole || 'candidate',
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
    localStorage.setItem('coach_user_system_role', user.role || 'candidate');
    setUserProfile(prev => ({
      ...prev,
      name: user.name,
      role: user.role === 'candidate' ? 'Candidate Profile' : 'Internal Management',
      userRole: user.role || 'candidate'
    }));
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('coach_jwt_token');
    localStorage.removeItem('coach_user_name');
    localStorage.removeItem('coach_user_email');
    localStorage.removeItem('coach_user_system_role');
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
    setCurrentPage('setup');
  };

  const handleStartInterviewWithQuestions = (questionsList) => {
    setUserProfile(prev => ({ ...prev, questions: questionsList }));
    setCurrentPage('interview');
  };

  const handleShowHistoricalReport = (sessionId) => {
    setSelectedReportId(sessionId);
    setCurrentPage('report');
  };

  if (!token) {
    if (authView === 'landing') {
      return (
        <LandingPage 
          switchToLogin={() => setAuthView('login')} 
          switchToRegister={() => setAuthView('register')} 
        />
      );
    }
    return (
      <>
        <div className="glow-orb orb-1"></div>
        <div className="glow-orb orb-2"></div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px', background: '#f5f7fb' }}>
          
          <button 
            onClick={() => setAuthView('landing')}
            style={{ position: 'absolute', top: '20px', left: '20px', background: '#ffffff', border: '1px solid var(--border-color)', padding: '8px 16px', borderRadius: '12px', cursor: 'pointer', fontSize: '13.5px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <i className="fa-solid fa-arrow-left"></i> Back to Homepage
          </button>

          <div style={{ background: 'rgba(255,255,255,0.8)', padding: '10px 20px', borderRadius: '20px', border: '1px solid var(--border-color)', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '30px', display: 'flex', gap: '15px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <div>
              DB Status:{' '}
              <span style={{ color: dbStatus.databaseConnected ? 'var(--success)' : 'var(--warning)', fontWeight: 'bold' }}>
                {dbStatus.databaseConnected ? 'MySQL Connected' : 'Mock Mode (Offline DB)'}
              </span>
            </div>
            <span>|</span>
            <div>
              Storage: <span style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>{dbStatus.storageMode || 'Checking...'}</span>
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

  if (currentPage === 'admin') {
    return (
      <AdminDashboard 
        userProfile={userProfile}
        onExitAdmin={() => setCurrentPage('dashboard')}
      />
    );
  }

  return (
    <>
      <div className="glow-orb orb-1"></div>
      <div className="glow-orb orb-2"></div>

      {/* Mobile Sticky Header */}
      <header className="app-header">
        <div className="app-header-logo" onClick={() => handlePageSwitch('dashboard')}>
          <div className="app-header-logo-icon">
            <i className="fa-solid fa-bars" style={{ fontSize: '18px', marginRight: '8px', color: '#64748b' }}></i>
          </div>
          <span className="app-header-logo-text">PrepFlow</span>
        </div>
        <div className="app-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={() => handlePageSwitch('resume')}
            style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '18px', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '4px' }}
            title="Upload Resume / Setup"
          >
            <i className="fa-solid fa-file-arrow-up"></i>
          </button>
          <img 
            className="avatar-img" 
            src={avatarUrl} 
            alt="Sarah profile" 
            onClick={() => handlePageSwitch('resume')}
            style={{ cursor: 'pointer' }}
          />
        </div>
      </header>

      <div className="app-container">
        {/* Sidebar Left for Desktop viewports */}
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

          {currentPage === 'library' && (
            <QuestionLibrary 
              userProfile={userProfile}
              startInterviewWithQuestions={handleStartInterviewWithQuestions}
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
                setSelectedReportId('latest'); // Load latest session report
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

          {currentPage === 'setup' && (
            <InterviewSetup 
              userProfile={userProfile}
              onStartInterview={handleStartInterviewWithQuestions}
              switchPage={handlePageSwitch}
            />
          )}

          {currentPage === 'admin' && (
            <AdminDashboard 
              userProfile={userProfile}
            />
          )}
        </main>

        {/* Bottom Navigation for Mobile viewports */}
        <nav className="bottom-nav">
          <a 
            className={`bottom-nav-item ${currentPage === 'dashboard' ? 'active' : ''}`}
            onClick={() => handlePageSwitch('dashboard')}
          >
            <i className="fa-solid fa-table-cells-large"></i>
            <span>Dashboard</span>
          </a>
          <a 
            className={`bottom-nav-item ${currentPage === 'library' ? 'active' : ''}`}
            onClick={() => handlePageSwitch('library')}
          >
            <i className="fa-solid fa-book-open"></i>
            <span>Library</span>
          </a>
          <a 
            className={`bottom-nav-item ${currentPage === 'resume' || currentPage === 'interview' ? 'active' : ''}`}
            onClick={() => handlePageSwitch('resume')}
          >
            <i className="fa-solid fa-circle-play"></i>
            <span>Practice</span>
          </a>
          <a 
            className={`bottom-nav-item ${currentPage === 'report' ? 'active' : ''}`}
            onClick={() => handlePageSwitch('report')}
          >
            <i className="fa-solid fa-square-poll-vertical"></i>
            <span>Reports</span>
          </a>
        </nav>
      </div>
    </>
  );
}
