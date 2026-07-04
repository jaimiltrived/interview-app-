import React from 'react';

export default function Dashboard({ 
  userProfile, 
  sessionHistory, 
  startDirectInterview, 
  switchPage, 
  showHistoricalReport 
}) {
  const totalSessions = sessionHistory.length;
  
  // Calculate average overall score
  const avgScore = totalSessions > 0
    ? Math.round(sessionHistory.reduce((sum, s) => sum + s.overallScore, 0) / totalSessions)
    : null;

  // Calculate practice time
  const practiceTimeMins = totalSessions * 6; // Assume 6 mins on average per session

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Welcome back, {userProfile.name}</h1>
        <p className="page-desc">Track your performance indicators and practice custom mock interviews.</p>
      </div>

      {/* Stats Summary Grid */}
      <div className="card-grid">
        <div className="glass-card stat-card">
          <div className="stat-icon primary">
            <i className="fa-solid fa-circle-play"></i>
          </div>
          <div>
            <div className="stat-label">Total Sessions</div>
            <div className="stat-value">{totalSessions}</div>
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon secondary">
            <i className="fa-solid fa-star"></i>
          </div>
          <div>
            <div className="stat-label">Average Score</div>
            <div className="stat-value">{avgScore ? `${avgScore}%` : '--'}</div>
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon accent">
            <i className="fa-solid fa-clock"></i>
          </div>
          <div>
            <div className="stat-label">Practice Time</div>
            <div className="stat-value">{practiceTimeMins} mins</div>
          </div>
        </div>
      </div>

      {/* Main Actions Panel */}
      <div className="card-grid" style={{ gridTemplateColumns: '1.8fr 1.2fr' }}>
        <div className="glass-card">
          <h2 className="report-section-title">
            <i className="fa-solid fa-rocket"></i> Get Started
          </h2>
          <p className="mb-4" style={{ color: 'var(--text-muted)', lineHeight: '1.6', fontSize: '14.5px' }}>
            Upload your resume to let our backend parser customize technical questions matching your experience level. Alternatively, jump straight into a general mock interview right away.
          </p>
          <div style={{ display: 'flex', gap: '15px' }}>
            <button className="btn btn-primary" onClick={() => switchPage('resume')}>
              <i className="fa-solid fa-upload"></i> Upload Resume
            </button>
            <button className="btn btn-secondary" onClick={startDirectInterview}>
              <i className="fa-solid fa-play"></i> Quick Start (General)
            </button>
          </div>
        </div>

        <div className="glass-card">
          <h2 className="report-section-title">
            <i className="fa-solid fa-user-gear"></i> Target Profile
          </h2>
          <div className="detail-row">
            <div className="detail-label">Current Role Target</div>
            <div className="detail-val">{userProfile.role}</div>
          </div>
          <div className="detail-row">
            <div className="detail-label">Core Skills Focus</div>
            <div className="detail-val">{userProfile.skills.slice(0, 4).join(', ') || 'General Soft Skills'}</div>
          </div>
          <div className="detail-row">
            <div className="detail-label">Question Customization</div>
            <div className="detail-val text-success">
              <i className="fa-solid fa-circle-check"></i> Standard Questions Loaded
            </div>
          </div>
        </div>
      </div>

      {/* Session History Table */}
      <div className="glass-card">
        <h2 className="report-section-title">
          <i className="fa-solid fa-clock-rotate-left"></i> Practice History
        </h2>
        <div style={{ overflowX: 'auto' }}>
          <table className="history-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Role Target</th>
                <th>Overall Score</th>
                <th>Technical Score</th>
                <th>Communication Score</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {totalSessions === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center" style={{ color: 'var(--text-muted)', padding: '30px' }}>
                    No recent mock interview sessions. Complete your first practice to see analytics!
                  </td>
                </tr>
              ) : (
                sessionHistory.map((session) => {
                  const formattedDate = new Date(session.date).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  });
                  return (
                    <tr key={session.id}>
                      <td>{formattedDate}</td>
                      <td><strong>{session.roleTarget}</strong></td>
                      <td><span className="badge secondary" style={{ fontSize: '13px' }}>{session.overallScore}%</span></td>
                      <td>{session.technicalScore}%</td>
                      <td>{session.communicationScore}%</td>
                      <td>
                        <button 
                          className="btn btn-secondary" 
                          onClick={() => showHistoricalReport(session.id)}
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                        >
                          <i className="fa-solid fa-eye"></i> View Report
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
