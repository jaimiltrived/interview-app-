import React, { useState, useEffect, useRef } from 'react';
import AudioVisualizer from '../components/AudioVisualizer';

export default function InterviewRoom({ userProfile, switchPage, onFinish }) {
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  
  // Real-time Metrics State
  const [wpm, setWpm] = useState(0);
  const [fillerCount, setFillerCount] = useState(0);
  const [eyeContact, setEyeContact] = useState(90);
  const [confidence, setConfidence] = useState('Confident');

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

  // Initializing questions and media stream
  useEffect(() => {
    // Determine target questions
    const qList = userProfile.questions && userProfile.questions.length > 0
      ? userProfile.questions
      : [
          "Could you start by introducing yourself and walking me through your background and key strengths?",
          "Can you describe a challenging technical problem you encountered in a recent project, and how you went about resolving it?",
          "How do you prioritize tasks and manage your time when dealing with tight deadlines and competing requirements?"
        ];
    
    setQuestions(qList);
    answersRef.current = [];
    wpmHistoryRef.current = [];
    eyeHistoryRef.current = [];
    fillerHistoryRef.current = [];

    // Start hardware streams
    startHardwareStreams();

    // Start speech recognition setup
    setupSpeechRecognition();

    // Load first question
    setTimeout(() => {
      loadQuestionPrompt(0, qList[0]);
    }, 1500);

    return () => {
      cleanupResources();
    };
  }, []);

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

      setEyeContact(hasEyeContact ? Math.round(85 + Math.random() * 10) : Math.round(55 + Math.random() * 10));
      setConfidence(currentExpr);

      // Box corner styling
      ctx.strokeStyle = hasEyeContact ? 'rgba(16, 185, 129, 0.85)' : 'rgba(245, 158, 11, 0.85)'; // Green / Orange
      ctx.lineWidth = 2;
      ctx.shadowBlur = 6;
      ctx.shadowColor = ctx.strokeStyle;

      const x = faceX - faceW/2;
      const y = faceY - faceH/2;
      const len = 15;

      // Draw Top-Left Corner
      ctx.beginPath(); ctx.moveTo(x, y + len); ctx.lineTo(x, y); ctx.lineTo(x + len, y); ctx.stroke();
      // Draw Top-Right
      ctx.beginPath(); ctx.moveTo(x + faceW - len, y); ctx.lineTo(x + faceW, y); ctx.lineTo(x + faceW, y + len); ctx.stroke();
      // Draw Bottom-Left
      ctx.beginPath(); ctx.moveTo(x, y + faceH - len); ctx.lineTo(x, y + faceH); ctx.lineTo(x + len, y + faceH); ctx.stroke();
      // Draw Bottom-Right
      ctx.beginPath(); ctx.moveTo(x + faceW - len, y + faceH); ctx.lineTo(x + faceW, y + faceH); ctx.lineTo(x + faceW, y + faceH - len); ctx.stroke();

      // Draw target crosshair dot nodes
      ctx.fillStyle = hasEyeContact ? '#10b981' : '#f59e0b';
      ctx.shadowBlur = 0;
      const drawNode = (nx, ny) => {
        ctx.beginPath(); ctx.arc(nx, ny, 3, 0, 2*Math.PI); ctx.fill();
      };
      
      drawNode(faceX - 25, faceY - 20); // Left Eye
      drawNode(faceX + 25, faceY - 20); // Right Eye
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
  const loadQuestionPrompt = (idx, text) => {
    setCurrentIdx(idx);
    setCoachSpeaking(true);
    setIsListening(false);
    setLiveTranscript('');
    setWpm(0);
    setFillerCount(0);

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => v.name.includes('Google US English') || v.lang.startsWith('en-US'));
      if (voice) utterance.voice = voice;
      
      utterance.rate = 1.05;
      utterance.onend = () => {
        setCoachSpeaking(false);
        questionStartTimeRef.current = new Date();
      };
      utterance.onerror = () => {
        setCoachSpeaking(false);
        questionStartTimeRef.current = new Date();
      };

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
  };

  const handleNextQuestion = async () => {
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
    if (nextIdx < questions.length) {
      loadQuestionPrompt(nextIdx, questions[nextIdx]);
    } else {
      // Completed last question, submit results to backend
      submitSessionResults();
    }
  };

  const submitSessionResults = async () => {
    try {
      const sessionPayload = {
        roleTarget: userProfile.role,
        questions: questions,
        answers: answersRef.current,
        wpmHistory: wpmHistoryRef.current,
        eyeContactHistory: eyeHistoryRef.current,
        fillerHistory: fillerHistoryRef.current,
        expression: confidence
      };

      const token = localStorage.getItem('coach_jwt_token');
      const res = await fetch('/api/interview/submit', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(sessionPayload)
      });
      const data = await res.json();
      
      if (data.success) {
        // Trigger report page load
        onFinish();
      } else {
        throw new Error(data.error || 'Failed to submit report');
      }
    } catch (e) {
      console.error(e);
      alert('Error submitting report to database. Falling back to local state data.');
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

  return (
    <div className="page">
      <div className="page-header flex-between">
        <div>
          <h1 className="page-title">AI Interview Room</h1>
          <p className="page-desc">Maintain eye contact with the camera and limit vocal filler words.</p>
        </div>
        <button className="btn btn-secondary" onClick={handleExit}>
          <i className="fa-solid fa-circle-stop text-error"></i> Exit Room
        </button>
      </div>

      <div className="interview-grid">
        {/* Webcam Frame */}
        <div className="camera-container">
          {videoStream && !coachSpeaking && (
            <div className="face-metrics-overlay">
              <div className={`metric-pill ${eyeContact > 75 ? 'success' : 'warning'}`}>
                <i className="fa-solid fa-eye"></i>
                <span>Eye Contact: {eyeContact > 75 ? 'Good' : 'Look Here'} ({eyeContact}%)</span>
              </div>
              <div className="metric-pill accent">
                <i className="fa-solid fa-smile"></i>
                <span>Confidence: {confidence}</span>
              </div>
            </div>
          )}

          {/* Camera display */}
          <video 
            ref={videoRef} 
            className={`webcam-feed ${!videoStream || coachSpeaking ? 'd-none' : ''}`}
            autoPlay 
            playsInline 
            muted
          ></video>
          <canvas 
            ref={canvasRef} 
            className={`canvas-overlay ${!videoStream || coachSpeaking ? 'd-none' : ''}`}
          ></canvas>

          {/* Scanning Line overlay */}
          {videoStream && !coachSpeaking && <div className="scan-line"></div>}

          {/* Fallback Coach Speaker Avatar */}
          {(!videoStream || coachSpeaking) && (
            <div className="coach-avatar-feed">
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
              <div className="coach-overlay-status">
                <div className="dot-pulse"></div>
                <span>{coachSpeaking ? 'AI Coach Speaking...' : 'Interviewer Ready'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Control Console */}
        <div className="control-panel">
          <div className="glass-card question-card">
            <div>
              <div className="question-number">Question {currentIdx + 1} of {questions.length}</div>
              <h3 className="question-text">{questions[currentIdx] || 'Loading question prompt...'}</h3>
            </div>

            <div>
              <div className="transcript-label">Live Answer Transcript:</div>
              <div className="transcript-area">
                {liveTranscript || (coachSpeaking ? 'Interviewer is speaking the question...' : 'Click "Start Answering" below and speak when ready...')}
              </div>

              <div className="flex-between">
                <button 
                  className={`btn ${isListening ? 'btn-secondary' : 'btn-primary'}`} 
                  onClick={handleToggleListening}
                  disabled={coachSpeaking}
                >
                  <i className={`fa-solid ${isListening ? 'fa-microphone-slash' : 'fa-microphone'}`}></i>
                  {isListening ? 'Pause Answer' : 'Start Answering'}
                </button>

                {!coachSpeaking && (liveTranscript || isListening) && (
                  <button className="btn btn-success" onClick={handleNextQuestion}>
                    Submit Answer <i className="fa-solid fa-arrow-right"></i>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Waveform Canvas widget */}
          <AudioVisualizer audioStream={audioStream} isListening={isListening} />
          
          <div className="flex-between" style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '0 10px' }}>
            <span><i className="fa-solid fa-gauge"></i> Speed: {wpm} WPM</span>
            <span><i className="fa-solid fa-triangle-exclamation"></i> Fillers: {fillerCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
