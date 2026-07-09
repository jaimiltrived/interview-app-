import React, { useState } from 'react';

export default function LandingPage({ switchToLogin, switchToRegister }) {
  const [activeFaq, setActiveFaq] = useState(null);

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const faqs = [
    { q: "How does the AI Interview Coach work?", a: "PrepFlow parses your resume target skills, custom-generates realistic job role questions, uses real-time webcam and speech API metrics to assess your performance, and outputs a score card on your technical accuracy and communication pacing." },
    { q: "Is the speech transcription done locally?", a: "Yes! PrepFlow uses HTML5 Speech Recognition APIs to transcribe your voice instantly in the browser session without sending heavy audio recordings back to server APIs." },
    { q: "What metrics are measured in the feedback report?", a: "We analyze your target technical keywords match, speech speed (Words Per Minute), total filler words count ('um', 'like', 'so'), camera eye-contact alignment, and mock facial confidence landmarks." },
    { q: "Does the platform support fallbacks if I don't have MySQL?", a: "Absolutely. PrepFlow is built with double redundancy fallback memory logs, allowing the entire admin control panel and mock practice room to be fully functional offline." }
  ];

  return (
    <div style={{ minHeight: '100vh', width: '100%', background: '#f5f7fb', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      
      {/* Landing Header */}
      <header className="app-header" style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(10px)' }}>
        <div className="app-header-logo">
          <div className="app-header-logo-icon">
            <i className="fa-solid fa-brain" style={{ fontSize: '24px' }}></i>
          </div>
          <span className="app-header-logo-text">PrepFlow</span>
        </div>
        
        <nav style={{ display: 'flex', gap: '25px', fontSize: '14.5px', fontWeight: '700' }} className="desktop-only">
          <a href="#features" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Features</a>
          <a href="#pricing" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Pricing</a>
          <a href="#faq" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>FAQ</a>
        </nav>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={switchToLogin} className="btn btn-secondary" style={{ height: '38px', fontSize: '13.5px', padding: '0 16px', background: 'transparent' }}>
            Login
          </button>
          <button onClick={switchToRegister} className="btn btn-primary" style={{ height: '38px', fontSize: '13.5px', padding: '0 16px' }}>
            Get Started
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ textAlign: 'center', padding: '80px 20px 60px', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
        <div style={{ background: 'var(--primary-glow)', color: 'var(--primary)', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className="fa-solid fa-sparkles"></i>
          Next-Generation AI Career Preparation
        </div>
        
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '48px', fontWeight: '800', lineHeight: '1.15', color: '#0f172a' }}>
          Master Your Next Tech & HR Mock Interviews with <span style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI Coach</span>
        </h1>
        
        <p style={{ color: 'var(--text-muted)', fontSize: '16.5px', lineHeight: '1.6', maxWidth: '600px' }}>
          Upload your resume target, practice technical question rooms, track real-time speaking speeds and filler counters, and review grading reports instantly.
        </p>

        <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
          <button onClick={switchToRegister} className="btn btn-primary" style={{ padding: '12px 28px', fontSize: '15px', borderRadius: '40px', boxShadow: '0 4px 14px rgba(11, 79, 205, 0.25)' }}>
            Start Practicing Free <i className="fa-solid fa-arrow-right" style={{ marginLeft: '8px' }}></i>
          </button>
          <a href="#how-it-works" className="btn btn-secondary" style={{ padding: '12px 24px', fontSize: '15px', borderRadius: '40px', textDecoration: 'none', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            How it Works
          </a>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" style={{ padding: '60px 20px', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
        <h3 style={{ textTransform: 'uppercase', fontSize: '12px', color: 'var(--primary)', fontWeight: '800', letterSpacing: '1px', textAlign: 'center', marginBottom: '10px' }}>Features Breakdown</h3>
        <h2 style={{ fontFamily: 'Outfit', fontSize: '28px', fontWeight: '800', textAlign: 'center', marginBottom: '40px', color: '#0f172a' }}>Everything you need to land target job offers</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px' }}>
          {[
            { title: 'Resume ATS Analysis', desc: 'Scan and extract target skills automatically to align generated interview questions with ATS metrics.', icon: 'fa-file-invoice' },
            { title: 'STT Speech Analytics', desc: 'Real-time transcript capture, measuring your words-per-minute speed and counting verbal filler words.', icon: 'fa-microphone-lines' },
            { title: 'Video Eye-Contact Tracker', desc: 'Browser webcam integration check verifying eye-alignment and showing head posture stability checks.', icon: 'fa-video' }
          ].map((item, idx) => (
            <div key={idx} className="glass-card" style={{ padding: '24px', borderRadius: '20px', background: '#ffffff', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'var(--primary-glow)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                <i className={`fa-solid ${item.icon}`}></i>
              </div>
              <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>{item.title}</h4>
              <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', lineHeight: '1.5' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it Works section */}
      <section id="how-it-works" style={{ background: '#ffffff', padding: '60px 20px', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h3 style={{ textTransform: 'uppercase', fontSize: '12px', color: 'var(--primary)', fontWeight: '800', letterSpacing: '1px', textAlign: 'center', marginBottom: '30px' }}>Simple 3-Step Setup</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            {[
              { step: '1', title: 'Upload Resume & Setup Profile', desc: 'Drop your resume target PDF or type targeted tech stack skills to build your candidate identity.' },
              { step: '2', title: 'Setup Interview Room Permission', desc: 'Select categories (HR, technical, behavioral, or specific company mock sets) and verify camera feed connection.' },
              { step: '3', title: 'Practice & Compile Score Card', desc: 'Perform the simulated interview, get voice readouts, record answers, and view overall feedback reports.' }
            ].map((item, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'var(--primary)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', flexShrink: 0 }}>
                  {item.step}
                </div>
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>{item.title}</h4>
                  <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" style={{ padding: '60px 20px', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
        <h3 style={{ textTransform: 'uppercase', fontSize: '12px', color: 'var(--primary)', fontWeight: '800', letterSpacing: '1px', textAlign: 'center', marginBottom: '10px' }}>Pricing & Quotas</h3>
        <h2 style={{ fontFamily: 'Outfit', fontSize: '28px', fontWeight: '800', textAlign: 'center', marginBottom: '40px', color: '#0f172a' }}>Fair pricing plans for every candidate</h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
          {[
            { name: 'Free Plan', price: '$0', sessions: '3 Mock Sessions', desc: 'Perfect for quick tests before job interviews.', features: ['ATS resume parser', 'Mock video feedback'] },
            { name: 'Basic Plan', price: '$19', sessions: '15 Mock Sessions', desc: 'Best for candidates actively looking for roles.', features: ['ATS resume parser', 'Detailed AI feedback cards'] },
            { name: 'Premium Plan', price: '$49', sessions: 'Unlimited Mocks', desc: 'Complete coaching suite for senior job seekers.', features: ['Full prompt editing', 'Detailed AI feedback cards', 'Company-specific mocks'] }
          ].map((plan, idx) => (
            <div key={idx} className="glass-card" style={{ padding: '24px', borderRadius: '20px', background: '#ffffff', border: idx === 1 ? '2px solid var(--primary)' : '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
              {idx === 1 && <span style={{ position: 'absolute', top: '-12px', right: '20px', background: 'var(--primary)', color: '#ffffff', fontSize: '10px', fontWeight: '800', padding: '3px 8px', borderRadius: '10px' }}>POPULAR</span>}
              <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>{plan.name}</h4>
              <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text-main)' }}>{plan.price}<span style={{ fontSize: '14px', fontWeight: 'normal', color: 'var(--text-muted)' }}>/mo</span></div>
              <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', lineHeight: '1.4' }}>{plan.desc}</p>
              <div style={{ height: '1px', background: 'var(--border-color)' }}></div>
              <ul style={{ listStyleType: 'none', paddingLeft: 0, display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px' }}>
                <li style={{ fontWeight: '700' }}><i className="fa-solid fa-check" style={{ color: 'var(--success)', marginRight: '6px' }}></i> {plan.sessions}</li>
                {plan.features.map((feat, fIdx) => (
                  <li key={fIdx}><i className="fa-solid fa-check" style={{ color: 'var(--success)', marginRight: '6px' }}></i> {feat}</li>
                ))}
              </ul>
              <button onClick={switchToRegister} className={`btn ${idx === 1 ? 'btn-primary' : 'btn-secondary'}`} style={{ marginTop: 'auto', width: '100%', height: '40px' }}>
                Select Plan
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" style={{ padding: '60px 20px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        <h3 style={{ textTransform: 'uppercase', fontSize: '12px', color: 'var(--primary)', fontWeight: '800', letterSpacing: '1px', textAlign: 'center', marginBottom: '30px' }}>Frequently Asked Questions</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {faqs.map((faq, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div key={idx} className="glass-card" style={{ background: '#ffffff', border: '1px solid var(--border-color)', borderRadius: '16px', overflow: 'hidden' }}>
                <div onClick={() => toggleFaq(idx)} style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', fontWeight: '700', color: '#0f172a' }}>
                  <span>{faq.q}</span>
                  <i className={`fa-solid ${isOpen ? 'fa-chevron-up' : 'fa-chevron-down'}`} style={{ color: 'var(--text-muted)' }}></i>
                </div>
                {isOpen && (
                  <div style={{ padding: '0 20px 20px', fontSize: '13.5px', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ marginTop: 'auto', padding: '30px 20px', borderTop: '1px solid var(--border-color)', background: '#ffffff', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
        <div>&copy; 2026 PrepFlow AI. All rights reserved.</div>
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginTop: '8px' }}>
          <a href="#" style={{ color: 'var(--text-muted)' }}>Privacy Policy</a>
          <span>|</span>
          <a href="#" style={{ color: 'var(--text-muted)' }}>Terms of Service</a>
        </div>
      </footer>

    </div>
  );
}
