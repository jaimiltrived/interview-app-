import React, { useState } from 'react';

export default function Login({ onLoginSuccess, switchToRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      localStorage.setItem('coach_jwt_token', data.token);
      localStorage.setItem('coach_user_name', data.user.name);
      localStorage.setItem('coach_user_email', data.user.email);
      onLoginSuccess(data.user, data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', width: '100%' }}>
      <div className="glass-card" style={{ maxWidth: '400px', width: '100%', padding: '35px', textAlign: 'center', background: '#ffffff', border: '1px solid var(--border-color)' }}>
        <div className="logo-icon" style={{ margin: '0 auto 20px', width: '50px', height: '50px', fontSize: '24px' }}>
          <i className="fa-solid fa-brain-circuit"></i>
        </div>
        <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '26px', fontWeight: '800', marginBottom: '10px', color: 'var(--text-main)' }}>
          Welcome Back
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '25px' }}>
          Sign in to access your interview coach profile and scorecards.
        </p>
 
        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--error)', color: 'var(--error)', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '20px', textAlign: 'left' }}>
            <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '8px' }}></i> {error}
          </div>
        )}
 
        <form onSubmit={handleSubmit} style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label className="detail-label" style={{ marginBottom: '6px', display: 'block', color: 'var(--text-muted)' }}>Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', background: '#ffffff', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '14px', outline: 'none' }}
              required
            />
          </div>
 
          <div>
            <label className="detail-label" style={{ marginBottom: '6px', display: 'block', color: 'var(--text-muted)' }}>Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', background: '#ffffff', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '14px', outline: 'none' }}
              required
            />
          </div>
 
          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '10px', height: '45px' }}
            disabled={loading}
          >
            {loading ? (
              <span><i className="fa-solid fa-circle-notch fa-spin"></i> Signing in...</span>
            ) : (
              <span>Sign In <i className="fa-solid fa-arrow-right-to-bracket" style={{ marginLeft: '6px' }}></i></span>
            )}
          </button>
        </form>
 
        <p style={{ marginTop: '25px', fontSize: '13.5px', color: 'var(--text-muted)' }}>
          Don't have an account?{' '}
          <span 
            onClick={switchToRegister} 
            style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}
          >
            Create account
          </span>
        </p>
      </div>
    </div>
  );
}
