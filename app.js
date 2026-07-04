/**
 * AI Interview Preparation Coach - Core JavaScript Controller
 */

class AIInterviewCoach {
    constructor() {
        // App State
        this.currentPage = 'dashboard';
        this.userProfile = {
            name: 'John Doe',
            role: 'Software Engineer',
            skills: ['JavaScript', 'System Design', 'Web APIs'],
            experience: '2 Years',
            questions: []
        };
        
        // Session Metrics State
        this.sessionHistory = [];
        this.currentSession = {
            active: false,
            questions: [],
            currentQuestionIdx: 0,
            answers: [], // Array of strings of answers
            wpmHistory: [],
            fillerCountHistory: [],
            eyeContactHistory: [],
            expressionsHistory: [],
            startTime: null,
            endTime: null
        };

        // Web Audio API State
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.audioStream = null;
        this.audioAnimId = null;

        // Camera Feed State
        this.videoStream = null;
        this.trackingAnimId = null;
        this.facePosition = { x: 0.5, y: 0.5, size: 0.25 };
        this.eyeContactDetected = true;
        this.currentExpression = 'Confident';

        // Speech Recognition (STT) State
        this.recognition = null;
        this.isListening = false;
        
        // Default general questions
        this.defaultQuestions = [
            "Could you start by introducing yourself and walking me through your background and key strengths?",
            "Can you describe a challenging technical problem you encountered in a recent project, and how you went about resolving it?",
            "How do you prioritize tasks and manage your time when dealing with tight deadlines and competing requirements?"
        ];

        // Chart Instance
        this.reportChart = null;

        // Binding Methods
        this.animateAudioVisualizer = this.animateAudioVisualizer.bind(this);
        this.animateFaceTracking = this.animateFaceTracking.bind(this);
    }

    init() {
        this.loadHistory();
        this.loadProfile();
        this.setupEventListeners();
        this.setupSpeechRecognition();
        
        // Show setup overlay if no saved name
        const savedName = localStorage.getItem('coach_user_name');
        if (!savedName) {
            document.getElementById('setupOverlay').classList.remove('d-none');
        } else {
            document.getElementById('setupOverlay').classList.add('d-none');
            this.updateDashboardUI();
        }
    }

    setupEventListeners() {
        // Setup Drag & Drop for Resume
        const dropzone = document.getElementById('dropzone');
        const fileInput = document.getElementById('resumeFileInput');

        if (dropzone) {
            ['dragenter', 'dragover'].forEach(eventName => {
                dropzone.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    dropzone.classList.add('dragover');
                }, false);
            });

            ['dragleave', 'drop'].forEach(eventName => {
                dropzone.addEventListener(eventName, (e) => {
                    e.preventDefault();
                    dropzone.classList.remove('dragover');
                }, false);
            });

            dropzone.addEventListener('drop', (e) => {
                const dt = e.dataTransfer;
                const files = dt.files;
                if (files.length) {
                    this.handleResumeFile(files[0]);
                }
            });

            fileInput.addEventListener('change', (e) => {
                if (e.target.files.length) {
                    this.handleResumeFile(e.target.files[0]);
                }
            });
        }
    }

    loadProfile() {
        const name = localStorage.getItem('coach_user_name');
        const role = localStorage.getItem('coach_user_role');
        const skills = localStorage.getItem('coach_user_skills');
        
        if (name) this.userProfile.name = name;
        if (role) this.userProfile.role = role;
        if (skills) this.userProfile.skills = JSON.parse(skills);

        // Sync to UI
        document.getElementById('sidebarName').textContent = this.userProfile.name;
        document.getElementById('sidebarTitle').textContent = this.userProfile.role;
        document.getElementById('dashWelcomeName').textContent = this.userProfile.name;
        document.getElementById('profileRole').textContent = this.userProfile.role;
        document.getElementById('profileFocus').textContent = this.userProfile.skills.slice(0, 3).join(', ');
        
        // Generate initial avatar letters
        const initials = this.userProfile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        document.getElementById('sidebarAvatar').textContent = initials || 'ME';
    }

    saveSetup() {
        const nameInput = document.getElementById('setupName').value.trim();
        const roleInput = document.getElementById('setupRole').value.trim();
        
        if (!nameInput) {
            alert("Please enter your name.");
            return;
        }

        this.userProfile.name = nameInput;
        this.userProfile.role = roleInput || 'Software Engineer';
        
        // Mock default skills based on role
        if (roleInput.toLowerCase().includes('react') || roleInput.toLowerCase().includes('frontend')) {
            this.userProfile.skills = ['React.js', 'JavaScript', 'CSS Grid', 'Tailwind CSS'];
        } else if (roleInput.toLowerCase().includes('laravel') || roleInput.toLowerCase().includes('php') || roleInput.toLowerCase().includes('backend')) {
            this.userProfile.skills = ['PHP', 'Laravel', 'MySQL', 'REST APIs'];
        } else {
            this.userProfile.skills = ['Algorithms', 'Problem Solving', 'System Design'];
        }

        // Save
        localStorage.setItem('coach_user_name', this.userProfile.name);
        localStorage.setItem('coach_user_role', this.userProfile.role);
        localStorage.setItem('coach_user_skills', JSON.stringify(this.userProfile.skills));
        
        // Update UI
        this.loadProfile();
        this.updateDashboardUI();

        // Close Overlay
        document.getElementById('setupOverlay').classList.add('d-none');
    }

    loadHistory() {
        const saved = localStorage.getItem('coach_session_history');
        if (saved) {
            this.sessionHistory = JSON.parse(saved);
        }
    }

    saveHistory() {
        localStorage.setItem('coach_session_history', JSON.stringify(this.sessionHistory));
    }

    switchPage(pageId) {
        // Stop any running stream or recording loop if exiting interview room
        if (this.currentPage === 'interview' && pageId !== 'interview') {
            this.stopMediaStreams();
        }

        this.currentPage = pageId;
        
        // Toggle Active Classes in sidebar
        const menuItems = document.querySelectorAll('.sidebar .menu-item');
        menuItems.forEach(item => {
            const clickAttr = item.getAttribute('onclick');
            if (clickAttr && clickAttr.includes(pageId)) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // Toggle Active Pages
        const pages = document.querySelectorAll('.main-content .page');
        pages.forEach(page => {
            if (page.id === `page-${pageId}`) {
                page.classList.add('active');
            } else {
                page.classList.remove('active');
            }
        });

        // Handle specific page initializations
        if (pageId === 'dashboard') {
            this.updateDashboardUI();
        }
    }

    updateDashboardUI() {
        document.getElementById('dashTotalSessions').textContent = this.sessionHistory.length;
        
        if (this.sessionHistory.length > 0) {
            const sum = this.sessionHistory.reduce((acc, item) => acc + item.overallScore, 0);
            const avg = Math.round(sum / this.sessionHistory.length);
            document.getElementById('dashAvgScore').textContent = `${avg}%`;
            
            const totalMins = Math.round((this.sessionHistory.length * 6) / 1); // Mock 6 mins average per practice
            document.getElementById('dashPracticeTime').textContent = `${totalMins} mins`;
        } else {
            document.getElementById('dashAvgScore').textContent = '--';
            document.getElementById('dashPracticeTime').textContent = '0 mins';
        }

        // Render history table
        const tbody = document.getElementById('historyTableBody');
        if (this.sessionHistory.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center" style="color: var(--text-muted); padding: 30px;">
                        No recent practice sessions. Complete your first interview to see history!
                    </td>
                </tr>
            `;
        } else {
            tbody.innerHTML = this.sessionHistory.map(session => {
                const date = new Date(session.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'});
                return `
                    <tr>
                        <td>${date}</td>
                        <td><strong>${session.roleTarget}</strong></td>
                        <td><span class="badge secondary" style="font-size: 13px;">${session.overallScore}%</span></td>
                        <td>${session.technicalScore}%</td>
                        <td>${session.communicationScore}%</td>
                        <td>
                            <button class="btn btn-secondary" onclick="app.showHistoricalReport('${session.id}')" style="padding: 6px 12px; font-size:12px;">
                                <i class="fa-solid fa-eye"></i> View Report
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        }
    }

    // --- Media Testing ---
    async requestMediaPermissions() {
        const testStatus = document.getElementById('deviceTestStatus');
        testStatus.textContent = "Connecting to camera/mic...";
        testStatus.style.color = "var(--text-muted)";
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            // Release the stream immediately
            stream.getTracks().forEach(track => track.stop());
            testStatus.textContent = "Devices successfully connected! Ready to go.";
            testStatus.style.color = "var(--success)";
            
            const btn = document.getElementById('btnTestDevices');
            btn.innerHTML = `<i class="fa-solid fa-circle-check"></i> Connected`;
            btn.className = "btn btn-success";
        } catch (err) {
            console.error(err);
            testStatus.textContent = "Permission Denied or Devices Not Found. Please check settings.";
            testStatus.style.color = "var(--error)";
        }
    }

    // --- Resume Upload & Parser Mock ---
    handleResumeFile(file) {
        const parserProgress = document.getElementById('parserProgress');
        const parserProgressFill = document.getElementById('parserProgressFill');
        const parserStatusText = document.getElementById('parserStatusText');
        const parserResults = document.getElementById('parserResults');
        const dropzone = document.getElementById('dropzone');

        dropzone.classList.add('d-none');
        parserProgress.style.display = 'block';
        parserResults.classList.add('d-none');

        // Reading file and finding keywords (skills)
        const reader = new FileReader();
        reader.onload = (e) => {
            const fileText = e.target.result || "";
            this.parseResumeKeywords(file.name, fileText);
        };
        reader.readAsText(file);
    }

    parseResumeKeywords(fileName, textContent) {
        const parserProgressFill = document.getElementById('parserProgressFill');
        const parserStatusText = document.getElementById('parserStatusText');
        const parserResults = document.getElementById('parserResults');
        const parserProgress = document.getElementById('parserProgress');

        // Extracting profile matching details
        let inferredRole = "Software Engineer";
        let extractedSkills = [];
        let experience = "2-3 Years";
        let candidateName = this.userProfile.name;

        // Simple mock parse sequences
        const steps = [
            { text: "Reading PDF document metadata...", duration: 600, pct: 25 },
            { text: "Analyzing technology stacks and projects...", duration: 800, pct: 60 },
            { text: "Extracting skills and mapping key terms...", duration: 600, pct: 90 },
            { text: "Tailoring personalized AI questions...", duration: 500, pct: 100 }
        ];

        let stepIdx = 0;
        const runStep = () => {
            if (stepIdx < steps.length) {
                const current = steps[stepIdx];
                parserStatusText.innerHTML = `<i class="fa-solid fa-circle-notch"></i> ${current.text}`;
                parserProgressFill.style.width = `${current.pct}%`;
                stepIdx++;
                setTimeout(runStep, current.duration);
            } else {
                // Done parsing, analyze text content
                const cleanedText = textContent.toLowerCase();

                // Scan common keywords
                const techSkills = {
                    'React': ['react', 'react.js', 'redux', 'hooks', 'jsx'],
                    'JavaScript': ['javascript', 'js', 'es6', 'typescript', 'ts'],
                    'Laravel': ['laravel', 'php', 'composer', 'eloquent'],
                    'Python': ['python', 'fastapi', 'flask', 'django', 'uvicorn'],
                    'MySQL': ['mysql', 'sql', 'database', 'postgresql', 'queries'],
                    'Firebase': ['firebase', 'firestore', 'auth', 'nosql'],
                    'Tailwind': ['tailwind', 'css', 'flexbox', 'grid'],
                    'HTML/CSS': ['html5', 'css3', 'sass', 'responsive'],
                    'Git': ['git', 'github', 'version control'],
                    'Node.js': ['node', 'node.js', 'express', 'backend']
                };

                for (const [skill, keywords] of Object.entries(techSkills)) {
                    if (keywords.some(kw => cleanedText.includes(kw) || fileName.toLowerCase().includes(kw))) {
                        extractedSkills.push(skill);
                    }
                }

                // If no skills found, assign defaults
                if (extractedSkills.length === 0) {
                    extractedSkills = ['React.js', 'JavaScript', 'CSS Grid', 'Tailwind CSS'];
                }

                // Inferred role based on skills
                if (extractedSkills.includes('Laravel') || extractedSkills.includes('PHP')) {
                    inferredRole = "Fullstack Engineer (Laravel & Vue/React)";
                    this.userProfile.questions = [
                        "Can you explain the life cycle of a request in Laravel, specifically how Middleware works?",
                        "How do you design database relations in Laravel Eloquent and avoid the N+1 query problem?",
                        "Tell me about a time you had to build a RESTful API. How did you structure the endpoints and handle authorization?"
                    ];
                } else if (extractedSkills.includes('React') || extractedSkills.includes('JavaScript')) {
                    inferredRole = "Frontend Developer (React)";
                    this.userProfile.questions = [
                        "What is the Virtual DOM in React, and how do React Hooks like useEffect manage state synchronization?",
                        "How do you optimize performance in a React application with heavy rendering loads?",
                        "Explain the difference between flexbox and grid, and how you make layouts fully responsive."
                    ];
                } else if (extractedSkills.includes('Python')) {
                    inferredRole = "Backend Python Developer";
                    this.userProfile.questions = [
                        "Explain how asynchronous programming works in Python FastAPI using async/await keywords.",
                        "How do you handle database migrations, serialization, and connection pooling in a backend application?",
                        "How do you secure API endpoints against common threats like SQL injection and cross-site scripting?"
                    ];
                } else {
                    inferredRole = "Software Engineer";
                    this.userProfile.questions = this.defaultQuestions;
                }

                // Experience mock estimation based on text content (searching for numbers of years)
                if (cleanedText.includes('senior') || cleanedText.includes('lead') || cleanedText.includes('5 years') || cleanedText.includes('6 years')) {
                    experience = "5+ Years (Senior)";
                } else if (cleanedText.includes('3 years') || cleanedText.includes('4 years')) {
                    experience = "3-4 Years (Mid-level)";
                } else {
                    experience = "1-2 Years (Associate)";
                }

                // Update Profile object
                this.userProfile.role = inferredRole;
                this.userProfile.skills = extractedSkills;
                this.userProfile.experience = experience;

                // Update UI elements
                document.getElementById('resExtName').textContent = candidateName;
                document.getElementById('resExtRole').textContent = inferredRole;
                document.getElementById('resExtExp').textContent = experience;
                
                const skillContainer = document.getElementById('resExtSkills');
                skillContainer.innerHTML = extractedSkills.map(sk => `<span class="badge primary">${sk}</span>`).join('');
                
                const questionsContainer = document.getElementById('resExtQuestions');
                questionsContainer.innerHTML = this.userProfile.questions.map(q => `<li><i class="fa-solid fa-chevron-right text-success"></i> ${q}</li>`).join('');

                // Display results
                parserProgress.style.display = 'none';
                parserResults.classList.remove('d-none');
            }
        };

        // Run animations
        runStep();
    }

    resetParser() {
        document.getElementById('dropzone').classList.remove('d-none');
        document.getElementById('parserResults').classList.add('d-none');
        document.getElementById('resumeFileInput').value = '';
    }

    startInterviewFromResume() {
        this.startSession(this.userProfile.questions);
    }

    startDirectInterview() {
        this.userProfile.questions = this.defaultQuestions;
        this.startSession(this.defaultQuestions);
    }

    // --- Interview Room Engine ---
    async startSession(questions) {
        this.currentSession.active = true;
        this.currentSession.questions = questions;
        this.currentSession.currentQuestionIdx = 0;
        this.currentSession.answers = [];
        this.currentSession.wpmHistory = [];
        this.currentSession.fillerCountHistory = [];
        this.currentSession.eyeContactHistory = [];
        this.currentSession.expressionsHistory = [];
        this.currentSession.startTime = new Date();

        this.switchPage('interview');

        // Update indicators
        document.getElementById('questionNumberIndicator').textContent = `Question 1 of ${questions.length}`;
        document.getElementById('activeQuestionText').textContent = "Preparing AI Interviewer...";
        document.getElementById('liveTranscriptText').innerHTML = `<i>Waiting for coach to finish speaking the question...</i>`;
        
        document.getElementById('btnSpeakToggle').disabled = true;
        document.getElementById('btnSpeakToggle').innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Coach Speaking...`;
        document.getElementById('btnSubmitAnswer').classList.add('d-none');
        document.getElementById('btnSkipQuestion').classList.add('d-none');

        // Start hardware connections
        await this.startVideoCamera();
        this.startAudioVisualizer();

        // Speak the first question
        setTimeout(() => {
            this.loadQuestion(0);
        }, 1500);
    }

    loadQuestion(idx) {
        this.currentSession.currentQuestionIdx = idx;
        const questionText = this.currentSession.questions[idx];

        document.getElementById('questionNumberIndicator').textContent = `Question ${idx + 1} of ${this.currentSession.questions.length}`;
        document.getElementById('activeQuestionText').textContent = questionText;
        document.getElementById('liveTranscriptText').innerHTML = `<i>Waiting for coach to finish speaking...</i>`;
        
        // Visual cue of coach speaking
        document.getElementById('coachAvatarFeed').classList.remove('d-none');
        document.getElementById('coachSpeechStatus').textContent = "AI Coach Speaking...";
        document.getElementById('btnSpeakToggle').disabled = true;
        document.getElementById('btnSpeakToggle').innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Coach Speaking...`;
        document.getElementById('btnSubmitAnswer').classList.add('d-none');
        document.getElementById('btnSkipQuestion').classList.add('d-none');

        // Reset metrics indicators
        document.getElementById('speechWpmIndicator').innerHTML = `<i class="fa-solid fa-gauge"></i> Speed: 0 WPM`;
        document.getElementById('speechFillerIndicator').innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Filler Words: 0`;

        // TTS Speech Synthesis
        this.speakQuestionAloud(questionText, () => {
            // Callback when coach finishes speaking
            document.getElementById('coachAvatarFeed').classList.add('d-none');
            document.getElementById('btnSpeakToggle').disabled = false;
            document.getElementById('btnSpeakToggle').innerHTML = `<i class="fa-solid fa-microphone"></i> Start Answering`;
            document.getElementById('liveTranscriptText').innerHTML = `<i>Coach is listening. Click "Start Answering" to record your response.</i>`;
        });
    }

    speakQuestionAloud(text, onEndCallback) {
        if ('speechSynthesis' in window) {
            // Cancel current speaker
            window.speechSynthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(text);
            
            // Try to find a pleasant natural voice
            const voices = window.speechSynthesis.getVoices();
            const preferredVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Natural') || v.lang.startsWith('en-US'));
            if (preferredVoice) {
                utterance.voice = preferredVoice;
            }
            utterance.rate = 1.0;

            utterance.onend = () => {
                onEndCallback();
            };

            utterance.onerror = () => {
                onEndCallback();
            };

            window.speechSynthesis.speak(utterance);
        } else {
            // Fallback immediately if synthesis is unsupported
            setTimeout(onEndCallback, 2000);
        }
    }

    setupSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
            this.recognition.lang = 'en-US';

            this.recognition.onresult = (event) => {
                let interimTranscript = '';
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    } else {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }

                // Gather current answer string
                const currentText = (this.tempAccumulatedTranscript + ' ' + finalTranscript + ' ' + interimTranscript).trim();
                document.getElementById('liveTranscriptText').textContent = currentText || "Speaking...";
                
                // Track stats in real-time
                this.calculateLiveStats(currentText);
            };

            this.recognition.onerror = (e) => {
                console.error("Speech Recognition Error: ", e);
            };

            this.recognition.onend = () => {
                if (this.isListening) {
                    // Auto-restart if we didn't explicitly stop it (safeguard for timeouts)
                    try { this.recognition.start(); } catch(e) {}
                }
            };
        }
    }

    toggleListening() {
        if (!this.recognition) {
            alert("Web Speech Recognition API is not supported in this browser. Please use Google Chrome or Edge.");
            return;
        }

        const btn = document.getElementById('btnSpeakToggle');
        
        if (!this.isListening) {
            // Start Listening
            this.isListening = true;
            this.tempAccumulatedTranscript = '';
            document.getElementById('liveTranscriptText').textContent = 'Listening... Start speaking now!';
            
            btn.innerHTML = `<i class="fa-solid fa-microphone-slash"></i> Pause Answer`;
            btn.className = "btn btn-secondary";
            
            document.getElementById('btnSubmitAnswer').classList.remove('d-none');
            document.getElementById('btnSkipQuestion').classList.remove('d-none');

            try {
                this.recognition.start();
            } catch(e) { console.log(e); }
        } else {
            // Stop/Pause Listening
            this.isListening = false;
            btn.innerHTML = `<i class="fa-solid fa-microphone"></i> Resume Answer`;
            btn.className = "btn btn-primary";
            
            try {
                this.recognition.stop();
            } catch(e) { console.log(e); }
        }
    }

    calculateLiveStats(text) {
        if (!text) return;

        // 1. WPM calculation
        const words = text.split(/\s+/).filter(Boolean);
        const wordCount = words.length;
        
        // Calculate duration in minutes since start of answering
        const elapsedSecs = (new Date() - this.questionAnswerStart) / 1000 || 1;
        const mins = elapsedSecs / 60;
        const wpm = Math.round(wordCount / mins) || 0;
        
        document.getElementById('speechWpmIndicator').innerHTML = `<i class="fa-solid fa-gauge"></i> Speed: ${wpm} WPM`;

        // 2. Filler words calculation
        const fillerList = ['um', 'uh', 'ah', 'like', 'basically', 'actually', 'so', 'you know', 'literally'];
        let fillerCount = 0;
        words.forEach(w => {
            const cleanWord = w.toLowerCase().replace(/[^a-z]/g, '');
            if (fillerList.includes(cleanWord)) {
                fillerCount++;
            }
        });
        
        document.getElementById('speechFillerIndicator').innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Filler Words: ${fillerCount}`;
    }

    nextQuestion() {
        // Stop current speech recognition
        this.isListening = false;
        if (this.recognition) {
            try { this.recognition.stop(); } catch(e) {}
        }

        // Save answer content
        const finalAnswerText = document.getElementById('liveTranscriptText').textContent.trim();
        this.currentSession.answers.push(finalAnswerText || "No answer recorded.");

        // Record metrics for this question
        const words = finalAnswerText.split(/\s+/).filter(Boolean);
        const elapsedSecs = (new Date() - this.questionAnswerStart) / 1000 || 1;
        const wpm = Math.round(words.length / (elapsedSecs / 60)) || 135; // default reasonable fallback
        
        const fillerList = ['um', 'uh', 'ah', 'like', 'basically', 'actually', 'so', 'you know', 'literally'];
        let fillers = 0;
        words.forEach(w => {
            const cleanWord = w.toLowerCase().replace(/[^a-z]/g, '');
            if (fillerList.includes(cleanWord)) fillers++;
        });

        // Store summaries
        this.currentSession.wpmHistory.push(wpm > 250 ? 140 : wpm); // cap out excessive glitches
        this.currentSession.fillerCountHistory.push(fillers);
        
        // Mock eye contact score for this interval (e.g. 75% - 95%)
        const avgEye = Math.round(80 + Math.random() * 15);
        this.currentSession.eyeContactHistory.push(avgEye);
        this.currentSession.expressionsHistory.push(this.currentExpression);

        const nextIdx = this.currentSession.currentQuestionIdx + 1;
        if (nextIdx < this.currentSession.questions.length) {
            // Load next question
            this.questionAnswerStart = new Date();
            this.loadQuestion(nextIdx);
        } else {
            // Complete Interview
            this.finishInterview();
        }
    }

    endInterviewEarly() {
        if (confirm("Are you sure you want to stop the interview? Your progress won't be saved.")) {
            this.stopMediaStreams();
            this.switchPage('dashboard');
        }
    }

    finishInterview() {
        this.stopMediaStreams();
        this.currentSession.endTime = new Date();
        this.currentSession.active = false;

        // Compile results & save to history
        const sessionReport = this.compileSessionMetrics();
        this.sessionHistory.unshift(sessionReport); // add to top of list
        this.saveHistory();

        // Render report
        this.renderFeedbackReport(sessionReport);
        this.switchPage('report');
    }

    compileSessionMetrics() {
        // Technical Evaluation logic based on keyword completeness
        let totalKeywordsMatched = 0;
        const keyVocab = [
            'react', 'hook', 'component', 'state', 'props', 'rendering', 'virtual dom',
            'laravel', 'php', 'middleware', 'database', 'eloquent', 'query', 'relations', 'n+1',
            'api', 'fastapi', 'async', 'await', 'asynchronous', 'security', 'sql', 'index',
            'design', 'optimize', 'scalability', 'performance', 'flexbox', 'grid', 'responsive'
        ];

        this.currentSession.answers.forEach(ans => {
            const lowercase = ans.toLowerCase();
            keyVocab.forEach(vocab => {
                if (lowercase.includes(vocab)) totalKeywordsMatched++;
            });
        });

        // Technical score math (min 60, max 98 based on technical vocabulary matched)
        const techScore = Math.min(98, Math.max(60, 60 + (totalKeywordsMatched * 4)));

        // Communication Score (penalized for filler words and non-optimal speed)
        const totalFiller = this.currentSession.fillerCountHistory.reduce((a, b) => a + b, 0);
        const avgWpm = Math.round(this.currentSession.wpmHistory.reduce((a, b) => a + b, 0) / this.currentSession.wpmHistory.length);
        
        let commScore = 95;
        // Pacing deduction (Optimal is 120-160)
        if (avgWpm < 110) commScore -= 10;
        if (avgWpm > 170) commScore -= 12;
        // Filler words deduction
        commScore -= Math.min(25, totalFiller * 2.5);
        commScore = Math.max(55, Math.round(commScore));

        // Eye Contact Overall
        const avgEye = Math.round(this.currentSession.eyeContactHistory.reduce((a, b) => a + b, 0) / this.currentSession.eyeContactHistory.length) || 88;

        // Overall Score (Weighted combination)
        const overallScore = Math.round((techScore * 0.4) + (commScore * 0.4) + (avgEye * 0.2));

        return {
            id: 'sess_' + Date.now(),
            date: new Date().toISOString(),
            roleTarget: this.userProfile.role,
            overallScore: overallScore,
            technicalScore: techScore,
            communicationScore: commScore,
            avgWpm: avgWpm,
            totalFiller: totalFiller,
            avgEyeContact: avgEye,
            expression: this.currentExpression,
            questions: this.currentSession.questions,
            answers: this.currentSession.answers,
            wpmHistory: this.currentSession.wpmHistory,
            eyeContactHistory: this.currentSession.eyeContactHistory,
            fillerHistory: this.currentSession.fillerCountHistory
        };
    }

    renderFeedbackReport(report) {
        // Circular Score Gauges
        document.getElementById('scoreOverallText').textContent = `${report.overallScore}%`;
        this.animateCircleOffset('scoreOverallFill', report.overallScore);

        document.getElementById('scoreTechText').textContent = `${report.technicalScore}%`;
        this.animateCircleOffset('scoreTechFill', report.technicalScore);

        document.getElementById('scoreCommText').textContent = `${report.communicationScore}%`;
        this.animateCircleOffset('scoreCommFill', report.communicationScore);

        // Sidebar Metrics Box
        document.getElementById('repPacing').innerHTML = `<strong>${report.avgWpm} WPM</strong> (Ideal is 120-160 WPM)`;
        document.getElementById('repFiller').innerHTML = `<strong>${report.totalFiller}</strong> instances detected`;
        document.getElementById('repEyeContact').innerHTML = `<strong>${report.avgEyeContact}%</strong> camera alignment`;
        document.getElementById('repExpression').innerHTML = `<strong>${report.expression}</strong>`;

        // Render Q&A transcripts
        const transContainer = document.getElementById('fullReportTranscripts');
        transContainer.innerHTML = report.questions.map((q, idx) => {
            const ans = report.answers[idx] || "No answer recorded.";
            return `
                <div style="border-left: 2px solid var(--border-color); padding-left: 15px; margin-bottom: 10px;">
                    <div style="font-weight: 700; color: var(--secondary); font-size:13px; margin-bottom: 5px;">QUESTION ${idx + 1}</div>
                    <div style="font-weight: 600; font-size:15px; margin-bottom: 8px;">"${q}"</div>
                    <div style="font-size:11px; text-transform:uppercase; color: var(--text-muted); margin-bottom: 3px;">Your Response:</div>
                    <div style="font-size:14px; line-height: 1.5; color: var(--text-main); font-style: italic;">"${ans}"</div>
                </div>
            `;
        }).join('');

        // Generate dynamic advice cards
        const adviceContainer = document.getElementById('coachingSuggestionsBox');
        const advice = [];

        if (report.avgWpm < 110) {
            advice.push({
                type: 'warning',
                icon: '<i class="fa-solid fa-gauge-simple-high"></i>',
                title: 'Increase Speech Pace',
                text: `Your pacing was ${report.avgWpm} WPM. Try to speak a bit more dynamically to project energy and confidence. Aim for around 130 WPM.`
            });
        } else if (report.avgWpm > 170) {
            advice.push({
                type: 'warning',
                icon: '<i class="fa-solid fa-gauge-simple"></i>',
                title: 'Slow Down Pacing',
                text: `Your speaking speed was ${report.avgWpm} WPM. Talking too fast can dilute clarity. Practice pausing between sentences.`
            });
        } else {
            advice.push({
                type: 'success',
                icon: '<i class="fa-solid fa-circle-check"></i>',
                title: 'Excellent Speech Pacing',
                text: `Your speed of ${report.avgWpm} WPM falls perfectly within the optimal human conversational range (120-160 WPM).`
            });
        }

        if (report.totalFiller > 5) {
            advice.push({
                type: 'warning',
                icon: '<i class="fa-solid fa-triangle-exclamation"></i>',
                title: 'Reduce Filler Word Count',
                text: `We noted ${report.totalFiller} instances of filler words like 'um', 'like', and 'basically'. Replace these fillers with brief pauses.`
            });
        } else {
            advice.push({
                type: 'success',
                icon: '<i class="fa-solid fa-check"></i>',
                title: 'Clear Speech Clarity',
                text: `Outstanding job maintaining structural vocabulary without fillers! You communicated ideas concisely.`
            });
        }

        if (report.avgEyeContact < 80) {
            advice.push({
                type: 'info',
                icon: '<i class="fa-solid fa-eye-slash"></i>',
                title: 'Eye Contact Alignment',
                text: `Your eye contact score was ${report.avgEyeContact}%. Remember to look directly at your webcam rather than looking at your own screen elements.`
            });
        } else {
            advice.push({
                type: 'success',
                icon: '<i class="fa-solid fa-camera"></i>',
                title: 'Excellent Camera Focus',
                text: `You maintained a high eye contact score of ${report.avgEyeContact}%, projecting engagement to remote interviewers.`
            });
        }

        adviceContainer.innerHTML = advice.map(ad => `
            <div class="suggestion-item ${ad.type}">
                <div class="suggestion-item-icon">${ad.icon}</div>
                <div class="suggestion-item-text">
                    <h4>${ad.title}</h4>
                    <p>${ad.text}</p>
                </div>
            </div>
        `).join('');

        // Generate Chart.js analytics graph
        this.renderSessionChart(report);
    }

    animateCircleOffset(circleId, score) {
        const circle = document.getElementById(circleId);
        if (circle) {
            const radius = circle.r.baseVal.value;
            const circumference = 2 * Math.PI * radius;
            const offset = circumference - (score / 100) * circumference;
            circle.style.strokeDasharray = `${circumference}`;
            
            // Trigger layout reflow to activate CSS animation
            setTimeout(() => {
                circle.style.strokeDashoffset = `${offset}`;
            }, 50);
        }
    }

    renderSessionChart(report) {
        const ctx = document.getElementById('performanceChart');
        if (!ctx) return;

        // Destroy previous chart if exists
        if (this.reportChart) {
            this.reportChart.destroy();
        }

        const labels = report.questions.map((_, i) => `Q${i + 1}`);

        this.reportChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Speaking Speed (WPM)',
                        data: report.wpmHistory,
                        backgroundColor: 'rgba(6, 182, 212, 0.4)',
                        borderColor: 'rgba(6, 182, 212, 1)',
                        borderWidth: 2,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Eye Contact (%)',
                        data: report.eyeContactHistory,
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
    }

    showHistoricalReport(sessionId) {
        const report = this.sessionHistory.find(s => s.id === sessionId);
        if (report) {
            this.renderFeedbackReport(report);
            this.switchPage('report');
        }
    }

    restartInterview() {
        this.startSession(this.userProfile.questions);
    }

    // --- Media Hardware Streams ---
    async startVideoCamera() {
        const video = document.getElementById('webcam');
        
        try {
            // Attempt to fetch camera stream
            this.videoStream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
            video.srcObject = this.videoStream;
            video.classList.remove('d-none');
            
            // Start Face Tracking simulation
            this.startFaceTrackingLoop();
        } catch (err) {
            console.warn("Webcam access denied or unavailable. Falling back to Coach Avatar visualizer.", err);
            // Hide camera, show coach avatar feed in its place
            video.classList.add('d-none');
            document.getElementById('coachAvatarFeed').classList.remove('d-none');
            document.getElementById('coachSpeechStatus').textContent = "Camera disabled. Ready.";
        }
    }

    startAudioVisualizer() {
        const audioVisualizerCanvas = document.getElementById('audioVisualizer');
        if (!audioVisualizerCanvas) return;

        // Reset indicators
        this.questionAnswerStart = new Date();

        // Check if Web Audio context can be created
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;

        navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
            this.audioStream = stream;
            this.audioContext = new AudioContext();
            const source = this.audioContext.createMediaStreamSource(stream);
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;

            source.connect(this.analyser);
            const bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(bufferLength);

            this.animateAudioVisualizer();
        }).catch(err => {
            console.warn("Audio Context setup failed (mic denied). Drawing simulated silent audio waves.", err);
            this.animateAudioVisualizerSimulated();
        });
    }

    animateAudioVisualizer() {
        const canvas = document.getElementById('audioVisualizer');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width = canvas.offsetWidth;
        const height = canvas.height = canvas.offsetHeight;

        this.audioAnimId = requestAnimationFrame(this.animateAudioVisualizer);

        if (this.analyser && this.dataArray) {
            this.analyser.getByteFrequencyData(this.dataArray);
            
            // Calculate decibels volume index
            let sum = 0;
            for (let i = 0; i < this.dataArray.length; i++) {
                sum += this.dataArray[i];
            }
            const volumeDb = Math.round(sum / this.dataArray.length);
            document.getElementById('visualizerVolume').textContent = `${volumeDb}dB`;
            
            ctx.clearRect(0, 0, width, height);

            // Draw glowing bars
            const barWidth = (width / this.dataArray.length) * 1.5;
            let barHeight;
            let x = 0;

            for (let i = 0; i < this.dataArray.length; i++) {
                barHeight = (this.dataArray[i] / 255) * height * 0.9;

                // Color gradients Cyber Cyan to Cyber Purple
                const grad = ctx.createLinearGradient(0, height - barHeight, 0, height);
                grad.addColorStop(0, '#06b6d4');
                grad.addColorStop(1, '#8b5cf6');

                ctx.fillStyle = grad;
                ctx.shadowBlur = 4;
                ctx.shadowColor = 'rgba(6, 182, 212, 0.4)';
                
                // Draw rounded rects
                this.drawRoundedRect(ctx, x, height - barHeight, barWidth - 2, barHeight, 3);
                
                x += barWidth;
            }
        }
    }

    animateAudioVisualizerSimulated() {
        const canvas = document.getElementById('audioVisualizer');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let phase = 0;

        const loop = () => {
            const width = canvas.width = canvas.offsetWidth;
            const height = canvas.height = canvas.offsetHeight;

            ctx.clearRect(0, 0, width, height);

            ctx.beginPath();
            ctx.strokeStyle = 'rgba(139, 92, 246, 0.4)';
            ctx.lineWidth = 2;
            
            // Draw a simulated sine wave representing passive listening
            const amp = this.isListening ? 15 : 2; // jump if answering
            for (let x = 0; x < width; x++) {
                const y = height / 2 + Math.sin(x * 0.05 + phase) * amp;
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();

            phase += 0.15;
            this.audioAnimId = requestAnimationFrame(loop);
        };
        
        this.audioAnimId = requestAnimationFrame(loop);
    }

    drawRoundedRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height);
        ctx.lineTo(x, y + height);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();
    }

    startFaceTrackingLoop() {
        this.startFaceTrackingSimulation();
    }

    startFaceTrackingSimulation() {
        const canvas = document.getElementById('trackingCanvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let frameCount = 0;

        const loop = () => {
            const width = canvas.width = canvas.offsetWidth;
            const height = canvas.height = canvas.offsetHeight;

            ctx.clearRect(0, 0, width, height);
            frameCount++;

            // Create smooth floating movement simulating face tracking coordinates
            const time = frameCount * 0.02;
            const targetX = width * 0.5 + Math.sin(time) * 30;
            const targetY = height * 0.45 + Math.cos(time * 0.7) * 15;
            const faceW = 140 + Math.sin(time * 1.5) * 5;
            const faceH = 180 + Math.sin(time * 1.5) * 5;

            // Decide tracking indicators
            this.eyeContactDetected = Math.sin(time * 3) > -0.85; // Mostly looking at camera
            this.currentExpression = (Math.sin(time * 0.5) > 0.2) ? 'Smiling' : 'Confident';

            // Draw bounding tracking green target box
            ctx.strokeStyle = this.eyeContactDetected ? 'rgba(16, 185, 129, 0.8)' : 'rgba(245, 158, 11, 0.8)';
            ctx.lineWidth = 2.5;
            ctx.shadowBlur = 8;
            ctx.shadowColor = ctx.strokeStyle;
            
            // Draw box corners
            const x = targetX - faceW/2;
            const y = targetY - faceH/2;
            const len = 20;

            // Top Left corner
            ctx.beginPath();
            ctx.moveTo(x, y + len); ctx.lineTo(x, y); ctx.lineTo(x + len, y);
            ctx.stroke();

            // Top Right
            ctx.beginPath();
            ctx.moveTo(x + faceW - len, y); ctx.lineTo(x + faceW, y); ctx.lineTo(x + faceW, y + len);
            ctx.stroke();

            // Bottom Left
            ctx.beginPath();
            ctx.moveTo(x, y + faceH - len); ctx.lineTo(x, y + faceH); ctx.lineTo(x + len, y + faceH);
            ctx.stroke();

            // Bottom Right
            ctx.beginPath();
            ctx.moveTo(x + faceW - len, y + faceH); ctx.lineTo(x + faceW, y + faceH); ctx.lineTo(x + faceW, y + faceH - len);
            ctx.stroke();

            // Draw target center crosshairs
            ctx.strokeStyle = 'rgba(255,255,255,0.2)';
            ctx.lineWidth = 1;
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.moveTo(targetX - 10, targetY); ctx.lineTo(targetX + 10, targetY);
            ctx.moveTo(targetX, targetY - 10); ctx.lineTo(targetX, targetY + 10);
            ctx.stroke();

            // Draw facial keypoint nodes simulation
            ctx.fillStyle = this.eyeContactDetected ? '#10b981' : '#f59e0b';
            const drawNode = (nx, ny) => {
                ctx.beginPath();
                ctx.arc(nx, ny, 3.5, 0, 2 * Math.PI);
                ctx.fill();
            };

            // Eyes
            drawNode(targetX - 30, targetY - 20);
            drawNode(targetX + 30, targetY - 20);
            // Nose tip
            drawNode(targetX, targetY + 5);
            // Mouth corners
            if (this.currentExpression === 'Smiling') {
                // Curved smile nodes
                drawNode(targetX - 25, targetY + 35);
                drawNode(targetX - 10, targetY + 40);
                drawNode(targetX + 10, targetY + 40);
                drawNode(targetX + 25, targetY + 35);
            } else {
                // Neutral nodes
                drawNode(targetX - 25, targetY + 38);
                drawNode(targetX, targetY + 38);
                drawNode(targetX + 25, targetY + 38);
            }

            // Sync indicators to camera overlay DOM pills
            const eyePill = document.getElementById('overlayEyeContact');
            if (eyePill) {
                if (this.eyeContactDetected) {
                    eyePill.className = "metric-pill success";
                    eyePill.innerHTML = `<i class="fa-solid fa-eye"></i> Eye Contact: Good`;
                } else {
                    eyePill.className = "metric-pill warning";
                    eyePill.innerHTML = `<i class="fa-solid fa-eye-slash"></i> Alignment: Re-align Eyes`;
                }
            }

            const expPill = document.getElementById('overlayExpression');
            if (expPill) {
                if (this.currentExpression === 'Smiling') {
                    expPill.className = "metric-pill success";
                    expPill.innerHTML = `<i class="fa-solid fa-smile-wink"></i> Expression: Positive / Smile`;
                } else {
                    expPill.className = "metric-pill secondary";
                    expPill.innerHTML = `<i class="fa-solid fa-smile"></i> Confidence: Confident`;
                }
            }

            this.trackingAnimId = requestAnimationFrame(loop);
        };

        this.trackingAnimId = requestAnimationFrame(loop);
    }

    stopMediaStreams() {
        // Cancel speech synthesis
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }

        // Stop recording
        this.isListening = false;
        if (this.recognition) {
            try { this.recognition.stop(); } catch(e) {}
        }

        // Cancel animations
        if (this.audioAnimId) cancelAnimationFrame(this.audioAnimId);
        if (this.trackingAnimId) cancelAnimationFrame(this.trackingAnimId);

        // Stop tracks
        if (this.videoStream) {
            this.videoStream.getTracks().forEach(track => track.stop());
            this.videoStream = null;
        }

        if (this.audioStream) {
            this.audioStream.getTracks().forEach(track => track.stop());
            this.audioStream = null;
        }

        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
            this.audioContext = null;
        }
    }
}

// Global initialization
const app = new AIInterviewCoach();
window.addEventListener('DOMContentLoaded', () => {
    app.init();
});
window.app = app;
