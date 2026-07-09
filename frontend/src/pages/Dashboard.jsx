import React, { useState } from 'react';

export default function Dashboard({ 
  userProfile, 
  sessionHistory, 
  startDirectInterview, 
  switchPage, 
  showHistoricalReport 
}) {
  const [timeframe, setTimeframe] = useState('Month');
  const totalSessions = sessionHistory.length;
  
  // Calculate average overall score
  const avgScore = totalSessions > 0
    ? Math.round(sessionHistory.reduce((sum, s) => sum + s.overallScore, 0) / totalSessions)
    : null;

  // Real-time calculated averages
  const avgCommunication = totalSessions > 0
    ? Math.round(sessionHistory.reduce((sum, s) => sum + (s.communicationScore || 80), 0) / totalSessions)
    : 80;

  const avgTechnical = totalSessions > 0
    ? Math.round(sessionHistory.reduce((sum, s) => sum + (s.technicalScore || 75), 0) / totalSessions)
    : 75;

  const avgConfidence = totalSessions > 0
    ? Math.round(sessionHistory.reduce((sum, s) => sum + (s.avgEyeContact || 85), 0) / totalSessions)
    : 85;

  // Streak calculations
  const calculateStreak = () => {
    if (sessionHistory.length === 0) return 3; // default startup streak
    const dates = [...new Set(sessionHistory.map(s => new Date(s.date).toDateString()))]
      .map(d => new Date(d))
      .sort((a, b) => b - a);
    
    let streak = 0;
    let current = new Date();
    current.setHours(0, 0, 0, 0);

    const latest = dates[0];
    if (latest) {
      const diffTime = Math.abs(current - latest);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 2) return 1;
    }

    for (let i = 0; i < dates.length; i++) {
      const diff = Math.abs(current - dates[i]);
      const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));
      if (diffDays <= streak + 1) {
        streak = diffDays + 1;
      } else {
        break;
      }
    }
    return Math.max(1, streak);
  };
  
  const currentStreak = calculateStreak();

  const formattedDate = (dStr) => {
    try {
      return new Date(dStr).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric'
      });
    } catch(e) {
      return 'Recent';
    }
  };

  return (
    <div className="page">
      {/* Welcome Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1 className="page-title" style={{ fontSize: '36px', color: '#0f172a', fontWeight: '800' }}>
          Welcome back, {userProfile.name || 'Sarah'}
        </h1>
        <p className="page-desc" style={{ color: '#64748b', fontSize: '15px', marginTop: '6px', maxWidth: '600px', lineHeight: '1.5' }}>
          Your interview for <strong>{userProfile.role || 'Senior Product Designer'}</strong> is in 4 days. Let's keep the momentum going.
        </p>
        
        {/* Next Session Action Pill */}
        <button 
          className="btn btn-primary" 
          onClick={startDirectInterview}
          style={{
            borderRadius: '40px',
            padding: '12px 24px',
            marginTop: '16px',
            fontSize: '14.5px',
            boxShadow: '0 4px 14px rgba(11, 79, 205, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <i className="fa-solid fa-circle-play" style={{ fontSize: '16px' }}></i>
          <span>Ready for your next session?</span>
        </button>
      </div>

      {/* Grid Layout matching screenshot aesthetics */}
      <div className="card-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '30px', alignItems: 'start' }}>
        
        {/* Left Side Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Card 1: Activity Status */}
          <div className="glass-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px' }}>
            <div className="flex-between" style={{ marginBottom: '16px' }}>
              <h3 style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', color: '#64748b', margin: 0 }}>
                Activity Status
              </h3>
              <span className="badge" style={{ backgroundColor: '#ecfdf5', color: '#027a48', border: 'none', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>
                In Progress
              </span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', background: '#fee2e2', color: '#ef4444', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
                <i className="fa-solid fa-fire-flame-curved"></i>
              </div>
              <div>
                <div style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a', lineHeight: '1.1' }}>{currentStreak} {currentStreak === 1 ? 'Day' : 'Days'}</div>
                <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600', marginTop: '2px' }}>Daily Streak</div>
              </div>
            </div>
            
            {/* Streak bars graphic */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '20px' }}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div 
                  key={i} 
                  style={{ 
                    flexGrow: 1, 
                    height: '4px', 
                    background: i <= currentStreak ? '#16a34a' : '#e2e8f0', 
                    borderRadius: '2px' 
                  }} 
                />
              ))}
            </div>
          </div>

          {/* Card 2: Upcoming Mock Interview */}
          <div className="glass-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0b4fcd', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              <i className="fa-solid fa-calendar-check"></i> Upcoming Mock Interview
            </div>
            
            <h2 style={{ fontSize: '24px', marginTop: '12px', marginBottom: '4px', fontWeight: '800', color: '#0f172a' }}>
              {userProfile.role || 'Senior Product Designer'}
            </h2>
            <p style={{ color: '#64748b', fontSize: '13.5px', margin: '0 0 20px 0', fontWeight: '500' }}>
              Focus: Systems Thinking & Leadership
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#334155' }}>
                <i className="fa-regular fa-calendar" style={{ color: '#0b4fcd', fontSize: '15px' }}></i>
                <span>Date: <strong>Oct 24, 2026</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: '#334155' }}>
                <i className="fa-regular fa-clock" style={{ color: '#0b4fcd', fontSize: '15px' }}></i>
                <span>Time: <strong>10:30 AM</strong></span>
              </div>
            </div>

            {/* City Skyline image banner with arrow button */}
            <div style={{
              height: '140px',
              borderRadius: '16px',
              overflow: 'hidden',
              position: 'relative',
              boxShadow: 'inset 0 0 20px rgba(0,0,0,0.1)'
            }}>
              <div style={{ 
                width: '100%', 
                height: '100%', 
                background: 'url("https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&q=80&w=600") center/cover no-repeat' 
              }}>
                <div 
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(135deg, rgba(11, 79, 205, 0.45) 0%, rgba(14, 165, 233, 0.3) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    padding: '16px'
                  }}
                  onClick={startDirectInterview}
                >
                  <div 
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: '#ffffff',
                      color: '#0b4fcd',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      transition: 'transform 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <i className="fa-solid fa-arrow-right"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recommended for you */}
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '16px', color: '#0f172a' }}>
              Recommended for you
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div 
                onClick={() => switchPage('interview')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '16px',
                  borderRadius: '16px',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                className="recom-hover"
              >
                <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#fef2f2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                  <i className="fa-solid fa-microphone-lines"></i>
                </div>
                <div style={{ flexGrow: 1 }}>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>Behavioral Drills</div>
                  <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Focus on STAR method responses.</div>
                </div>
                <i className="fa-solid fa-chevron-right" style={{ color: '#94a3b8', fontSize: '12px' }}></i>
              </div>

              <div 
                onClick={() => switchPage('interview')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '16px',
                  borderRadius: '16px',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                className="recom-hover"
              >
                <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#eff6ff', color: '#0b4fcd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                  <i className="fa-solid fa-eye"></i>
                </div>
                <div style={{ flexGrow: 1 }}>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>Body Language Review</div>
                  <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Analyze eye contact from last session.</div>
                </div>
                <i className="fa-solid fa-chevron-right" style={{ color: '#94a3b8', fontSize: '12px' }}></i>
              </div>

              <div 
                onClick={() => switchPage('interview')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '16px',
                  borderRadius: '16px',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                className="recom-hover"
              >
                <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#f5f3ff', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                  <i className="fa-solid fa-lightbulb"></i>
                </div>
                <div style={{ flexGrow: 1 }}>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>Industry Trends</div>
                  <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Top questions for AI companies.</div>
                </div>
                <i className="fa-solid fa-chevron-right" style={{ color: '#94a3b8', fontSize: '12px' }}></i>
              </div>

              <div 
                onClick={startDirectInterview}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '16px',
                  borderRadius: '16px',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                className="recom-hover"
              >
                <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#fff7ed', color: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                  <i className="fa-solid fa-sliders"></i>
                </div>
                <div style={{ flexGrow: 1 }}>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>Tech Setup</div>
                  <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Test your audio and lighting gear.</div>
                </div>
                <i className="fa-solid fa-chevron-right" style={{ color: '#94a3b8', fontSize: '12px' }}></i>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Card 3: Recent Progress */}
          <div className="glass-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px' }}>
            <div className="flex-between" style={{ marginBottom: '4px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', margin: 0 }}>Recent Progress</h3>
              
              {/* Tab toggles */}
              <div style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: '30px' }}>
                {['Week', 'Month'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setTimeframe(tab)}
                    style={{
                      padding: '4px 12px',
                      borderRadius: '30px',
                      border: 'none',
                      background: timeframe === tab ? '#ffffff' : 'transparent',
                      color: timeframe === tab ? '#0f172a' : '#64748b',
                      fontSize: '11.5px',
                      fontWeight: '700',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: timeframe === tab ? '0 1px 4px rgba(0,0,0,0.06)' : 'none'
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>
            
            <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 20px 0', fontWeight: '500' }}>
              Performance metrics from last 5 sessions
            </p>

            <div style={{ marginBottom: '16px' }}>
              <div className="flex-between" style={{ fontSize: '13.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                <span>Communication</span>
                <span style={{ color: '#0b4fcd' }}>{avgCommunication}%</span>
              </div>
              <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${avgCommunication}%`, background: '#0b4fcd', borderRadius: '10px' }} />
              </div>
              <div style={{ fontSize: '11px', color: '#16a34a', marginTop: '4px', fontWeight: '700' }}>
                <i className="fa-solid fa-arrow-trend-up"></i> Dynamic Average
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div className="flex-between" style={{ fontSize: '13.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                <span>Technical</span>
                <span style={{ color: '#6366f1' }}>{avgTechnical}%</span>
              </div>
              <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${avgTechnical}%`, background: '#6366f1', borderRadius: '10px' }} />
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', fontWeight: '600' }}>
                Active Performance Index
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <div className="flex-between" style={{ fontSize: '13.5px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                <span>Confidence</span>
                <span style={{ color: '#10b981' }}>{avgConfidence}%</span>
              </div>
              <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${avgConfidence}%`, background: '#10b981', borderRadius: '10px' }} />
              </div>
              <div style={{ fontSize: '11px', color: '#16a34a', marginTop: '4px', fontWeight: '700' }}>
                <i className="fa-solid fa-circle-check"></i> Calibration average
              </div>
            </div>

            {/* Custom rounded columns bar chart from mockups */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              height: 120,
              padding: '16px 20px',
              background: '#f8fafc',
              borderRadius: '16px',
              border: '1px solid #e2e8f0'
            }}>
              {(() => {
                const lastFive = [...sessionHistory].slice(-5);
                const bars = [];
                for (let i = 0; i < 5; i++) {
                  const s = lastFive[i];
                  if (s) {
                    bars.push({ label: formattedDate(s.date), val: s.overallScore, active: i === lastFive.length - 1 });
                  } else {
                    const fallback = [
                      { label: 'Practice 1', val: 50 },
                      { label: 'Practice 2', val: 65 },
                      { label: 'Practice 3', val: 58 },
                      { label: 'Practice 4', val: 74 },
                      { label: 'Practice 5', val: 82 }
                    ];
                    bars.push(fallback[i]);
                  }
                }
                return bars.map((bar, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '15%' }}>
                    <div style={{ 
                      width: '100%', 
                      height: '70px',
                      display: 'flex',
                      alignItems: 'flex-end'
                    }}>
                      <div style={{ 
                        width: '100%', 
                        height: `${bar.val}%`, 
                        background: bar.active ? '#0b4fcd' : '#bfdbfe', 
                        borderRadius: '6px',
                        transition: 'height 0.4s ease'
                      }} />
                    </div>
                    <span style={{ fontSize: '9px', color: bar.active ? '#0b4fcd' : '#94a3b8', marginTop: '8px', fontWeight: '700', whiteSpace: 'nowrap' }}>
                      {bar.label}
                    </span>
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="glass-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#0f172a', fontWeight: '800' }}>
              <i className="fa-solid fa-file-arrow-up" style={{ color: '#0b4fcd', marginRight: '8px' }}></i> Configure Resume Setup
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.5', margin: '0 0 16px 0', fontWeight: '500' }}>
              Upload your resume so our LLM parser can extract technical skills and customize mock questions.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => switchPage('resume')} 
                style={{ flexGrow: 1, padding: '10px', fontSize: '13.5px', fontWeight: '700', borderRadius: '10px' }}
              >
                Upload Resume
              </button>
            </div>
          </div>

          {/* Card 4: Practice History Table */}
          <div className="glass-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', margin: '0 0 12px 0', color: '#0f172a', fontWeight: '800' }}>
              <i className="fa-solid fa-clock-rotate-left" style={{ color: '#0b4fcd', marginRight: '8px' }}></i> Practice History
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="history-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '8px 12px', fontSize: '11px' }}>Date</th>
                    <th style={{ padding: '8px 12px', fontSize: '11px' }}>Role</th>
                    <th style={{ padding: '8px 12px', fontSize: '11px' }}>Score</th>
                    <th style={{ padding: '8px 12px', fontSize: '11px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {totalSessions === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center" style={{ color: '#94a3b8', padding: '20px', fontSize: '13px', fontWeight: '500' }}>
                        No mock sessions yet. Complete your first practice!
                      </td>
                    </tr>
                  ) : (
                    sessionHistory.slice(0, 4).map((session) => (
                      <tr key={session.id}>
                        <td style={{ padding: '12px', fontSize: '13px' }}>{formattedDate(session.date)}</td>
                        <td style={{ padding: '12px', fontSize: '13px', fontWeight: '700' }}>{session.roleTarget}</td>
                        <td style={{ padding: '12px' }}>
                          <span className="badge secondary" style={{ padding: '4px 8px', fontSize: '11px' }}>
                            {session.overallScore}%
                          </span>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <button 
                            className="btn btn-secondary" 
                            onClick={() => showHistoricalReport(session.id)}
                            style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '8px', fontWeight: '700' }}
                          >
                            Report
                          </button>
                        </td>
                      </tr>
                    ))
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
