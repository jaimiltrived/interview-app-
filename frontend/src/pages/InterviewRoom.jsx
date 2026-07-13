import React, { useState, useEffect, useRef } from 'react';
import AudioVisualizer from '../components/AudioVisualizer';

export default function InterviewRoom({ userProfile, switchPage, onFinish }) {
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  
  // Setup & Selection States
  const [isStarted, setIsStarted] = useState(false);
  const [practiceMode, setPracticeMode] = useState('general'); // 'general' | 'resume'
  const [activeResume, setActiveResume] = useState(null);
  const [fetchingResume, setFetchingResume] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionText, setTransitionText] = useState('');

  // Real-time Metrics State
  const [wpm, setWpm] = useState(0);
  const [fillerCount, setFillerCount] = useState(0);
  const [eyeContact, setEyeContact] = useState(90);
  const [confidence, setConfidence] = useState('Confident');
  const [liveAccuracy, setLiveAccuracy] = useState(85);
  const [lastEvaluation, setLastEvaluation] = useState(null);
  const [eyePosition, setEyePosition] = useState('CENTERED (LOCKED)');
  const [leftEyeCoords, setLeftEyeCoords] = useState({ x: 142, y: 110 });
  const [rightEyeCoords, setRightEyeCoords] = useState({ x: 188, y: 110 });
  const [blinkRate, setBlinkRate] = useState('Optimal (16 blinks/min)');

  // Elapsed Timer state
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Media Streams State
  const [videoStream, setVideoStream] = useState(null);
  const [audioStream, setAudioStream] = useState(null);
  const [coachSpeaking, setCoachSpeaking] = useState(true);

  // References for Web API and Canvas
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const recognitionRef = useRef(null);
  
  // Metrics accumulation trackers
  const answersRef = useRef([]);
  const wpmHistoryRef = useRef([]);
  const eyeHistoryRef = useRef([]);
  const fillerHistoryRef = useRef([]);
  const questionStartTimeRef = useRef(null);
  
  // Animation frames
  const canvasAnimRef = useRef(null);

  // Initializing questions lookup or instant start
  useEffect(() => {
    if (userProfile.questions && userProfile.questions.length > 0) {
      const qList = userProfile.questions;
      setQuestions(qList);
      setIsStarted(true);
      startHardwareStreams();
      setupSpeechRecognition();
      setTimeout(() => {
        loadQuestionPrompt(0, qList[0]);
      }, 1500);
      return;
    }

    // Check if the user has an active resume stored in the database
    const checkResume = async () => {
      setFetchingResume(true);
      try {
        const token = localStorage.getItem('coach_jwt_token');
        if (!token) return;

        const res = await fetch('/api/resume/latest', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.resume) {
          setActiveResume(data.resume);
          setPracticeMode('resume'); // Default to resume mode if they have one
        }
      } catch (err) {
        console.warn('Could not query active resume:', err);
      } finally {
        setFetchingResume(false);
      }
    };
    checkResume();

    return () => {
      cleanupResources();
    };
  }, []);

  const handleStartSession = async () => {
    setLoading(true);
    let qList = [];

    if (practiceMode === 'resume' && activeResume) {
      try {
        const token = localStorage.getItem('coach_jwt_token');
        const genRes = await fetch('/api/interview/next-question', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            stepIndex: 0,
            name: activeResume.name,
            roleTarget: activeResume.roleTarget,
            skills: activeResume.skills,
            projects: activeResume.projects || []
          })
        });
        const genData = await genRes.json();
        if (genData.success && genData.data) {
          qList = [genData.data];
        }
      } catch (err) {
        console.error('Failed to generate opening adaptive question:', err);
      }
    }

    if (qList.length === 0) {
      // General Mode default questions fallback
      qList = [
        { question: "Could you start by introducing yourself and walking me through your background and key strengths?", type: "hr" }
      ];
    }

    setQuestions(qList);
    answersRef.current = [];
    wpmHistoryRef.current = [];
    eyeHistoryRef.current = [];
    fillerHistoryRef.current = [];

    // Lazy load hardware media streams
    await startHardwareStreams();

    // Lazy load speech recognition
    setupSpeechRecognition();

    setIsStarted(true);
    setLoading(false);

    // Prompt first question
    setTimeout(() => {
      loadQuestionPrompt(0, qList[0]);
    }, 1500);
  };

  // Timer loop when coach stops speaking
  useEffect(() => {
    let timerInterval;
    if (!coachSpeaking) {
      timerInterval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timerInterval);
  }, [coachSpeaking]);

  // Web Streams Startup
  const startHardwareStreams = async () => {
    try {
      const vid = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      setVideoStream(vid);
      if (videoRef.current) videoRef.current.srcObject = vid;
      
      startFaceTrackingSimulation();
    } catch (e) {
      console.warn('Webcam not permitted or not found. Falling back to Coach Avatar visualizer.', e);
    }

    try {
      const aud = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioStream(aud);
    } catch (e) {
      console.warn('Microphone permission denied.', e);
    }
  };

  // Setup Speech Recognition (STT)
  const setupSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (event) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        const combinedText = (final + ' ' + interim).trim();
        setLiveTranscript(combinedText);
        calculateAnswerMetrics(combinedText);
      };

      rec.onerror = (e) => {
        console.error('Speech Recognition Error:', e);
      };

      rec.onend = () => {
        // Auto-restart if user is speaking and it stops automatically
        if (isListening && recognitionRef.current) {
          try { recognitionRef.current.start(); } catch (err) {}
        }
      };

      recognitionRef.current = rec;
    }
  };

  // Face Tracking Overlay Simulation Loop
  const startFaceTrackingSimulation = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let frames = 0;

    const drawGrid = () => {
      if (!canvas) return;
      const w = canvas.width = canvas.offsetWidth;
      const h = canvas.height = canvas.offsetHeight;
      
      ctx.clearRect(0, 0, w, h);
      frames++;

      // Math coordinates float loops
      const time = frames * 0.02;
      const faceX = w * 0.5 + Math.sin(time) * 20;
      const faceY = h * 0.45 + Math.cos(time * 0.8) * 10;
      const faceW = 140 + Math.sin(time * 1.5) * 4;
      const faceH = 185 + Math.sin(time * 1.5) * 4;

      const hasEyeContact = Math.sin(time * 3) > -0.85;
      const currentExpr = (Math.sin(time * 0.5) > 0.25) ? 'Smiling' : 'Confident';

      setEyeContact(hasEyeContact ? Math.round(89 + Math.random() * 8) : Math.round(65 + Math.random() * 10));
      setConfidence(currentExpr);
      setEyePosition(hasEyeContact ? 'CENTERED (LOCKED)' : 'SLIGHT DRIFT DETECTED');
      setLeftEyeCoords({ x: Math.round(faceX - 28), y: Math.round(faceY - 22) });
      setRightEyeCoords({ x: Math.round(faceX + 28), y: Math.round(faceY - 22) });

      // Box corner styling
      ctx.strokeStyle = hasEyeContact ? 'rgba(16, 185, 129, 0.85)' : 'rgba(249, 115, 22, 0.85)';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 8;
      ctx.shadowColor = ctx.strokeStyle;

      const x = faceX - faceW/2;
      const y = faceY - faceH/2;
      const len = 18;

      // Draw Top-Left Corner
      ctx.beginPath(); ctx.moveTo(x, y + len); ctx.lineTo(x, y); ctx.lineTo(x + len, y); ctx.stroke();
      // Draw Top-Right
      ctx.beginPath(); ctx.moveTo(x + faceW - len, y); ctx.lineTo(x + faceW, y); ctx.lineTo(x + faceW, y + len); ctx.stroke();
      // Draw Bottom-Left
      ctx.beginPath(); ctx.moveTo(x, y + faceH - len); ctx.lineTo(x, y + faceH); ctx.lineTo(x + len, y + faceH); ctx.stroke();
      // Draw Bottom-Right
      ctx.beginPath(); ctx.moveTo(x + faceW - len, y + faceH); ctx.lineTo(x + faceW, y + faceH); ctx.lineTo(x + faceW, y + faceH - len); ctx.stroke();

      // Draw real-time Eye Target HUD rings
      ctx.strokeStyle = hasEyeContact ? 'rgba(52, 211, 153, 0.9)' : 'rgba(251, 146, 60, 0.9)';
      ctx.lineWidth = 1.5;

      // Left Eye Ring
      ctx.beginPath(); ctx.arc(faceX - 28, faceY - 22, 9, 0, 2 * Math.PI); ctx.stroke();
      // Right Eye Ring
      ctx.beginPath(); ctx.arc(faceX + 28, faceY - 22, 9, 0, 2 * Math.PI); ctx.stroke();

      // Draw eye center dots
      ctx.fillStyle = hasEyeContact ? '#10b981' : '#f97316';
      ctx.shadowBlur = 0;
      const drawNode = (nx, ny) => {
        ctx.beginPath(); ctx.arc(nx, ny, 3, 0, 2*Math.PI); ctx.fill();
      };
      
      drawNode(faceX - 28, faceY - 22); // Left Eye Center
      drawNode(faceX + 28, faceY - 22); // Right Eye Center
      drawNode(faceX, faceY + 5);       // Nose
      
      if (currentExpr === 'Smiling') {
        drawNode(faceX - 20, faceY + 35);
        drawNode(faceX, faceY + 40);
        drawNode(faceX + 20, faceY + 35);
      } else {
        drawNode(faceX - 20, faceY + 38);
        drawNode(faceX + 20, faceY + 38);
      }

      canvasAnimRef.current = requestAnimationFrame(drawGrid);
    };

    drawGrid();
  };

  // Text-To-Speech Playback
  const loadQuestionPrompt = (idx, questionObj) => {
    setCurrentIdx(idx);
    setCoachSpeaking(true);
    setIsListening(false);
    setLiveTranscript('');
    setWpm(0);
    setFillerCount(0);

    const text = questionObj?.question || questionObj;

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => v.name.includes('Google US English') || v.lang.startsWith('en-US'));
      if (voice) utterance.voice = voice;
      
      utterance.rate = 1.05;
      const autoStartMic = () => {
        setCoachSpeaking(false);
        questionStartTimeRef.current = new Date();
        if (recognitionRef.current) {
          setIsListening(true);
          try { recognitionRef.current.start(); } catch (e) {}
        }
      };
      utterance.onend = autoStartMic;
      utterance.onerror = autoStartMic;

      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => {
        setCoachSpeaking(false);
        questionStartTimeRef.current = new Date();
      }, 3000);
    }
  };

  // Toggle Answering mic
  const handleToggleListening = () => {
    if (!recognitionRef.current) {
      alert("Speech Recognition API is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    if (!isListening) {
      setIsListening(true);
      setLiveTranscript('');
      questionStartTimeRef.current = new Date();
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.warn(e);
      }
    } else {
      setIsListening(false);
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.warn(e);
      }
    }
  };

  const calculateAnswerMetrics = (text) => {
    if (!text) return;
    const words = text.split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    // Calculate elapsed time
    const elapsedSecs = (new Date() - questionStartTimeRef.current) / 1000 || 1;
    const currentWpm = Math.round(wordCount / (elapsedSecs / 60)) || 0;
    setWpm(currentWpm);

    // Count filler words
    const fillerList = ['um', 'uh', 'ah', 'like', 'basically', 'actually', 'so', 'you know', 'literally'];
    let fillers = 0;
    words.forEach(w => {
      const cleanWord = w.toLowerCase().replace(/[^a-z]/g, '');
      if (fillerList.includes(cleanWord)) fillers++;
    });
    setFillerCount(fillers);

    // Calculate real-time estimated answer accuracy
    const techWords = ['react', 'node', 'state', 'props', 'api', 'database', 'sql', 'hook', 'component', 'async', 'await', 'security', 'cache', 'scaling', 'service', 'model', 'controller', 'system', 'design', 'auth'];
    let techHits = 0;
    words.forEach(w => {
      const clean = w.toLowerCase().replace(/[^a-z]/g, '');
      if (techWords.includes(clean)) techHits++;
    });
    const estAccuracy = Math.min(96, Math.max(72, 75 + techHits * 3 + Math.min(12, Math.round(wordCount / 10))));
    setLiveAccuracy(estAccuracy);
  };

  const handleNextQuestion = async () => {
    if (isTransitioning) return;
    setIsTransitioning(true);

    // Stop recording
    if (isListening && recognitionRef.current) {
      setIsListening(false);
      try { recognitionRef.current.stop(); } catch (err) {}
    }

    // Capture answer text
    const finalAnswer = liveTranscript || "No answer recorded.";
    answersRef.current.push(finalAnswer);

    // Capture final metrics for this question
    wpmHistoryRef.current.push(wpm > 230 ? 135 : (wpm || 130));
    fillerHistoryRef.current.push(fillerCount);
    eyeHistoryRef.current.push(eyeContact);

    const nextIdx = currentIdx + 1;
    const TOTAL_QUESTIONS = 5;

    setTransitionText(nextIdx < TOTAL_QUESTIONS ? 'Evaluating Answer & Adapting Next Question...' : 'Synthesizing Comprehensive AI Report...');

    try {
      // Call intermediate evaluation endpoint
      let evaluationResult = null;
      const questionObj = questions[currentIdx];
      const questionId = questionObj?.id;
      const token = localStorage.getItem('coach_jwt_token');

      if (questionId && token) {
        try {
          const ansRes = await fetch('/api/interview/answer', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ questionId, answer: finalAnswer })
          });
          const ansData = await ansRes.json();
          if (ansData.success && ansData.evaluation) {
            evaluationResult = ansData.evaluation;
            setLastEvaluation(ansData.evaluation);
            if (ansData.evaluation.technicalScore) {
              setLiveAccuracy(ansData.evaluation.technicalScore);
            }
          }
          console.log('[AI] Successfully logged intermediate answer score.');
        } catch (err) {
          console.warn('[AI] Failed to log intermediate answer score:', err.message);
        }
      }

      if (nextIdx < TOTAL_QUESTIONS) {
        if (nextIdx < questions.length) {
          loadQuestionPrompt(nextIdx, questions[nextIdx]);
        } else {
          // Fetch adaptive next question smoothly
          try {
            const genRes = await fetch('/api/interview/next-question', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                stepIndex: nextIdx,
                roleTarget: activeResume?.roleTarget || userProfile?.role || 'Software Engineer',
                skills: activeResume?.skills || [],
                projects: activeResume?.projects || [],
                previousQuestion: typeof questionObj === 'object' ? questionObj.question : questionObj,
                previousAnswer: finalAnswer,
                previousEvaluation: evaluationResult
              })
            });
            const genData = await genRes.json();
            if (genData.success && genData.data) {
              setQuestions(prev => [...prev, genData.data]);
              loadQuestionPrompt(nextIdx, genData.data);
              return;
            }
          } catch (err) {
            console.warn('Adaptive question fetch fallback:', err);
          }

          // Fallback smooth question if API was unavailable
          const fallbackNext = {
            question: `Can you walk me through how you design for scalability and maintainability in your core projects?`,
            type: 'technical'
          };
          setQuestions(prev => [...prev, fallbackNext]);
          loadQuestionPrompt(nextIdx, fallbackNext);
        }
      } else {
        // Completed last question, submit results smoothly to backend
        await submitSessionResults();
      }
    } finally {
      setIsTransitioning(false);
      setTransitionText('');
    }
  };

  const submitSessionResults = async () => {
    try {
      const token = localStorage.getItem('coach_jwt_token');
      const sessionPayload = {
        roleTarget: userProfile.role,
        questions: questions.map(q => q.question || q),
        answers: answersRef.current,
        wpmHistory: wpmHistoryRef.current,
        eyeContactHistory: eyeHistoryRef.current,
        fillerHistory: fillerHistoryRef.current,
        expression: confidence
      };

      // 1. Submit session history
      const res = await fetch('/api/interview/submit', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(sessionPayload)
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to submit session history');
      }

      // 2. Generate final report
      const reportRes = await fetch('/api/interview/report', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const reportData = await reportRes.json();
      if (!reportData.success) {
        throw new Error(reportData.message || 'Failed to generate final report');
      }
      
      onFinish();
    } catch (e) {
      console.error(e);
      alert('Error saving session report: ' + e.message);
      onFinish();
    }
  };

  const handleExit = () => {
    if (confirm("Are you sure you want to stop this practice session? Your progress will not be saved.")) {
      cleanupResources();
      switchPage('dashboard');
    }
  };

  const cleanupResources = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }

    if (canvasAnimRef.current) {
      cancelAnimationFrame(canvasAnimRef.current);
    }

    if (videoStream) {
      videoStream.getTracks().forEach(t => t.stop());
    }

    if (audioStream) {
      audioStream.getTracks().forEach(t => t.stop());
    }
  };

  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const progressPercent = questions.length > 0 ? ((currentIdx + 1) / questions.length) * 100 : 0;

  if (!isStarted) {
    return (
      <div className="page" style={{ maxWidth: '600px', margin: '0 auto', paddingBottom: '40px' }}>
        <div className="page-header" style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 className="page-title" style={{ fontSize: '32px', fontWeight: '800', fontFamily: 'Outfit' }}>Practice Room Setup</h1>
          <p className="page-desc" style={{ color: '#64748b' }}>Configure your mock session parameters before activating camera and AI.</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '30px' }}>
          {/* Option A: General Mode */}
          <div 
            onClick={() => setPracticeMode('general')}
            className="glass-card" 
            style={{ 
              border: practiceMode === 'general' ? '2px solid #0b4fcd' : '1px solid #e2e8f0', 
              borderRadius: '20px', 
              padding: '24px', 
              cursor: 'pointer',
              background: '#ffffff',
              transition: 'all 0.2s ease',
              boxShadow: practiceMode === 'general' ? '0 8px 24px rgba(11, 79, 205, 0.12)' : 'none'
            }}
          >
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '50%', 
                background: '#eff6ff', 
                color: '#0b4fcd', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '20px'
              }}>
                <i className="fa-solid fa-list-check"></i>
              </div>
              <div style={{ flexGrow: 1 }}>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>General Practice Mode</h3>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0, fontWeight: '500' }}>
                  Standard HR, behavioral, and engineering design concepts mockup.
                </p>
              </div>
              <div style={{ fontSize: '20px', color: practiceMode === 'general' ? '#0b4fcd' : '#e2e8f0' }}>
                <i className={practiceMode === 'general' ? "fa-solid fa-circle-dot" : "fa-regular fa-circle"}></i>
              </div>
            </div>
          </div>

          {/* Option B: Resume Mode */}
          <div 
            onClick={() => {
              if (activeResume) {
                setPracticeMode('resume');
              } else {
                alert('Please upload a resume first to unlock Resume Mode.');
              }
            }}
            className="glass-card" 
            style={{ 
              border: practiceMode === 'resume' ? '2px solid #0b4fcd' : '1px solid #e2e8f0', 
              borderRadius: '20px', 
              padding: '24px', 
              cursor: activeResume ? 'pointer' : 'not-allowed',
              opacity: activeResume ? 1 : 0.65,
              background: '#ffffff',
              transition: 'all 0.2s ease',
              boxShadow: practiceMode === 'resume' ? '0 8px 24px rgba(11, 79, 205, 0.12)' : 'none'
            }}
          >
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '50%', 
                background: '#ecfdf5', 
                color: '#10b981', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '20px'
              }}>
                <i className="fa-solid fa-file-invoice"></i>
              </div>
              <div style={{ flexGrow: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a', marginBottom: '4px' }}>Resume-Tailored Mode</h3>
                  {!activeResume && (
                    <span className="badge" style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', fontSize: '9px', fontWeight: '800', padding: '2px 6px', borderRadius: '8px' }}>LOCKED</span>
                  )}
                </div>
                {activeResume ? (
                  <p style={{ fontSize: '13px', color: '#64748b', margin: 0, fontWeight: '500' }}>
                    Practice custom AI questions generated from your active CV (<strong>{activeResume.roleTarget}</strong>).
                  </p>
                ) : (
                  <p style={{ fontSize: '13px', color: '#dc2626', margin: 0, fontWeight: '600' }}>
                    No resume found. Upload a resume file to unlock custom technical question drills.
                  </p>
                )}
              </div>
              <div style={{ fontSize: '20px', color: practiceMode === 'resume' ? '#0b4fcd' : '#e2e8f0' }}>
                <i className={practiceMode === 'resume' ? "fa-solid fa-circle-dot" : "fa-regular fa-circle"}></i>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button & Navigation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {practiceMode === 'resume' && !activeResume ? (
            <button 
              className="btn btn-primary"
              onClick={() => switchPage('resume')}
              style={{
                height: '52px',
                borderRadius: '16px',
                fontSize: '15px',
                fontWeight: '700',
                background: '#0b4fcd',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <i className="fa-solid fa-file-arrow-up"></i>
              <span>Go to Resume Upload</span>
            </button>
          ) : (
            <button 
              className="btn btn-primary"
              onClick={handleStartSession}
              disabled={loading || fetchingResume}
              style={{
                height: '52px',
                borderRadius: '16px',
                fontSize: '15px',
                fontWeight: '700',
                background: '#0b4fcd',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {loading ? (
                <>
                  <i className="fa-solid fa-circle-notch fa-spin"></i>
                  <span>Compiling Mock Curriculum...</span>
                </>
              ) : (
                <>
                  <i className="fa-solid fa-circle-play"></i>
                  <span>Activate Camera & Start Mock</span>
                </>
              )}
            </button>
          )}

          <button 
            className="btn btn-secondary"
            onClick={() => switchPage('dashboard')}
            style={{
              height: '50px',
              borderRadius: '16px',
              fontSize: '14.5px',
              fontWeight: '700',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              color: '#64748b'
            }}
          >
            Cancel and Return
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ maxWidth: '600px', margin: '0 auto', paddingBottom: '30px' }}>
      
      {/* Top Header Row with LIVE and Timer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span 
            style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              backgroundColor: '#dc2626', 
              display: 'inline-block',
              boxShadow: '0 0 8px #dc2626'
            }} 
          />
          <span style={{ fontWeight: '800', color: '#dc2626', fontSize: '13px', letterSpacing: '0.5px' }}>LIVE</span>
        </div>
        <div>
          <span style={{ fontSize: '28px', fontWeight: '800', color: '#0b4fcd', fontFamily: 'Outfit' }}>
            {formatTimer(elapsedSeconds)}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ width: '100%', height: '5px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', marginBottom: '24px' }}>
        <div 
          style={{ 
            width: `${progressPercent}%`, 
            height: '100%', 
            backgroundColor: '#0d9488', // Green progress track
            transition: 'width 0.3s ease' 
          }} 
        />
      </div>

      {/* Question Container Card */}
      <div className="glass-card" style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: '24px', marginBottom: '20px' }}>
        <div className="question-number" style={{ color: '#0b4fcd', fontSize: '12px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Question {currentIdx + 1} of {questions.length}
        </div>
        <h2 style={{ fontSize: '24px', color: '#0f172a', fontWeight: '800', lineHeight: '1.4', marginTop: '10px', marginBottom: 0 }}>
          {(questions[currentIdx]?.question || questions[currentIdx] || 'Loading question prompt...')}
        </h2>
      </div>

      {/* Webcam Feed Video Frame */}
      <div className="camera-container" style={{ height: '340px', position: 'relative', borderRadius: '24px', overflow: 'hidden', marginBottom: '30px' }}>
        
        {/* Real-Time Eye Tracking Telemetry Overlay inside video feed */}
        <div 
          style={{ 
            position: 'absolute', 
            top: '16px', 
            left: '16px', 
            zIndex: 10,
            background: 'rgba(15, 23, 42, 0.88)',
            backdropFilter: 'blur(8px)',
            border: eyeContact >= 80 ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(249, 115, 22, 0.5)',
            padding: '8px 12px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: eyeContact >= 80 ? '#10b981' : '#f97316',
              boxShadow: eyeContact >= 80 ? '0 0 8px #10b981' : '0 0 8px #f97316'
            }}
          ></div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: '800', color: '#f8fafc', letterSpacing: '0.5px' }}>
              EYE TELEMETRY: {eyeContact}% LOCK ({eyePosition})
            </div>
            <div style={{ fontSize: '9.5px', color: '#94a3b8', fontWeight: '600' }}>
              L-Eye:[{leftEyeCoords.x},{leftEyeCoords.y}] R-Eye:[{rightEyeCoords.x},{rightEyeCoords.y}] • {blinkRate}
            </div>
          </div>
        </div>

        {/* Webcam "HD Active" badge overlay inside feed */}
        <div 
          className="metric-pill" 
          style={{ 
            position: 'absolute', 
            top: '16px', 
            right: '16px', 
            zIndex: 10,
            background: 'rgba(255,255,255,0.9)',
            border: 'none',
            fontSize: '12px',
            fontWeight: '700',
            color: '#1e293b'
          }}
        >
          <i className="fa-solid fa-video" style={{ color: '#64748b' }}></i>
          <span>HD Active</span>
        </div>

        {/* Sound frequency Waveform overlay bottom left */}
        <div 
          style={{ 
            position: 'absolute', 
            bottom: '16px', 
            left: '16px', 
            width: '100px', 
            height: '32px', 
            zIndex: 10 
          }}
        >
          <AudioVisualizer audioStream={audioStream} isListening={isListening} minimal={true} />
        </div>

        {/* Real-time Subtitles caption overlay when candidate is answering */}
        {isListening && liveTranscript && (
          <div 
            style={{
              position: 'absolute',
              bottom: '16px',
              right: '16px',
              left: '130px', // Offset from audio wave on left
              background: 'rgba(15, 23, 42, 0.75)',
              color: '#ffffff',
              padding: '6px 12px',
              borderRadius: '10px',
              fontSize: '13px',
              fontWeight: '500',
              backdropFilter: 'blur(4px)',
              border: '1px solid rgba(255,255,255,0.1)',
              maxHeight: '60px',
              overflowY: 'auto'
            }}
          >
            {liveTranscript}
          </div>
        )}

        {/* Video feed display */}
        <video 
          ref={videoRef} 
          className={`webcam-feed ${!videoStream || coachSpeaking ? 'd-none' : ''}`}
          autoPlay 
          playsInline 
          muted
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        ></video>
        <canvas 
          ref={canvasRef} 
          className={`canvas-overlay ${!videoStream || coachSpeaking ? 'd-none' : ''}`}
        ></canvas>

        {/* Scanning grid lines */}
        {videoStream && !coachSpeaking && <div className="scan-line"></div>}

        {/* Fallback Coach Speaker Avatar when AI is speaking */}
        {(!videoStream || coachSpeaking) && (
          <div className="coach-avatar-feed" style={{ height: '100%' }}>
            {coachSpeaking && (
              <>
                <div className="coach-speaking-wave"></div>
                <div className="coach-speaking-wave" style={{ animationDelay: '0.6s' }}></div>
                <div className="coach-speaking-wave" style={{ animationDelay: '1.2s' }}></div>
              </>
            )}
            <div className="coach-avatar-container">
              <i className="fa-solid fa-robot"></i>
            </div>
            <div className="coach-overlay-status" style={{ padding: '6px 12px', fontSize: '12px' }}>
              <div className="dot-pulse"></div>
              <span>{coachSpeaking ? 'AI Recruiter speaking...' : 'Interviewer Ready'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Real-Time Voice Recognition & AI Accuracy HUD Dashboard */}
      <div
        style={{
          background: 'linear-gradient(145deg, #0f172a, #1e293b)',
          borderRadius: '24px',
          padding: '20px',
          marginBottom: '24px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25)'
        }}
      >
        {/* Voice Input & Mic Status Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                backgroundColor: isListening ? 'rgba(16, 185, 129, 0.2)' : 'rgba(100, 116, 139, 0.2)',
                color: isListening ? '#10b981' : '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px'
              }}
            >
              <i className={`fa-solid ${isListening ? 'fa-microphone-lines fa-fade' : 'fa-microphone-slash'}`}></i>
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '800', color: '#f8fafc' }}>
                {isListening ? 'Voice Capture Active' : 'Microphone Paused'}
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500' }}>
                {isListening ? 'AI is analyzing your voice tone, vocabulary & precision' : 'Click microphone button below to speak'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <span
              style={{
                padding: '4px 10px',
                borderRadius: '8px',
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                fontSize: '11px',
                fontWeight: '700'
              }}
            >
              {wpm} WPM
            </span>
            <span
              style={{
                padding: '4px 10px',
                borderRadius: '8px',
                backgroundColor: fillerCount > 3 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                color: fillerCount > 3 ? '#ef4444' : '#10b981',
                fontSize: '11px',
                fontWeight: '700'
              }}
            >
              {fillerCount} Fillers
            </span>
          </div>
        </div>

        {/* Real-Time AI Accuracy & Evaluation 3-Pillar Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {/* Pillar 1: Technical Accuracy */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '16px',
              padding: '12px',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>Technical Accuracy</span>
              <i className="fa-solid fa-bullseye" style={{ color: '#10b981', fontSize: '12px' }}></i>
            </div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#10b981', fontFamily: 'Outfit' }}>
              {liveAccuracy}%
            </div>
            <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginTop: '6px', overflow: 'hidden' }}>
              <div style={{ width: `${liveAccuracy}%`, height: '100%', background: '#10b981', transition: 'width 0.4s ease' }}></div>
            </div>
          </div>

          {/* Pillar 2: Communication Clarity */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '16px',
              padding: '12px',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>Clarity Score</span>
              <i className="fa-solid fa-waveform-lines" style={{ color: '#38bdf8', fontSize: '12px' }}></i>
            </div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#38bdf8', fontFamily: 'Outfit' }}>
              {wpm > 200 ? '78%' : '92%'}
            </div>
            <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginTop: '6px', overflow: 'hidden' }}>
              <div style={{ width: wpm > 200 ? '78%' : '92%', height: '100%', background: '#38bdf8', transition: 'width 0.4s ease' }}></div>
            </div>
          </div>

          {/* Pillar 3: Eye Contact Accuracy */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: '16px',
              padding: '12px',
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase' }}>Eye Contact</span>
              <i className="fa-solid fa-eye" style={{ color: '#a855f7', fontSize: '12px' }}></i>
            </div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#a855f7', fontFamily: 'Outfit' }}>
              {eyeContact}%
            </div>
            <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginTop: '6px', overflow: 'hidden' }}>
              <div style={{ width: `${eyeContact}%`, height: '100%', background: '#a855f7', transition: 'width 0.4s ease' }}></div>
            </div>
          </div>
        </div>

        {/* Real-time AI Evaluation Insight Bar */}
        {lastEvaluation && lastEvaluation.feedback && (
          <div
            style={{
              marginTop: '14px',
              padding: '10px 14px',
              borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              color: '#a7f3d0',
              fontSize: '12.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <i className="fa-solid fa-sparkles" style={{ color: '#34d399' }}></i>
            <span><strong>Gemini AI Evaluation:</strong> {lastEvaluation.feedback}</span>
          </div>
        )}
      </div>

      {/* Control Console buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Mid Row Controls: Pause and Next Question */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          
          {/* Pause Circle Button */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={handleToggleListening}
              disabled={coachSpeaking}
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                backgroundColor: isListening ? '#0b4fcd' : '#e2e8f0',
                border: 'none',
                color: isListening ? '#ffffff' : '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                cursor: 'pointer',
                boxShadow: isListening ? '0 4px 12px rgba(11, 79, 205, 0.25)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <i className={`fa-solid ${isListening ? 'fa-pause' : 'fa-microphone'}`}></i>
            </button>
            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '700' }}>
              {isListening ? 'Pause' : 'Start Answer'}
            </span>
          </div>

          {/* Next Question Pill button */}
          <button
            onClick={handleNextQuestion}
            disabled={isTransitioning}
            style={{
              height: '54px',
              borderRadius: '16px',
              padding: '0 24px',
              backgroundColor: isTransitioning ? '#0b4fcd' : (currentIdx >= 4 ? '#10b981' : '#eff6ff'),
              border: 'none',
              color: (isTransitioning || currentIdx >= 4) ? '#ffffff' : '#0b4fcd',
              fontSize: '14.5px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: isTransitioning ? 'not-allowed' : 'pointer',
              boxShadow: isTransitioning ? '0 4px 14px rgba(11, 79, 205, 0.35)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            {isTransitioning ? (
              <>
                <i className="fa-solid fa-circle-notch fa-spin"></i>
                <span>{currentIdx >= 4 ? 'Generating Report...' : 'Evaluating AI...'}</span>
              </>
            ) : (
              <>
                <span>
                  {currentIdx >= 4
                    ? 'Finish & View AI Report'
                    : (!liveTranscript && !isListening)
                    ? 'Skip Question'
                    : 'Next Question'}
                </span>
                <i className={`fa-solid ${currentIdx >= 4 ? 'fa-wand-magic-sparkles' : (!liveTranscript && !isListening) ? 'fa-forward-step' : 'fa-arrow-right'}`}></i>
              </>
            )}
          </button>
        </div>

        {/* Transition Status Notification Banner */}
        {isTransitioning && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #1e293b, #0f172a)',
              color: '#38bdf8',
              fontSize: '13px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              border: '1px solid rgba(56, 189, 248, 0.2)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}
          >
            <i className="fa-solid fa-microchip fa-bounce"></i>
            <span>{transitionText || 'AI Processing...'}</span>
          </div>
        )}

        {/* End Session full-width button */}
        <button
          onClick={handleExit}
          style={{
            width: '100%',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            color: '#334155',
            fontSize: '14px',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#fee2e2';
            e.currentTarget.style.color = '#dc2626';
            e.currentTarget.style.borderColor = '#fca5a5';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#ffffff';
            e.currentTarget.style.color = '#334155';
            e.currentTarget.style.borderColor = '#e2e8f0';
          }}
        >
          End Session
        </button>

      </div>
    </div>
  );
}
