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

  const avatarUrl = userProfile.photoUrl 
    ? userProfile.photoUrl 
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile.name || 'User')}&background=0D8ABC&color=fff`;

  const isAdmin = ['super_admin', 'admin', 'content_manager'].includes(userProfile.userRole);

  return (
    <aside className="sidebar">
      <div className="logo-container">
        <div className="logo-icon" style={{ background: 'none', boxShadow: 'none', width: 'auto', height: 'auto' }}>
          <i className="fa-solid fa-brain" style={{ color: 'var(--primary)', fontSize: '24px' }}></i>
        </div>
        <div className="logo-text" style={{ fontFamily: 'Outfit', fontWeight: '800', fontSize: '22px' }}>PrepFlow</div>
      </div>

      {currentPage !== 'interview' && (
        <>
          <nav className="menu-list" style={{ flexGrow: 1 }}>
            <a 
              className={`menu-item ${currentPage === 'dashboard' ? 'active' : ''}`}
              onClick={() => switchPage('dashboard')}
            >
              <i className="fa-solid fa-table-cells-large"></i>
              <span>Dashboard</span>
            </a>
            <a 
              className={`menu-item ${currentPage === 'activity' ? 'active' : ''}`}
              onClick={() => switchPage('activity')}
            >
              <i className="fa-solid fa-fire"></i>
              <span>Activity & Streaks</span>
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
            {/*
            <a 
              className={`menu-item ${currentPage === 'interview' ? 'active' : ''}`}
              onClick={() => switchPage('interview')}
            >
              <i className="fa-solid fa-circle-play"></i>
              <span>Practice Room</span>
            </a>
            */}
            <a 
              className={`menu-item ${currentPage === 'report' ? 'active' : ''}`}
              onClick={() => switchPage('report')}
            >
              <i className="fa-solid fa-square-poll-vertical"></i>
              <span>Feedback Reports</span>
            </a>
            {['super_admin'].includes(userProfile.userRole) && (
              <a 
                className={`menu-item ${currentPage === 'admin' ? 'active' : ''}`}
                onClick={() => switchPage('admin')}
              >
                <i className="fa-solid fa-user-shield"></i>
                <span>Admin Control</span>
              </a>
            )}
          </nav>

          <div 
            className={`user-profile ${currentPage === 'profile' ? 'active-profile' : ''}`} 
            onClick={() => switchPage('profile')} 
            style={{ 
              cursor: 'pointer', 
              padding: currentPage === 'profile' ? '12px' : '20px 8px 8px 8px', 
              borderRadius: '12px', 
              background: currentPage === 'profile' ? 'rgba(0, 0, 0, 0.05)' : 'none', 
              transition: 'all 0.2s ease', 
              borderTop: '1px solid var(--border-color)', 
              marginTop: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              overflow: 'hidden'
            }} 
            title="User Profile & Settings"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden', flexGrow: 1 }}>
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt={userProfile.name} 
                  style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-color)', flexShrink: 0 }}
                />
              ) : (
                <div className="user-avatar" style={{ flexShrink: 0 }}>{initials}</div>
              )}
              <div className="user-info" style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', flexGrow: 1 }}>
                <div className="user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: '700' }}>{userProfile.name}</div>
                <div className="user-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-muted)', fontSize: '11.5px' }}>{userProfile.role || 'Candidate'}</div>
              </div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLogout();
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#ef4444',
                cursor: 'pointer',
                fontSize: '16px',
                padding: '8px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background 0.2s',
                flexShrink: 0
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fee2e2'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              title="Logout"
            >
              <i className="fa-solid fa-right-from-bracket"></i>
            </button>
          </div>
        </>
      )}
    </aside>
  );
}
