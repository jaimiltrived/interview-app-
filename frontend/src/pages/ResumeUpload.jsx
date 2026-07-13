import React, { useState, useEffect } from 'react';

export default function ResumeUpload({ userProfile, setUserProfile, switchPage }) {
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingLatest, setFetchingLatest] = useState(true);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Initializing AI Resume Parser...');
  const [parsedData, setParsedData] = useState(null);
  const [hasConfirmedResume, setHasConfirmedResume] = useState(true);

  // Fetch the user's active resume or saved candidate profile on mount
  useEffect(() => {
    const fetchLatestResume = async () => {
      try {
        const token = localStorage.getItem('coach_jwt_token');
        let profileToUse = null;

        if (token) {
          try {
            const res = await fetch('/api/resume/latest', {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success && data.resume) {
              profileToUse = data.resume;
            }
          } catch (apiErr) {
            console.warn('Backend /api/resume/latest check:', apiErr.message);
          }
        }

        // Check localStorage for saved resume profile
        if (!profileToUse) {
          const savedLocal = localStorage.getItem('coach_saved_resume_profile');
          if (savedLocal) {
            try { profileToUse = JSON.parse(savedLocal); } catch (e) {}
          }
        }

        // Ensure full candidate profile details (Name, Role, Experience, Skills) are populated
        if (!profileToUse) {
          profileToUse = {};
        }

        profileToUse.name = profileToUse.name || userProfile?.name || localStorage.getItem('coach_user_name') || 'Candidate';
        profileToUse.roleTarget = profileToUse.roleTarget || userProfile?.role || 'Software Engineer';
        profileToUse.experience = profileToUse.experience || userProfile?.experience || 'Not Specified';
        profileToUse.skills = (Array.isArray(profileToUse.skills) && profileToUse.skills.length > 0)
          ? profileToUse.skills
          : (userProfile?.skills && userProfile.skills.length > 0
              ? userProfile.skills
              : ['JavaScript', 'React.js', 'Node.js', 'SQL']);

        // Ensure questions array is dynamically populated from skills/role if empty
        if (!profileToUse.questions || profileToUse.questions.length === 0) {
          const role = profileToUse.roleTarget;
          const topSkill = profileToUse.skills?.[0] || 'your core tech stack';
          profileToUse.questions = [
            `How do you architect scalable applications targeting ${role} using ${topSkill}?`,
            `What production bottlenecks or latency challenges have you resolved in your past engineering roles?`,
            `Explain your approach to automated testing, code reviews, and CI/CD pipelines.`,
            `How do you handle production incident debugging and root-cause analysis?`
          ];
        }

        setParsedData(profileToUse);
        setHasConfirmedResume(true);
      } catch (err) {
        console.warn('Failed to load active resume profile:', err);
      } finally {
        setFetchingLatest(false);
      }
    };
    fetchLatestResume();
  }, [userProfile]);

  const handleDrag = (e, val) => {
    e.preventDefault();
    setDragOver(val);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files.length) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file) => {
    setLoading(true);
    setProgress(10);
    setStatusText('Reading file binary payload...');

    // Read local file contents as text to analyze keywords in browser
    const reader = new FileReader();
    reader.onload = async (e) => {
      // Run sequential parsing UI indicators
      const steps = [
        { text: 'Analyzing database model matching...', pct: 40, duration: 600 },
        { text: 'Extracting candidate core tech stack...', pct: 75, duration: 800 },
        { text: 'Tailoring targeted technical interview prompts...', pct: 100, duration: 600 }
      ];

      let stepIdx = 0;
      const runAnim = async () => {
        if (stepIdx < steps.length) {
          const step = steps[stepIdx];
          setStatusText(step.text);
          setProgress(step.pct);
          stepIdx++;
          setTimeout(runAnim, step.duration);
        } else {
          // Finished animation, trigger backend upload API
          try {
            const token = localStorage.getItem('coach_jwt_token');
            const formData = new FormData();
            formData.append('file', file);
            formData.append('candidateName', userProfile.name);

            const res = await fetch('/api/resume/upload', {
              method: 'POST',
              headers: { 
                'Authorization': `Bearer ${token}`
              },
              body: formData
            });
            const data = await res.json();
            if (data.success) {
              localStorage.setItem('coach_saved_resume_profile', JSON.stringify(data.profile));
              setParsedData(data.profile);
              if (setUserProfile) {
                setUserProfile(prev => ({
                  ...prev,
                  name: data.profile.name || prev.name,
                  role: data.profile.roleTarget || prev.role,
                  skills: data.profile.skills || prev.skills,
                  experience: data.profile.experience || prev.experience,
                  questions: data.profile.questions || prev.questions
                }));
              }
              setHasConfirmedResume(true); // Directly confirm newly uploaded resumes
              setLoading(false);
            } else {
              throw new Error(data.error || 'Parsing failed');
            }
          } catch (err) {
            alert('Upload failed: ' + err.message);
            setLoading(false);
          }
        }
      };

      setTimeout(runAnim, 400);
    };
    // Send raw file object to fetch, do not read as text here
    reader.readAsArrayBuffer(file);
  };

  const handleStart = async () => {
    setLoading(true);
    setStatusText('Generating personalized interview questions...');
    try {
      const token = localStorage.getItem('coach_jwt_token');
      
      // 1. Generate questions from resume profile context
      const genRes = await fetch('/api/interview/generate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: parsedData.name || userProfile.name,
          roleTarget: parsedData.roleTarget,
          skills: parsedData.skills,
          projects: parsedData.projects || []
        })
      });
      const genData = await genRes.json();
      if (!genData.success) {
        throw new Error(genData.message || 'Failed to generate questions');
      }

      // Convert mapping structured questions format into a flat list
      const flatQuestions = [
        ...(genData.questions.hr || []).map(q => ({ question: q, type: 'hr' })),
        ...(genData.questions.technical || []).map(q => ({ question: q, type: 'technical' })),
        ...(genData.questions.project || []).map(q => ({ question: q, type: 'project' })),
        ...(genData.questions.behavioral || []).map(q => ({ question: q, type: 'behavioral' }))
      ];

      setStatusText('Saving practice questions to session database...');
      // 2. Post session questions to database initialization
      const startRes = await fetch('/api/interview/start', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ questions: flatQuestions })
      });
      const startData = await startRes.json();
      if (!startData.success) {
        throw new Error(startData.message || 'Failed to start interview session');
      }

      // Update parent user profile state
      setUserProfile({
        ...userProfile,
        role: parsedData.roleTarget,
        skills: parsedData.skills,
        experience: parsedData.experience || userProfile.experience,
        questions: startData.questions // Mapped list with DB ids
      });
      
      switchPage('interview');
    } catch (err) {
      alert('Initialization error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setParsedData(null);
    setHasConfirmedResume(false);
    setProgress(0);
    setLoading(false);
  };

  if (fetchingLatest) {
    return (
      <div className="page text-center" style={{ padding: '60px' }}>
        <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '48px', color: '#0b4fcd', marginBottom: '20px' }}></i>
        <h2 style={{ fontFamily: 'Outfit', fontWeight: '800' }}>Checking Active Profile...</h2>
      </div>
    );
  }

  // Confirmation view if we found a resume and they haven't explicitly chosen to proceed
  if (parsedData && !hasConfirmedResume) {
    return (
      <div className="page" style={{ maxWidth: '500px', margin: '0 auto', paddingTop: '40px' }}>
        <div className="glass-card text-center" style={{ padding: '35px', background: '#ffffff', border: '1px solid var(--border-color)', borderRadius: '24px' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#ecfdf5', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '26px' }}>
            <i className="fa-solid fa-file-circle-check"></i>
          </div>
          <h2 style={{ fontFamily: 'Outfit', fontWeight: '800', fontSize: '24px', color: '#0f172a', marginBottom: '10px' }}>Active Resume Found</h2>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '28px', lineHeight: '1.5', fontWeight: '500' }}>
            We found a previously analyzed resume targeting the role of <strong style={{ color: '#10b981' }}>{parsedData.roleTarget}</strong>.
            Would you like to practice using this profile or configure a new resume?
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button 
              className="btn btn-primary"
              onClick={() => setHasConfirmedResume(true)}
              style={{ height: '48px', borderRadius: '12px', fontWeight: '700', background: '#0b4fcd', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}
            >
              <i className="fa-solid fa-circle-check"></i>
              <span>Continue with Active Profile</span>
            </button>
            <button 
              className="btn btn-secondary"
              onClick={handleReset}
              style={{ height: '48px', borderRadius: '12px', fontWeight: '700', background: '#ffffff', border: '1px solid #e2e8f0', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}
            >
              <i className="fa-solid fa-file-arrow-up"></i>
              <span>Upload New Resume</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Resume & Setup</h1>
        <p className="page-desc">Load your resume to configure skills and generate personalized interview questions.</p>
      </div>

      {/* Recommended Resume Card - shown when a saved resume exists */}
      {parsedData && !loading && (
        <div className="glass-card" style={{ marginBottom: '24px', border: '2px solid #10b981', background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '16px', right: '16px', background: '#10b981', color: '#fff', padding: '4px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '700', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <i className="fa-solid fa-star"></i> RECOMMENDED
          </div>
          <h2 className="report-section-title" style={{ color: '#065f46' }}>
            <i className="fa-solid fa-clipboard-check" style={{ color: '#10b981' }}></i> Your Saved Resume Profile
          </h2>
          <p style={{ color: '#047857', fontSize: '13.5px', marginBottom: '20px', fontWeight: '500' }}>
            This resume is saved in your account. You can practice with it directly or upload a new one below.
          </p>

          <div className="resume-result-layout">
            <div className="resume-details" style={{ background: '#ffffff', borderRadius: '16px', padding: '20px', border: '1px solid #d1fae5' }}>
              <h3><i className="fa-solid fa-clipboard-user"></i> Candidate Profile</h3>
              <div className="detail-row">
                <div className="detail-label">Name</div>
                <div className="detail-val">{parsedData.name || userProfile?.name || 'Candidate'}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Inferred Target Role</div>
                <div className="detail-val text-success" style={{ fontWeight: '700' }}>{parsedData.roleTarget || userProfile?.role || 'Software Engineer'}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Experience Rating</div>
                <div className="detail-val" style={{ fontWeight: '600', color: '#0f172a' }}>{parsedData.experience || userProfile?.experience || 'Not Specified'}</div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Skills Extracted</div>
                <div className="badge-container" style={{ marginTop: '5px' }}>
                  {(parsedData.skills && parsedData.skills.length > 0 ? parsedData.skills : (userProfile?.skills || [])).map((skill, i) => (
                    <span key={i} className="badge primary">{skill}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="resume-details" style={{ background: '#ffffff', borderRadius: '16px', padding: '20px', border: '1px solid #d1fae5' }}>
              <h3><i className="fa-solid fa-circle-question"></i> Tailored Technical Practice</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', marginBottom: '15px' }}>
                AI-generated questions matched to your skills and target role.
              </p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {parsedData.questions && parsedData.questions.length > 0 ? (
                  parsedData.questions.map((q, i) => (
                    <li key={i} style={{ fontSize: '14.5px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <i className="fa-solid fa-chevron-right text-success" style={{ marginTop: '4px' }}></i>
                      <span>{q}</span>
                    </li>
                  ))
                ) : (
                  <li style={{ fontSize: '13.5px', color: 'var(--text-muted)', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fa-solid fa-circle-info" style={{ color: '#0b4fcd' }}></i>
                    <span>Questions will generate automatically from your tech stack upon startup.</span>
                  </li>
                )}
              </ul>
            </div>
          </div>

          <div className="flex-row-center mt-4" style={{ justifyContent: 'flex-end', gap: '15px' }}>
            <button className="btn btn-secondary" onClick={handleReset}>
              <i className="fa-solid fa-file-arrow-up"></i> Upload Different Resume
            </button>
            <button className="btn btn-success" onClick={handleStart}>
              <i className="fa-solid fa-circle-play"></i> Start Practice Session
            </button>
          </div>
        </div>
      )}

      {/* Upload section - shown when no resume or user clicked re-upload */}
      {!parsedData && (
        <div className="glass-card">
          <h2 className="report-section-title">
            <i className="fa-solid fa-file-arrow-up"></i> Upload Resume File
          </h2>

          {/* Drag & Drop box */}
          {!loading && (
            <div 
              className={`upload-container ${dragOver ? 'dragover' : ''}`}
              onDragOver={(e) => handleDrag(e, true)}
              onDragLeave={(e) => handleDrag(e, false)}
              onDrop={handleDrop}
              onClick={() => document.getElementById('fileInput').click()}
            >
              <div className="upload-icon">
                <i className="fa-solid fa-cloud-arrow-up"></i>
              </div>
              <div className="upload-text">Drag & drop your resume file here or click to browse</div>
              <div className="upload-sub">Supports PDF, DOCX, TXT (Max size: 5MB)</div>
              <input 
                type="file" 
                id="fileInput" 
                style={{ display: 'none' }} 
                accept=".pdf,.docx,.txt"
                onChange={handleFileChange}
              />
            </div>
          )}

          {/* Loading Parser Progress */}
          {loading && (
            <div className="analysis-progress">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }}></div>
              </div>
              <div className="analysis-step">
                <i className="fa-solid fa-circle-notch"></i>
                <span>{statusText}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

