import React, { useState } from 'react';

export default function ResumeUpload({ userProfile, setUserProfile, switchPage }) {
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Initializing AI Resume Parser...');
  const [parsedData, setParsedData] = useState(null);

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
      const fileText = e.target.result || '';

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
            const res = await fetch('/api/resume/upload', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                fileName: file.name,
                fileContent: fileText,
                candidateName: userProfile.name
              })
            });
            const data = await res.json();
            if (data.success) {
              setParsedData(data.profile);
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
    reader.readAsText(file);
  };

  const handleStart = () => {
    // Update parent user profile state
    setUserProfile({
      ...userProfile,
      role: parsedData.roleTarget,
      skills: parsedData.skills,
      experience: parsedData.experience,
      questions: parsedData.questions
    });
    switchPage('interview');
  };

  const handleReset = () => {
    setParsedData(null);
    setProgress(0);
    setLoading(false);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Resume Parsing & Setup</h1>
        <p className="page-desc">Load your resume to automatically configure skills and generate personalized interview questions.</p>
      </div>

      <div className="glass-card">
        <h2 className="report-section-title">
          <i className="fa-solid fa-file-arrow-up"></i> Upload Resume File
        </h2>

        {/* 1. Drag & Drop box */}
        {!loading && !parsedData && (
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

        {/* 2. Loading Parser Progress */}
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

        {/* 3. Output results */}
        {parsedData && (
          <div>
            <div className="resume-result-layout">
              <div className="resume-details">
                <h3><i className="fa-solid fa-clipboard-user"></i> Extracted Candidate Profile</h3>
                <div className="detail-row">
                  <div className="detail-label">Name</div>
                  <div className="detail-val">{parsedData.name}</div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">Inferred Target Role</div>
                  <div className="detail-val text-success">{parsedData.roleTarget}</div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">Experience Rating</div>
                  <div className="detail-val">{parsedData.experience}</div>
                </div>
                <div className="detail-row">
                  <div className="detail-label">Skills Extracted</div>
                  <div className="badge-container" style={{ marginTop: '5px' }}>
                    {parsedData.skills.map((skill, i) => (
                      <span key={i} className="badge primary">{skill}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="resume-details">
                <h3><i className="fa-solid fa-circle-question"></i> Tailored Technical Questions</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', marginBottom: '15px' }}>
                  The AI interviewer will ask you these customized questions to evaluate your competency:
                </p>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {parsedData.questions.map((q, i) => (
                    <li key={i} style={{ fontSize: '14.5px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <i className="fa-solid fa-chevron-right text-success" style={{ marginTop: '4px' }}></i>
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex-row-center mt-4" style={{ justifyContent: 'flex-end', gap: '15px' }}>
              <button className="btn btn-secondary" onClick={handleReset}>
                <i className="fa-solid fa-rotate-left"></i> Re-Upload
              </button>
              <button className="btn btn-success" onClick={handleStart}>
                <i className="fa-solid fa-circle-play"></i> Start Interview
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
