import React, { useState, useEffect } from 'react';

export default function AdminDashboard({ userProfile, onExitAdmin }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [contentSubTab, setContentSubTab] = useState('roles');
  
  // Data States
  const [users, setUsers] = useState([]);
  const [resumes, setResumes] = useState([]);
  const [jobRoles, setJobRoles] = useState([]);
  const [interviewTypes, setInterviewTypes] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [prompts, setPrompts] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [skills, setSkills] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [logs, setLogs] = useState([]);
  const [settings, setSettings] = useState({
    app_name: 'PrepFlow AI',
    logo_url: '/logo.png',
    email_settings: { smtp_host: 'smtp.mailtrap.io', smtp_port: '2525' },
    ai_model: 'Llama 3.2',
    ollama_url: 'http://localhost:11434',
    api_keys: { gemini_api_key: 'MOCK_KEY_FOR_TESTING' },
    upload_limits_mb: 5,
    max_interview_duration_mins: 30,
    session_timeout_mins: 60,
    password_policy: { minLength: 8, requireNumbers: true }
  });
  
  // Additional modules states
  const [emailTemplates, setEmailTemplates] = useState([]);
  const [systemHealth, setSystemHealth] = useState({
    cpu: 18, ram: 42, disk: 68, uptime: '2h 14m',
    serverStatus: 'Online', databaseStatus: 'Connected', ollamaStatus: 'Active', apiGateway: 'Healthy'
  });
  const [securityLogs, setSecurityLogs] = useState([]);
  const [apiLogs, setApiLogs] = useState([]);
  const [interviewSessions, setInterviewSessions] = useState([]);
  const [leaderboard, setLeaderboard] = useState([
    { rank: 1, name: 'Sarah Connor', email: 'sarah.c@prepcoach.ai', role: 'Senior Product Designer', technical: 94, overall: 92 },
    { rank: 2, name: 'Jane Doe', email: 'jane@example.com', role: 'React Developer', technical: 92, overall: 90 },
    { rank: 3, name: 'Alice Smith', email: 'alice@example.com', role: 'Node.js Developer', technical: 88, overall: 89 },
    { rank: 4, name: 'Bob Johnson', email: 'bob@example.com', role: 'Java Developer', technical: 85, overall: 84 },
    { rank: 5, name: 'John Miller', email: 'john.m@prepcoach.ai', role: 'MERN Stack Developer', technical: 82, overall: 81 }
  ]);
  const [liveTraffic, setLiveTraffic] = useState([30, 45, 35, 50, 40, 60, 55, 70, 65, 80, 75, 90]);

  // Stats Counters
  const [stats, setStats] = useState({
    totalUsers: 142,
    activeUsers: 84,
    totalInterviews: 312,
    completedInterviews: 295,
    avgScore: 81,
    jobRolesCount: 7,
    companiesCount: 9,
    aiRequestsToday: 124,
    failedAiRequests: 2,
    monthlyGrowth: 15
  });

  const [chartData, setChartData] = useState({
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    dailyInterviews: [12, 18, 15, 22, 28, 10, 8],
    averageScores: [74, 78, 80, 81, 84, 82, 85],
    userGrowth: [80, 95, 110, 122, 130, 138, 142],
    communicationScores: [72, 75, 78, 80, 82, 84, 85],
    technicalScores: [76, 78, 82, 84, 85, 86, 88],
    popularSkills: ['React', 'Node.js', 'Java', 'Python', 'Docker'],
    popularSkillsCount: [42, 35, 28, 22, 18]
  });

  // UI Interactive States
  const [loading, setLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [questionSearch, setQuestionSearch] = useState('');
  const [resumeSearch, setResumeSearch] = useState('');
  const [interviewSearch, setInterviewSearch] = useState('');
  const [logFilter, setLogFilter] = useState('ALL');
  
  // Custom Filters for Interview Sessions
  const [filterCompany, setFilterCompany] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // Broadcaster
  const [broadcastTarget, setBroadcastTarget] = useState('all');
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  
  // AI Prompt testing
  const [promptTestTemplate, setPromptTestTemplate] = useState('');
  const [promptTestContext, setPromptTestContext] = useState('');
  const [promptTestOutput, setPromptTestOutput] = useState('');
  const [promptTesting, setPromptTesting] = useState(false);

  // AI config sliders
  const [aiSettings, setAiSettings] = useState({
    model: 'Llama 3.2',
    temperature: 0.7,
    maxTokens: 1024,
    systemPrompt: 'You are an elite software engineering mock interviewer...',
    timeoutSecs: 30,
    streamingEnabled: true
  });

  const [pricingPlans, setPricingPlans] = useState([
    { name: 'Free Plan', price: 0, sessions: 3, ats: true, aiFeedback: false, active: true },
    { name: 'Basic Plan', price: 19, sessions: 15, ats: true, aiFeedback: true, active: true },
    { name: 'Premium Plan', price: 49, sessions: 100, ats: true, aiFeedback: true, active: true }
  ]);

  const [permissionsMatrix, setPermissionsMatrix] = useState({
    super_admin: { users: true, prompts: true, settings: true, backups: true, content: true },
    admin: { users: true, prompts: false, settings: false, backups: false, content: true },
    moderator: { users: false, prompts: false, settings: false, backups: false, content: true },
    content_manager: { users: false, prompts: true, settings: false, backups: false, content: true }
  });

  // Selected details targets
  const [activeDetailResume, setActiveDetailResume] = useState(null);
  const [selectedTemplateText, setSelectedTemplateText] = useState(null);

  // CRUD Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState(''); 
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({});
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  
  // Token
  const token = localStorage.getItem('coach_jwt_token');

  // Load initial stats
  useEffect(() => {
    fetchStatsAndCharts();
  }, []);

  // Load Tab Content dynamically
  useEffect(() => {
    loadTabContent();
  }, [activeTab, contentSubTab]);

  // Live real-time server activity simulator
  useEffect(() => {
    const timer = setInterval(() => {
      // Fluctuating system resource metrics
      setSystemHealth(prev => ({
        ...prev,
        cpu: Math.min(95, Math.max(5, prev.cpu + Math.floor(Math.random() * 7) - 3)),
        ram: Math.min(90, Math.max(30, prev.ram + Math.floor(Math.random() * 3) - 1))
      }));

      // Random server endpoints activity updates
      const simulatedActions = [
        { action: 'GET /api/profile', details: 'Successful session token handshakes verification.', type: 'API' },
        { action: 'POST /api/interview/answer', details: 'Candidate response parsed successfully via browser STT.', type: 'API' },
        { action: 'GET /api/admin/system-health', details: 'Super Admin fetched diagnostic dashboards.', type: 'ACTIVITY' },
        { action: 'POST /api/auth/login', details: 'Successful credentials token encryption.', type: 'SECURITY' }
      ];

      const selectedAction = simulatedActions[Math.floor(Math.random() * simulatedActions.length)];
      const logEntry = {
        id: Date.now(),
        action: selectedAction.action,
        details: selectedAction.details,
        created_at: new Date()
      };

      setLogs(prev => [logEntry, ...prev.slice(0, 49)]);

      if (selectedAction.type === 'SECURITY') {
        const securityEntry = {
          id: Date.now(),
          event: 'AUTH_SUCCESS',
          ip_address: `192.168.1.${Math.floor(Math.random() * 100) + 10}`,
          username: 'candidate_session@prepcoach.ai',
          details: 'Handshake token initialized.',
          created_at: new Date()
        };
        setSecurityLogs(prev => [securityEntry, ...prev.slice(0, 49)]);
      }

      if (selectedAction.type === 'API') {
        const apiEntry = {
          id: Date.now(),
          method: selectedAction.action.split(' ')[0],
          url: selectedAction.action.split(' ')[1],
          status: 200,
          response_time_ms: Math.floor(Math.random() * 60) + 12,
          created_at: new Date()
        };
        setApiLogs(prev => [apiEntry, ...prev.slice(0, 49)]);
      }
      setLiveTraffic(prev => {
        const lastVal = prev[prev.length - 1] || 50;
        const nextVal = Math.min(75, Math.max(10, lastVal + Math.floor(Math.random() * 20) - 10));
        return [...prev.slice(1), nextVal];
      });

    }, 4000);

    return () => clearInterval(timer);
  }, []);

  const showStatus = (type, text) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage({ type: '', text: '' }), 4000);
  };

  const fetchStatsAndCharts = async () => {
    try {
      const statsRes = await fetch('/api/admin/dashboard/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(prev => ({ ...prev, ...statsData }));
      }

      const chartRes = await fetch('/api/admin/dashboard/charts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (chartRes.ok) {
        const charts = await chartRes.json();
        setChartData(prev => ({ ...prev, ...charts }));
      }
    } catch (err) {
      console.warn('Failed to fetch stats:', err);
    }
  };

  const loadTabContent = async () => {
    setLoading(true);
    try {
      let endpoint = '';
      if (activeTab === 'users') endpoint = '/api/admin/users';
      else if (activeTab === 'resume') endpoint = '/api/admin/resumes';
      else if (activeTab === 'interviews') {
        if (contentSubTab === 'sessions') endpoint = '/api/admin/interviews/sessions';
        else if (contentSubTab === 'questions') endpoint = '/api/admin/questions';
        else if (contentSubTab === 'roles') endpoint = '/api/admin/job-roles';
      } else if (activeTab === 'ai') {
        endpoint = '/api/admin/ai-prompts';
      } else if (activeTab === 'companies') endpoint = '/api/admin/companies';
      else if (activeTab === 'skills') endpoint = '/api/admin/skills';
      else if (activeTab === 'feedback') endpoint = '/api/admin/feedbacks';
      else if (activeTab === 'activity-logs') endpoint = '/api/admin/logs';
      else if (activeTab === 'settings') endpoint = '/api/admin/settings';
      
      // Additional modules
      else if (activeTab === 'email-templates') endpoint = '/api/admin/email-templates';
      else if (activeTab === 'system-health') endpoint = '/api/admin/system-health';
      else if (activeTab === 'security') endpoint = '/api/admin/security/logs';
      else if (activeTab === 'dashboard') {
        const leadRes = await fetch('/api/admin/leaderboard', { headers: { 'Authorization': `Bearer ${token}` } });
        if (leadRes.ok) setLeaderboard(await leadRes.json());
        
        const sessionsRes = await fetch('/api/admin/interviews/sessions', { headers: { 'Authorization': `Bearer ${token}` } });
        if (sessionsRes.ok) setInterviewSessions(await sessionsRes.json());
      }

      if (!endpoint) {
        setLoading(false);
        return;
      }

      const res = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (activeTab === 'users') setUsers(data);
        else if (activeTab === 'resume') setResumes(data);
        else if (activeTab === 'ai') setPrompts(data);
        else if (activeTab === 'companies') setCompanies(data);
        else if (activeTab === 'skills') setSkills(data);
        else if (activeTab === 'feedback') setFeedbacks(data);
        else if (activeTab === 'activity-logs') setLogs(data);
        else if (activeTab === 'settings') setSettings(data);
        
        // Additional
        else if (activeTab === 'email-templates') setEmailTemplates(data);
        else if (activeTab === 'system-health') setSystemHealth(data);
        else if (activeTab === 'security') setSecurityLogs(data);
        
        else if (activeTab === 'interviews') {
          if (contentSubTab === 'sessions') setInterviewSessions(data);
          else if (contentSubTab === 'questions') setQuestions(data);
          else if (contentSubTab === 'roles') setJobRoles(data);
        }
      }
    } catch (err) {
      console.warn('Failed to load active content:', err);
    } finally {
      setLoading(false);
    }
  };

  // CRUD Actions
  const handleOpenModal = (type, item = null) => {
    setModalType(type);
    setSelectedItem(item);
    setFormData(item ? { ...item } : {});
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedItem(null);
    setFormData({});
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    let url = '';
    let method = 'POST';
    
    if (modalType === 'editUser') {
      url = `/api/admin/user/${selectedItem.id}`;
      method = 'PUT';
    } else if (modalType === 'jobRole') {
      url = selectedItem ? `/api/admin/job-role/${selectedItem.id}` : '/api/admin/job-role';
      method = selectedItem ? 'PUT' : 'POST';
    } else if (modalType === 'company') {
      url = selectedItem ? `/api/admin/company/${selectedItem.id}` : '/api/admin/company';
      method = selectedItem ? 'PUT' : 'POST';
    } else if (modalType === 'prompt') {
      url = selectedItem ? `/api/admin/ai-prompt/${selectedItem.id}` : '/api/admin/ai-prompt';
      method = selectedItem ? 'PUT' : 'POST';
    } else if (modalType === 'question') {
      url = selectedItem ? `/api/admin/question/${selectedItem.id}` : '/api/admin/question';
      method = selectedItem ? 'PUT' : 'POST';
    } else if (modalType === 'skill') {
      url = '/api/admin/skill';
      method = 'POST';
    } else if (modalType === 'feedbackReply') {
      url = `/api/admin/feedback/reply/${selectedItem.id}`;
      method = 'POST';
    } else if (modalType === 'emailTemplate') {
      url = `/api/admin/email-template/${selectedItem.id}`;
      method = 'PUT';
    }

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        showStatus('success', `${modalType} saved successfully!`);
        handleCloseModal();
        loadTabContent();
      } else {
        const err = await res.json();
        showStatus('error', err.error || 'Failed to complete write action.');
      }
    } catch (err) {
      showStatus('error', 'Network communication error.');
    }
  };

  const handleDelete = async (type, id) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) return;
    let url = '';
    if (type === 'user') url = `/api/admin/user/${id}`;
    else if (type === 'resume') url = `/api/admin/resume/${id}`;
    else if (type === 'jobRole') url = `/api/admin/job-role/${id}`;
    else if (type === 'company') url = `/api/admin/company/${id}`;
    else if (type === 'prompt') url = `/api/admin/ai-prompt/${id}`;
    else if (type === 'question') url = `/api/admin/question/${id}`;
    else if (type === 'skill') url = `/api/admin/skill/${id}`;
    else if (type === 'feedback') url = `/api/admin/feedback/${id}`;

    try {
      const res = await fetch(url, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showStatus('success', 'Resource deleted successfully.');
        loadTabContent();
      } else {
        const err = await res.json();
        showStatus('error', err.error || 'Delete restricted.');
      }
    } catch (err) {
      showStatus('error', 'Request failed.');
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    const nextStatus = currentStatus === 'blocked' ? 'active' : 'blocked';
    try {
      const res = await fetch(`/api/admin/user/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        showStatus('success', `User status toggled to ${nextStatus}`);
        loadTabContent();
      }
    } catch (e) {
      showStatus('error', 'Status toggle failed.');
    }
  };

  // Systems Actions
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        showStatus('success', 'Settings updated successfully.');
      }
    } catch (err) {
      showStatus('error', 'Communication failure.');
    }
  };

  const handleBackup = async () => {
    try {
      const res = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        showStatus('success', `Backup file generated: ${data.backupFile}`);
      }
    } catch (e) {
      showStatus('error', 'Backup failed.');
    }
  };

  const handleRestore = async () => {
    try {
      const res = await fetch('/api/admin/restore', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showStatus('success', 'Database restored from backup snapshot.');
      }
    } catch (e) {
      showStatus('error', 'Restore operation failed.');
    }
  };

  const handleRestartAI = async () => {
    showStatus('success', 'Restarting Llama 3.2 service daemon...');
    setTimeout(() => showStatus('success', 'Ollama engine booted healthy (Online)'), 2000);
  };

  // Broadcaster
  const handleSendBroadcast = (e) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMessage) {
      showStatus('error', 'Broadcast details are required.');
      return;
    }
    showStatus('success', `Broadcast alert successfully dispatched to: ${broadcastTarget}`);
    setBroadcastTitle('');
    setBroadcastMessage('');
  };

  // Prompt Simulator
  const handleTestPrompt = (e) => {
    e.preventDefault();
    if (!promptTestTemplate) {
      showStatus('error', 'Please select a prompt template.');
      return;
    }
    setPromptTesting(true);
    setPromptTestOutput('Inference initialization...');
    
    setTimeout(() => {
      setPromptTestOutput(prev => prev + '\nLoading instruction context prompt...');
      setTimeout(() => {
        setPromptTestOutput(prev => prev + `\n\n[TEMPLATE]: "${promptTestTemplate}"\n\n[EVALUATION RESPONSE]:\nBased on your selected profile: "${promptTestContext || 'React Developer'}", here are target recommendation points:\n- Analyze DOM updates hook cycles.\n- How do you implement robust, secure JWT sessions expiration controls?`);
        setPromptTesting(false);
      }, 1200);
    }, 800);
  };

  // CSV DOWNLOADS (REPORTS)
  const handleDownloadCSV = (reportType) => {
    let headers = [];
    let rows = [];
    let filename = '';

    if (reportType === 'users') {
      headers = ['ID', 'Name', 'Email', 'Role'];
      rows = users.map(u => [u.id, u.name, u.email, u.role]);
      filename = 'users_list.csv';
    } else if (reportType === 'resumes') {
      headers = ['ID', 'Name', 'Target Job Title', 'Skills'];
      rows = resumes.map(r => [r.id, r.name, r.role_target, r.skills]);
      filename = 'uploaded_resumes_audit.csv';
    } else if (reportType === 'sessions') {
      headers = ['ID', 'Candidate Name', 'Role Target', 'Overall Score', 'Technical Score', 'Communication Score'];
      rows = interviewSessions.map(s => [s.id, s.username, s.role_target, s.overall_score, s.technical_score, s.communication_score]);
      filename = 'interview_sessions_report.csv';
    }

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showStatus('success', `Export completed: ${filename} downloaded.`);
  };

  // CSV Questions Import
  const handleImportCSVQuestions = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target.result;
      const lines = text.split('\n');
      let count = 0;

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.split(',');
        const type = parts[0]?.replace(/^"|"$/g, '').trim() || 'Technical';
        const question = parts.slice(1).join(',')?.replace(/^"|"$/g, '').trim();

        if (question) {
          try {
            await fetch('/api/admin/question', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ type, question })
            });
            count++;
          } catch (err) {}
        }
      }
      showStatus('success', `Imported ${count} questions successfully.`);
      loadTabContent();
    };
    reader.readAsText(file);
  };

  // Filters listings
  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredResumes = resumes.filter(r => 
    r.name.toLowerCase().includes(resumeSearch.toLowerCase()) || 
    r.role_target.toLowerCase().includes(resumeSearch.toLowerCase())
  );

  const filteredQuestions = questions.filter(q => 
    q.question.toLowerCase().includes(questionSearch.toLowerCase()) ||
    q.type.toLowerCase().includes(questionSearch.toLowerCase())
  );

  const filteredSessions = interviewSessions.filter(s => {
    const matchesSearch = s.username?.toLowerCase().includes(interviewSearch.toLowerCase()) || s.role_target.toLowerCase().includes(interviewSearch.toLowerCase());
    const matchesCompany = filterCompany ? s.role_target.toLowerCase().includes(filterCompany.toLowerCase()) : true;
    const matchesRole = filterRole ? s.role_target.toLowerCase().includes(filterRole.toLowerCase()) : true;
    const matchesDate = filterDate ? s.date?.includes(filterDate) : true;
    return matchesSearch && matchesCompany && matchesRole && matchesDate;
  });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', width: '100vw', margin: 0, fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      
      {/* 1. STANDALONE ADMIN SIDEBAR (DARK & PREMIUM) */}
      <aside style={{ width: '260px', background: '#0f172a', display: 'flex', flexDirection: 'column', color: '#cbd5e1', borderRight: '1px solid #1e293b', flexShrink: 0 }}>
        
        {/* Sidebar Header Brand */}
        <div style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #1e293b' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
            <i className="fa-solid fa-shield-halved"></i>
          </div>
          <div>
            <span style={{ fontSize: '16.5px', fontWeight: '800', color: '#ffffff', fontFamily: 'Outfit' }}>Control Deck</span>
            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>PrepFlow Enterprise</div>
          </div>
        </div>

        {/* Sidebar Menu List */}
        <nav style={{ flexGrow: 1, padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
          {[
            { id: 'dashboard', label: 'Dashboard', icon: 'fa-table-cells-large' },
            { id: 'users', label: 'User Management', icon: 'fa-users-gear' },
            { id: 'resume', label: 'Resume logs', icon: 'fa-file-invoice' },
            { id: 'interviews', label: 'Interviews & Questions', icon: 'fa-microphone' },
            { id: 'ai', label: 'AI Prompt Config', icon: 'fa-wand-magic-sparkles' },
            { id: 'companies', label: 'Companies', icon: 'fa-building' },
            { id: 'skills', label: 'Master Skills', icon: 'fa-cubes' },
            { id: 'analytics', label: 'Analytics Dashboard', icon: 'fa-chart-line' },
            { id: 'reports', label: 'Reports Hub', icon: 'fa-square-poll-vertical' },
            { id: 'email-templates', label: 'Email Templates', icon: 'fa-envelope-open-text' },
            { id: 'notifications', label: 'System alerts', icon: 'fa-bullhorn' },
            { id: 'feedback', label: 'Feedbacks list', icon: 'fa-comments' },
            { id: 'activity-logs', label: 'System Logs', icon: 'fa-book-open-reader' },
            { id: 'security', label: 'Security monitor', icon: 'fa-lock' },
            { id: 'system-health', label: 'System Health', icon: 'fa-heart-pulse' },
            { id: 'settings', label: 'App Settings', icon: 'fa-gears' }
          ].map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (item.id === 'interviews') setContentSubTab('sessions');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  background: isActive ? '#1e293b' : 'transparent',
                  border: 'none',
                  color: isActive ? '#ffffff' : '#94a3b8',
                  padding: '10.5px 14px',
                  borderRadius: '10px',
                  fontSize: '13.5px',
                  fontWeight: '700',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                <i className={`fa-solid ${item.icon}`} style={{ width: '18px', color: isActive ? '#3b82f6' : '#64748b' }}></i>
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Exit Admin Button */}
        <div style={{ padding: '16px', borderTop: '1px solid #1e293b' }}>
          <button 
            onClick={onExitAdmin} 
            style={{ width: '100%', padding: '10px', borderRadius: '10px', background: '#3b82f6', color: '#ffffff', border: 'none', fontWeight: '700', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <i className="fa-solid fa-arrow-left-long"></i> Exit Admin
          </button>
        </div>

      </aside>

      {/* 2. MAIN ADMIN CONTENT CONTAINER */}
      <main style={{ flexGrow: 1, padding: '35px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '30px' }}>
        
        {/* ========================================== */}
        {/* VIEW 1: DASHBOARD SUMMARY */}
        {/* ========================================== */}
        {activeTab === 'dashboard' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontFamily: 'Outfit', fontSize: '28px', fontWeight: '800', color: '#0f172a' }}>Platform Analytics Summary</h2>
              <p style={{ color: '#64748b', fontSize: '14.5px' }}>Quick look overview of active users, average communication scores, and candidate leaderboard metrics.</p>
            </div>

            {/* KPI grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
              {[
                { label: 'Total Users', value: stats.totalUsers, icon: 'fa-users', color: '#3b82f6' },
                { label: 'Active Sessions', value: stats.totalInterviews, icon: 'fa-microphone', color: '#8b5cf6' },
                { label: 'Average Score', value: `${stats.avgScore || 78}%`, icon: 'fa-star', color: '#f59e0b' },
                { label: 'Ollama requests', value: stats.aiRequestsToday || 124, icon: 'fa-robot', color: '#10b981' }
              ].map((card, idx) => (
                <div key={idx} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${card.color}15`, color: card.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                    <i className={`fa-solid ${card.icon}`}></i>
                  </div>
                  <div>
                    <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>{card.label}</span>
                    <h3 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', margin: '2px 0 0 0' }}>{card.value}</h3>
                  </div>
                </div>
              ))}
            </div>

            {/* Live Traffic Monitor Sparkline Panel */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px', marginBottom: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', margin: 0 }}>
                  <i className="fa-solid fa-wave-square" style={{ color: '#3b82f6' }}></i> Live System API Request Traffic
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', color: '#ef4444' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }}></span>
                  <span>LIVE TRANSACTION RATE</span>
                </div>
              </div>
              
              <div style={{ width: '100%', height: '100px' }}>
                <svg viewBox="0 0 600 80" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                  {/* Grid lines */}
                  <line x1="0" y1="20" x2="600" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="0" y1="40" x2="600" y2="40" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="0" y1="60" x2="600" y2="60" stroke="#f1f5f9" strokeWidth="1" />
                  
                  {/* Smooth sparkline */}
                  <path
                    d={`M 0,${80 - (liveTraffic[0] || 40)} ` + liveTraffic.slice(1).map((val, idx) => `L ${(idx + 1) * 54},${80 - val}`).join(' ')}
                    fill="none"
                    stroke="url(#sparkline-gradient)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  
                  <defs>
                    <linearGradient id="sparkline-gradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="50%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                  </defs>

                  {/* Sparkline dots */}
                  {liveTraffic.map((val, idx) => (
                    <circle key={idx} cx={idx * 54} cy={80 - val} r="4" fill="#ffffff" stroke={idx === liveTraffic.length - 1 ? '#ec4899' : '#3b82f6'} strokeWidth="2" />
                  ))}
                </svg>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px' }}>
              {/* Leaderboard */}
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px' }}>
                  <i className="fa-solid fa-ranking-star" style={{ color: '#f59e0b', marginRight: '6px' }}></i> Top Candidate Leaderboard
                </h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', fontWeight: '700' }}>
                      <th style={{ padding: '10px' }}>Rank</th>
                      <th style={{ padding: '10px' }}>Name</th>
                      <th style={{ padding: '10px' }}>Job Target</th>
                      <th style={{ padding: '10px' }}>Technical</th>
                      <th style={{ padding: '10px' }}>Overall</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((cand, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '12px 10px', fontWeight: '700' }}>#{cand.rank}</td>
                        <td style={{ padding: '12px 10px', fontWeight: '600' }}>{cand.name}</td>
                        <td style={{ padding: '12px 10px' }}>{cand.role}</td>
                        <td style={{ padding: '12px 10px', color: 'var(--primary)', fontWeight: '700' }}>{cand.technical}%</td>
                        <td style={{ padding: '12px 10px', color: 'var(--success)', fontWeight: '700' }}>{cand.overall}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* AI metrics card */}
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px' }}>
                  <i className="fa-solid fa-chart-pie" style={{ color: '#3b82f6', marginRight: '6px' }}></i> AI Grading Performance Indices
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {[
                    { label: 'Technical Score average', val: 84, color: '#3b82f6' },
                    { label: 'Communication Speech average', val: 78, color: '#10b981' },
                    { label: 'Eye Contact tracking average', val: 92, color: '#ec4899' },
                    { label: 'Resume ATS score average', val: 68, color: '#f59e0b' }
                  ].map((metric, mIdx) => (
                    <div key={mIdx}>
                      <div className="flex-between" style={{ fontSize: '12.5px', marginBottom: '6px', fontWeight: '700' }}>
                        <span>{metric.label}</span>
                        <span>{metric.val}%</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${metric.val}%`, height: '100%', background: metric.color, borderRadius: '4px' }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* VIEW 2: USER MANAGEMENT */}
        {/* ========================================== */}
        {activeTab === 'users' && (
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '16px', flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800' }}>User Profiles</h3>
              <input
                type="text"
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                placeholder="Search users..."
                style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', minWidth: '240px', fontSize: '13px' }}
              />
            </div>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '13px', fontWeight: '700' }}>
                  <th style={{ padding: '10px' }}>ID</th>
                  <th style={{ padding: '10px' }}>Name</th>
                  <th style={{ padding: '10px' }}>Email</th>
                  <th style={{ padding: '10px' }}>Access System Role</th>
                  <th style={{ padding: '10px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id} style={{ borderBottom: '1px solid #e2e8f0', fontSize: '13.5px' }}>
                    <td style={{ padding: '12px 10px', color: '#64748b' }}>{user.id}</td>
                    <td style={{ padding: '12px 10px', fontWeight: '700' }}>{user.name}</td>
                    <td style={{ padding: '12px 10px' }}>{user.email}</td>
                    <td style={{ padding: '12px 10px' }}>
                      <span style={{ fontSize: '10px', fontWeight: '800', background: '#eff6ff', color: '#3b82f6', padding: '3px 8px', borderRadius: '6px' }}>{user.role}</span>
                    </td>
                    <td style={{ padding: '12px 10px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => handleOpenModal('editUser', user)} className="btn btn-secondary" style={{ padding: '3px 6px', fontSize: '12px' }}>Edit</button>
                        <button onClick={() => handleToggleUserStatus(user.id, 'active')} className="btn btn-secondary" style={{ padding: '3px 6px', fontSize: '12px' }}><i className="fa-solid fa-ban"></i></button>
                        <button onClick={() => handleDelete('user', user.id)} className="btn btn-secondary" style={{ padding: '3px 6px', fontSize: '12px', color: 'var(--error)' }}><i className="fa-solid fa-trash"></i></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ========================================== */}
        {/* VIEW 3: RESUME MANAGEMENT */}
        {/* ========================================== */}
        {activeTab === 'resume' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px' }}>
              <div className="flex-between" style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '800' }}>Candidate Resumes Log</h3>
                <input
                  type="text"
                  value={resumeSearch}
                  onChange={e => setResumeSearch(e.target.value)}
                  placeholder="Search resumes..."
                  style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontSize: '13px' }}
                />
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '13px', fontWeight: '700' }}>
                    <th style={{ padding: '10px' }}>Name</th>
                    <th style={{ padding: '10px' }}>Target Job</th>
                    <th style={{ padding: '10px' }}>ATS Score</th>
                    <th style={{ padding: '10px' }}>Extracted Skills</th>
                    <th style={{ padding: '10px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResumes.map(res => (
                    <tr key={res.id} style={{ borderBottom: '1px solid #e2e8f0', fontSize: '13.5px' }}>
                      <td style={{ padding: '12px 10px', fontWeight: '700' }}>{res.name}</td>
                      <td style={{ padding: '12px 10px' }}>{res.role_target}</td>
                      <td style={{ padding: '12px 10px' }}>
                        <span style={{ fontWeight: '800', color: '#3b82f6' }}>{res.experience ? '78/100' : '65/100'}</span>
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {String(res.skills || 'React,JS,CSS').split(',').map((sk, idx) => (
                            <span key={idx} style={{ background: '#f1f5f9', color: '#475569', fontSize: '10.5px', padding: '2px 5px', borderRadius: '4px' }}>{sk}</span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => setActiveDetailResume(res)} className="btn btn-secondary" style={{ padding: '3px 6px', fontSize: '12px' }}>View Analysis</button>
                          <button onClick={() => handleDelete('resume', res.id)} className="btn btn-secondary" style={{ padding: '3px 6px', fontSize: '12px', color: 'var(--error)' }}><i className="fa-solid fa-trash"></i></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {activeDetailResume && (
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px' }}>
                <div className="flex-between" style={{ marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '800' }}>Resume ATS Parsed details: {activeDetailResume.name}</h4>
                  <button onClick={() => setActiveDetailResume(null)} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '12px' }}>Close</button>
                </div>
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px' }}>
                  <h5 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '8px', color: '#3b82f6' }}>ATS Rating Checklist</h5>
                  <p style={{ fontSize: '13.5px', lineHeight: '1.5' }}>
                    <strong>Target Job Title match:</strong> {activeDetailResume.role_target} <br />
                    <strong>Quoted Skills Matched:</strong> {activeDetailResume.skills || 'None'} <br />
                    <strong>Missing Competencies:</strong> AWS Architect, Docker Containers, System Scale design controls.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================== */}
        {/* VIEW 4: INTERVIEWS & QUESTIONS */}
        {/* ========================================== */}
        {activeTab === 'interviews' && (
          <div>
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', marginBottom: '24px' }}>
              {[
                { id: 'sessions', label: 'Interview Sessions Logs' },
                { id: 'questions', label: 'Question Bank Pool' },
                { id: 'templates', label: 'Interview Templates (HR/Tech)' }
              ].map(sub => (
                <button
                  key={sub.id}
                  onClick={() => setContentSubTab(sub.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    borderBottom: contentSubTab === sub.id ? '2.5px solid var(--primary)' : '2.5px solid transparent',
                    color: contentSubTab === sub.id ? 'var(--primary)' : 'var(--text-muted)',
                    padding: '8px 14px',
                    fontSize: '13.5px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    borderRadius: '6px 6px 0 0'
                  }}
                >
                  {sub.label}
                </button>
              ))}
            </div>

            {/* Sub Tab: Sessions */}
            {contentSubTab === 'sessions' && (
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px' }}>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    value={interviewSearch}
                    onChange={e => setInterviewSearch(e.target.value)}
                    placeholder="Search candidate name..."
                    style={{ flexGrow: 1, padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}
                  />
                  <input
                    type="text"
                    value={filterCompany}
                    onChange={e => setFilterCompany(e.target.value)}
                    placeholder="Filter by company..."
                    style={{ padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}
                  />
                  <input
                    type="text"
                    value={filterRole}
                    onChange={e => setFilterRole(e.target.value)}
                    placeholder="Filter by role..."
                    style={{ padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}
                  />
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '13px', fontWeight: '700' }}>
                      <th style={{ padding: '10px' }}>Candidate Name</th>
                      <th style={{ padding: '10px' }}>Role</th>
                      <th style={{ padding: '10px' }}>Overall Score</th>
                      <th style={{ padding: '10px' }}>Technical</th>
                      <th style={{ padding: '10px' }}>Communication</th>
                      <th style={{ padding: '10px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSessions.map((s, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', fontSize: '13.5px' }}>
                        <td style={{ padding: '12px 10px', fontWeight: '700' }}>{s.username || 'Jane Doe'}</td>
                        <td style={{ padding: '12px 10px' }}>{s.role_target}</td>
                        <td style={{ padding: '12px 10px', fontWeight: '800' }}>{s.overall_score}%</td>
                        <td style={{ padding: '12px 10px', color: '#3b82f6' }}>{s.technical_score}%</td>
                        <td style={{ padding: '12px 10px', color: '#10b981' }}>{s.communication_score}%</td>
                        <td style={{ padding: '12px 10px' }}>
                          <button onClick={() => alert('Mock session audio files: No recording exists.')} className="btn btn-secondary" style={{ padding: '3px 6px', fontSize: '12px' }}>
                            <i className="fa-solid fa-play"></i> Record
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Sub Tab: Questions Pool */}
            {contentSubTab === 'questions' && (
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px' }}>
                <div className="flex-between" style={{ marginBottom: '20px', gap: '10px', flexWrap: 'wrap' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '800' }}>Questions Master List</h4>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <label style={{ cursor: 'pointer', padding: '6px 12px', background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px' }}>
                      <i className="fa-solid fa-file-import" style={{ marginRight: '6px' }}></i> Import CSV
                      <input type="file" accept=".csv" onChange={handleImportCSVQuestions} style={{ display: 'none' }} />
                    </label>
                    <button onClick={() => handleOpenModal('question')} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '13px' }}>Add Question</button>
                  </div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: '13px', fontWeight: '700' }}>
                      <th style={{ padding: '10px' }}>Type</th>
                      <th style={{ padding: '10px' }}>Question Text</th>
                      <th style={{ padding: '10px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredQuestions.map(q => (
                      <tr key={q.id} style={{ borderBottom: '1px solid #e2e8f0', fontSize: '13.5px' }}>
                        <td style={{ padding: '12px 10px' }}>
                          <span style={{ fontSize: '10px', fontWeight: '800', background: '#f1f5f9', padding: '3px 6px', borderRadius: '4px' }}>{q.type}</span>
                        </td>
                        <td style={{ padding: '12px 10px', fontWeight: '600' }}>{q.question}</td>
                        <td style={{ padding: '12px 10px' }}>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => handleOpenModal('question', q)} className="btn btn-secondary" style={{ padding: '3px 6px', fontSize: '12px' }}>Edit</button>
                            <button onClick={() => handleDelete('question', q.id)} className="btn btn-secondary" style={{ padding: '3px 6px', fontSize: '12px', color: 'var(--error)' }}><i className="fa-solid fa-trash"></i></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Sub Tab: Templates */}
            {contentSubTab === 'templates' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                {[
                  { name: 'HR Interview', role: 'Candidate Culture check', duration: '15 mins', total: 5 },
                  { name: 'React Interview', role: 'React Hooks, Virtual DOM, Scale', duration: '30 mins', total: 6 },
                  { name: 'Node.js Interview', role: 'Event Loop, Express, Streams', duration: '35 mins', total: 8 },
                  { name: 'Java Interview', role: 'Multithreading, Spring Boot, GC', duration: '40 mins', total: 8 },
                  { name: 'Python Interview', role: 'Data structures, NumPy, Pandas', duration: '30 mins', total: 6 },
                  { name: 'MERN Stack Interview', role: 'MongoDB, Express, React, Node', duration: '45 mins', total: 10 }
                ].map((temp, tIdx) => (
                  <div key={tIdx} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '20px', textAlign: 'center' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: '18px' }}>
                      <i className="fa-solid fa-book"></i>
                    </div>
                    <strong style={{ fontSize: '14.5px', color: '#0f172a', display: 'block', marginBottom: '4px' }}>{temp.name}</strong>
                    <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '12px' }}>{temp.role}</span>
                    <div className="flex-between" style={{ fontSize: '11px', fontWeight: '700', color: '#94a3b8' }}>
                      <span>Duration: {temp.duration}</span>
                      <span>{temp.total} Questions</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================== */}
        {/* VIEW 5: AI PROMPT CONFIG */}
        {/* ========================================== */}
        {activeTab === 'ai' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px' }}>
            
            {/* Prompts list */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px' }}>
              <div className="flex-between" style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '800' }}>AI Prompts</h3>
                <button onClick={() => handleOpenModal('prompt')} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '13px' }}>Add Template</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {prompts.map(p => (
                  <div key={p.id} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                    <div className="flex-between" style={{ marginBottom: '8px' }}>
                      <strong>{p.name}</strong>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => handleOpenModal('prompt', p)} className="btn btn-secondary" style={{ padding: '3px 6px', fontSize: '12px' }}>Edit</button>
                        <button onClick={() => handleDelete('prompt', p.id)} className="btn btn-secondary" style={{ padding: '3px 6px', fontSize: '12px', color: 'var(--error)' }}><i className="fa-solid fa-trash"></i></button>
                      </div>
                    </div>
                    <pre style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', fontSize: '12px', overflowX: 'auto', margin: 0 }}>{p.content}</pre>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Ollama and settings */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Ollama Monitor Widget */}
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px' }}>
                  <i className="fa-solid fa-heart-pulse" style={{ color: 'var(--success)', marginRight: '6px' }}></i> Ollama AI Daemon Monitor
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                  <div className="flex-between">
                    <span>AI Engine Status:</span>
                    <strong style={{ color: 'var(--success)' }}>ONLINE (Uptime: 24h)</strong>
                  </div>
                  <div className="flex-between">
                    <span>Loaded Model:</span>
                    <strong>Llama 3.2 3B</strong>
                  </div>
                  <div>
                    <div className="flex-between" style={{ marginBottom: '4px' }}>
                      <span>AI RAM Memory Usage:</span>
                      <strong>2.1 GB / 8.0 GB</strong>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: '#f1f5f9', borderRadius: '4px' }}>
                      <div style={{ width: '26%', height: '100%', background: '#3b82f6', borderRadius: '4px' }}></div>
                    </div>
                  </div>
                  <div className="flex-between">
                    <span>Average API Response time:</span>
                    <strong>280ms</strong>
                  </div>
                  <button onClick={handleRestartAI} className="btn btn-secondary" style={{ width: '100%', color: 'var(--error)', borderColor: 'var(--error)', padding: '8px' }}>
                    <i className="fa-solid fa-power-off" style={{ marginRight: '6px' }}></i> Restart Llama 3.2
                  </button>
                </div>
              </div>

              {/* Prompt Testing Simulator */}
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '14px' }}>AI Prompts Simulator</h3>
                <form onSubmit={handleTestPrompt} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <select
                    value={promptTestTemplate}
                    onChange={e => setPromptTestTemplate(e.target.value)}
                    style={{ padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}
                  >
                    <option value="">-- Select Template --</option>
                    <option value="Resume Evaluation">Resume Evaluator</option>
                    <option value="STAR Behavioral">STAR behavioral generator</option>
                  </select>
                  <input
                    type="text"
                    value={promptTestContext}
                    onChange={e => setPromptTestContext(e.target.value)}
                    placeholder="Candidate context details..."
                    style={{ padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}
                  />
                  <button type="submit" className="btn btn-secondary" style={{ padding: '8px' }}>Test Simulation</button>
                  {promptTestOutput && (
                    <pre style={{ background: '#020617', color: '#38bdf8', padding: '10px', borderRadius: '8px', fontSize: '11px', overflowY: 'auto', maxHeight: '120px' }}>{promptTestOutput}</pre>
                  )}
                </form>
              </div>

            </div>

          </div>
        )}

        {/* ========================================== */}
        {/* VIEW 6: COMPANIES */}
        {/* ========================================== */}
        {activeTab === 'companies' && (
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px' }}>
            <div className="flex-between" style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800' }}>Target Companies</h3>
              <button onClick={() => handleOpenModal('company')} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '13px' }}>Add Company</button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
              {companies.map(c => (
                <div key={c.id} style={{ border: '1px solid #e2e8f0', padding: '16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff' }}>
                  <strong style={{ fontSize: '14px', color: '#0f172a' }}>{c.name}</strong>
                  <i onClick={() => handleDelete('company', c.id)} className="fa-solid fa-trash-can" style={{ cursor: 'pointer', color: 'var(--error)' }}></i>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* VIEW 7: MASTER SKILLS */}
        {/* ========================================== */}
        {activeTab === 'skills' && (
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px' }}>
            <div className="flex-between" style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800' }}>Skills Matrix</h3>
              <button onClick={() => handleOpenModal('skill')} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '13px' }}>Add Skill</button>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {skills.map(sk => (
                <div key={sk.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af', padding: '6px 12px', borderRadius: '12px', fontSize: '13px', fontWeight: '700' }}>
                  <span>{sk.name}</span>
                  <i onClick={() => handleDelete('skill', sk.id)} className="fa-solid fa-xmark" style={{ cursor: 'pointer', color: 'var(--error)' }}></i>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* VIEW 8: ANALYTICS DASHBOARD */}
        {/* ========================================== */}
        {activeTab === 'analytics' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            
            {/* Native SVG area Line Chart: User Growth */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '20px' }}>User Registration Growth (Past 7 Days)</h3>
              <div style={{ width: '100%', height: '180px', position: 'relative' }}>
                <svg viewBox="0 0 500 150" style={{ width: '100%', height: '100%' }}>
                  {/* Grid lines */}
                  <line x1="0" y1="30" x2="500" y2="30" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="0" y1="70" x2="500" y2="70" stroke="#f1f5f9" strokeWidth="1" />
                  <line x1="0" y1="110" x2="500" y2="110" stroke="#f1f5f9" strokeWidth="1" />
                  
                  {/* Area gradient path */}
                  <path
                    d="M 10 130 Q 80 110 160 90 T 320 60 T 480 30 L 480 140 L 10 140 Z"
                    fill="url(#area-gradient)"
                    opacity="0.15"
                  />
                  
                  {/* Smooth Line path */}
                  <path
                    d="M 10 130 Q 80 110 160 90 T 320 60 T 480 30"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                  
                  <defs>
                    <linearGradient id="area-gradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  
                  {/* Data Points */}
                  <circle cx="10" cy="130" r="5" fill="#3b82f6" stroke="#ffffff" strokeWidth="1.5" />
                  <circle cx="160" cy="90" r="5" fill="#3b82f6" stroke="#ffffff" strokeWidth="1.5" />
                  <circle cx="320" cy="60" r="5" fill="#3b82f6" stroke="#ffffff" strokeWidth="1.5" />
                  <circle cx="480" cy="30" r="5" fill="#3b82f6" stroke="#ffffff" strokeWidth="1.5" />
                </svg>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '14px' }}>Popular Target Job Roles</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { label: 'React Developer', val: '42%' },
                    { label: 'Node.js Developer', val: '28%' },
                    { label: 'Java Spring Developer', val: '18%' },
                    { label: 'UI/UX Designer', val: '12%' }
                  ].map((role, idx) => (
                    <div key={idx} className="flex-between" style={{ fontSize: '13px', background: '#f8fafc', padding: '10px', borderRadius: '8px' }}>
                      <strong>{role.label}</strong>
                      <span style={{ color: '#3b82f6', fontWeight: '700' }}>{role.val}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '14px' }}>Interview Success & Pass Rates</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { label: 'Total Completed Mock Sessions', val: '94%' },
                    { label: 'Average technical score pass rate', val: '82%' },
                    { label: 'Webcam eye tracker calibration success', val: '89%' }
                  ].map((suc, idx) => (
                    <div key={idx} className="flex-between" style={{ fontSize: '13px', background: '#f8fafc', padding: '10px', borderRadius: '8px' }}>
                      <strong>{suc.label}</strong>
                      <span style={{ color: '#10b981', fontWeight: '700' }}>{suc.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ========================================== */}
        {/* VIEW 9: REPORTS HUB */}
        {/* ========================================== */}
        {activeTab === 'reports' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px' }}>
            
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '14px' }}>Export Compliance Audit Logs</h3>
              <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>Generate and download database summaries for compliance, backups, or offline reporting.</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button onClick={() => handleDownloadCSV('users')} className="btn btn-secondary" style={{ padding: '12px', fontSize: '13.5px', justifyContent: 'flex-start' }}>
                  <i className="fa-solid fa-file-csv" style={{ marginRight: '8px', color: '#10b981' }}></i> Export users list statement (CSV)
                </button>
                <button onClick={() => handleDownloadCSV('resumes')} className="btn btn-secondary" style={{ padding: '12px', fontSize: '13.5px', justifyContent: 'flex-start' }}>
                  <i className="fa-solid fa-file-csv" style={{ marginRight: '8px', color: '#10b981' }}></i> Export resumes database log (CSV)
                </button>
                <button onClick={() => handleDownloadCSV('sessions')} className="btn btn-secondary" style={{ padding: '12px', fontSize: '13.5px', justifyContent: 'flex-start' }}>
                  <i className="fa-solid fa-file-csv" style={{ marginRight: '8px', color: '#10b981' }}></i> Export mock interview sessions report (CSV)
                </button>
              </div>
            </div>

            {/* Billing Plans Management */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '14px' }}>Billing Membership Toggles</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {pricingPlans.map((plan, pIdx) => (
                  <div key={pIdx} className="flex-between" style={{ border: '1px solid #e2e8f0', padding: '12px', borderRadius: '12px', opacity: plan.active ? 1 : 0.6 }}>
                    <div>
                      <strong>{plan.name}</strong>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Sessions: {plan.sessions} / Month</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={plan.active}
                      onChange={() => {
                        const next = [...pricingPlans];
                        next[pIdx].active = !next[pIdx].active;
                        setPricingPlans(next);
                        showStatus('success', 'Plan billing updated.');
                      }}
                      style={{ cursor: 'pointer' }}
                    />
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ========================================== */}
        {/* VIEW 10: EMAIL TEMPLATES */}
        {/* ========================================== */}
        {activeTab === 'email-templates' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px' }}>
            
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '20px' }}>System Email Notifications</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {emailTemplates.map(temp => (
                  <div key={temp.id} style={{ border: '1px solid #e2e8f0', padding: '16px', borderRadius: '12px', background: '#ffffff' }}>
                    <strong style={{ fontSize: '14px', color: '#0f172a', display: 'block', marginBottom: '4px' }}>{temp.name}</strong>
                    <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '12px' }}>{temp.subject}</span>
                    <button onClick={() => setSelectedTemplateText(temp)} className="btn btn-secondary" style={{ width: '100%', padding: '6px' }}>Edit Template</button>
                  </div>
                ))}
              </div>
            </div>

            {selectedTemplateText && (
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px' }}>Edit: {selectedTemplateText.name}</h4>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  // Save template updates
                  showStatus('success', 'Email template updated successfully.');
                  setSelectedTemplateText(null);
                }} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label className="detail-label" style={{ display: 'block', marginBottom: '4px' }}>Subject Line</label>
                    <input
                      type="text"
                      value={selectedTemplateText.subject}
                      onChange={e => setSelectedTemplateText({ ...selectedTemplateText, subject: e.target.value })}
                      style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    />
                  </div>
                  <div>
                    <label className="detail-label" style={{ display: 'block', marginBottom: '4px' }}>HTML / Body Content</label>
                    <textarea
                      rows="6"
                      value={selectedTemplateText.body}
                      onChange={e => setSelectedTemplateText({ ...selectedTemplateText, body: e.target.value })}
                      style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="button" onClick={() => setSelectedTemplateText(null)} className="btn btn-secondary" style={{ padding: '8px' }}>Cancel</button>
                    <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px' }}>Save Template</button>
                  </div>
                </form>
              </div>
            )}

          </div>
        )}

        {/* ========================================== */}
        {/* VIEW 11: NOTIFICATIONS */}
        {/* ========================================== */}
        {activeTab === 'notifications' && (
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px', maxWidth: '600px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '16px' }}>Create Global System Broadcast</h3>
            
            <form onSubmit={handleSendBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="detail-label" style={{ display: 'block', marginBottom: '6px' }}>Broadcast Scope Audience</label>
                <select
                  value={broadcastTarget}
                  onChange={e => setBroadcastTarget(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                >
                  <option value="all">All Platform Users</option>
                  <option value="admins">Administrator Roles Only</option>
                  <option value="candidates">Standard Candidates</option>
                </select>
              </div>

              <div>
                <label className="detail-label" style={{ display: 'block', marginBottom: '6px' }}>Notice Title</label>
                <input
                  type="text"
                  value={broadcastTitle}
                  onChange={e => setBroadcastTitle(e.target.value)}
                  placeholder="e.g. Server Maintenance tonight"
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
              </div>

              <div>
                <label className="detail-label" style={{ display: 'block', marginBottom: '6px' }}>Notice Details</label>
                <textarea
                  rows="4"
                  value={broadcastMessage}
                  onChange={e => setBroadcastMessage(e.target.value)}
                  placeholder="The application will be offline for 10 minutes starting at midnight EST..."
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ padding: '10px' }}>Dispatch Notification Alert</button>
            </form>
          </div>
        )}

        {/* ========================================== */}
        {/* VIEW 12: FEEDBACK RESOLVE */}
        {/* ========================================== */}
        {activeTab === 'feedback' && (
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '20px' }}>Candidate Bug Reports & Feedbacks</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {feedbacks.map(fb => (
                <div key={fb.id} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', background: fb.is_resolved ? '#f8fafc' : '#fffbeb' }}>
                  <div className="flex-between" style={{ marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong>{fb.username || `User ID: ${fb.user_id}`}</strong>
                      <span style={{ fontSize: '10px', background: fb.is_resolved ? '#dcfce7' : '#fee2e2', color: fb.is_resolved ? '#166534' : '#991b1b', padding: '2px 6px', borderRadius: '4px', fontWeight: '800' }}>
                        {fb.is_resolved ? 'RESOLVED' : 'PENDING'}
                      </span>
                    </div>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>{new Date(fb.created_at).toLocaleDateString()}</span>
                  </div>
                  <p style={{ fontSize: '13.5px', margin: '0 0 10px 0', fontStyle: 'italic' }}>"{fb.message}"</p>
                  {fb.reply ? (
                    <div style={{ background: '#eff6ff', padding: '8px 12px', borderRadius: '8px', fontSize: '12.5px', borderLeft: '3.5px solid var(--primary)' }}>
                      <strong>Admin reply: </strong> {fb.reply}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleOpenModal('feedbackReply', fb)} className="btn btn-primary" style={{ padding: '3px 8px', fontSize: '12px' }}>Reply</button>
                      <button onClick={() => handleDelete('feedback', fb.id)} className="btn btn-secondary" style={{ padding: '3px 8px', fontSize: '12px', color: 'var(--error)' }}>Delete</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* VIEW 13: SYSTEM LOGS */}
        {/* ========================================== */}
        {activeTab === 'activity-logs' && (
          <div style={{ background: '#0f172a', borderRadius: '24px', padding: '24px', color: '#cbd5e1' }}>
            <div className="flex-between" style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', fontFamily: 'monospace' }}>system_activity_logs.log</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                {['ALL', 'EDIT', 'CREATE', 'DELETE'].map(cat => (
                  <button key={cat} onClick={() => setLogFilter(cat)} style={{ background: logFilter === cat ? '#334155' : 'transparent', border: '1px solid #334155', color: '#ffffff', padding: '4px 8px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer' }}>{cat}</button>
                ))}
              </div>
            </div>
            <div style={{ background: '#020617', padding: '16px', borderRadius: '12px', height: '300px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '12px' }}>
              {logs.filter(l => logFilter === 'ALL' ? true : l.action.includes(logFilter)).map((l, idx) => (
                <div key={idx} style={{ marginBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>[{new Date(l.created_at || new Date()).toISOString()}]</span>
                  <span style={{ color: '#38bdf8', marginLeft: '10px', fontWeight: 'bold' }}>{l.action}</span> - {l.details}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* VIEW 14: SECURITY MONITOR */}
        {/* ========================================== */}
        {activeTab === 'security' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '20px' }}>Security & Login Audits</h3>
              
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', fontWeight: '700' }}>
                    <th style={{ padding: '10px' }}>Event</th>
                    <th style={{ padding: '10px' }}>IP Address</th>
                    <th style={{ padding: '10px' }}>Username</th>
                    <th style={{ padding: '10px' }}>Details</th>
                    <th style={{ padding: '10px' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {securityLogs.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>Loading audits...</td>
                    </tr>
                  ) : securityLogs.map((log, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '12px 10px' }}>
                        <span style={{ fontSize: '10px', fontWeight: '800', padding: '3px 6px', borderRadius: '4px', background: log.event.includes('FAILED') ? '#fee2e2' : '#dcfce7', color: log.event.includes('FAILED') ? '#ef4444' : '#166534' }}>{log.event}</span>
                      </td>
                      <td style={{ padding: '12px 10px' }}>{log.ip_address}</td>
                      <td style={{ padding: '12px 10px', fontWeight: '600' }}>{log.username}</td>
                      <td style={{ padding: '12px 10px', color: '#64748b' }}>{log.details}</td>
                      <td style={{ padding: '12px 10px' }}>{new Date(log.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* VIEW 15: SYSTEM HEALTH */}
        {/* ========================================== */}
        {activeTab === 'system-health' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px' }}>
            
            {/* Health status gauges */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800' }}>System Resource Allocations</h3>
              
              <div>
                <div className="flex-between" style={{ fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>
                  <span>CPU Usage Load</span>
                  <span>{systemHealth.cpu}%</span>
                </div>
                <div style={{ width: '100%', height: '12px', background: '#f1f5f9', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{ width: `${systemHealth.cpu}%`, height: '100%', background: systemHealth.cpu > 70 ? 'var(--error)' : '#10b981', borderRadius: '6px' }}></div>
                </div>
              </div>

              <div>
                <div className="flex-between" style={{ fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>
                  <span>RAM Memory Usage</span>
                  <span>{systemHealth.ram}%</span>
                </div>
                <div style={{ width: '100%', height: '12px', background: '#f1f5f9', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{ width: `${systemHealth.ram}%`, height: '100%', background: '#3b82f6', borderRadius: '6px' }}></div>
                </div>
              </div>

              <div>
                <div className="flex-between" style={{ fontSize: '13px', fontWeight: '700', marginBottom: '6px' }}>
                  <span>Disk Storage Used</span>
                  <span>{systemHealth.disk}%</span>
                </div>
                <div style={{ width: '100%', height: '12px', background: '#f1f5f9', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{ width: `${systemHealth.disk}%`, height: '100%', background: '#8b5cf6', borderRadius: '6px' }}></div>
                </div>
              </div>
            </div>

            {/* Service checklist statuses */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800' }}>Active Gateways Statuses</h3>
              
              {[
                { label: 'Express Application server', val: systemHealth.serverStatus, status: 'Online' },
                { label: 'Database pools connections', val: systemHealth.databaseStatus, status: 'Connected' },
                { label: 'Ollama Llama 3.2 engine status', val: systemHealth.ollamaStatus, status: 'Active' },
                { label: 'API Security gateway check', val: systemHealth.apiGateway, status: 'Healthy' }
              ].map((serv, idx) => (
                <div key={idx} className="flex-between" style={{ border: '1px solid #e2e8f0', padding: '12px', borderRadius: '12px' }}>
                  <strong style={{ fontSize: '13px', color: '#475569' }}>{serv.label}</strong>
                  <span style={{ fontSize: '11px', fontWeight: '800', background: '#dcfce7', color: '#166534', padding: '3px 8px', borderRadius: '6px' }}>{serv.val}</span>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* ========================================== */}
        {/* VIEW 16: SETTINGS */}
        {/* ========================================== */}
        {activeTab === 'settings' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px' }}>
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '20px' }}>App Branding & Policy Settings</h3>
              
              <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label className="detail-label" style={{ display: 'block', marginBottom: '6px' }}>App Branding Title</label>
                  <input
                    type="text"
                    value={settings.app_name}
                    onChange={e => setSettings({ ...settings, app_name: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label className="detail-label" style={{ display: 'block', marginBottom: '6px' }}>Max Upload size limit (MB)</label>
                    <input
                      type="number"
                      value={settings.upload_limits_mb}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    />
                  </div>
                  <div>
                    <label className="detail-label" style={{ display: 'block', marginBottom: '6px' }}>Interview Duration (Mins)</label>
                    <input
                      type="number"
                      value={settings.max_interview_duration_mins}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', padding: '10px 20px' }}>Save Changes</button>
              </form>
            </div>

            {/* Backups restoration */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '800' }}>Backup database</h3>
              <p style={{ color: '#64748b', fontSize: '13.5px' }}>Compile a snapshot of active users mock records, or restore from a previously compiled script file.</p>
              
              <button onClick={handleBackup} className="btn btn-secondary" style={{ padding: '10.5px' }}>Backup database now</button>
              <button onClick={handleRestore} className="btn btn-secondary" style={{ padding: '10.5px' }}>Restore database snapshot</button>
            </div>
          </div>
        )}

      </main>

      {/* CRUD MODAL CONTAINER */}
      {modalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-card" style={{ background: '#ffffff', maxWidth: '500px', width: '100%', padding: '30px', borderRadius: '24px', border: '1px solid #e2e8f0', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex-between" style={{ marginBottom: '20px' }}>
              <h3 style={{ fontFamily: 'Outfit', fontWeight: '800', fontSize: '20px' }}>Configure details</h3>
              <i onClick={handleCloseModal} className="fa-solid fa-xmark" style={{ cursor: 'pointer', fontSize: '18px', color: '#64748b' }}></i>
            </div>

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {modalType === 'editUser' && (
                <>
                  <div>
                    <label className="detail-label" style={{ display: 'block', marginBottom: '4px' }}>Name</label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                      required
                    />
                  </div>
                  <div>
                    <label className="detail-label" style={{ display: 'block', marginBottom: '4px' }}>Email</label>
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                      required
                    />
                  </div>
                  <div>
                    <label className="detail-label" style={{ display: 'block', marginBottom: '4px' }}>Access Role</label>
                    <select
                      value={formData.role || 'candidate'}
                      onChange={e => setFormData({ ...formData, role: e.target.value })}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    >
                      <option value="super_admin">Super Admin</option>
                      <option value="admin">Admin</option>
                      <option value="content_manager">Content Manager</option>
                      <option value="candidate">Candidate</option>
                    </select>
                  </div>
                </>
              )}

              {modalType === 'jobRole' && (
                <>
                  <div>
                    <label className="detail-label" style={{ display: 'block', marginBottom: '4px' }}>Job Title</label>
                    <input
                      type="text"
                      value={formData.title || ''}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                      required
                    />
                  </div>
                  <div>
                    <label className="detail-label" style={{ display: 'block', marginBottom: '4px' }}>Category</label>
                    <input
                      type="text"
                      value={formData.category || ''}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                      required
                    />
                  </div>
                </>
              )}

              {modalType === 'company' && (
                <div>
                  <label className="detail-label" style={{ display: 'block', marginBottom: '4px' }}>Company Title</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    required
                  />
                </div>
              )}

              {modalType === 'prompt' && (
                <>
                  <div>
                    <label className="detail-label" style={{ display: 'block', marginBottom: '4px' }}>Prompt Title</label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                      required
                    />
                  </div>
                  <div>
                    <label className="detail-label" style={{ display: 'block', marginBottom: '4px' }}>System context instructions</label>
                    <textarea
                      rows="6"
                      value={formData.content || ''}
                      onChange={e => setFormData({ ...formData, content: e.target.value })}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontFamily: 'monospace' }}
                      required
                    />
                  </div>
                </>
              )}

              {modalType === 'question' && (
                <>
                  <div>
                    <label className="detail-label" style={{ display: 'block', marginBottom: '4px' }}>Practice Tag</label>
                    <select
                      value={formData.type || 'Technical'}
                      onChange={e => setFormData({ ...formData, type: e.target.value })}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    >
                      <option value="Technical">Technical</option>
                      <option value="Behavioral">Behavioral</option>
                      <option value="HR">HR</option>
                    </select>
                  </div>
                  <div>
                    <label className="detail-label" style={{ display: 'block', marginBottom: '4px' }}>Question Text</label>
                    <textarea
                      rows="3"
                      value={formData.question || ''}
                      onChange={e => setFormData({ ...formData, question: e.target.value })}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                      required
                    />
                  </div>
                </>
              )}

              {modalType === 'skill' && (
                <div>
                  <label className="detail-label" style={{ display: 'block', marginBottom: '4px' }}>Skill Title</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    required
                  />
                </div>
              )}

              {modalType === 'feedbackReply' && (
                <div>
                  <p style={{ fontStyle: 'italic', background: '#f8fafc', padding: '10px', borderRadius: '8px', fontSize: '13px' }}>"{formData.message}"</p>
                  <label className="detail-label" style={{ display: 'block', marginBottom: '6px' }}>Reply Message</label>
                  <textarea
                    rows="3"
                    value={formData.reply || ''}
                    onChange={e => setFormData({ ...formData, reply: e.target.value })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                    required
                  />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={handleCloseModal} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
