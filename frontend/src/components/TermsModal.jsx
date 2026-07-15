import React, { useState } from 'react';

export default function TermsModal({ isOpen, onClose, onAccept }) {
  const [isChecked, setIsChecked] = useState(false);

  if (!isOpen) return null;

  const handleAgreeAndProceed = () => {
    if (isChecked) {
      onAccept();
      onClose();
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.45)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '20px',
      fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '540px',
        boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.15), 0 0 1px rgba(0, 0, 0, 0.1)',
        border: '1px solid #f1f5f9',
        overflow: 'hidden',
        animation: 'termsModalShow 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '28px 28px 20px',
          borderBottom: '1px solid #f1f5f9',
          textAlign: 'center',
          position: 'relative'
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            backgroundColor: '#eff6ff',
            color: '#0b4fcd',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            margin: '0 auto 16px'
          }}>
            <i className="fa-solid fa-shield-halved"></i>
          </div>
          <h3 style={{
            margin: 0,
            fontFamily: 'Outfit, sans-serif',
            fontSize: '22px',
            fontWeight: '800',
            color: '#0f172a'
          }}>
            Practice Session Agreement
          </h3>
          <p style={{
            margin: '6px 0 0',
            fontSize: '13.5px',
            color: '#64748b',
            fontWeight: '500'
          }}>
            Please review and accept our data terms before starting the mock room.
          </p>
          <button 
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: '18px',
              transition: 'color 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#64748b'}
            onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Modal Scroll Content */}
        <div style={{
          padding: '24px 28px',
          maxHeight: '280px',
          overflowY: 'auto',
          backgroundColor: '#fafafa',
          borderBottom: '1px solid #f1f5f9',
          fontSize: '13px',
          lineHeight: '1.6',
          color: '#334155'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Section 1: Practice Rules */}
            <div>
              <h4 style={{ margin: '0 0 8px 0', fontFamily: 'Outfit, sans-serif', fontSize: '14px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-list-check" style={{ color: '#0b4fcd' }}></i> Practice Session Rules
              </h4>
              <ul style={{ paddingLeft: '18px', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px', color: '#475569', fontSize: '12.5px' }}>
                <li><strong>Maintain Eye Contact:</strong> Face the camera directly. Gaze drifts will affect your performance scores.</li>
                <li><strong>Clear Enunciation:</strong> Speak clearly at a steady pace. Minimize filler words (e.g. "like", "um", "ah").</li>
                <li><strong>Allotted Time:</strong> Answer questions within the active response time limit.</li>
                <li><strong>Focus Mode:</strong> Do not minimize the window or switch tabs mid-session to prevent session resets.</li>
              </ul>
            </div>

            <hr style={{ border: 0, borderTop: '1px solid #e2e8f0', margin: 0 }} />

            {/* Section 2: Data Consent */}
            <div>
              <h4 style={{ margin: '0 0 10px 0', fontFamily: 'Outfit, sans-serif', fontSize: '14px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-user-shield" style={{ color: '#10b981' }}></i> Consent & Privacy Terms
              </h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12.5px', color: '#475569' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <div style={{ color: '#10b981', fontSize: '13px', marginTop: '2px' }}>
                    <i className="fa-solid fa-circle-check"></i>
                  </div>
                  <div>
                    <strong>Hardware Access:</strong> Temporary webcam and microphone access is required for real-time grading.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <div style={{ color: '#10b981', fontSize: '13px', marginTop: '2px' }}>
                    <i className="fa-solid fa-circle-check"></i>
                  </div>
                  <div>
                    <strong>Local Browser Processing:</strong> Audio STT and video tracking are computed locally. No video or audio is saved on the server.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <div style={{ color: '#10b981', fontSize: '13px', marginTop: '2px' }}>
                    <i className="fa-solid fa-circle-check"></i>
                  </div>
                  <div>
                    <strong>Report Generation:</strong> Transcripts and aggregated metrics are stored in your private dashboard logs.
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Modal Footer Checkbox & Actions */}
        <div style={{ padding: '24px 28px 28px' }}>
          <label 
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              cursor: 'pointer',
              marginBottom: '20px',
              fontSize: '13px',
              color: '#475569',
              userSelect: 'none'
            }}
          >
            <input 
              type="checkbox" 
              checked={isChecked}
              onChange={e => setIsChecked(e.target.checked)}
              style={{ 
                width: '16px', 
                height: '16px', 
                borderRadius: '4px', 
                border: '1px solid #cbd5e1',
                accentColor: '#0b4fcd',
                cursor: 'pointer',
                marginTop: '2px'
              }}
            />
            <span style={{ fontWeight: '600', lineHeight: '1.4' }}>
              I agree to the terms of service and consent to the temporary use of my camera and microphone for AI scoring.
            </span>
          </label>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={onClose}
              className="btn btn-secondary"
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '700',
                height: '46px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button 
              onClick={handleAgreeAndProceed}
              disabled={!isChecked}
              className="btn btn-primary"
              style={{
                flex: 2,
                padding: '12px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '700',
                height: '46px',
                backgroundColor: isChecked ? '#0b4fcd' : '#94a3b8',
                borderColor: isChecked ? '#0b4fcd' : '#94a3b8',
                color: '#ffffff',
                cursor: isChecked ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
                opacity: isChecked ? 1 : 0.7
              }}
            >
              Accept & Start Session
            </button>
          </div>
        </div>
      </div>
      
      {/* Dynamic Keyframes inject in DOM if not present */}
      <style>{`
        @keyframes termsModalShow {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(10px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
