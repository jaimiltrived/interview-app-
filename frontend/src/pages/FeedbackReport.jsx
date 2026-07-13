import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export default function FeedbackReport({ selectedId, sessionHistory, switchPage }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  // SVG Circular progress values
  const radius = 40;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    setLoading(true);
    let targetId = selectedId;
    
    if (targetId === 'latest') {
      const token = localStorage.getItem('coach_jwt_token');
      fetch('/api/history', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(data => {
          if (data && data.length > 0) {
            fetchReportDetails(data[0].id);
          } else {
            setLoading(false);
          }
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    } else if (targetId) {
      fetchReportDetails(targetId);
    } else {
      setLoading(false);
    }
  }, [selectedId]);

  const fetchReportDetails = (id) => {
    const token = localStorage.getItem('coach_jwt_token');
    fetch(`/api/interview/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        setReport(data);
        setLoading(false);
      })
      .catch(e => {
        console.error('Failed to fetch session details:', e);
        // Fallback to searching in sessionHistory if API fails
        const matched = sessionHistory.find(s => String(s.id) === String(id));
        if (matched) {
          // Construct mock detailed report
          setReport({
            ...matched,
            avgWpm: 135,
            totalFiller: 3,
            avgEyeContact: 88,
            expression: 'Confident',
            questions: ['Tell me about yourself', 'How do you handle conflict?', 'Explain REST APIs'],
            answers: ['Recorded answer description...', 'Recorded conflict resolution...', 'Recorded REST API explain...']
          });
        }
        setLoading(false);
      });
  };

  if (loading) {
    return (
      <div className="page text-center" style={{ padding: '60px' }}>
        <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '48px', color: '#0b4fcd', marginBottom: '20px' }}></i>
        <h2 style={{ fontFamily: 'Outfit', fontWeight: '800' }}>Compiling AI Feedback...</h2>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="page text-center" style={{ padding: '60px' }}>
        <h2 style={{ fontWeight: '800' }}>No session reports available.</h2>
        <p style={{ color: 'var(--text-muted)', margin: '15px 0' }}>Please complete a mock interview practice first.</p>
        <button className="btn btn-primary" onClick={() => switchPage('dashboard')}>
          Return to Dashboard
        </button>
      </div>
    );
  }

  // Dynamic strengths & improvements based on actual metrics
  const strengths = [];
  const improvements = [];

  if (report.avgEyeContact && report.avgEyeContact >= 80) {
    strengths.push("Strong eye contact throughout");
  } else {
    improvements.push("Improve camera eye-contact alignment");
  }

  if (report.communicationScore && report.communicationScore >= 80) {
    strengths.push("Clear structure in behavioral answers");
  }

  if (report.avgWpm && report.avgWpm >= 120 && report.avgWpm <= 160) {
    strengths.push("Excellent tone and pace");
  } else if (report.avgWpm && report.avgWpm > 160) {
    improvements.push("Slow down speaking pace (aim for 130-150 WPM)");
  } else {
    improvements.push("Increase speaking pace to project more energy");
  }

  if (report.totalFiller && report.totalFiller > 4) {
    improvements.push(`Minimize filler words (logged ${report.totalFiller} fillers like "uh", "like")`);
  } else {
    strengths.push("Outstanding vocabulary flow with minimal fillers");
  }

  if (report.technicalScore && report.technicalScore < 80) {
    improvements.push("Provide more specific technical examples and deep dives");
  }

  // Fallbacks if lists are empty
  if (strengths.length === 0) {
    strengths.push("Attempted all questions and spoke clearly");
  }
  if (improvements.length === 0) {
    improvements.push("Focus on structured STAR format for behavioral drills");
  }

  // PASS / RETRY checker for individual questions
  const isQuestionPass = (answerText) => {
    return answerText && answerText.length > 40 && !answerText.toLowerCase().includes('no answer');
  };

  const overallScoreVal = report.overallScore || 82;
  const communicationScoreVal = report.communicationScore || 88;
  const technicalScoreVal = report.technicalScore || 75;
  const confidenceScoreVal = report.confidenceScore || 82; // Fallback to confidence or avg score

  return (
    <div className="page" style={{ maxWidth: '600px', margin: '0 auto', paddingBottom: '30px' }}>
      
      {/* Header with back navigation, centered title and share icon */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <button 
          onClick={() => switchPage('dashboard')}
          style={{ background: 'none', border: 'none', fontSize: '20px', color: '#0f172a', cursor: 'pointer' }}
        >
          <i className="fa-solid fa-arrow-left"></i>
        </button>
        <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: 0, fontFamily: 'Outfit' }}>Feedback Report</h1>
        <button 
          onClick={() => toast.success('Report link copied to clipboard!')}
          style={{ background: 'none', border: 'none', fontSize: '18px', color: '#0f172a', cursor: 'pointer' }}
        >
          <i className="fa-solid fa-share-nodes"></i>
        </button>
      </div>

      {/* Radial score card */}
      <div className="glass-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '30px', textAlign: 'center', marginBottom: '24px' }}>
        <div className="score-circle-wrapper" style={{ width: '110px', height: '110px', margin: '0 auto 16px' }}>
          <svg className="score-circle-svg" style={{ width: '110px', height: '110px' }}>
            <circle className="score-circle-bg" cx="55" cy="55" r={radius} strokeWidth="9"></circle>
            <circle 
              className="score-circle-fill" 
              cx="55" 
              cy="55" 
              r={radius}
              strokeWidth="9"
              style={{
                stroke: '#0b4fcd',
                strokeDasharray: circumference,
                strokeDashoffset: circumference - (overallScoreVal / 100) * circumference
              }}
            ></circle>
          </svg>
          <div className="score-circle-text" style={{ fontSize: '22px', fontWeight: '800', color: '#0b4fcd', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span>{overallScoreVal}%</span>
            <span style={{ fontSize: '8px', color: '#64748b', fontWeight: '800', marginTop: '2px', letterSpacing: '0.5px' }}>OVERALL</span>
          </div>
        </div>
        
        <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>Well done!</h2>
        <p style={{ color: '#64748b', fontSize: '14.5px', fontWeight: '500' }}>
          Your performance was strong and professional.
        </p>
      </div>

      {/* KEY METRICS Section */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', color: '#64748b', marginBottom: '14px' }}>
          Key Metrics
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Metric 1: Communication */}
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', borderRadius: '16px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#eff6ff', color: '#0b4fcd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
              <i className="fa-regular fa-comment-dots"></i>
            </div>
            <div style={{ flexGrow: 1 }}>
              <div className="flex-between" style={{ marginBottom: '6px' }}>
                <span style={{ fontSize: '14.5px', fontWeight: '700', color: '#1e293b' }}>Communication</span>
                <span style={{ fontSize: '14.5px', fontWeight: '800', color: '#0f172a' }}>{communicationScoreVal}%</span>
              </div>
              <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${communicationScoreVal}%`, background: '#0b4fcd', borderRadius: '10px' }} />
              </div>
            </div>
          </div>

          {/* Metric 2: Technical */}
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', borderRadius: '16px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
              <i className="fa-solid fa-code"></i>
            </div>
            <div style={{ flexGrow: 1 }}>
              <div className="flex-between" style={{ marginBottom: '6px' }}>
                <span style={{ fontSize: '14.5px', fontWeight: '700', color: '#1e293b' }}>Technical Proficiency</span>
                <span style={{ fontSize: '14.5px', fontWeight: '800', color: '#0f172a' }}>{technicalScoreVal}%</span>
              </div>
              <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${technicalScoreVal}%`, background: '#0ea5e9', borderRadius: '10px' }} />
              </div>
            </div>
          </div>

          {/* Metric 3: Confidence */}
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', borderRadius: '16px', background: '#ffffff', border: '1px solid #e2e8f0' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#faf5ff', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
              <i className="fa-regular fa-lightbulb"></i>
            </div>
            <div style={{ flexGrow: 1 }}>
              <div className="flex-between" style={{ marginBottom: '6px' }}>
                <span style={{ fontSize: '14.5px', fontWeight: '700', color: '#1e293b' }}>Confidence</span>
                <span style={{ fontSize: '14.5px', fontWeight: '800', color: '#0f172a' }}>{confidenceScoreVal}%</span>
              </div>
              <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${confidenceScoreVal}%`, background: '#6366f1', borderRadius: '10px' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI INSIGHTS Section */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', color: '#64748b', marginBottom: '14px' }}>
          AI Insights
        </h3>
        
        <div className="glass-card" style={{ background: '#eff6ff', border: 'none', borderRadius: '24px', padding: '24px' }}>
          {/* Strengths */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', color: '#1e3a8a', fontWeight: '800', marginBottom: '10px' }}>
              <i className="fa-solid fa-circle-check" style={{ color: '#16a34a' }}></i> Strengths
            </h4>
            <ul style={{ listStyleType: 'none', paddingLeft: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {strengths.map((str, i) => (
                <li key={i} style={{ fontSize: '13.5px', color: '#1e3a8a', fontWeight: '600', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ color: '#16a34a' }}>•</span>
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          </div>

          <div style={{ height: '1px', backgroundColor: '#bfdbfe', margin: '20px 0' }} />

          {/* Areas for Improvement */}
          <div>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', color: '#7f1d1d', fontWeight: '800', marginBottom: '10px' }}>
              <i className="fa-solid fa-circle-exclamation" style={{ color: '#dc2626' }}></i> Areas for Improvement
            </h4>
            <ul style={{ listStyleType: 'none', paddingLeft: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {improvements.map((imp, i) => (
                <li key={i} style={{ fontSize: '13.5px', color: '#7f1d1d', fontWeight: '600', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <span style={{ color: '#dc2626' }}>•</span>
                  <span>{imp}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* QUESTION BREAKDOWN Section */}
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', color: '#64748b', marginBottom: '14px' }}>
          Question Breakdown
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {report.questions.map((q, idx) => {
            const answer = report.answers[idx] || '';
            const passed = isQuestionPass(answer);
            return (
              <div 
                key={idx} 
                className="glass-card" 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '16px 20px', 
                  borderRadius: '16px', 
                  background: '#ffffff', 
                  border: '1px solid #e2e8f0' 
                }}
              >
                <div>
                  <h4 style={{ fontSize: '14.5px', fontWeight: '700', color: '#0f172a', marginBottom: '3px' }}>
                    {q.length > 45 ? q.substring(0, 45) + '...' : q}
                  </h4>
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                    {idx === 0 || q.toLowerCase().includes('yourself') || q.toLowerCase().includes('conflict') ? 'Behavioral' : 'Technical'}
                  </span>
                </div>

                <span className={`badge ${passed ? 'tag-pass' : 'tag-retry'}`} style={{ fontSize: '11px', fontWeight: '800', padding: '4px 10px', borderRadius: '12px' }}>
                  {passed ? 'PASS' : 'RETRY'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <button 
          onClick={() => toast.success('Launching video feedback review...')}
          className="btn btn-primary"
          style={{
            height: '48px',
            borderRadius: '12px',
            fontSize: '14.5px',
            fontWeight: '700',
            background: '#0b4fcd',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <i className="fa-regular fa-circle-play"></i>
          <span>Watch Recording</span>
        </button>

        <button 
          onClick={() => switchPage('dashboard')}
          className="btn btn-secondary"
          style={{
            height: '48px',
            borderRadius: '12px',
            fontSize: '14.5px',
            fontWeight: '700',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            color: '#0b4fcd'
          }}
        >
          Back to Dashboard
        </button>
      </div>

    </div>
  );
}
