import React, { useEffect, useState, useRef } from 'react';
import Chart from 'chart.js/auto';

export default function FeedbackReport({ selectedId, sessionHistory, switchPage }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  // SVG Circular progress values
  const radius = 45;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    setLoading(true);
    let targetId = selectedId;
    
    // If "latest" is selected, fetch history list and get the first one
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

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [selectedId]);

  const fetchReportDetails = (id) => {
    const token = localStorage.getItem('coach_jwt_token');
    fetch(`/api/history/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        setReport(data);
        setLoading(false);
      })
      .catch(e => {
        console.error('Failed to fetch session details:', e);
        setLoading(false);
      });
  };

  // Render Chart when report state is populated
  useEffect(() => {
    if (loading || !report || !chartRef.current) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    const labels = report.questions.map((_, i) => `Q${i + 1}`);

    chartInstanceRef.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Speaking Speed (WPM)',
            data: report.wpmHistory || [130, 140, 135],
            backgroundColor: 'rgba(6, 182, 212, 0.4)',
            borderColor: 'rgba(6, 182, 212, 1)',
            borderWidth: 2,
            yAxisID: 'y'
          },
          {
            label: 'Eye Contact (%)',
            data: report.eyeContactHistory || [85, 90, 88],
            backgroundColor: 'rgba(139, 92, 246, 0.3)',
            borderColor: 'rgba(139, 92, 246, 1)',
            borderWidth: 2,
            type: 'line',
            tension: 0.3,
            yAxisID: 'yPercent'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans' } }
          }
        },
        scales: {
          x: {
            ticks: { color: '#94a3b8' },
            grid: { color: 'rgba(255, 255, 255, 0.05)' }
          },
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            ticks: { color: '#94a3b8' },
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            title: { display: true, text: 'Words Per Minute', color: '#94a3b8' }
          },
          yPercent: {
            type: 'linear',
            display: true,
            position: 'right',
            min: 0,
            max: 100,
            ticks: { color: '#94a3b8' },
            grid: { drawOnChartArea: false },
            title: { display: true, text: 'Percentage (%)', color: '#94a3b8' }
          }
        }
      }
    });
  }, [report, loading]);

  if (loading) {
    return (
      <div className="page text-center" style={{ padding: '60px' }}>
        <i className="fa-solid fa-circle-notch fa-spin text-success" style={{ fontSize: '48px', marginBottom: '20px' }}></i>
        <h2 style={{ fontFamily: 'Outfit' }}>Compiling AI Feedback metrics...</h2>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="page text-center" style={{ padding: '60px' }}>
        <h2>No session reports available.</h2>
        <p style={{ color: 'var(--text-muted)', margin: '15px 0' }}>Please complete a mock interview practice first.</p>
        <button className="btn btn-primary" onClick={() => switchPage('dashboard')}>
          Return to Dashboard
        </button>
      </div>
    );
  }

  // Compile coaching advices
  const advices = [];
  if (report.avgWpm < 110) {
    advices.push({
      type: 'warning',
      icon: <i className="fa-solid fa-gauge-simple-high"></i>,
      title: 'Increase Speaking Pace',
      text: `Your average speech pace was ${report.avgWpm} WPM. Talking too slowly can project low energy. Aim for around 130 WPM.`
    });
  } else if (report.avgWpm > 170) {
    advices.push({
      type: 'warning',
      icon: <i className="fa-solid fa-gauge-simple"></i>,
      title: 'Slow Down Speaking Pace',
      text: `Your average speaking speed was ${report.avgWpm} WPM. Talking too rapidly can affect clarity. Focus on taking structured pauses.`
    });
  } else {
    advices.push({
      type: 'success',
      icon: <i className="fa-solid fa-circle-check"></i>,
      title: 'Optimal Conversational Pacing',
      text: `Excellent! Your speed of ${report.avgWpm} WPM sits perfectly within the target conversational range (120-160 WPM).`
    });
  }

  if (report.totalFiller > 5) {
    advices.push({
      type: 'warning',
      icon: <i className="fa-solid fa-triangle-exclamation"></i>,
      title: 'Reduce Filler Word Use',
      text: `We logged ${report.totalFiller} filler words ('um', 'like', 'so'). Practice taking silent breaths instead of verbal gaps.`
    });
  } else {
    advices.push({
      type: 'success',
      icon: <i className="fa-solid fa-check"></i>,
      title: 'Clear Vocabulary Delivery',
      text: 'Outstanding! Your answers contained very few filler words, presenting highly articulate arguments.'
    });
  }

  if (report.avgEyeContact < 80) {
    advices.push({
      type: 'info',
      icon: <i className="fa-solid fa-eye-slash"></i>,
      title: 'Improve Camera Alignment',
      text: `Your eye contact score was ${report.avgEyeContact}%. Remember to look directly at the webcam lens rather than focusing on the screen.`
    });
  } else {
    advices.push({
      type: 'success',
      icon: <i className="fa-solid fa-camera"></i>,
      title: 'Engaging Camera Eye Contact',
      text: `You maintained a high eye contact score of ${report.avgEyeContact}%, projecting strong presence to potential interviewers.`
    });
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Session Performance Analysis</h1>
        <p className="page-desc">Comprehensive evaluation of target skills, pacing metrics, facial focus, and transcript delivery.</p>
      </div>

      <div className="report-grid">
        {/* Left Column stats */}
        <div style={{ display: 'flex', flexSide: 'column', flexDirection: 'column', gap: '30px' }}>
          
          {/* Radial score meters */}
          <div className="glass-card">
            <h2 className="report-section-title">
              <i className="fa-solid fa-award"></i> Core Performance Indicators
            </h2>
            <div className="score-summary-grid">
              
              {/* Overall Circular Score */}
              <div className="text-center">
                <div className="score-circle-wrapper">
                  <svg className="score-circle-svg">
                    <circle className="score-circle-bg" cx="50" cy="50" r={radius}></circle>
                    <circle 
                      className="score-circle-fill" 
                      cx="50" 
                      cy="50" 
                      r={radius}
                      style={{
                        strokeDasharray: circumference,
                        strokeDashoffset: circumference - (report.overallScore / 100) * circumference
                      }}
                    ></circle>
                  </svg>
                  <div className="score-circle-text">{report.overallScore}%</div>
                </div>
                <div className="stat-label">Overall Interview Score</div>
              </div>

              {/* Technical Circular Score */}
              <div className="text-center">
                <div className="score-circle-wrapper">
                  <svg className="score-circle-svg">
                    <circle className="score-circle-bg" cx="50" cy="50" r={radius}></circle>
                    <circle 
                      className="score-circle-fill" 
                      cx="50" 
                      cy="50" 
                      r={radius}
                      style={{
                        stroke: 'var(--secondary)',
                        strokeDasharray: circumference,
                        strokeDashoffset: circumference - (report.technicalScore / 100) * circumference
                      }}
                    ></circle>
                  </svg>
                  <div className="score-circle-text">{report.technicalScore}%</div>
                </div>
                <div className="stat-label">Technical Score</div>
              </div>

              {/* Communication Circular Score */}
              <div className="text-center">
                <div className="score-circle-wrapper">
                  <svg className="score-circle-svg">
                    <circle className="score-circle-bg" cx="50" cy="50" r={radius}></circle>
                    <circle 
                      className="score-circle-fill" 
                      cx="50" 
                      cy="50" 
                      r={radius}
                      style={{
                        stroke: 'var(--accent)',
                        strokeDasharray: circumference,
                        strokeDashoffset: circumference - (report.communicationScore / 100) * circumference
                      }}
                    ></circle>
                  </svg>
                  <div className="score-circle-text">{report.communicationScore}%</div>
                </div>
                <div className="stat-label">Communication Score</div>
              </div>

            </div>
          </div>

          {/* Chart.js container */}
          <div className="glass-card">
            <h2 className="report-section-title">
              <i className="fa-solid fa-chart-line"></i> Speech Speed & Eye Contact Over Time
            </h2>
            <div className="chart-container">
              <canvas ref={chartRef}></canvas>
            </div>
          </div>

          {/* Q&A Transcript */}
          <div className="glass-card">
            <h2 className="report-section-title">
              <i className="fa-solid fa-comments"></i> Questions & Transcripts Review
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              {report.questions.map((q, idx) => (
                <div key={idx} style={{ borderLeft: '2px solid var(--border-color)', paddingLeft: '15px' }}>
                  <div style={{ fontWeight: '700', color: 'var(--secondary)', fontSize: '12px', marginBottom: '4px' }}>
                    QUESTION {idx + 1}
                  </div>
                  <div style={{ fontWeight: '600', fontSize: '15px', marginBottom: '10px', lineHeight: '1.4' }}>
                    "{q}"
                  </div>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Your Recorded Answer:
                  </div>
                  <div style={{ fontSize: '14px', lineHeight: '1.5', color: 'var(--text-main)', fontStyle: 'italic', background: 'rgba(255,255,255,0.01)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.02)' }}>
                    "{report.answers[idx] || 'No answer recorded.'}"
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column Breakdowns & Suggestions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* Detail stats breakdown */}
          <div className="glass-card">
            <h2 className="report-section-title">
              <i className="fa-solid fa-sliders"></i> Metrics Breakdown
            </h2>
            <div className="detail-row">
              <div className="detail-label">Average Pacing</div>
              <div className="detail-val"><strong>{report.avgWpm} WPM</strong> (Normal is 120-160)</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Vocal Fillers Used</div>
              <div className="detail-val"><strong>{report.totalFiller}</strong> words flagged</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Average Eye Contact</div>
              <div className="detail-val"><strong>{report.avgEyeContact}%</strong> frame alignment</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Prevailing Expression</div>
              <div className="detail-val"><strong>{report.expression}</strong></div>
            </div>
          </div>

          {/* Coaching Insight Pills */}
          <div className="glass-card">
            <h2 className="report-section-title">
              <i className="fa-solid fa-wand-magic-sparkles"></i> AI Coaching Insights
            </h2>
            <div className="suggestions-list">
              {advices.map((ad, i) => (
                <div key={i} className={`suggestion-item ${ad.type}`}>
                  <div className="suggestion-item-icon">{ad.icon}</div>
                  <div className="suggestion-item-text">
                    <h4>{ad.title}</h4>
                    <p style={{ marginTop: '2px' }}>{ad.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Report Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button className="btn btn-primary" onClick={() => switchPage('interview')}>
              <i className="fa-solid fa-rotate-left"></i> Practice Again
            </button>
            <button className="btn btn-secondary" onClick={() => switchPage('dashboard')}>
              <i className="fa-solid fa-house"></i> Return to Dashboard
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
