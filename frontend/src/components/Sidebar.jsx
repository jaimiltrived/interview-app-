import React from 'react';

export default function Sidebar({ currentPage, switchPage, userProfile }) {
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

      <nav className="menu-list">
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

      <div className="user-profile">
        <div className="user-avatar">{initials}</div>
        <div className="user-info">
          <div className="user-name">{userProfile.name}</div>
          <div className="user-title">{userProfile.role}</div>
        </div>
      </div>
    </aside>
  );
}
