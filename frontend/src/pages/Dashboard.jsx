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
    <div className="dashboard-light-theme">
      {/* Welcome Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1 className="page-title">Welcome back, {userProfile.name || 'Sarah'}</h1>
        <p className="page-desc" style={{ maxWidth: '600px', lineHeight: '1.6' }}>
          Your interview for <strong>{userProfile.role || 'Senior Product Designer'}</strong> is in 4 days. Let's keep the momentum going.
        </p>
        
        {/* Next Session Action Pill */}
        <button className="btn-action-pill" onClick={startDirectInterview}>
          <i className="fa-solid fa-circle-play" style={{ fontSize: '16px' }}></i>
          Ready for your next session?
        </button>
      </div>

      {/* Grid Layout matching screenshot aesthetics */}
      <div className="card-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '30px', alignItems: 'start' }}>
        
        {/* Left Side Columns (Activity & Upcoming Mock & Recom) */}
        <div>
          {/* Card 1: Activity Status */}
          <div className="glass-card">
            <div className="flex-between">
              <h3 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', color: '#64748b', margin: 0 }}>
                Activity Status
              </h3>
              <span className="badge-green">In Progress</span>
            </div>
            
            <div className="streak-container">
              <div className="streak-icon-box">
                <i className="fa-solid fa-fire"></i>
              </div>
              <div>
                <div className="streak-value">5 Days</div>
                <div className="streak-label">Daily Streak</div>
              </div>
            </div>
            
            {/* Streak bars graphic */}
            <div style={{ display: 'flex', gap: '6px', marginTop: '16px' }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <div 
                  key={i} 
                  style={{ 
                    flexGrow: 1, 
                    height: '4px', 
                    background: i <= 4 ? '#027a48' : '#e2e8f0', 
                    borderRadius: '2px' 
                  }} 
                />
              ))}
            </div>
          </div>

          {/* Card 2: Upcoming Mock Interview */}
          <div className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0047cc', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <i className="fa-solid fa-calendar-days"></i> Upcoming Mock Interview
            </div>
            
            <h2 style={{ fontSize: '22px', marginTop: '12px', marginBottom: '4px', fontWeight: 800 }}>
              {userProfile.role || 'Senior Product Designer'}
            </h2>
            <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 16px 0' }}>
              Focus: Systems Thinking & Leadership
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#334155' }}>
                <i className="fa-regular fa-calendar" style={{ color: '#2563eb' }}></i>
                <span>Date: <strong>Oct 24, 2026</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#334155' }}>
                <i className="fa-regular fa-clock" style={{ color: '#2563eb' }}></i>
                <span>Time: <strong>10:30 AM</strong></span>
              </div>
            </div>

            {/* City Skyline skyline card illustration container */}
            <div className="city-image-container">
              <div style={{ 
                width: '100%', 
                height: '100%', 
                background: 'url("https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&q=80&w=600") center/cover no-repeat' 
              }}>
                <div className="city-image-overlay" onClick={startDirectInterview}>
                  <div className="city-go-btn">
                    <i className="fa-solid fa-arrow-right"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recommended for you */}
          <div style={{ marginTop: '30px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '16px', color: '#0f172a' }}>
              Recommended for you
            </h3>
            
            <div className="recom-item" onClick={() => switchPage('interview')}>
              <div className="recom-icon" style={{ background: '#fef2f2', color: '#ef4444' }}>
                <i className="fa-solid fa-microphone-lines"></i>
              </div>
              <div style={{ flexGrow: 1 }}>
                <div className="recom-title">Behavioral Drills</div>
                <div className="recom-desc">Focus on STAR method responses.</div>
              </div>
              <i className="fa-solid fa-chevron-right" style={{ color: '#94a3b8', fontSize: '12px' }}></i>
            </div>

            <div className="recom-item" onClick={() => switchPage('interview')}>
              <div className="recom-icon" style={{ background: '#ecfdf5', color: '#10b981' }}>
                <i className="fa-solid fa-eye"></i>
              </div>
              <div style={{ flexGrow: 1 }}>
                <div className="recom-title">Body Language Review</div>
                <div className="recom-desc">Analyze eye contact from last session.</div>
              </div>
              <i className="fa-solid fa-chevron-right" style={{ color: '#94a3b8', fontSize: '12px' }}></i>
            </div>

            <div className="recom-item" onClick={() => switchPage('interview')}>
              <div className="recom-icon" style={{ background: '#f5f3ff', color: '#8b5cf6' }}>
                <i className="fa-solid fa-lightbulb"></i>
              </div>
              <div style={{ flexGrow: 1 }}>
                <div className="recom-title">Industry Trends</div>
                <div className="recom-desc">Top questions for AI companies.</div>
              </div>
              <i className="fa-solid fa-chevron-right" style={{ color: '#94a3b8', fontSize: '12px' }}></i>
            </div>

            <div className="recom-item" onClick={startDirectInterview}>
              <div className="recom-icon" style={{ background: '#fff7ed', color: '#f97316' }}>
                <i className="fa-solid fa-sliders"></i>
              </div>
              <div style={{ flexGrow: 1 }}>
                <div className="recom-title">Tech Setup</div>
                <div className="recom-desc">Test your audio and lighting gear.</div>
              </div>
              <i className="fa-solid fa-chevron-right" style={{ color: '#94a3b8', fontSize: '12px' }}></i>
            </div>
          </div>
        </div>

        {/* Right Side Columns (Recent Progress & History Table) */}
        <div>
          {/* Card 3: Recent Progress */}
          <div className="glass-card">
            <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 4px 0' }}>Recent Progress</h3>
            <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 20px 0' }}>
              Performance metrics from last 5 sessions
            </p>

            <div className="metric-progress-item">
              <div className="metric-progress-label">
                <span>Communication</span>
                <span>88%</span>
              </div>
              <div className="metric-progress-bg">
                <div className="metric-progress-fill" style={{ width: '88%', background: '#0047cc' }} />
              </div>
              <div style={{ fontSize: '11px', color: '#027a48', marginTop: '4px', fontWeight: 600 }}>
                <i className="fa-solid fa-arrow-trend-up"></i> 4% improvement
              </div>
            </div>

            <div className="metric-progress-item">
              <div className="metric-progress-label">
                <span>Technical</span>
                <span>72%</span>
              </div>
              <div className="metric-progress-bg">
                <div className="metric-progress-fill" style={{ width: '72%', background: '#4f46e5' }} />
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', fontWeight: 500 }}>
                Stable performance
              </div>
            </div>

            <div className="metric-progress-item">
              <div className="metric-progress-label">
                <span>Confidence</span>
                <span>94%</span>
              </div>
              <div className="metric-progress-bg">
                <div className="metric-progress-fill" style={{ width: '94%', background: '#10b981' }} />
              </div>
              <div style={{ fontSize: '11px', color: '#027a48', marginTop: '4px', fontWeight: 600 }}>
                <i className="fa-solid fa-circle-check"></i> Personal best
              </div>
            </div>

            {/* Rounded column bar chart matching picture exactly */}
            <div className="visual-chart-row">
              <div className="visual-chart-bar-col">
                <div className="visual-chart-bar" style={{ height: '50px' }} />
                <span className="visual-chart-bar-lbl">Oct 12</span>
              </div>
              <div className="visual-chart-bar-col">
                <div className="visual-chart-bar" style={{ height: '70px' }} />
                <span className="visual-chart-bar-lbl">Oct 15</span>
              </div>
              <div className="visual-chart-bar-col">
                <div className="visual-chart-bar" style={{ height: '60px' }} />
                <span className="visual-chart-bar-lbl">Oct 18</span>
              </div>
              <div className="visual-chart-bar-col">
                <div className="visual-chart-bar" style={{ height: '90px' }} />
                <span className="visual-chart-bar-lbl">Oct 21</span>
              </div>
              <div className="visual-chart-bar-col">
                <div className="visual-chart-bar active" style={{ height: '110px' }} />
                <span className="visual-chart-bar-lbl" style={{ color: '#2563eb' }}>Today</span>
              </div>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="glass-card">
            <h3 className="report-section-title" style={{ borderBottom: 'none', padding: 0, margin: '0 0 12px 0', fontSize: '16px' }}>
              <i className="fa-solid fa-file-arrow-up"></i> Configure Resume Setup
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.5', margin: '0 0 16px 0' }}>
              Upload your resume so our LLM parser can extract technical skills and customize mock questions.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-primary" onClick={() => switchPage('resume')} style={{ flexGrow: 1, padding: '10px' }}>
                Upload Resume
              </button>
            </div>
          </div>

          {/* Card 4: Practice History Table */}
          <div className="glass-card">
            <h3 className="report-section-title" style={{ fontSize: '16px', margin: '0 0 10px 0' }}>
              <i className="fa-solid fa-clock-rotate-left"></i> Practice History
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Role</th>
                    <th>Score</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {totalSessions === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center" style={{ color: '#94a3b8', padding: '20px', fontSize: '13px' }}>
                        No mock sessions yet. Complete your first practice!
                      </td>
                    </tr>
                  ) : (
                    sessionHistory.slice(0, 4).map((session) => {
                      const formattedDate = new Date(session.date).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric'
                      });
                      return (
                        <tr key={session.id}>
                          <td>{formattedDate}</td>
                          <td><strong>{session.roleTarget}</strong></td>
                          <td><span className="badge secondary">{session.overallScore}%</span></td>
                          <td>
                            <button 
                              className="btn btn-secondary" 
                              onClick={() => showHistoricalReport(session.id)}
                              style={{ padding: '4px 8px', fontSize: '11px' }}
                            >
                              Report
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

      </div>
    </div>
  );
}
