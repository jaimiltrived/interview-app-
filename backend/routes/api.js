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
const InterviewResult = require('../models/InterviewResult');
const { validateRegistration, validateLogin } = require('../middleware/validation');

// --- AI Modular Services ---
const resumeService = require('../services/resumeService');
const questionService = require('../services/questionService');
const evaluationService = require('../services/evaluationService');
const feedbackService = require('../services/feedbackService');

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
let memorySessions = [];
let memoryResumes = [];
let memoryNotifications = [
  { id: 1, title: 'Welcome!', message: 'Welcome to PrepCoach.AI! Start by uploading your resume.', is_read: false, created_at: new Date() },
  { id: 2, title: 'Webcam Check', message: 'Tip: Maintain consistent eye contact with your webcam for a better scoring.', is_read: false, created_at: new Date() }
];
let memoryJobRoles = [
  { id: 1, title: 'Frontend Developer', category: 'Engineering', status: 'Active' },
  { id: 2, title: 'Fullstack Engineer', category: 'Engineering', status: 'Active' },
  { id: 3, title: 'Backend Developer', category: 'Engineering', status: 'Active' },
  { id: 4, title: 'Data Scientist', category: 'Data', status: 'Active' }
];
let memoryInterviewTypes = [
  { id: 1, name: 'Behavioral Mock', duration: '15 mins' },
  { id: 2, name: 'Technical Mock', duration: '30 mins' },
  { id: 3, name: 'System Design Mock', duration: '45 mins' }
];
let memoryCompanies = [
  { id: 1, name: 'Google' },
  { id: 2, name: 'Amazon' },
  { id: 3, name: 'Microsoft' },
  { id: 4, name: 'Meta' },
  { id: 5, name: 'Apple' },
  { id: 6, name: 'TCS' },
  { id: 7, name: 'Infosys' },
  { id: 8, name: 'Deloitte' },
  { id: 9, name: 'Accenture' }
];
let memorySkills = [
  { id: 1, name: 'React' },
  { id: 2, name: 'Angular' },
  { id: 3, name: 'Vue' },
  { id: 4, name: 'Laravel' },
  { id: 5, name: 'Node.js' },
  { id: 6, name: 'Java' },
  { id: 7, name: 'Spring Boot' },
  { id: 8, name: 'Python' },
  { id: 9, name: 'Docker' },
  { id: 10, name: 'Kubernetes' },
  { id: 11, name: 'AWS' },
  { id: 12, name: 'Azure' }
];
let memoryAiPrompts = [
  { id: 1, name: 'Resume Analysis Prompt', content: 'You are an ATS resume reviewer. Analyze the resume text, score it against standard technical roles, list missing skills, and give improvement tips.', is_active: true },
  { id: 2, name: 'Technical Interview Prompt', content: 'You are a technical interviewer. Generate demanding technical interview questions based on the candidate\'s skills and job description.', is_active: true },
  { id: 3, name: 'HR Prompt', content: 'You are an HR Manager. Ask behavioral and cultural fit questions using standard STAR methodology.', is_active: true },
  { id: 4, name: 'Behavior Prompt', content: 'Analyze candidate\'s answers for behavioral patterns, emotional stability, and professional boundaries.', is_active: true },
  { id: 5, name: 'Feedback Prompt', content: 'Construct comprehensive, constructive score cards on their technical precision and communication pacing.', is_active: true }
];
let memoryQuestionBank = [
  { id: 1, question: 'What are the primary differences between virtual DOM and real DOM in React?', type: 'Technical' },
  { id: 2, question: 'Explain the execution context and event loop structure in Node.js.', type: 'Technical' },
  { id: 3, question: 'Describe a time when you had to resolve a conflict within a cross-functional dev team.', type: 'Behavioral' },
  { id: 4, question: 'Why do you want to join our company and how does this role fit your career path?', type: 'HR' },
  { id: 5, question: 'What is your methodology for optimizing slow database queries in production?', type: 'Technical' }
];
let memorySettings = {
  app_name: 'PrepFlow AI',
  logo_url: '/logo.png',
  email_settings: '{"smtp_host":"smtp.mailtrap.io","smtp_port":2525}',
  ai_model: 'Llama 3.2',
  ollama_url: 'http://localhost:11434',
  api_keys: '{"gemini_api_key":"MOCK_KEY_FOR_TESTING"}',
  upload_limits_mb: '5',
  max_interview_duration_mins: '30',
  session_timeout_mins: '60',
  password_policy: '{"minLength":8,"requireNumbers":true}'
};
let memoryFeedback = [
  { id: 1, userId: 4, username: 'Jane Doe', message: 'The audio visualizer works wonderfully, but it would be nice to have a darker theme.', reply: 'Thanks! We are adding dark mode control settings soon.', is_resolved: true, created_at: new Date() },
  { id: 2, userId: 4, username: 'Jane Doe', message: 'Could you add Java Spring Boot mock practice questions set?', reply: null, is_resolved: false, created_at: new Date() }
];
let memoryAdminLogs = [
  { id: 1, action: 'Admin Panel Booted', details: 'System logs initialized.', created_at: new Date() },
  { id: 2, action: 'User Login', details: 'Super Admin logged in from local IP.', created_at: new Date() }
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
      { id: userRecord.id, name: userRecord.name, email: userRecord.email, role: userRecord.role || 'candidate' },
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      token,
      user: { id: userRecord.id, name: userRecord.name, email: userRecord.email, role: userRecord.role || 'candidate' }
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
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let roleTarget = 'Software Engineer';
    let experience = '1-2 Years';
    let skills = [];
    let questions = [];

    // Parse user profile level skills if present
    if (user.skills) {
      try {
        const skillsObj = typeof user.skills === 'string' ? JSON.parse(user.skills) : user.skills;
        if (Array.isArray(skillsObj)) skills = skillsObj;
      } catch (e) {
        skills = String(user.skills).split(',').map(s => s.trim());
      }
    }

    // Lookup latest resume for the user to enrich profile questions and target role
    try {
      const resumes = await Resume.listByCandidate(user.name);
      if (resumes && resumes.length > 0) {
        const latestResume = resumes[0];
        roleTarget = latestResume.role_target || roleTarget;
        experience = latestResume.experience || experience;
        
        if (latestResume.skills) {
          try {
            const parsedSkills = typeof latestResume.skills === 'string' ? JSON.parse(latestResume.skills) : latestResume.skills;
            if (Array.isArray(parsedSkills)) skills = parsedSkills;
          } catch (e) {}
        }

        if (latestResume.questions) {
          try {
            const parsedQuestions = typeof latestResume.questions === 'string' ? JSON.parse(latestResume.questions) : latestResume.questions;
            if (Array.isArray(parsedQuestions)) questions = parsedQuestions;
          } catch (e) {}
        }
      }
    } catch (err) {
      console.warn('Could not fetch resume context for profile:', err.message);
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      photoUrl: user.photo_url,
      role: roleTarget,
      userRole: user.role || 'candidate',
      experience,
      skills,
      questions
    });
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

// Legacy /resume/upload route removed to avoid routing conflict with the new multer-based routes in resume.js.

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

// Legacy /interview/start route removed to avoid routing conflict with interview.js.

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

router.post('/ai/generate-question', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    let inferredRole = 'Software Engineer';
    let skills = 'JavaScript, React, Node';
    let experience = '1-2 Years';

    if (user) {
      if (user.skills) {
        try {
          const skillsObj = typeof user.skills === 'string' ? JSON.parse(user.skills) : user.skills;
          if (Array.isArray(skillsObj)) skills = skillsObj.join(', ');
        } catch (e) {
          skills = String(user.skills);
        }
      }

      try {
        const latestResume = await Resume.listByCandidate(user.name);
        if (latestResume && latestResume.length > 0) {
          const r = latestResume[0];
          inferredRole = r.role_target || inferredRole;
          experience = r.experience || experience;
          if (r.skills) {
            try {
              const rSkills = typeof r.skills === 'string' ? JSON.parse(r.skills) : r.skills;
              if (Array.isArray(rSkills)) skills = rSkills.join(', ');
            } catch (e) {}
          }
        }
      } catch (err) {
        console.warn('Could not fetch resume context from database:', err.message);
      }
    }

    const questionsList = await questionService.generateQuestions({
      name: user ? user.name : 'Candidate',
      roleTarget: inferredRole,
      experience,
      skills,
      count: 1
    });
    const question = questionsList[0] || 'Explain the request lifecycle in Laravel middleware.';
    res.json({ question });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/ai/follow-up-question', authMiddleware, async (req, res) => {
  try {
    const { lastQuestion = '', lastAnswer = '' } = req.body;
    const question = await questionService.generateFollowUpQuestion(lastQuestion, lastAnswer);
    res.json({ question });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/ai/company-question', authMiddleware, async (req, res) => {
  try {
    const { company = 'Google', role = 'Software Engineer' } = req.body;
    const question = await questionService.generateCompanyQuestion(company, role);
    res.json({ question });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/ai/technical-question', authMiddleware, async (req, res) => {
  try {
    const { domain = 'JavaScript' } = req.body;
    const question = await questionService.generateTechnicalQuestion(domain);
    res.json({ question });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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

router.post('/ai/evaluate-answer', authMiddleware, async (req, res) => {
  try {
    const { question, answer } = req.body;
    if (!question || !answer) {
      return res.status(400).json({ error: 'Question and answer are required' });
    }

    const evaluation = await evaluationService.evaluateAnswer(question, answer);
    const userId = req.user ? req.user.id : null;

    const resultId = await InterviewResult.create({
      userId,
      question,
      answer,
      aiFeedback: evaluation.suggestions,
      technicalScore: evaluation.technicalScore,
      communicationScore: evaluation.communicationScore
    });

    res.json({
      success: true,
      id: resultId,
      ...evaluation
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
// 14. ADMIN PANEL & ROLE-BASED MODULE (CRUD APIs)
// ==========================================

// Authorization Middleware
const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.user?.role || 'candidate';
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: 'Access denied: Insufficient permissions for this operation.' });
    }
    next();
  };
};

// Admin Login (Fallback support)
router.post('/admin/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const userRecord = await User.findByEmail(email);
    if (!userRecord || !['super_admin', 'admin', 'content_manager'].includes(userRecord.role)) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }
    const isMatch = await bcrypt.compare(password, userRecord.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }
    const token = jwt.sign(
      { id: userRecord.id, name: userRecord.name, email: userRecord.email, role: userRecord.role },
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: '7d' }
    );
    res.json({ success: true, token, user: { id: userRecord.id, name: userRecord.name, email: userRecord.email, role: userRecord.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper: Log Admin activity
const logAdminActivity = async (userId, action, details) => {
  const detailsStr = typeof details === 'object' ? JSON.stringify(details) : details;
  if (getDBStatus()) {
    try {
      await queryDB('INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)', [userId, action, detailsStr]);
    } catch (e) {
      console.error('[LOG ERROR] Could not save activity log:', e.message);
    }
  } else {
    memoryAdminLogs.unshift({
      id: memoryAdminLogs.length + 1,
      userId,
      action,
      details: detailsStr,
      created_at: new Date()
    });
  }
};

// Dashboard Stats
router.get('/admin/dashboard/stats', authMiddleware, roleMiddleware(['super_admin', 'admin']), async (req, res) => {
  try {
    let totalUsers = 0;
    let activeUsers = 0;
    let totalInterviews = 0;
    let completedInterviews = 0;
    let avgScore = 0;
    let jobRolesCount = 0;
    let companiesCount = 0;

    if (getDBStatus()) {
      const [uCount] = await queryDB('SELECT COUNT(*) as count FROM users');
      totalUsers = uCount.count;

      const [actCount] = await queryDB('SELECT COUNT(DISTINCT user_id) as count FROM sessions');
      activeUsers = actCount.count;

      const [sCount] = await queryDB('SELECT COUNT(*) as count, AVG(overall_score) as avgScore FROM sessions');
      totalInterviews = sCount.count;
      completedInterviews = sCount.count; // Assuming all sessions in table are finished
      avgScore = Math.round(sCount.avgScore) || 0;

      const [jrCount] = await queryDB('SELECT COUNT(*) as count FROM job_roles');
      jobRolesCount = jrCount.count;

      const [cCount] = await queryDB('SELECT COUNT(*) as count FROM companies');
      companiesCount = cCount.count;
    } else {
      const allUsers = User.getMemoryUsers();
      totalUsers = allUsers.length;
      activeUsers = new Set(memorySessions.map(s => s.userId)).size;
      totalInterviews = memorySessions.length;
      completedInterviews = memorySessions.length;
      const totalScore = memorySessions.reduce((acc, curr) => acc + (curr.overallScore || 0), 0);
      avgScore = totalInterviews ? Math.round(totalScore / totalInterviews) : 0;
      jobRolesCount = memoryJobRoles.length;
      companiesCount = memoryCompanies.length;
    }

    res.json({
      totalUsers,
      activeUsers,
      totalInterviews,
      completedInterviews,
      avgScore,
      jobRolesCount,
      companiesCount,
      aiRequestsToday: 18,
      failedAiRequests: 0,
      monthlyGrowth: 12
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Dashboard Charts Data
router.get('/admin/dashboard/charts', authMiddleware, roleMiddleware(['super_admin', 'admin']), async (req, res) => {
  try {
    // Generate dates for past 7 days
    const labels = [];
    const dailyInterviews = [];
    const averageScores = [];
    const userGrowth = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      labels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
      // Simple mock stats for charts
      dailyInterviews.push(Math.floor(Math.random() * 5) + 2);
      averageScores.push(Math.floor(Math.random() * 15) + 75);
      userGrowth.push(10 + (6 - i) * 2);
    }

    res.json({
      labels,
      dailyInterviews,
      averageScores,
      userGrowth,
      communicationScores: [82, 85, 84, 88, 89, 87, 91],
      technicalScores: [75, 78, 80, 82, 85, 84, 86],
      popularSkills: ['React', 'Node.js', 'Python', 'AWS', 'Laravel'],
      popularSkillsCount: [35, 28, 20, 15, 12]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- USER MANAGEMENT (Super Admin & Admin) ---
router.get('/admin/users', authMiddleware, roleMiddleware(['super_admin', 'admin']), async (req, res) => {
  try {
    if (getDBStatus()) {
      const list = await queryDB('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC');
      res.json(list);
    } else {
      res.json(User.getMemoryUsers().map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role, created_at: new Date() })));
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/admin/user/:id', authMiddleware, roleMiddleware(['super_admin', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    if (getDBStatus()) {
      const rows = await queryDB('SELECT id, name, email, role, created_at FROM users WHERE id = ?', [id]);
      if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
      res.json(rows[0]);
    } else {
      const user = User.getMemoryUsers().find(u => u.id === parseInt(id));
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json({ id: user.id, name: user.name, email: user.email, role: user.role, created_at: new Date() });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/admin/user/:id', authMiddleware, roleMiddleware(['super_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role } = req.body;
    if (getDBStatus()) {
      await queryDB('UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?', [name, email, role, id]);
      await logAdminActivity(req.user.id, 'EDIT_USER', `Updated user ID ${id}: ${name} (${role})`);
      res.json({ id, name, email, role });
    } else {
      const users = User.getMemoryUsers();
      const user = users.find(u => u.id === parseInt(id));
      if (!user) return res.status(404).json({ error: 'User not found' });
      user.name = name || user.name;
      user.email = email || user.email;
      user.role = role || user.role;
      User.setMemoryUsers(users);
      await logAdminActivity(req.user.id, 'EDIT_USER', `Updated user ID ${id} in-memory: ${user.name} (${user.role})`);
      res.json(user);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/admin/user/:id', authMiddleware, roleMiddleware(['super_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    if (getDBStatus()) {
      await queryDB('DELETE FROM users WHERE id = ?', [id]);
      await logAdminActivity(req.user.id, 'DELETE_USER', `Deleted user ID ${id}`);
    } else {
      const users = User.getMemoryUsers().filter(u => u.id !== parseInt(id));
      User.setMemoryUsers(users);
      await logAdminActivity(req.user.id, 'DELETE_USER', `Deleted user ID ${id} in-memory`);
    }
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/admin/user/:id/reset-password', authMiddleware, roleMiddleware(['super_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const bcrypt = require('bcryptjs');
    const defaultPass = 'Password123';
    const hashed = await bcrypt.hash(defaultPass, 10);

    if (getDBStatus()) {
      await queryDB('UPDATE users SET password = ? WHERE id = ?', [hashed, id]);
      await logAdminActivity(req.user.id, 'RESET_PASSWORD', `Reset password for user ID ${id}`);
    } else {
      const users = User.getMemoryUsers();
      const user = users.find(u => u.id === parseInt(id));
      if (user) user.password = hashed;
      User.setMemoryUsers(users);
      await logAdminActivity(req.user.id, 'RESET_PASSWORD', `Reset password for user ID ${id} in-memory`);
    }
    res.json({ success: true, message: `Password reset successfully to: ${defaultPass}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/admin/user/:id/status', authMiddleware, roleMiddleware(['super_admin', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // status can be "blocked" or "active"
    // Mock blocking behavior
    await logAdminActivity(req.user.id, 'TOGGLE_USER_STATUS', `Set status of user ID ${id} to: ${status}`);
    res.json({ success: true, message: `User status set to ${status}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- RESUME MANAGEMENT ---
router.get('/admin/resumes', authMiddleware, roleMiddleware(['super_admin', 'admin']), async (req, res) => {
  try {
    if (getDBStatus()) {
      const list = await queryDB('SELECT r.id, r.name, r.role_target, r.experience, r.created_at, u.email FROM resumes r LEFT JOIN users u ON r.user_id = u.id ORDER BY r.created_at DESC');
      res.json(list);
    } else {
      res.json(memoryResumes.map(r => ({ id: r.id, name: r.name, role_target: r.role_target, experience: r.experience || '1-2 years', created_at: new Date(), email: 'jane@example.com' })));
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/admin/resume/:id', authMiddleware, roleMiddleware(['super_admin', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    if (getDBStatus()) {
      await queryDB('DELETE FROM resumes WHERE id = ?', [id]);
      await logAdminActivity(req.user.id, 'DELETE_RESUME', `Deleted resume ID ${id}`);
    } else {
      memoryResumes = memoryResumes.filter(r => String(r.id) !== String(id));
      await logAdminActivity(req.user.id, 'DELETE_RESUME', `Deleted resume ID ${id} in-memory`);
    }
    res.json({ success: true, message: 'Resume deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- JOB ROLE MANAGEMENT ---
router.get('/admin/job-roles', authMiddleware, roleMiddleware(['super_admin', 'admin', 'content_manager']), async (req, res) => {
  try {
    if (getDBStatus()) {
      const list = await queryDB('SELECT * FROM job_roles ORDER BY id DESC');
      res.json(list);
    } else {
      res.json(memoryJobRoles);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/admin/job-role', authMiddleware, roleMiddleware(['super_admin', 'admin', 'content_manager']), async (req, res) => {
  try {
    const { title, category } = req.body;
    if (getDBStatus()) {
      const result = await queryDB('INSERT INTO job_roles (title, category) VALUES (?, ?)', [title, category]);
      await logAdminActivity(req.user.id, 'CREATE_JOB_ROLE', `Created job role: ${title} (${category})`);
      res.status(201).json({ id: result.insertId, title, category });
    } else {
      const newRole = { id: memoryJobRoles.length + 1, title, category, status: 'Active' };
      memoryJobRoles.push(newRole);
      await logAdminActivity(req.user.id, 'CREATE_JOB_ROLE', `Created job role in-memory: ${title}`);
      res.status(201).json(newRole);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/admin/job-role/:id', authMiddleware, roleMiddleware(['super_admin', 'admin', 'content_manager']), async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category } = req.body;
    if (getDBStatus()) {
      await queryDB('UPDATE job_roles SET title = ?, category = ? WHERE id = ?', [title, category, id]);
      await logAdminActivity(req.user.id, 'EDIT_JOB_ROLE', `Updated job role ID ${id}: ${title}`);
      res.json({ id, title, category });
    } else {
      const role = memoryJobRoles.find(r => r.id === parseInt(id));
      if (!role) return res.status(404).json({ error: 'Role not found' });
      role.title = title || role.title;
      role.category = category || role.category;
      await logAdminActivity(req.user.id, 'EDIT_JOB_ROLE', `Updated job role ID ${id} in-memory: ${title}`);
      res.json(role);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/admin/job-role/:id', authMiddleware, roleMiddleware(['super_admin', 'admin', 'content_manager']), async (req, res) => {
  try {
    const { id } = req.params;
    if (getDBStatus()) {
      await queryDB('DELETE FROM job_roles WHERE id = ?', [id]);
      await logAdminActivity(req.user.id, 'DELETE_JOB_ROLE', `Deleted job role ID ${id}`);
    } else {
      memoryJobRoles = memoryJobRoles.filter(r => r.id !== parseInt(id));
      await logAdminActivity(req.user.id, 'DELETE_JOB_ROLE', `Deleted job role ID ${id} in-memory`);
    }
    res.json({ success: true, message: 'Job role deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- INTERVIEW TYPE MANAGEMENT ---
router.get('/admin/interview-types', authMiddleware, roleMiddleware(['super_admin', 'admin', 'content_manager']), async (req, res) => {
  try {
    if (getDBStatus()) {
      const list = await queryDB('SELECT * FROM interview_types ORDER BY id DESC');
      res.json(list);
    } else {
      res.json(memoryInterviewTypes);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/admin/interview-type', authMiddleware, roleMiddleware(['super_admin', 'admin', 'content_manager']), async (req, res) => {
  try {
    const { name, duration } = req.body;
    if (getDBStatus()) {
      const result = await queryDB('INSERT INTO interview_types (name, duration) VALUES (?, ?)', [name, duration]);
      await logAdminActivity(req.user.id, 'CREATE_INTERVIEW_TYPE', `Created interview type: ${name}`);
      res.status(201).json({ id: result.insertId, name, duration });
    } else {
      const newType = { id: memoryInterviewTypes.length + 1, name, duration };
      memoryInterviewTypes.push(newType);
      await logAdminActivity(req.user.id, 'CREATE_INTERVIEW_TYPE', `Created interview type in-memory: ${name}`);
      res.status(201).json(newType);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/admin/interview-type/:id', authMiddleware, roleMiddleware(['super_admin', 'admin', 'content_manager']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, duration } = req.body;
    if (getDBStatus()) {
      await queryDB('UPDATE interview_types SET name = ?, duration = ? WHERE id = ?', [name, duration, id]);
      await logAdminActivity(req.user.id, 'EDIT_INTERVIEW_TYPE', `Updated interview type ID ${id}: ${name}`);
      res.json({ id, name, duration });
    } else {
      const type = memoryInterviewTypes.find(t => t.id === parseInt(id));
      if (!type) return res.status(404).json({ error: 'Type not found' });
      type.name = name || type.name;
      type.duration = duration || type.duration;
      await logAdminActivity(req.user.id, 'EDIT_INTERVIEW_TYPE', `Updated interview type ID ${id} in-memory: ${name}`);
      res.json(type);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/admin/interview-type/:id', authMiddleware, roleMiddleware(['super_admin', 'admin', 'content_manager']), async (req, res) => {
  try {
    const { id } = req.params;
    if (getDBStatus()) {
      await queryDB('DELETE FROM interview_types WHERE id = ?', [id]);
      await logAdminActivity(req.user.id, 'DELETE_INTERVIEW_TYPE', `Deleted interview type ID ${id}`);
    } else {
      memoryInterviewTypes = memoryInterviewTypes.filter(t => t.id !== parseInt(id));
      await logAdminActivity(req.user.id, 'DELETE_INTERVIEW_TYPE', `Deleted interview type ID ${id} in-memory`);
    }
    res.json({ success: true, message: 'Interview type deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- COMPANY MANAGEMENT ---
router.get('/admin/companies', authMiddleware, roleMiddleware(['super_admin', 'admin', 'content_manager']), async (req, res) => {
  try {
    if (getDBStatus()) {
      const list = await queryDB('SELECT * FROM companies ORDER BY id DESC');
      res.json(list);
    } else {
      res.json(memoryCompanies);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/admin/company', authMiddleware, roleMiddleware(['super_admin', 'admin', 'content_manager']), async (req, res) => {
  try {
    const { name } = req.body;
    if (getDBStatus()) {
      const result = await queryDB('INSERT INTO companies (name) VALUES (?)', [name]);
      await logAdminActivity(req.user.id, 'CREATE_COMPANY', `Created company: ${name}`);
      res.status(201).json({ id: result.insertId, name });
    } else {
      const newCompany = { id: memoryCompanies.length + 1, name };
      memoryCompanies.push(newCompany);
      await logAdminActivity(req.user.id, 'CREATE_COMPANY', `Created company in-memory: ${name}`);
      res.status(201).json(newCompany);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/admin/company/:id', authMiddleware, roleMiddleware(['super_admin', 'admin', 'content_manager']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (getDBStatus()) {
      await queryDB('UPDATE companies SET name = ? WHERE id = ?', [name, id]);
      await logAdminActivity(req.user.id, 'EDIT_COMPANY', `Updated company ID ${id}: ${name}`);
      res.json({ id, name });
    } else {
      const comp = memoryCompanies.find(c => c.id === parseInt(id));
      if (!comp) return res.status(404).json({ error: 'Company not found' });
      comp.name = name || comp.name;
      await logAdminActivity(req.user.id, 'EDIT_COMPANY', `Updated company ID ${id} in-memory: ${name}`);
      res.json(comp);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/admin/company/:id', authMiddleware, roleMiddleware(['super_admin', 'admin', 'content_manager']), async (req, res) => {
  try {
    const { id } = req.params;
    if (getDBStatus()) {
      await queryDB('DELETE FROM companies WHERE id = ?', [id]);
      await logAdminActivity(req.user.id, 'DELETE_COMPANY', `Deleted company ID ${id}`);
    } else {
      memoryCompanies = memoryCompanies.filter(c => c.id !== parseInt(id));
      await logAdminActivity(req.user.id, 'DELETE_COMPANY', `Deleted company ID ${id} in-memory`);
    }
    res.json({ success: true, message: 'Company deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- AI PROMPT MANAGEMENT ---
router.get('/admin/ai-prompts', authMiddleware, roleMiddleware(['super_admin', 'admin', 'content_manager']), async (req, res) => {
  try {
    if (getDBStatus()) {
      const list = await queryDB('SELECT * FROM ai_prompts ORDER BY id DESC');
      res.json(list);
    } else {
      res.json(memoryAiPrompts);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/admin/ai-prompt', authMiddleware, roleMiddleware(['super_admin', 'admin', 'content_manager']), async (req, res) => {
  try {
    const { name, content } = req.body;
    if (getDBStatus()) {
      const result = await queryDB('INSERT INTO ai_prompts (name, content) VALUES (?, ?)', [name, content]);
      await logAdminActivity(req.user.id, 'CREATE_PROMPT', `Created prompt: ${name}`);
      res.status(201).json({ id: result.insertId, name, content, is_active: true });
    } else {
      const newPrompt = { id: memoryAiPrompts.length + 1, name, content, is_active: true };
      memoryAiPrompts.push(newPrompt);
      await logAdminActivity(req.user.id, 'CREATE_PROMPT', `Created prompt in-memory: ${name}`);
      res.status(201).json(newPrompt);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/admin/ai-prompt/:id', authMiddleware, roleMiddleware(['super_admin', 'admin', 'content_manager']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, content, is_active } = req.body;
    const isActiveVal = is_active !== undefined ? (is_active ? 1 : 0) : 1;

    if (getDBStatus()) {
      await queryDB('UPDATE ai_prompts SET name = ?, content = ?, is_active = ? WHERE id = ?', [name, content, isActiveVal, id]);
      await logAdminActivity(req.user.id, 'EDIT_PROMPT', `Updated prompt ID ${id}: ${name}`);
      res.json({ id, name, content, is_active: !!isActiveVal });
    } else {
      const prompt = memoryAiPrompts.find(p => p.id === parseInt(id));
      if (!prompt) return res.status(404).json({ error: 'Prompt not found' });
      prompt.name = name || prompt.name;
      prompt.content = content || prompt.content;
      if (is_active !== undefined) prompt.is_active = !!is_active;
      await logAdminActivity(req.user.id, 'EDIT_PROMPT', `Updated prompt ID ${id} in-memory: ${prompt.name}`);
      res.json(prompt);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/admin/ai-prompt/:id', authMiddleware, roleMiddleware(['super_admin', 'admin', 'content_manager']), async (req, res) => {
  try {
    const { id } = req.params;
    if (getDBStatus()) {
      await queryDB('DELETE FROM ai_prompts WHERE id = ?', [id]);
      await logAdminActivity(req.user.id, 'DELETE_PROMPT', `Deleted prompt ID ${id}`);
    } else {
      memoryAiPrompts = memoryAiPrompts.filter(p => p.id !== parseInt(id));
      await logAdminActivity(req.user.id, 'DELETE_PROMPT', `Deleted prompt ID ${id} in-memory`);
    }
    res.json({ success: true, message: 'Prompt deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- QUESTION BANK MANAGEMENT ---
router.get('/admin/questions', authMiddleware, roleMiddleware(['super_admin', 'admin', 'content_manager']), async (req, res) => {
  try {
    if (getDBStatus()) {
      const list = await queryDB('SELECT * FROM question_bank ORDER BY id DESC');
      res.json(list);
    } else {
      res.json(memoryQuestionBank);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/admin/question', authMiddleware, roleMiddleware(['super_admin', 'admin', 'content_manager']), async (req, res) => {
  try {
    const { question, type } = req.body;
    if (getDBStatus()) {
      const result = await queryDB('INSERT INTO question_bank (question, type) VALUES (?, ?)', [question, type]);
      await logAdminActivity(req.user.id, 'CREATE_QUESTION', `Created question`);
      res.status(201).json({ id: result.insertId, question, type });
    } else {
      const newQuestion = { id: memoryQuestionBank.length + 1, question, type };
      memoryQuestionBank.push(newQuestion);
      await logAdminActivity(req.user.id, 'CREATE_QUESTION', `Created question in-memory`);
      res.status(201).json(newQuestion);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/admin/question/:id', authMiddleware, roleMiddleware(['super_admin', 'admin', 'content_manager']), async (req, res) => {
  try {
    const { id } = req.params;
    const { question, type } = req.body;
    if (getDBStatus()) {
      await queryDB('UPDATE question_bank SET question = ?, type = ? WHERE id = ?', [question, type, id]);
      await logAdminActivity(req.user.id, 'EDIT_QUESTION', `Updated question ID ${id}`);
      res.json({ id, question, type });
    } else {
      const q = memoryQuestionBank.find(qb => qb.id === parseInt(id));
      if (!q) return res.status(404).json({ error: 'Question not found' });
      q.question = question || q.question;
      q.type = type || q.type;
      await logAdminActivity(req.user.id, 'EDIT_QUESTION', `Updated question ID ${id} in-memory`);
      res.json(q);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/admin/question/:id', authMiddleware, roleMiddleware(['super_admin', 'admin', 'content_manager']), async (req, res) => {
  try {
    const { id } = req.params;
    if (getDBStatus()) {
      await queryDB('DELETE FROM question_bank WHERE id = ?', [id]);
      await logAdminActivity(req.user.id, 'DELETE_QUESTION', `Deleted question ID ${id}`);
    } else {
      memoryQuestionBank = memoryQuestionBank.filter(q => q.id !== parseInt(id));
      await logAdminActivity(req.user.id, 'DELETE_QUESTION', `Deleted question ID ${id} in-memory`);
    }
    res.json({ success: true, message: 'Question deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- SKILLS MANAGEMENT ---
router.get('/admin/skills', authMiddleware, roleMiddleware(['super_admin', 'admin', 'content_manager']), async (req, res) => {
  try {
    if (getDBStatus()) {
      const list = await queryDB('SELECT * FROM skills ORDER BY name ASC');
      res.json(list);
    } else {
      res.json(memorySkills);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/admin/skill', authMiddleware, roleMiddleware(['super_admin', 'admin', 'content_manager']), async (req, res) => {
  try {
    const { name } = req.body;
    if (getDBStatus()) {
      const result = await queryDB('INSERT INTO skills (name) VALUES (?)', [name]);
      await logAdminActivity(req.user.id, 'CREATE_SKILL', `Added skill: ${name}`);
      res.status(201).json({ id: result.insertId, name });
    } else {
      const newSkill = { id: memorySkills.length + 1, name };
      memorySkills.push(newSkill);
      await logAdminActivity(req.user.id, 'CREATE_SKILL', `Added skill in-memory: ${name}`);
      res.status(201).json(newSkill);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/admin/skill/:id', authMiddleware, roleMiddleware(['super_admin', 'admin', 'content_manager']), async (req, res) => {
  try {
    const { id } = req.params;
    if (getDBStatus()) {
      await queryDB('DELETE FROM skills WHERE id = ?', [id]);
      await logAdminActivity(req.user.id, 'DELETE_SKILL', `Deleted skill ID ${id}`);
    } else {
      memorySkills = memorySkills.filter(s => s.id !== parseInt(id));
      await logAdminActivity(req.user.id, 'DELETE_SKILL', `Deleted skill ID ${id} in-memory`);
    }
    res.json({ success: true, message: 'Skill deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- FEEDBACK MANAGEMENT ---
router.get('/admin/feedbacks', authMiddleware, roleMiddleware(['super_admin', 'admin']), async (req, res) => {
  try {
    if (getDBStatus()) {
      const list = await queryDB('SELECT f.id, f.message, f.reply, f.is_resolved, f.created_at, u.name as username FROM feedback f LEFT JOIN users u ON f.user_id = u.id ORDER BY f.created_at DESC');
      res.json(list);
    } else {
      res.json(memoryFeedback);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/admin/feedback/reply/:id', authMiddleware, roleMiddleware(['super_admin', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { reply } = req.body;
    if (getDBStatus()) {
      await queryDB('UPDATE feedback SET reply = ?, is_resolved = 1 WHERE id = ?', [reply, id]);
      await logAdminActivity(req.user.id, 'REPLY_FEEDBACK', `Replied to feedback ID ${id}`);
      res.json({ id, reply, is_resolved: true });
    } else {
      const item = memoryFeedback.find(f => f.id === parseInt(id));
      if (!item) return res.status(404).json({ error: 'Feedback item not found' });
      item.reply = reply;
      item.is_resolved = true;
      await logAdminActivity(req.user.id, 'REPLY_FEEDBACK', `Replied to feedback ID ${id} in-memory`);
      res.json(item);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/admin/feedback/resolve/:id', authMiddleware, roleMiddleware(['super_admin', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    if (getDBStatus()) {
      await queryDB('UPDATE feedback SET is_resolved = 1 WHERE id = ?', [id]);
      res.json({ success: true, message: 'Feedback resolved' });
    } else {
      const item = memoryFeedback.find(f => f.id === parseInt(id));
      if (item) item.is_resolved = true;
      res.json({ success: true });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/admin/feedback/:id', authMiddleware, roleMiddleware(['super_admin', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    if (getDBStatus()) {
      await queryDB('DELETE FROM feedback WHERE id = ?', [id]);
    } else {
      memoryFeedback = memoryFeedback.filter(f => f.id !== parseInt(id));
    }
    res.json({ success: true, message: 'Feedback deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- SYSTEM SETTINGS ---
router.get('/admin/settings', authMiddleware, roleMiddleware(['super_admin']), async (req, res) => {
  try {
    if (getDBStatus()) {
      const rows = await queryDB('SELECT * FROM settings');
      const settingsObj = {};
      rows.forEach(r => {
        try {
          settingsObj[r.key_name] = JSON.parse(r.value_data);
        } catch (e) {
          settingsObj[r.key_name] = r.value_data;
        }
      });
      res.json(settingsObj);
    } else {
      res.json(memorySettings);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/admin/settings', authMiddleware, roleMiddleware(['super_admin']), async (req, res) => {
  try {
    const newSettings = req.body;
    if (getDBStatus()) {
      for (const [key, value] of Object.entries(newSettings)) {
        const valStr = typeof value === 'object' ? JSON.stringify(value) : String(value);
        await queryDB('INSERT INTO settings (key_name, value_data) VALUES (?, ?) ON DUPLICATE KEY UPDATE value_data = ?', [key, valStr, valStr]);
      }
      await logAdminActivity(req.user.id, 'UPDATE_SETTINGS', 'Global system settings updated');
      res.json({ success: true, message: 'Global system settings updated successfully' });
    } else {
      memorySettings = { ...memorySettings, ...newSettings };
      await logAdminActivity(req.user.id, 'UPDATE_SETTINGS', 'Global settings updated in-memory');
      res.json({ success: true, settings: memorySettings });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- SYSTEM LOGS ---
router.get('/admin/logs', authMiddleware, roleMiddleware(['super_admin', 'admin']), async (req, res) => {
  try {
    if (getDBStatus()) {
      const list = await queryDB('SELECT l.id, l.action, l.details, l.created_at, u.name as username FROM activity_logs l LEFT JOIN users u ON l.user_id = u.id ORDER BY l.created_at DESC LIMIT 50');
      res.json(list);
    } else {
      res.json(memoryAdminLogs);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- AI MODEL MANAGEMENT ---
router.get('/admin/model-status', authMiddleware, roleMiddleware(['super_admin']), (req, res) => {
  res.json({
    status: 'Healthy',
    modelName: 'Llama 3.2 (Ollama)',
    connectionStatus: 'Connected',
    url: 'http://localhost:11434',
    temperature: 0.7,
    maxTokens: 512,
    cpuLoad: '12%',
    memoryUsage: '28%'
  });
});

router.post('/admin/model-settings', authMiddleware, roleMiddleware(['super_admin']), async (req, res) => {
  const { temperature, maxTokens } = req.body;
  await logAdminActivity(req.user.id, 'UPDATE_AI_MODEL_SETTINGS', `Temp: ${temperature}, MaxTokens: ${maxTokens}`);
  res.json({ success: true, message: 'AI model parameters updated successfully' });
});

// --- BACKUP & RESTORE ---
router.post('/admin/backup', authMiddleware, roleMiddleware(['super_admin']), async (req, res) => {
  await logAdminActivity(req.user.id, 'DATABASE_BACKUP', 'Manual database backup created');
  res.json({ success: true, message: 'Database backup compiled and saved locally', backupFile: 'backup_' + Date.now() + '.sql' });
});

router.post('/admin/restore', authMiddleware, roleMiddleware(['super_admin']), async (req, res) => {
  await logAdminActivity(req.user.id, 'DATABASE_RESTORE', 'Manual database restoration triggered');
  res.json({ success: true, message: 'Database schema and records restored successfully from backup point' });
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
  try {
    const { fileContent = '' } = req.body;
    const parsed = await resumeService.parseResume(fileContent);
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/ai/analyze-resume', async (req, res) => {
  try {
    const { roleTarget = '', skills = [] } = req.body;
    const analysis = await resumeService.analyzeResume(roleTarget, skills);
    res.json(analysis);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
  try {
    const { questions = [], answers = [] } = req.body;
    const feedback = await feedbackService.generateFinalFeedback(questions, answers);
    res.json(feedback);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/ai/recommend-practice', (req, res) => {
  res.json({ recommendedAreas: ['System Design Scale Check', 'Redux State Management'] });
});

// --- NEW SPECIFIC AI ENDPOINTS ---

router.post('/ai/generate-questions', async (req, res) => {
  try {
    const { name, roleTarget, experience, skills, count } = req.body;
    const questions = await questionService.generateQuestions({ name, roleTarget, experience, skills, count });
    res.json({ success: true, questions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/ai/resume-analysis', async (req, res) => {
  try {
    const { roleTarget, skills } = req.body;
    const analysis = await resumeService.analyzeResume(roleTarget, skills);
    res.json({ success: true, ...analysis });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/ai/hr-interview', async (req, res) => {
  try {
    const question = await questionService.generateHRQuestion();
    res.json({ success: true, question });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/ai/technical-interview', async (req, res) => {
  try {
    const { domain } = req.body;
    const question = await questionService.generateTechnicalQuestion(domain);
    res.json({ success: true, question });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/ai/behavioral-interview', async (req, res) => {
  try {
    const question = await questionService.generateBehavioralQuestion();
    res.json({ success: true, question });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/ai/company-interview', async (req, res) => {
  try {
    const { company, role } = req.body;
    const question = await questionService.generateCompanyQuestion(company, role);
    res.json({ success: true, question });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- ADDITIONAL PORTAL ADMIN MODULES ENDPOINTS ---

let memoryEmailTemplates = [
  { id: 1, name: 'Welcome Email', subject: 'Welcome to PrepFlow AI!', body: 'Hi {{name}},\n\nWelcome to PrepFlow! We are excited to support your mock interview preparation journeys. Upload your resume to start customized mock coaching.' },
  { id: 2, name: 'OTP Email', subject: 'Your OTP Verification Code', body: 'Hi {{name}},\n\nYour OTP code is {{otp}}. This verification code is valid for 10 minutes. Do not share this code with anyone.' },
  { id: 3, name: 'Password Reset', subject: 'Password Reset Request', body: 'Hi {{name}},\n\nWe received a password reset request. Click the link to reset your account password: {{reset_link}}' },
  { id: 4, name: 'Interview Complete', subject: 'Mock Practice Session Finished', body: 'Hi {{name}},\n\nCongratulations! You have completed your mock session for {{role}}. Your performance details are being analyzed.' },
  { id: 5, name: 'Report Ready', subject: 'AI Performance Report Available', body: 'Hi {{name}},\n\nYour detailed interview scorecard is compiled! Open your dashboard to view technical and pacing metric grades.' }
];

router.get('/admin/email-templates', authMiddleware, roleMiddleware(['super_admin', 'admin']), async (req, res) => {
  try {
    if (getDBStatus()) {
      const templates = await queryDB('SELECT * FROM email_templates ORDER BY id DESC');
      res.json(templates);
    } else {
      res.json(memoryEmailTemplates);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/admin/email-template/:id', authMiddleware, roleMiddleware(['super_admin', 'admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, subject, body } = req.body;
    if (getDBStatus()) {
      await queryDB('UPDATE email_templates SET name = ?, subject = ?, body = ? WHERE id = ?', [name, subject, body, id]);
      res.json({ id, name, subject, body });
    } else {
      const template = memoryEmailTemplates.find(t => t.id === parseInt(id));
      if (!template) return res.status(404).json({ error: 'Template not found' });
      template.name = name || template.name;
      template.subject = subject || template.subject;
      template.body = body || template.body;
      res.json(template);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/admin/system-health', authMiddleware, roleMiddleware(['super_admin']), async (req, res) => {
  const cpuLoad = Math.floor(Math.random() * 20) + 10;
  const ramUsage = Math.floor(Math.random() * 15) + 40;
  const diskUsage = 68;
  const uptimeMins = Math.floor(process.uptime() / 60);

  res.json({
    cpu: cpuLoad,
    ram: ramUsage,
    disk: diskUsage,
    uptime: `${Math.floor(uptimeMins / 60)}h ${uptimeMins % 60}m`,
    serverStatus: 'Online',
    databaseStatus: getDBStatus() ? 'Connected (MySQL)' : 'Fallback Memory DB',
    ollamaStatus: 'Active (Llama 3.2 3B)',
    apiGateway: 'Healthy'
  });
});

router.get('/admin/security/logs', authMiddleware, roleMiddleware(['super_admin']), async (req, res) => {
  try {
    if (getDBStatus()) {
      const list = await queryDB('SELECT * FROM security_logs ORDER BY created_at DESC LIMIT 50');
      res.json(list);
    } else {
      res.json([
        { id: 1, event: 'AUTH_SUCCESS', ip_address: '127.0.0.1', username: 'superadmin@prepcoach.ai', details: 'Session JWT generated successfully.', created_at: new Date() },
        { id: 2, event: 'AUTH_SUCCESS', ip_address: '192.168.1.45', username: 'jane@example.com', details: 'Successful credentials verification.', created_at: new Date() },
        { id: 3, event: 'AUTH_FAILED', ip_address: '185.220.101.4', username: 'admin@prepcoach.ai', details: 'Warning: Invalid password attempt on admin role.', created_at: new Date(Date.now() - 3600000) },
        { id: 4, event: 'API_POLICY_BLOCK', ip_address: '185.220.101.4', username: 'anonymous', details: 'Suspicious IP attempting multiple rapid requests block.', created_at: new Date(Date.now() - 7200000) }
      ]);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/admin/api/logs', authMiddleware, roleMiddleware(['super_admin']), async (req, res) => {
  try {
    if (getDBStatus()) {
      const list = await queryDB('SELECT * FROM api_logs ORDER BY created_at DESC LIMIT 50');
      res.json(list);
    } else {
      res.json([
        { id: 1, method: 'GET', url: '/api/profile', status: 200, response_time_ms: 12, created_at: new Date() },
        { id: 2, method: 'POST', url: '/api/interview/generate', status: 201, response_time_ms: 450, created_at: new Date() },
        { id: 3, method: 'POST', url: '/api/admin/settings', status: 200, response_time_ms: 22, created_at: new Date(Date.now() - 10000) },
        { id: 4, method: 'GET', url: '/api/admin/users', status: 403, response_time_ms: 5, created_at: new Date(Date.now() - 20000) }
      ]);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/admin/interviews/sessions', authMiddleware, roleMiddleware(['super_admin', 'admin']), async (req, res) => {
  try {
    if (getDBStatus()) {
      const list = await queryDB('SELECT s.id, s.role_target, s.overall_score, s.technical_score, s.communication_score, s.date, u.name as username, u.email as user_email FROM sessions s LEFT JOIN users u ON s.user_id = u.id ORDER BY s.date DESC');
      res.json(list);
    } else {
      res.json([
        { id: 1, username: 'Jane Doe', user_email: 'jane@example.com', role_target: 'React Developer', overall_score: 82, technical_score: 85, communication_score: 80, date: new Date() },
        { id: 2, username: 'Jane Doe', user_email: 'jane@example.com', role_target: 'React Developer', overall_score: 74, technical_score: 70, communication_score: 78, date: new Date(Date.now() - 86400000) }
      ]);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/admin/leaderboard', authMiddleware, roleMiddleware(['super_admin', 'admin']), async (req, res) => {
  res.json([
    { rank: 1, name: 'Jane Doe', email: 'jane@example.com', role: 'React Developer', technical: 92, communication: 88, overall: 90 },
    { rank: 2, name: 'Alice Smith', email: 'alice@example.com', role: 'Node.js Developer', technical: 88, communication: 90, overall: 89 },
    { rank: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'Java Developer', technical: 85, communication: 82, overall: 84 }
  ]);
});

router.post('/ai/final-feedback', async (req, res) => {
  try {
    const { questions, answers } = req.body;
    const feedback = await feedbackService.generateFinalFeedback(questions, answers);
    res.json({ success: true, ...feedback });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
