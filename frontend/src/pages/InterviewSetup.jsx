import React, { useState, useEffect, useRef } from 'react';

export default function InterviewSetup({ userProfile, onStartInterview, switchPage }) {
  const [jobRoles, setJobRoles] = useState([]);
  const [companies, setCompanies] = useState([]);
  
  const [selectedRole, setSelectedRole] = useState(userProfile.role || '');
  const [selectedType, setSelectedType] = useState('Technical');
  const [selectedCompany, setSelectedCompany] = useState('');
  
  // Hardware status
  const [stream, setStream] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState('idle'); // 'idle' | 'checking' | 'granted' | 'denied'
  const videoRef = useRef(null);
  
  const token = localStorage.getItem('coach_jwt_token');

  useEffect(() => {
    fetchJobRolesAndCompanies();
    return () => {
      stopCamera();
    };
  }, []);

  const fetchJobRolesAndCompanies = async () => {
    try {
      const rolesRes = await fetch('/api/admin/job-roles', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (rolesRes.ok) {
        const data = await rolesRes.json();
        setJobRoles(data);
      }

      const compRes = await fetch('/api/admin/companies', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (compRes.ok) {
        const data = await compRes.json();
        setCompanies(data);
      }
    } catch (e) {
      // Fallback arrays if database is in-memory fallback
      setJobRoles([
        { id: 1, title: 'React Developer', category: 'Engineering' },
        { id: 2, title: 'Node.js Developer', category: 'Engineering' },
        { id: 3, title: 'Laravel Developer', category: 'Engineering' },
        { id: 4, title: 'Java Developer', category: 'Engineering' },
        { id: 5, title: 'Python Developer', category: 'Engineering' },
        { id: 6, title: 'Data Analyst', category: 'Data' },
        { id: 7, title: 'UI/UX Designer', category: 'Design' }
      ]);
      setCompanies([
        { id: 1, name: 'Google' },
        { id: 2, name: 'Amazon' },
        { id: 3, name: 'Microsoft' },
        { id: 4, name: 'Meta' },
        { id: 5, name: 'Apple' },
        { id: 6, name: 'TCS' },
        { id: 7, name: 'Infosys' }
      ]);
    }
  };

  const handleTestHardware = async () => {
    setPermissionStatus('checking');
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(mediaStream);
      setPermissionStatus('granted');
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Camera permissions denied:', err);
      setPermissionStatus('denied');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleLaunch = async () => {
    stopCamera();
    
    // Custom tailor questions based on role, type, and company selections
    let generatedQuestions = [
      `Could you introduce yourself as a ${selectedRole} and walk me through your background?`,
      `How do you handle demanding technical challenges during project lifecycles?`,
      `Explain the core strategies you employ to optimize database caching in high-load setups.`
    ];

    if (selectedType === 'Behavioral') {
      generatedQuestions = [
        "Tell me about a time when you had to make a compromise to meet a deadline.",
        "How do you resolve feedback conflicts within cross-functional teams?",
        "Describe a major failure in a recent project and what lessons you learned."
      ];
    } else if (selectedType === 'HR') {
      generatedQuestions = [
        "Why do you want to join our organization?",
        "What are your salary expectations and career goals for the next three years?",
        "How do you handle stress and manage tight deliverables?"
      ];
    }

    if (selectedCompany) {
      generatedQuestions.push(`Why are you interested in joining ${selectedCompany} specifically?`);
    }

    onStartInterview(generatedQuestions);
  };

  return (
    <div className="page" style={{ padding: '30px', maxWidth: '800px', margin: '0 auto', fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontFamily: 'Outfit', fontSize: '30px', fontWeight: '800', color: 'var(--text-main)' }}>
          Interview Session Configuration
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14.5px', marginTop: '4px' }}>
          Select target job configurations, mock category templates, and test webcam hardware.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px', alignItems: 'start' }}>
        
        {/* Left Side: Selections */}
        <div className="glass-card" style={{ padding: '24px', borderRadius: '24px', background: '#ffffff', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div>
            <label className="detail-label" style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontWeight: '700' }}>
              Target Job Role
            </label>
            <select
              value={selectedRole}
              onChange={e => setSelectedRole(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', outline: 'none', background: '#ffffff', fontSize: '14px' }}
            >
              <option value="">-- Choose Job Role --</option>
              {jobRoles.map(role => (
                <option key={role.id} value={role.title}>{role.title}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="detail-label" style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontWeight: '700' }}>
              Interview Mock Category
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {['Technical', 'Behavioral', 'HR', 'Company Specific'].map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedType(type)}
                  style={{
                    padding: '10px',
                    borderRadius: '10px',
                    border: selectedType === type ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                    background: selectedType === type ? 'var(--primary-glow)' : 'transparent',
                    color: selectedType === type ? 'var(--primary)' : 'var(--text-muted)',
                    fontSize: '13px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {selectedType === 'Company Specific' && (
            <div>
              <label className="detail-label" style={{ display: 'block', marginBottom: '8px', color: 'var(--text-muted)', fontWeight: '700' }}>
                Select Target Corporate Set
              </label>
              <select
                value={selectedCompany}
                onChange={e => setSelectedCompany(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', outline: 'none', background: '#ffffff', fontSize: '14px' }}
              >
                <option value="">-- Choose Company --</option>
                {companies.map(comp => (
                  <option key={comp.id} value={comp.name}>{comp.name}</option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
            <button onClick={() => switchPage('dashboard')} className="btn btn-secondary" style={{ flexGrow: 1, padding: '12px' }}>
              Cancel
            </button>
            <button 
              onClick={handleLaunch} 
              disabled={permissionStatus !== 'granted' || !selectedRole} 
              className="btn btn-primary" 
              style={{ flexGrow: 2, padding: '12px', opacity: (permissionStatus !== 'granted' || !selectedRole) ? 0.6 : 1 }}
            >
              Launch Practice Room <i className="fa-solid fa-arrow-right" style={{ marginLeft: '6px' }}></i>
            </button>
          </div>

        </div>

        {/* Right Side: Camera Permissions and Settings Check */}
        <div className="glass-card" style={{ padding: '24px', borderRadius: '24px', background: '#ffffff', border: '1px solid var(--border-color)', textAlign: 'center' }}>
          <h4 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <i className="fa-solid fa-video-slash" style={{ color: 'var(--primary)' }}></i> Hardware Verification
          </h4>
          
          <div style={{ width: '100%', height: '180px', background: '#0f172a', borderRadius: '16px', overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            {permissionStatus === 'granted' ? (
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            ) : (
              <div style={{ color: '#94a3b8', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                <i className="fa-solid fa-camera" style={{ fontSize: '28px' }}></i>
                <span>Webcam feed is currently inactive.</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button 
              onClick={handleTestHardware} 
              className="btn btn-secondary" 
              style={{ width: '100%', padding: '10px', background: permissionStatus === 'granted' ? '#f0fdf4' : 'transparent', color: permissionStatus === 'granted' ? 'var(--success)' : 'var(--text-main)', borderColor: permissionStatus === 'granted' ? 'var(--success)' : 'var(--border-color)' }}
            >
              {permissionStatus === 'granted' ? (
                <span><i className="fa-solid fa-check-circle" style={{ marginRight: '6px' }}></i> Permissions Verified</span>
              ) : permissionStatus === 'checking' ? (
                <span><i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '6px' }}></i> Checking connections...</span>
              ) : (
                <span>Test Camera & Mic</span>
              )}
            </button>
            <p style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
              Note: Webcam permissions are required to grade metrics like eye alignment during live sessions.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
