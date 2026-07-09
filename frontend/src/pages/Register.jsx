import React, { useState } from 'react';

export default function Register({ onRegisterSuccess, switchToLogin }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Software Engineer');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !role) {
      setError('Please fill in all fields.');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setSuccess('Account created successfully! Redirecting to login...');
      
      // Store temporary role preference so the app loads it on login
      localStorage.setItem('coach_user_role', role);

      setTimeout(() => {
        onRegisterSuccess();
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', width: '100%' }}>
      <div className="glass-card" style={{ maxWidth: '440px', width: '100%', padding: '35px', textAlign: 'center', background: '#ffffff', border: '1px solid var(--border-color)' }}>
        <div className="logo-icon" style={{ margin: '0 auto 20px', width: '50px', height: '50px', fontSize: '24px' }}>
          <i className="fa-solid fa-user-plus"></i>
        </div>
        <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '26px', fontWeight: '800', marginBottom: '10px', color: 'var(--text-main)' }}>
          Create Account
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '25px' }}>
          Set up your target role and profile to start customized interview coaching.
        </p>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--error)', color: 'var(--error)', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '20px', textAlign: 'left' }}>
            <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '8px' }}></i> {error}
          </div>
        )}

        {success && (
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid var(--success)', color: 'var(--success)', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '20px', textAlign: 'left' }}>
            <i className="fa-solid fa-circle-check" style={{ marginRight: '8px' }}></i> {success}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div>
            <label className="detail-label" style={{ marginBottom: '5px', display: 'block', color: 'var(--text-muted)' }}>Full Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
              style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', background: '#ffffff', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '14px', outline: 'none' }}
              required
            />
          </div>

          <div>
            <label className="detail-label" style={{ marginBottom: '5px', display: 'block', color: 'var(--text-muted)' }}>Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@example.com"
              style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', background: '#ffffff', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '14px', outline: 'none' }}
              required
            />
          </div>

          <div>
            <label className="detail-label" style={{ marginBottom: '5px', display: 'block', color: 'var(--text-muted)' }}>Target Job / Role</label>
            <input 
              type="text" 
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Software Engineer"
              style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', background: '#ffffff', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '14px', outline: 'none' }}
              required
            />
          </div>

          <div>
            <label className="detail-label" style={{ marginBottom: '5px', display: 'block', color: 'var(--text-muted)' }}>Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', background: '#ffffff', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '14px', outline: 'none' }}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '10px', height: '42px' }}
            disabled={loading}
          >
            {loading ? (
              <span><i className="fa-solid fa-circle-notch fa-spin"></i> Creating...</span>
            ) : (
              <span>Register Account <i className="fa-solid fa-user-plus" style={{ marginLeft: '6px' }}></i></span>
            )}
          </button>
        </form>

        <p style={{ marginTop: '25px', fontSize: '13.5px', color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <span 
            onClick={switchToLogin} 
            style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}
          >
            Sign in
          </span>
        </p>
      </div>
    </div>
  );
}
