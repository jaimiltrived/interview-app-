import React, { useState, useEffect } from 'react';

export default function Profile({ userProfile, setUserProfile, onLogout }) {
  const [name, setName] = useState(userProfile.name || '');
  const [email, setEmail] = useState(userProfile.email || '');
  const [role, setRole] = useState(userProfile.role || '');
  const [experience, setExperience] = useState(userProfile.experience || '');
  
  // Local state for skill tags management
  const [newSkill, setNewSkill] = useState('');
  const [skills, setSkills] = useState(userProfile.skills || []);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Resume upload details
  const [resumeFile, setResumeFile] = useState(null);
  const [currentResume, setCurrentResume] = useState(null);
  const [resumeUploadLoading, setResumeUploadLoading] = useState(false);

  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem('coach_jwt_token');

  // Initials for avatar fallback
  const initials = name
    ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const avatarUrl = userProfile.photoUrl || (name === 'Sarah'
    ? 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200'
    : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200');

  // Load the latest uploaded resume as default on mount
  useEffect(() => {
    const fetchLatestResume = async () => {
      try {
        const res = await fetch('/api/resume/latest', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.resume) {
          setCurrentResume(data.resume);
        }
      } catch (err) {
        console.warn('Could not load latest resume in profile:', err.message);
      }
    };
    if (token) fetchLatestResume();
  }, [token]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg('');
    setErrorMsg('');

    try {
      const res = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, email })
      });
      const data = await res.json();
      if (res.ok) {
        setUserProfile(prev => ({ ...prev, name, email }));
        setStatusMsg('Profile details updated successfully!');
      } else {
        throw new Error(data.error || 'Failed to update profile');
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadPhoto = async () => {
    setLoading(true);
    setStatusMsg('');
    setErrorMsg('');
    try {
      const res = await fetch('/api/profile/upload-photo', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setUserProfile(prev => ({ ...prev, photoUrl: data.photoUrl }));
        setStatusMsg('Profile photo updated successfully!');
      } else {
        throw new Error(data.error || 'Failed to upload photo');
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePhoto = async () => {
    setLoading(true);
    setStatusMsg('');
    setErrorMsg('');
    try {
      const res = await fetch('/api/profile/delete-photo', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setUserProfile(prev => ({ ...prev, photoUrl: null }));
        setStatusMsg('Profile photo removed.');
      } else {
        throw new Error(data.error || 'Failed to remove photo');
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResumeUpload = async (e) => {
    e.preventDefault();
    if (!resumeFile) return;
    setResumeUploadLoading(true);
    setStatusMsg('');
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('file', resumeFile);
      formData.append('candidateName', name);

      const res = await fetch('/api/resume/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg('Default resume uploaded and parsed successfully!');
        setCurrentResume(data.profile);
        
        // Dynamically update the user state properties
        setRole(data.profile.roleTarget || role);
        setSkills(data.profile.skills || []);
        setExperience(data.profile.experience || experience);
        setUserProfile(prev => ({
          ...prev,
          role: data.profile.roleTarget || prev.role,
          skills: data.profile.skills || prev.skills,
          experience: data.profile.experience || prev.experience,
          questions: data.profile.questions || prev.questions
        }));
        setResumeFile(null);
        const fileInput = document.getElementById('profile-resume-input');
        if (fileInput) fileInput.value = '';
      } else {
        throw new Error(data.error || 'Parsing failed');
      }
    } catch (err) {
      setErrorMsg('Resume upload failed: ' + err.message);
    } finally {
      setResumeUploadLoading(false);
    }
  };

  const handleAddSkill = async (e) => {
    e.preventDefault();
    if (!newSkill.trim()) return;
    const updatedSkills = [...skills, newSkill.trim()];
    setSkills(updatedSkills);
    setNewSkill('');
    await saveSkills(updatedSkills);
  };

  const handleRemoveSkill = async (skillToRemove) => {
    const updatedSkills = skills.filter(s => s !== skillToRemove);
    setSkills(updatedSkills);
    await saveSkills(updatedSkills);
  };

  const saveSkills = async (updatedSkills) => {
    setStatusMsg('');
    setErrorMsg('');
    try {
      const res = await fetch('/api/profile/update-skills', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ skills: updatedSkills })
      });
      if (res.ok) {
        setUserProfile(prev => ({ ...prev, skills: updatedSkills }));
        setStatusMsg('Skills list updated successfully!');
      }
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    setLoading(true);
    setStatusMsg('');
    setErrorMsg('');
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg('Password changed successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        throw new Error(data.error || 'Failed to change password');
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('WARNING: Are you absolutely sure you want to permanently delete your account? This action cannot be undone.')) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/profile/delete-account', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        alert('Your account has been deleted.');
        onLogout();
      }
    } catch (err) {
      alert('Failed to delete account: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-light-theme" style={{ maxWidth: '900px', margin: '0 auto' }}>
      
      {/* Title Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1 className="page-title">User Profile</h1>
        <p className="page-desc">Manage your account details, personal credentials, skills focus, and preferences.</p>
      </div>

      {statusMsg && (
        <div style={{ padding: '12px 20px', background: '#ecfdf3', color: '#027a48', borderRadius: '12px', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="fa-solid fa-circle-check"></i> {statusMsg}
        </div>
      )}

      {errorMsg && (
        <div style={{ padding: '12px 20px', background: '#fef2f2', color: '#ef4444', borderRadius: '12px', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="fa-solid fa-circle-xmark"></i> {errorMsg}
        </div>
      )}

      {/* Profile Card Header (Avatar photo & general roles info) */}
      <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative' }}>
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt="Avatar" 
              style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #0b4fcd' }}
            />
          ) : (
            <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(135deg, #0b4fcd, #6366f1)', color: 'white', display: 'flex', alignItems: 'center', justify: 'center', fontSize: '32px', fontWeight: '800' }}>
              {initials}
            </div>
          )}
        </div>
        <div style={{ flexGrow: 1 }}>
          <h2 style={{ margin: '0 0 6px 0', fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>{name}</h2>
          <div style={{ color: '#0b4fcd', fontWeight: '700', fontSize: '14px', marginBottom: '4px' }}>
            <i className="fa-solid fa-briefcase"></i> {role || 'Software Engineer'}
          </div>
          <div style={{ color: '#64748b', fontSize: '13px', fontWeight: '500' }}>
            <i className="fa-solid fa-envelope"></i> {email}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-primary" onClick={handleUploadPhoto} disabled={loading} style={{ padding: '8px 16px', fontSize: '13px' }}>
            <i className="fa-solid fa-camera"></i> Change Photo
          </button>
          <button className="btn btn-secondary" onClick={handleDeletePhoto} disabled={loading} style={{ padding: '8px 16px', fontSize: '13px' }}>
            Remove
          </button>
        </div>
      </div>

      <div className="card-grid" style={{ gridTemplateColumns: '1.2fr 0.8fr', gap: '30px', alignItems: 'start' }}>
        
        {/* Left Hand Card Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Card 1: Account Details */}
          <div className="glass-card">
            <h3 style={{ fontSize: '18px', fontWeight: '800', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '20px' }}>
              <i className="fa-solid fa-user" style={{ color: '#0b4fcd', marginRight: '8px' }}></i> Personal Details
            </h3>
            
            <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '6px' }}>Full Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  required
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '14px', background: '#f8fafc', color: '#0f172a' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '6px' }}>Email Address</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  required
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '14px', background: '#f8fafc', color: '#0f172a' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '6px' }}>Target Role</label>
                  <input 
                    type="text" 
                    value={role} 
                    onChange={e => setRole(e.target.value)}
                    placeholder="e.g. Frontend Developer"
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '14px', background: '#f8fafc', color: '#0f172a' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '6px' }}>Experience</label>
                  <input 
                    type="text" 
                    value={experience} 
                    onChange={e => setExperience(e.target.value)}
                    placeholder="e.g. 3-4 Years"
                    style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '14px', background: '#f8fafc', color: '#0f172a' }}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading} style={{ alignSelf: 'flex-start', padding: '10px 24px', fontSize: '14px' }}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>

          {/* Card 2: Change Password */}
          <div className="glass-card">
            <h3 style={{ fontSize: '18px', fontWeight: '800', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '20px' }}>
              <i className="fa-solid fa-lock" style={{ color: '#0b4fcd', marginRight: '8px' }}></i> Change Password
            </h3>
            
            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '6px' }}>Current Password</label>
                <input 
                  type="password" 
                  value={currentPassword} 
                  onChange={e => setCurrentPassword(e.target.value)} 
                  required
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '14px', background: '#f8fafc', color: '#0f172a' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '6px' }}>New Password</label>
                <input 
                  type="password" 
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)} 
                  required
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '14px', background: '#f8fafc', color: '#0f172a' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '6px' }}>Confirm New Password</label>
                <input 
                  type="password" 
                  value={confirmPassword} 
                  onChange={e => setConfirmPassword(e.target.value)} 
                  required
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '14px', background: '#f8fafc', color: '#0f172a' }}
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading} style={{ alignSelf: 'flex-start', padding: '10px 24px', fontSize: '14px' }}>
                Change Password
              </button>
            </form>
          </div>

        </div>

        {/* Right Hand Card Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Card 3: Default Resume Upload */}
          <div className="glass-card">
            <h3 style={{ fontSize: '18px', fontWeight: '800', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '16px' }}>
              <i className="fa-solid fa-file-arrow-up" style={{ color: '#0b4fcd', marginRight: '8px' }}></i> Default Resume
            </h3>

            {currentResume ? (
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '14px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a', fontWeight: '700', fontSize: '14px', marginBottom: '6px' }}>
                  <i className="fa-solid fa-file-pdf" style={{ color: '#ef4444', fontSize: '16px' }}></i>
                  <span>Parsed Default Resume</span>
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
                  Target Role: <strong style={{ color: '#334155' }}>{currentResume.roleTarget || 'Not parsed'}</strong>
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '500', marginTop: '2px' }}>
                  Experience: <strong style={{ color: '#334155' }}>{currentResume.experience || 'Not parsed'}</strong>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic', marginBottom: '16px' }}>
                No default resume uploaded yet.
              </div>
            )}

            <form onSubmit={handleResumeUpload} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ position: 'relative' }}>
                <input 
                  type="file" 
                  id="profile-resume-input"
                  onChange={e => setResumeFile(e.target.files[0])}
                  accept=".pdf,.txt,.docx"
                  required
                  style={{ display: 'block', width: '100%', fontSize: '13px', color: '#64748b' }}
                />
              </div>
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={resumeUploadLoading || !resumeFile}
                style={{ padding: '8px 16px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}
              >
                {resumeUploadLoading ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i> Parsing Resume...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-upload"></i> Set Default Resume
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Card 4: Skills focus manager */}
          <div className="glass-card">
            <h3 style={{ fontSize: '18px', fontWeight: '800', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', marginBottom: '16px' }}>
              <i className="fa-solid fa-code" style={{ color: '#0b4fcd', marginRight: '8px' }}></i> Skills & Keywords
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.5', margin: '0 0 16px 0' }}>
              Add targeted technical skill tags to customize your dynamically generated interview questions.
            </p>

            <form onSubmit={handleAddSkill} style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
              <input 
                type="text" 
                value={newSkill} 
                onChange={e => setNewSkill(e.target.value)} 
                placeholder="e.g. Docker"
                style={{ flexGrow: 1, padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '13px', background: '#f8fafc', color: '#0f172a' }}
              />
              <button type="submit" className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '8px' }}>
                Add
              </button>
            </form>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {skills.length === 0 ? (
                <span style={{ fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>No skills tags added yet.</span>
              ) : (
                skills.map((skill, index) => (
                  <span 
                    key={index} 
                    style={{ 
                      padding: '6px 12px', 
                      borderRadius: '20px', 
                      background: '#eff6ff', 
                      color: '#0b4fcd', 
                      fontSize: '12px', 
                      fontWeight: '700', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px' 
                    }}
                  >
                    {skill}
                    <i 
                      className="fa-solid fa-xmark" 
                      onClick={() => handleRemoveSkill(skill)}
                      style={{ cursor: 'pointer', color: '#3b82f6', fontSize: '11px' }}
                      title="Remove"
                    />
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Card 5: Danger Zone (Delete Account) */}
          <div className="glass-card" style={{ border: '1px solid #fecaca' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', borderBottom: '1px solid #fecaca', paddingBottom: '12px', marginBottom: '16px', color: '#b91c1c' }}>
              <i className="fa-solid fa-triangle-exclamation" style={{ color: '#b91c1c', marginRight: '8px' }}></i> Danger Zone
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.5', margin: '0 0 16px 0' }}>
              Permanently delete your profile, practice sessions, history scores, and uploaded resume. This operation cannot be reversed.
            </p>
            <button className="btn" onClick={handleDeleteAccount} style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: '10px', padding: '10px', fontSize: '13px', fontWeight: '700', width: '100%', transition: 'all 0.2s' }}>
              <i className="fa-solid fa-trash-can"></i> Delete Account
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
