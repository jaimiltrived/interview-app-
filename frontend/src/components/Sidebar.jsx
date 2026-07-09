import React from 'react';

export default function Sidebar({ currentPage, switchPage, userProfile, onLogout }) {
  // Get initials for profile avatar fallback
  const initials = userProfile.name
    ? userProfile.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'SR';

  const avatarUrl = userProfile.name === 'Sarah'
    ? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200'
    : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200';

  return (
    <aside className="sidebar">
      <div className="logo-container">
        <div className="logo-icon" style={{ background: 'none', boxShadow: 'none', width: 'auto', height: 'auto' }}>
          <i className="fa-solid fa-brain" style={{ color: 'var(--primary)', fontSize: '24px' }}></i>
        </div>
        <div className="logo-text" style={{ fontFamily: 'Outfit', fontWeight: '800', fontSize: '22px' }}>PrepFlow</div>
      </div>

      <nav className="menu-list" style={{ flexGrow: 1 }}>
        <a 
          className={`menu-item ${currentPage === 'dashboard' ? 'active' : ''}`}
          onClick={() => switchPage('dashboard')}
        >
          <i className="fa-solid fa-table-cells-large"></i>
          <span>Dashboard</span>
        </a>
        <a 
          className={`menu-item ${currentPage === 'library' ? 'active' : ''}`}
          onClick={() => switchPage('library')}
        >
          <i className="fa-solid fa-book-open"></i>
          <span>Question Library</span>
        </a>
        <a 
          className={`menu-item ${currentPage === 'resume' ? 'active' : ''}`}
          onClick={() => switchPage('resume')}
        >
          <i className="fa-solid fa-file-arrow-up"></i>
          <span>Resume & Setup</span>
        </a>
        <a 
          className={`menu-item ${currentPage === 'interview' ? 'active' : ''}`}
          onClick={() => switchPage('interview')}
        >
          <i className="fa-solid fa-circle-play"></i>
          <span>Practice Room</span>
        </a>
        <a 
          className={`menu-item ${currentPage === 'report' ? 'active' : ''}`}
          onClick={() => switchPage('report')}
        >
          <i className="fa-solid fa-square-poll-vertical"></i>
          <span>Feedback Reports</span>
        </a>
        {['super_admin', 'admin', 'content_manager'].includes(userProfile.userRole) && (
          <a 
            className={`menu-item ${currentPage === 'admin' ? 'active' : ''}`}
            onClick={() => switchPage('admin')}
          >
            <i className="fa-solid fa-user-shield"></i>
            <span>Admin Control</span>
          </a>
        )}
      </nav>

      <div className="user-profile" onClick={() => switchPage('resume')} style={{ cursor: 'pointer' }} title="Resume Upload / Setup">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt={userProfile.name} 
              style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-color)' }}
            />
          ) : (
            <div className="user-avatar" style={{ flexShrink: 0 }}>{initials}</div>
          )}
          <div className="user-info" style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
            <div className="user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: '700' }}>{userProfile.name}</div>
            <div className="user-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-muted)', fontSize: '11.5px' }}>{userProfile.role}</div>
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
