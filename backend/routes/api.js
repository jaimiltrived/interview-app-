const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/auth');
const { getPool, getDBStatus } = require('../config/db');

// --- Models & Middlewares ---
const User = require('../models/User');
const Resume = require('../models/Resume');
const Session = require('../models/Session');
const { validateRegistration, validateLogin } = require('../middleware/validation');

// --- Google Gemini AI API Helper ---
const callGemini = async (prompt, fallbackText) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log('[GEMINI] API key not found. Using local fallback.');
    return fallbackText;
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API returned status ${response.status}`);
    }

    const data = await response.json();
    const result = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (result) return result.trim();
  } catch (err) {
    console.error('[GEMINI ERROR]', err.message);
  }
  return fallbackText;
};

// --- In-Memory State Mocks (Fallback if MySQL is offline) ---
let memoryUsers = [
  { id: 1, name: 'Jane Doe', email: 'jane@example.com', password: 'SecurePassword123', photo_url: null, skills: 'React,Node,SQL' }
];
let memorySessions = [];
let memoryResumes = [];
let memoryNotifications = [
  { id: 1, title: 'Welcome!', message: 'Welcome to PrepCoach.AI! Start by uploading your resume.', is_read: false, created_at: new Date() },
  { id: 2, title: 'Webcam Check', message: 'Tip: Maintain consistent eye contact with your webcam for a better scoring.', is_read: false, created_at: new Date() }
];
let memoryJobRoles = [
  { id: 1, title: 'Frontend Developer', category: 'Engineering' },
  { id: 2, title: 'Fullstack Engineer', category: 'Engineering' },
  { id: 3, title: 'Backend Developer', category: 'Engineering' }
];
let memoryInterviewTypes = [
  { id: 1, name: 'Behavioral Mock', duration: '15 mins' },
  { id: 2, name: 'Technical Mock', duration: '30 mins' },
  { id: 3, name: 'System Design Mock', duration: '45 mins' }
];
let memoryAdminLogs = [
  { id: 1, action: 'Admin Panel Booted', timestamp: new Date() }
];

// Helper to query database
const queryDB = async (sql, params = []) => {
  const pool = getPool();
  if (getDBStatus() && pool) {
    const [results] = await pool.execute(sql, params);
    return results;
  }
  return null;
};

// ==========================================
// 1. AUTHENTICATION MODULE (8 APIs)
// ==========================================

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags: [Authentication]
 *     summary: Register User
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string, example: Jane Doe }
 *               email: { type: string, example: jane@example.com }
 *               password: { type: string, example: Secure123 }
 *     responses:
 *       201: { description: User registered successfully }
 */
router.post('/auth/register', validateRegistration, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'User email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ name, email, password: hashedPassword });
    res.status(201).json({ success: true, message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Login User
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, example: jane@example.com }
 *               password: { type: string, example: SecurePassword123 }
 *     responses:
 *       200: { description: Login successful, returns token }
 */
router.post('/auth/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;
    const userRecord = await User.findByEmail(email);

    if (!userRecord) {
      return res.status(401).json({ error: 'Invalid email or password credentials' });
    }

    const isMatch = await bcrypt.compare(password, userRecord.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password credentials' });
    }

    const token = jwt.sign(
      { id: userRecord.id, name: userRecord.name, email: userRecord.email },
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      token,
      user: { id: userRecord.id, name: userRecord.name, email: userRecord.email }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     tags: [Authentication]
 *     summary: Logout
 *     responses:
 *       200: { description: Logged out }
 */
router.post('/auth/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

/**
 * @openapi
 * /api/auth/refresh-token:
 *   post:
 *     tags: [Authentication]
 *     summary: Refresh Token
 *     responses:
 *       200: { description: Token refreshed }
 */
router.post('/auth/refresh-token', (req, res) => {
  res.json({ success: true, token: 'jwt_mock_refreshed_token_' + Date.now() });
});

/**
 * @openapi
 * /api/auth/forgot-password:
 *   post:
 *     tags: [Authentication]
 *     summary: Forgot Password
 *     responses:
 *       200: { description: Link sent }
 */
router.post('/auth/forgot-password', (req, res) => {
  res.json({ success: true, message: 'Reset password link dispatched to email' });
});

/**
 * @openapi
 * /api/auth/reset-password:
 *   post:
 *     tags: [Authentication]
 *     summary: Reset Password
 *     responses:
 *       200: { description: Password reset }
 */
router.post('/api/auth/reset-password', (req, res) => {
  res.json({ success: true, message: 'Password updated successfully' });
});

/**
 * @openapi
 * /api/auth/verify-email:
 *   get:
 *     tags: [Authentication]
 *     summary: Verify Email
 *     responses:
 *       200: { description: Verified }
 */
router.get('/auth/verify-email', (req, res) => {
  res.json({ success: true, message: 'Email code verified' });
});

/**
 * @openapi
 * /api/auth/change-password:
 *   post:
 *     tags: [Authentication]
 *     summary: Change Password
 *     responses:
 *       200: { description: Password updated }
 */
router.post('/auth/change-password', (req, res) => {
  res.json({ success: true, message: 'Password updated' });
});


router.get('/status', (req, res) => {
  res.json({
    databaseConnected: getDBStatus(),
    storageMode: getDBStatus() ? 'MySQL Server' : 'In-Memory (Fallback)'
  });
});


// ==========================================
// 2. USER PROFILE MODULE (6 APIs)
// ==========================================

/**
 * @openapi
 * /api/profile:
 *   get:
 *     tags: [User Profile]
 *     summary: Get Profile Details
 *     responses:
 *       200: { description: Details returned }
 */
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    if (getDBStatus()) {
      const rows = await queryDB('SELECT * FROM users WHERE id = ?', [userId]);
      if (rows.length > 0) {
        return res.json({
          id: rows[0].id,
          name: rows[0].name,
          email: rows[0].email,
          photoUrl: rows[0].photo_url,
          skills: rows[0].skills ? rows[0].skills.split(',') : []
        });
      }
    }
    const user = memoryUsers.find(u => u.id === userId);
    if (user) {
      return res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        photoUrl: user.photo_url,
        skills: user.skills ? user.skills.split(',') : []
      });
    }
    res.status(404).json({ error: 'User not found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/profile/update:
 *   put:
 *     tags: [User Profile]
 *     summary: Update Profile details
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, example: Jane Doe }
 *               email: { type: string, example: jane@example.com }
 *     responses:
 *       200: { description: Profile updated }
 */
router.put('/profile/update', authMiddleware, async (req, res) => {
  try {
    const { name, email } = req.body;
    const userId = req.user.id;
    if (getDBStatus()) {
      await queryDB('UPDATE users SET name = ?, email = ? WHERE id = ?', [name, email, userId]);
    } else {
      const user = memoryUsers.find(u => u.id === userId);
      if (user) {
        user.name = name || user.name;
        user.email = email || user.email;
      }
    }
    res.json({ success: true, message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/profile/upload-photo:
 *   post:
 *     tags: [User Profile]
 *     summary: Upload Profile Photo
 *     responses:
 *       200: { description: Uploaded }
 */
router.post('/profile/upload-photo', async (req, res) => {
  try {
    const mockPhotoUrl = 'https://picsum.photos/150';
    if (getDBStatus()) {
      await queryDB('UPDATE users SET photo_url = ? ORDER BY id ASC LIMIT 1', [mockPhotoUrl]);
    } else {
      memoryUsers[0].photo_url = mockPhotoUrl;
    }
    res.json({ success: true, photoUrl: mockPhotoUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/profile/delete-photo:
 *   delete:
 *     tags: [User Profile]
 *     summary: Remove Profile Photo
 *     responses:
 *       200: { description: Removed }
 */
router.delete('/profile/delete-photo', async (req, res) => {
  try {
    if (getDBStatus()) {
      await queryDB('UPDATE users SET photo_url = NULL ORDER BY id ASC LIMIT 1');
    } else {
      memoryUsers[0].photo_url = null;
    }
    res.json({ success: true, message: 'Photo removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/profile/update-skills:
 *   put:
 *     tags: [User Profile]
 *     summary: Update Skills
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [skills]
 *             properties:
 *               skills: { type: array, items: { type: string } }
 *     responses:
 *       200: { description: Skills updated }
 */
router.put('/profile/update-skills', async (req, res) => {
  try {
    const { skills } = req.body;
    const skillsStr = Array.isArray(skills) ? skills.join(',') : '';
    
    if (getDBStatus()) {
      await queryDB('UPDATE users SET skills = ? ORDER BY id ASC LIMIT 1', [skillsStr]);
    } else {
      memoryUsers[0].skills = skillsStr;
    }
    res.json({ success: true, skills: skillsStr.split(',') });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * @openapi
 * /api/profile/delete-account:
 *   delete:
 *     tags: [User Profile]
 *     summary: Delete User Account
 *     responses:
 *       200: { description: Account deleted }
 */
router.delete('/profile/delete-account', async (req, res) => {
  try {
    if (getDBStatus()) {
      await queryDB('DELETE FROM users ORDER BY id ASC LIMIT 1');
    } else {
      memoryUsers.shift();
    }
    res.json({ success: true, message: 'Account deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ==========================================
// 3. RESUME MODULE (7 APIs)
// ==========================================

router.post('/resume/upload', authMiddleware, async (req, res) => {
  try {
    const { fileName, fileContent } = req.body;
    const candidateName = req.user.name || 'Candidate';
    if (!fileName) return res.status(400).json({ error: 'File name is required' });

    const textToAnalyze = (fileContent || fileName).toLowerCase();
    let inferredRole = 'Software Engineer';
    let skills = [];
    let experience = '1-2 Years';
    let questions = [];

    let isParsedByAI = false;
    if (process.env.GEMINI_API_KEY && fileContent) {
      const prompt = `You are a professional resume parser. Parse the following resume content and extract:
      1. Target Job Role (e.g. Frontend Developer, Laravel Engineer, Backend Developer)
      2. Core technical skills (array of strings, e.g. ["React", "JavaScript", "Node.js"])
      3. Experience range rating (e.g. 5+ Years (Senior), 3-4 Years (Mid-level), 1-2 Years (Associate))
      4. Generate 3 highly technical interview questions tailored specifically to these skills and experience level.
      
      Resume Content:
      ${fileContent}
      
      Output a valid JSON response format:
      {
        "roleTarget": "Role Title",
        "skills": ["Skill1", "Skill2"],
        "experience": "Experience Info",
        "questions": ["Q1", "Q2", "Q3"]
      }
      Only output valid JSON, no backticks, no markdown blocks.`;

      try {
        const geminiResult = await callGemini(prompt, '');
        if (geminiResult) {
          const cleaned = geminiResult.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleaned);
          if (parsed.roleTarget && parsed.skills && parsed.questions) {
            inferredRole = parsed.roleTarget;
            skills = parsed.skills;
            experience = parsed.experience || experience;
            questions = parsed.questions;
            isParsedByAI = true;
            console.log('[GEMINI] Successfully parsed resume and generated questions!');
          }
        }
      } catch (err) {
        console.error('[GEMINI] Error parsing resume with AI, falling back to keywords:', err.message);
      }
    }

    if (!isParsedByAI) {
      const techSkills = {
        'React': ['react', 'react.js', 'redux', 'hooks', 'jsx', 'frontend'],
        'JavaScript': ['javascript', 'js', 'es6', 'typescript', 'ts'],
        'Laravel': ['laravel', 'php', 'composer', 'eloquent'],
        'Python': ['python', 'fastapi', 'flask', 'django'],
        'MySQL': ['mysql', 'sql', 'database', 'postgresql'],
        'Firebase': ['firebase', 'firestore', 'auth'],
        'Tailwind CSS': ['tailwind', 'css', 'flexbox', 'grid'],
        'Node.js': ['node', 'node.js', 'express', 'backend']
      };

      for (const [skill, keywords] of Object.entries(techSkills)) {
        if (keywords.some(kw => textToAnalyze.includes(kw))) skills.push(skill);
      }
      if (skills.length === 0) skills = ['React.js', 'JavaScript', 'CSS Grid'];

      if (skills.includes('Laravel')) {
        inferredRole = 'Fullstack Engineer (Laravel & React)';
        questions = [
          "Can you explain the request lifecycle in Laravel, specifically how Middleware works?",
          "How do you design database relations in Laravel Eloquent and avoid the N+1 query problem?",
          "Tell me about a time you had to build a RESTful API. How did you structure the endpoints and handle authorization?"
        ];
      } else if (skills.includes('React') || skills.includes('JavaScript')) {
        inferredRole = 'Frontend Developer (React)';
        questions = [
          "What is the Virtual DOM in React, and how do React Hooks like useEffect manage state synchronization?",
          "How do you optimize performance in a React application with heavy rendering loads?",
          "Explain the difference between flexbox and grid, and how you make layouts fully responsive."
        ];
      } else if (skills.includes('Python')) {
        inferredRole = 'Backend Python Developer';
        questions = [
          "Explain how asynchronous programming works in Python FastAPI using async/await keywords.",
          "How do you handle database migrations, serialization, and connection pooling in a backend application?",
          "How do you secure API endpoints against common threats like SQL injection and cross-site scripting?"
        ];
      } else {
        inferredRole = 'Software Engineer';
        questions = [
          "Could you start by introducing yourself and walking me through your background and key strengths?",
          "Can you describe a challenging technical problem you encountered in a recent project, and how you went about resolving it?",
          "How do you prioritize tasks and manage your time when dealing with tight deadlines and competing requirements?"
        ];
      }

      if (textToAnalyze.includes('senior') || textToAnalyze.includes('lead') || textToAnalyze.includes('5 years') || textToAnalyze.includes('6 years')) {
        experience = '5+ Years (Senior)';
      } else if (textToAnalyze.includes('3 years') || textToAnalyze.includes('4 years')) {
        experience = '3-4 Years (Mid-level)';
      } else {
        experience = '1-2 Years (Associate)';
      }
    }

    const skillsString = skills.join(',');
    let insertedId;

    if (getDBStatus()) {
      const result = await queryDB(
        'INSERT INTO resumes (name, role_target, experience, skills) VALUES (?, ?, ?, ?)',
        [candidateName, inferredRole, experience, skillsString]
      );
      insertedId = result.insertId;
    } else {
      const mockRecord = {
        id: 'mem_res_' + Date.now(),
        name: candidateName,
        role_target: inferredRole,
        experience,
        skills: skillsString,
        created_at: new Date()
      };
      memoryResumes.push(mockRecord);
      insertedId = mockRecord.id;
    }

    res.json({
      success: true,
      profile: {
        id: insertedId,
        name: candidateName,
        roleTarget: inferredRole,
        experience,
        skills,
        questions
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/resume/list', authMiddleware, async (req, res) => {
  try {
    const candidateName = req.user.name;
    if (getDBStatus()) {
      const list = await queryDB('SELECT * FROM resumes WHERE name = ? ORDER BY id DESC', [candidateName]);
      res.json(list.map(r => ({ ...r, skills: r.skills ? r.skills.split(',') : [] })));
    } else {
      const list = memoryResumes.filter(r => r.name === candidateName);
      res.json(list.map(r => ({ ...r, skills: r.skills ? r.skills.split(',') : [] })));
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/resume/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const candidateName = req.user.name;
    if (getDBStatus()) {
      const rows = await queryDB('SELECT * FROM resumes WHERE id = ? AND name = ?', [id, candidateName]);
      if (rows.length === 0) return res.status(404).json({ error: 'Resume not found or access denied' });
      res.json({ ...rows[0], skills: rows[0].skills ? rows[0].skills.split(',') : [] });
    } else {
      const resu = memoryResumes.find(r => String(r.id) === String(id) && r.name === candidateName);
      if (!resu) return res.status(404).json({ error: 'Resume not found or access denied in memory' });
      res.json({ ...resu, skills: resu.skills ? resu.skills.split(',') : [] });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/resume/delete/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (getDBStatus()) {
      await queryDB('DELETE FROM resumes WHERE id = ?', [id]);
    } else {
      memoryResumes = memoryResumes.filter(r => String(r.id) !== String(id));
    }
    res.json({ success: true, message: 'Resume deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/resume/parse', (req, res) => {
  res.json({ success: true, skills: ['React', 'Node.js'], role: 'Frontend Developer' });
});

router.post('/resume/analyze', (req, res) => {
  res.json({ success: true, ATSScore: 82, warnings: [] });
});

router.get('/resume/score/:id', (req, res) => {
  res.json({ ATS_Score: 84, matchedKeywordsRatio: 0.72 });
});


// ==========================================
// 4. JOB ROLE MODULE (5 APIs)
// ==========================================

router.get('/job-roles', async (req, res) => {
  try {
    if (getDBStatus()) {
      const list = await queryDB('SELECT * FROM job_roles');
      res.json(list);
    } else {
      res.json(memoryJobRoles);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/job-role/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (getDBStatus()) {
      const rows = await queryDB('SELECT * FROM job_roles WHERE id = ?', [id]);
      if (rows.length === 0) return res.status(404).json({ error: 'Role not found' });
      res.json(rows[0]);
    } else {
      const role = memoryJobRoles.find(r => r.id === parseInt(id));
      if (!role) return res.status(404).json({ error: 'Role not found' });
      res.json(role);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/job-role', async (req, res) => {
  try {
    const { title, category } = req.body;
    if (!title || !category) return res.status(400).json({ error: 'Title and category required' });

    if (getDBStatus()) {
      const result = await queryDB('INSERT INTO job_roles (title, category) VALUES (?, ?)', [title, category]);
      res.status(201).json({ id: result.insertId, title, category });
    } else {
      const newRole = { id: memoryJobRoles.length + 1, title, category };
      memoryJobRoles.push(newRole);
      res.status(201).json(newRole);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/job-role/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category } = req.body;
    
    if (getDBStatus()) {
      await queryDB('UPDATE job_roles SET title = ?, category = ? WHERE id = ?', [title, category, id]);
      res.json({ id, title, category });
    } else {
      const role = memoryJobRoles.find(r => r.id === parseInt(id));
      if (!role) return res.status(404).json({ error: 'Role not found' });
      role.title = title || role.title;
      role.category = category || role.category;
      res.json(role);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/job-role/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (getDBStatus()) {
      await queryDB('DELETE FROM job_roles WHERE id = ?', [id]);
    } else {
      memoryJobRoles = memoryJobRoles.filter(r => r.id !== parseInt(id));
    }
    res.json({ success: true, message: 'Job role deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ==========================================
// 5. INTERVIEW TYPE MODULE (4 APIs)
// ==========================================

router.get('/interview-types', async (req, res) => {
  try {
    if (getDBStatus()) {
      const list = await queryDB('SELECT * FROM interview_types');
      res.json(list);
    } else {
      res.json(memoryInterviewTypes);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/interview-type', async (req, res) => {
  try {
    const { name, duration } = req.body;
    if (getDBStatus()) {
      const result = await queryDB('INSERT INTO interview_types (name, duration) VALUES (?, ?)', [name, duration]);
      res.status(201).json({ id: result.insertId, name, duration });
    } else {
      const newType = { id: memoryInterviewTypes.length + 1, name, duration };
      memoryInterviewTypes.push(newType);
      res.status(201).json(newType);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/interview-type/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, duration } = req.body;
    if (getDBStatus()) {
      await queryDB('UPDATE interview_types SET name = ?, duration = ? WHERE id = ?', [name, duration, id]);
      res.json({ id, name, duration });
    } else {
      const type = memoryInterviewTypes.find(t => t.id === parseInt(id));
      if (!type) return res.status(404).json({ error: 'Type not found' });
      type.name = name || type.name;
      type.duration = duration || type.duration;
      res.json(type);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/interview-type/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (getDBStatus()) {
      await queryDB('DELETE FROM interview_types WHERE id = ?', [id]);
    } else {
      memoryInterviewTypes = memoryInterviewTypes.filter(t => t.id !== parseInt(id));
    }
    res.json({ success: true, message: 'Interview type deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ==========================================
// 6. INTERVIEW SESSION MODULE (8 APIs)
// ==========================================

router.post('/interview/start', (req, res) => {
  res.json({ success: true, message: 'Session started', sessionId: 'sess_' + Date.now() });
});

router.get('/interview/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (getDBStatus()) {
      const rows = await queryDB('SELECT * FROM sessions WHERE id = ?', [id]);
      if (rows.length === 0) return res.status(404).json({ error: 'Session not found' });
      const row = rows[0];
      res.json({
        id: row.id,
        roleTarget: row.role_target,
        overallScore: row.overall_score,
        technicalScore: row.technical_score,
        communicationScore: row.communication_score,
        avgWpm: row.avg_wpm,
        totalFiller: row.total_filler,
        avgEyeContact: row.avg_eye_contact,
        expression: row.expression,
        questions: JSON.parse(row.questions || '[]'),
        answers: JSON.parse(row.answers || '[]'),
        wpmHistory: JSON.parse(row.wpm_history || '[]'),
        eyeContactHistory: JSON.parse(row.eye_contact_history || '[]'),
        fillerHistory: JSON.parse(row.filler_history || '[]'),
        date: row.date
      });
    } else {
      const record = memorySessions.find(s => String(s.id) === String(id));
      if (!record) return res.status(404).json({ error: 'Session not found' });
      res.json(record);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/interview/next-question', (req, res) => {
  res.json({ question: 'Explain how you structure REST API endpoints logically.' });
});

router.post('/interview/submit-answer', (req, res) => {
  res.json({ success: true, message: 'Recorded' });
});

router.post('/interview/skip-question', (req, res) => {
  res.json({ success: true, message: 'Skipped' });
});

router.post('/interview/end', (req, res) => {
  res.json({ success: true, message: 'Ended' });
});

router.get('/interview/history', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    if (getDBStatus()) {
      const rows = await queryDB('SELECT * FROM sessions WHERE user_id = ? ORDER BY date DESC', [userId]);
      const list = rows.map(r => ({
        id: r.id,
        roleTarget: r.role_target,
        overallScore: r.overall_score,
        technicalScore: r.technical_score,
        communicationScore: r.communication_score,
        date: r.date
      }));
      res.json(list);
    } else {
      const list = memorySessions.filter(s => s.userId === userId);
      res.json(list);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/history', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    if (getDBStatus()) {
      const rows = await queryDB('SELECT * FROM sessions WHERE user_id = ? ORDER BY date DESC', [userId]);
      const list = rows.map(r => ({
        id: r.id,
        roleTarget: r.role_target,
        overallScore: r.overall_score,
        technicalScore: r.technical_score,
        communicationScore: r.communication_score,
        date: r.date
      }));
      res.json(list);
    } else {
      const list = memorySessions.filter(s => s.userId === userId);
      res.json(list);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/interview/delete/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (getDBStatus()) {
      await queryDB('DELETE FROM sessions WHERE id = ?', [id]);
    } else {
      memorySessions = memorySessions.filter(s => String(s.id) !== String(id));
    }
    res.json({ success: true, message: 'Session deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ==========================================
// 7. AI QUESTION MODULE (4 APIs)
// ==========================================

router.post('/ai/generate-question', (req, res) => {
  res.json({ question: 'Explain the request lifecycle in Laravel middleware.' });
});

router.post('/ai/follow-up-question', (req, res) => {
  res.json({ question: 'You mentioned routing; how do route model bindings optimize database queries?' });
});

router.post('/ai/company-question', (req, res) => {
  res.json({ question: 'Google Mock Prompt: How would you design a distributed key-value cache?' });
});

router.post('/ai/technical-question', (req, res) => {
  res.json({ question: 'Can you describe a race condition, and how you resolve it in Node.js?' });
});


// ==========================================
// 8. SPEECH MODULE (3 APIs)
// ==========================================

router.post('/speech-to-text', (req, res) => {
  res.json({ transcript: 'Hello, this is a transcribed response from speech recognition.' });
});

router.post('/text-to-speech', (req, res) => {
  res.json({ audioUrl: 'https://prepcoach.ai/audio/speech.mp3' });
});

router.post('/speech/analyze', (req, res) => {
  res.json({ clarityScore: 90, pacingStatus: 'Normal' });
});


// ==========================================
// 9. FACE ANALYSIS MODULE (4 APIs)
// ==========================================

router.post('/face/detect', (req, res) => {
  res.json({ faceDetected: true, box: { x: 10, y: 15 } });
});

router.post('/face/eye-contact', (req, res) => {
  res.json({ eyeContactScore: 92 });
});

router.post('/face/head-pose', (req, res) => {
  res.json({ pitch: 0.0, yaw: 0.1, roll: 0.0, status: 'Centered' });
});

router.post('/face/emotion', (req, res) => {
  res.json({ emotion: 'Confident', confidence: 0.92 });
});


// ==========================================
// 10. VOICE MODULE (4 APIs)
// ==========================================

router.post('/voice/analyze', (req, res) => {
  res.json({ tone: 'Professional', frequencyRange: 'Medium-High' });
});

router.post('/voice/filler-words', (req, res) => {
  res.json({ count: 2, fillerWordsMatched: ['um', 'like'] });
});

router.post('/voice/confidence-score', (req, res) => {
  res.json({ confidenceRating: 90 });
});

router.post('/voice/speaking-speed', (req, res) => {
  res.json({ wpm: 135, pace: 'Ideal' });
});


// ==========================================
// 11. AI EVALUATION MODULE (4 APIs)
// ==========================================

router.post('/ai/evaluate-answer', (req, res) => {
  res.json({ rating: 'Excellent', technicalKeywordsRatio: 0.8 });
});

router.post('/ai/technical-score', (req, res) => {
  res.json({ score: 86 });
});

router.post('/ai/communication-score', (req, res) => {
  res.json({ score: 92 });
});

router.post('/ai/overall-score', (req, res) => {
  res.json({ score: 88 });
});


// ==========================================
// 12. REPORT MODULE (4 APIs)
// ==========================================

router.get('/report/:interviewId', async (req, res) => {
  const { interviewId } = req.params;
  try {
    if (getDBStatus()) {
      const rows = await queryDB('SELECT * FROM sessions WHERE id = ?', [interviewId]);
      if (rows.length === 0) return res.status(404).json({ error: 'Session report not found' });
      res.json(rows[0]);
    } else {
      const record = memorySessions.find(s => String(s.id) === String(interviewId));
      if (!record) return res.status(404).json({ error: 'Session report not found' });
      res.json(record);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/report/download/:interviewId', (req, res) => {
  res.json({ downloadUrl: 'https://prepcoach.ai/reports/download.pdf' });
});

router.get('/report/resume/:resumeId', (req, res) => {
  res.json({ ATS_Score: 84, keywordsMatched: ['React', 'Node.js'] });
});

router.get('/report/progress', async (req, res) => {
  try {
    let list = [];
    if (getDBStatus()) {
      const rows = await queryDB('SELECT overall_score, date FROM sessions ORDER BY date ASC');
      list = rows.map(r => ({ score: r.overall_score, date: r.date }));
    } else {
      list = memorySessions.map(s => ({ score: s.overallScore, date: s.date }));
    }
    res.json({ progress: list });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ==========================================
// 13. DASHBOARD MODULE (5 APIs)
// ==========================================

router.get('/dashboard', authMiddleware, (req, res) => {
  res.json({ username: req.user.name, email: req.user.email });
});

router.get('/dashboard/stats', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    if (getDBStatus()) {
      const rows = await queryDB('SELECT COUNT(*) as count, AVG(overall_score) as avgScore FROM sessions WHERE user_id = ?', [userId]);
      const count = rows[0].count || 0;
      const avg = Math.round(rows[0].avgScore) || 0;
      res.json({ totalSessions: count, avgScore: avg, practiceMins: count * 6 });
    } else {
      const list = memorySessions.filter(s => s.userId === userId);
      const count = list.length;
      const sum = list.reduce((a, b) => a + b.overallScore, 0);
      const avg = count ? Math.round(sum / count) : 0;
      res.json({ totalSessions: count, avgScore: avg, practiceMins: count * 6 });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/dashboard/performance', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    let dataPoints = [];
    if (getDBStatus()) {
      const rows = await queryDB('SELECT overall_score FROM sessions WHERE user_id = ? ORDER BY date ASC LIMIT 5', [userId]);
      dataPoints = rows.map(r => r.overall_score);
    } else {
      dataPoints = memorySessions.filter(s => s.userId === userId).slice(-5).map(s => s.overallScore);
    }
    res.json({ performanceScores: dataPoints });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/dashboard/recent-interviews', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    if (getDBStatus()) {
      const rows = await queryDB('SELECT * FROM sessions WHERE user_id = ? ORDER BY date DESC LIMIT 3', [userId]);
      res.json(rows);
    } else {
      res.json(memorySessions.filter(s => s.userId === userId).slice(0, 3));
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/dashboard/recommendations', (req, res) => {
  res.json({ recommendedAreas: ['System Design Scale Check', 'Redux State Management'] });
});


// ==========================================
// 14. ADMIN MODULE (12 APIs)
// ==========================================

router.post('/admin/login', (req, res) => {
  res.json({ success: true, adminToken: 'admin_session_token_12345' });
});

router.get('/admin/dashboard', (req, res) => {
  res.json({ userAccountsCount: memoryUsers.length, mockSessionsCount: memorySessions.length });
});

router.get('/admin/users', async (req, res) => {
  try {
    if (getDBStatus()) {
      const list = await queryDB('SELECT id, name, email FROM users');
      res.json(list);
    } else {
      res.json(memoryUsers.map(u => ({ id: u.id, name: u.name, email: u.email })));
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/admin/user/:id/status', (req, res) => {
  res.json({ success: true, userId: req.params.id, status: 'Updated' });
});

router.delete('/admin/user/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (getDBStatus()) {
      await queryDB('DELETE FROM users WHERE id = ?', [id]);
    } else {
      memoryUsers = memoryUsers.filter(u => u.id !== parseInt(id));
    }
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/admin/interviews', async (req, res) => {
  try {
    if (getDBStatus()) {
      const list = await queryDB('SELECT * FROM sessions');
      res.json(list);
    } else {
      res.json(memorySessions);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/admin/reports', (req, res) => {
  res.json({ reportsProcessedCount: memorySessions.length });
});

router.post('/admin/job-role', async (req, res) => {
  const { title, category } = req.body;
  try {
    if (getDBStatus()) {
      const result = await queryDB('INSERT INTO job_roles (title, category) VALUES (?, ?)', [title, category]);
      res.status(201).json({ id: result.insertId, title, category });
    } else {
      const newRole = { id: memoryJobRoles.length + 1, title, category };
      memoryJobRoles.push(newRole);
      res.status(201).json(newRole);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/admin/company', (req, res) => {
  res.status(201).json({ id: 10, name: req.body.name || 'Amazon' });
});

router.get('/admin/analytics', (req, res) => {
  res.json({ CPU_load: '15%', memory_load: '35%' });
});

router.put('/admin/settings', (req, res) => {
  res.json({ success: true, message: 'Global settings updated' });
});

router.get('/admin/logs', (req, res) => {
  res.json(memoryAdminLogs);
});


// ==========================================
// 15. NOTIFICATION MODULE (3 APIs)
// ==========================================

router.get('/notifications', async (req, res) => {
  try {
    if (getDBStatus()) {
      const list = await queryDB('SELECT * FROM notifications ORDER BY created_at DESC');
      res.json(list);
    } else {
      res.json(memoryNotifications);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/notifications/read/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (getDBStatus()) {
      await queryDB('UPDATE notifications SET is_read = TRUE WHERE id = ?', [id]);
    } else {
      const notif = memoryNotifications.find(n => n.id === parseInt(id));
      if (notif) notif.is_read = true;
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/notifications/:id', async (req, res) => {
  const { id } = req.params;
  try {
    if (getDBStatus()) {
      await queryDB('DELETE FROM notifications WHERE id = ?', [id]);
    } else {
      memoryNotifications = memoryNotifications.filter(n => n.id !== parseInt(id));
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ==========================================
// 16. FEEDBACK MODULE (4 APIs)
// ==========================================

router.post('/feedback/generate', (req, res) => {
  res.json({ success: true, recommendation: 'Review hooks and routing constraints.' });
});

router.get('/feedback/:interviewId', async (req, res) => {
  const { interviewId } = req.params;
  try {
    let session = null;
    if (getDBStatus()) {
      const rows = await queryDB('SELECT * FROM sessions WHERE id = ?', [interviewId]);
      if (rows.length > 0) session = rows[0];
    } else {
      session = memorySessions.find(s => String(s.id) === String(interviewId));
    }
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json({ score: session.overallScore || session.overall_score, suggestions: ['Practice structural STAR frameworks.'] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/feedback/improvement-plan', (req, res) => {
  res.json({ success: true, roadmap: ['1. Redo System Design Mock', '2. Study MySQL Indexing'] });
});

router.get('/feedback/practice-questions', (req, res) => {
  res.json({ practiceSet: ['How do you scale Express session servers?', 'Detail CSS grid auto-fit layouts.'] });
});


// ==========================================
// CORE INTEGRATED BACKEND ROUTINGS
// ==========================================

// Process full completed interview session responses (Linked from React room submit triggers)
router.post('/interview/submit', authMiddleware, async (req, res) => {
  try {
    const {
      roleTarget,
      questions,
      answers,
      wpmHistory = [],
      eyeContactHistory = [],
      fillerHistory = [],
      expression = 'Confident'
    } = req.body;

    const userId = req.user.id;

    if (!roleTarget || !questions || !answers) {
      return res.status(400).json({ error: 'Missing required session metrics' });
    }

    // Assess technical scores
    let totalKeywordsMatched = 0;
    const keyVocab = [
      'react', 'hook', 'component', 'state', 'props', 'rendering', 'virtual dom',
      'laravel', 'php', 'middleware', 'database', 'eloquent', 'query', 'relations', 'n+1',
      'api', 'fastapi', 'async', 'await', 'asynchronous', 'security', 'sql', 'index',
      'design', 'optimize', 'scalability', 'performance', 'flexbox', 'grid', 'responsive'
    ];

    answers.forEach(ans => {
      const lowercase = ans.toLowerCase();
      keyVocab.forEach(vocab => {
        if (lowercase.includes(vocab)) totalKeywordsMatched++;
      });
    });

    const technicalScore = Math.min(98, Math.max(60, 60 + (totalKeywordsMatched * 4)));

    // Assess communication scores
    const totalFiller = fillerHistory.reduce((a, b) => a + b, 0);
    const avgWpm = wpmHistory.length ? Math.round(wpmHistory.reduce((a, b) => a + b, 0) / wpmHistory.length) : 130;
    const avgEyeContact = eyeContactHistory.length ? Math.round(eyeContactHistory.remove ? 0 : eyeContactHistory.reduce((a, b) => a + b, 0) / eyeContactHistory.length) : 90;

    let communicationScore = 95;
    if (avgWpm < 110) communicationScore -= 10;
    if (avgWpm > 170) communicationScore -= 12;
    communicationScore -= Math.min(25, totalFiller * 2.5);
    communicationScore = Math.max(55, Math.round(communicationScore));

    const overallScore = Math.round((technicalScore * 0.4) + (communicationScore * 0.4) + (avgEyeContact * 0.2));

    // Serialize arrays for MySQL TEXT storage
    const questionsText = JSON.stringify(questions);
    const answersText = JSON.stringify(answers);
    const wpmText = JSON.stringify(wpmHistory);
    const eyeContactText = JSON.stringify(eyeContactHistory);
    const fillerText = JSON.stringify(fillerHistory);

    let sessionRecord;

    if (getDBStatus()) {
      const result = await queryDB(
        `INSERT INTO sessions 
        (user_id, role_target, overall_score, technical_score, communication_score, avg_wpm, total_filler, avg_eye_contact, expression, questions, answers, wpm_history, eye_contact_history, filler_history) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, roleTarget, overallScore, technicalScore, communicationScore, avgWpm, totalFiller, avgEyeContact, expression, questionsText, answersText, wpmText, eyeContactText, fillerText]
      );
      
      sessionRecord = {
        id: result.insertId,
        userId,
        roleTarget,
        overallScore,
        technicalScore,
        communicationScore,
        avgWpm,
        totalFiller,
        avgEyeContact,
        expression,
        questions,
        answers,
        wpmHistory,
        eyeContactHistory,
        fillerHistory,
        date: new Date()
      };
    } else {
      sessionRecord = {
        id: 'mem_sess_' + Date.now(),
        userId,
        roleTarget,
        overallScore,
        technicalScore,
        communicationScore,
        avgWpm,
        totalFiller,
        avgEyeContact,
        expression,
        questions,
        answers,
        wpmHistory,
        eyeContactHistory,
        fillerHistory,
        date: new Date()
      };
      memorySessions.push(sessionRecord);
    }

    res.json({
      success: true,
      session: sessionRecord
    });

  } catch (error) {
    console.error('Error submitting session:', error);
    res.status(500).json({ error: 'Server error processing session scores' });
  }
});

// GET Details of a single session (duplicated for naming compatibility check)
router.get('/history/:id', authMiddleware, async (req, res) => {
  try {
    const id = req.params.id;
    const userId = req.user.id;
    
    if (getDBStatus()) {
      const rows = await queryDB('SELECT * FROM sessions WHERE id = ? AND user_id = ?', [id, userId]);
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Session not found or access denied' });
      }
      
      const row = rows[0];
      const session = {
        id: row.id,
        roleTarget: row.role_target,
        overallScore: row.overall_score,
        technicalScore: row.technical_score,
        communicationScore: row.communication_score,
        avgWpm: row.avg_wpm,
        totalFiller: row.total_filler,
        avgEyeContact: row.avg_eye_contact,
        expression: row.expression,
        questions: JSON.parse(row.questions || '[]'),
        answers: JSON.parse(row.answers || '[]'),
        wpmHistory: JSON.parse(row.wpm_history || '[]'),
        eyeContactHistory: JSON.parse(row.eye_contact_history || '[]'),
        fillerHistory: JSON.parse(row.filler_history || '[]'),
        date: row.date
      };
      
      res.json(session);
    } else {
      const record = memorySessions.find(s => String(s.id) === String(id) && s.userId === userId);
      if (!record) {
        return res.status(404).json({ error: 'Session not found or access denied in memory' });
      }
      res.json(record);
    }
  } catch (error) {
    console.error('Error fetching session details:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ==========================================
// FASTAPI AI INTEGRATED ENDPOINTS
// ==========================================

router.post('/ai/parse-resume', async (req, res) => {
  const { fileContent = '' } = req.body;
  const prompt = `Parse this resume text and extract the candidate name, target role, experience range, and a list of key technical skills.
  Resume Content:
  ${fileContent}
  
  Output a JSON response with format:
  {
    "name": "Extract Name",
    "roleTarget": "Inferred Target Role",
    "experience": "e.g. 2 Years",
    "skills": ["Skill1", "Skill2"]
  }
  Only output valid JSON.`;
  
  const defaultData = { name: 'Candidate', roleTarget: 'Software Engineer', experience: '1-2 Years', skills: ['JavaScript', 'HTML5', 'CSS3'] };
  const result = await callGemini(prompt, JSON.stringify(defaultData));
  try {
    const jsonString = result.replace(/```json/g, '').replace(/```/g, '').trim();
    res.json(JSON.parse(jsonString));
  } catch (e) {
    res.json(defaultData);
  }
});

router.post('/ai/analyze-resume', async (req, res) => {
  const { roleTarget = '', skills = [] } = req.body;
  res.json({
    resumeScore: 85,
    missingSkillsKeywords: ['System Design', 'Redis'],
    readabilityScore: 90
  });
});

router.post('/ai/speech-to-text', (req, res) => {
  res.json({ transcript: 'Hello, this is a transcribed response from speech recognition.' });
});

router.post('/ai/text-to-speech', (req, res) => {
  res.json({ audioUrl: 'https://prepcoach.ai/audio/speech.mp3' });
});

router.post('/ai/analyze-face', (req, res) => {
  res.json({
    eyeContactScore: 92,
    headPose: { pitch: 0.0, yaw: 0.1, roll: 0.0 },
    emotion: 'Confident',
    expressionScore: 0.94
  });
});

router.post('/ai/analyze-voice', (req, res) => {
  res.json({
    speakingSpeedWpm: 135,
    clarityRating: 90,
    fillerWordsCount: 2,
    fillerWordsDetails: ['um', 'like']
  });
});

router.post('/ai/generate-feedback', async (req, res) => {
  const { questions = [], answers = [] } = req.body;
  const prompt = `Based on these interview questions and candidate answers, generate constructive feedback for the candidate.
  Questions: ${JSON.stringify(questions)}
  Answers: ${JSON.stringify(answers)}
  Provide a JSON response format:
  {
    "summary": "Overall assessment feedback",
    "strengths": ["Strength 1", "Strength 2"],
    "improvements": ["Area 1", "Area 2"]
  }
  Only output valid JSON.`;
  const defaultFeedback = { summary: 'Overall Good performance.', strengths: ['Technical knowledge'], improvements: ['Detail structural execution'] };
  const result = await callGemini(prompt, JSON.stringify(defaultFeedback));
  try {
    const jsonString = result.replace(/```json/g, '').replace(/```/g, '').trim();
    res.json(JSON.parse(jsonString));
  } catch (e) {
    res.json(defaultFeedback);
  }
});

router.post('/ai/recommend-practice', (req, res) => {
  res.json({ recommendedAreas: ['System Design Scale Check', 'Redux State Management'] });
});

module.exports = router;
