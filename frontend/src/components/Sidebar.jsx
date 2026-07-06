import React from 'react';

export default function Sidebar({ currentPage, switchPage, userProfile, onLogout }) {
  // Get initials for profile avatar
  const initials = userProfile.name
    ? userProfile.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'ME';

  return (
    <aside className="sidebar">
      <div className="logo-container">
        <div className="logo-icon">
          <i className="fa-solid fa-brain-circuit"></i>
        </div>
        <div className="logo-text">PrepCoach.AI</div>
      </div>

      <nav className="menu-list" style={{ flexGrow: 1 }}>
        <a 
          className={`menu-item ${currentPage === 'dashboard' ? 'active' : ''}`}
          onClick={() => switchPage('dashboard')}
        >
          <i className="fa-solid fa-chart-pie"></i>
          <span>Dashboard</span>
        </a>
        <a 
          className={`menu-item ${currentPage === 'resume' ? 'active' : ''}`}
          onClick={() => switchPage('resume')}
        >
          <i className="fa-solid fa-file-invoice"></i>
          <span>Resume Upload</span>
        </a>
        <a 
          className={`menu-item ${currentPage === 'interview' ? 'active' : ''}`}
          onClick={() => switchPage('interview')}
        >
          <i className="fa-solid fa-video"></i>
          <span>Interview Room</span>
        </a>
        <a 
          className={`menu-item ${currentPage === 'report' ? 'active' : ''}`}
          onClick={() => switchPage('report')}
        >
          <i className="fa-solid fa-square-poll-vertical"></i>
          <span>Feedback Report</span>
        </a>
      </nav>

      <div className="user-profile" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '15px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
          <div className="user-avatar" style={{ flexShrink: 0 }}>{initials}</div>
          <div className="user-info" style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
            <div className="user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{userProfile.name}</div>
            <div className="user-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{userProfile.role}</div>
          </div>
        </div>
        <button 
          onClick={onLogout} 
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '16px', padding: '6px', borderRadius: '6px', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          title="Sign Out"
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--error)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <i className="fa-solid fa-arrow-right-from-bracket"></i>
        </button>
      </div>
    </aside>
  );
}
