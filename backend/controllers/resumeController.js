const { extractText } = require('../services/pdfParser');
const resumeService = require('../services/resumeService');
const questionService = require('../services/questionService');
const Resume = require('../models/Resume');
const { getPool, getDBStatus } = require('../config/db');

/**
 * Handles multipart file uploads, extracts document texts, structures metadata,
 * generates tailored interview questions, and saves the complete profile to DB.
 */
const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No resume file uploaded' });
    }

    // 1. Extract plain text from buffer with fallback to original filename if empty
    let textContent = '';
    try {
      textContent = await extractText(req.file.buffer, req.file.mimetype);
    } catch (err) {
      console.warn('[RESUME CONTROLLER WARNING] Text extraction failed:', err.message);
    }

    if (!textContent || !textContent.trim()) {
      console.warn('[RESUME CONTROLLER WARNING] Extracted text content is empty. Falling back to filename.');
      textContent = req.file.originalname || 'Resume file';
    }

    // 2. Parse structural details with Llama 3.2
    const parsedData = await resumeService.parseResume(textContent);
    
    // 3. Generate tailored interview questions based on parsed resume profile
    let questions = [];
    try {
      const skillsStr = Array.isArray(parsedData.skills) ? parsedData.skills.join(', ') : (parsedData.skills || '');
      questions = await questionService.generateQuestions({
        name: parsedData.name || 'Candidate',
        roleTarget: parsedData.roleTarget || 'Software Engineer',
        experience: parsedData.experience || '1-2 Years',
        skills: skillsStr,
        count: 5
      });
    } catch (qErr) {
      console.warn('[RESUME CONTROLLER WARNING] Question generation failed, saving empty:', qErr.message);
    }

    // 4. Save to database with generated questions
    const userId = req.user ? req.user.id : null;
    const candidateName = parsedData.name || (req.user ? req.user.name : 'Candidate');

    const resumeId = await Resume.create({
      userId,
      name: candidateName,
      roleTarget: parsedData.roleTarget,
      experience: parsedData.experience,
      skills: parsedData.skills,
      questions: questions,
      resumeText: textContent,
      parsedJson: parsedData
    });

    res.json({
      success: true,
      resumeId,
      profile: {
        id: resumeId,
        name: candidateName,
        roleTarget: parsedData.roleTarget,
        skills: parsedData.skills || [],
        experience: parsedData.experience,
        projects: parsedData.projects || [],
        education: parsedData.education,
        certifications: parsedData.certifications || [],
        questions: questions
      }
    });

  } catch (error) {
    console.error('[RESUME CONTROLLER ERROR] Failed to upload and parse resume:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Analyzes resume skills context for compatibility score and details
 */
const analyzeResume = async (req, res) => {
  try {
    const { roleTarget, skills } = req.body;
    if (!roleTarget || !skills) {
      return res.status(400).json({ success: false, error: 'roleTarget and skills are required' });
    }

    const analysis = await resumeService.analyzeResume(roleTarget, skills);
    res.json({
      success: true,
      ...analysis
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Retrieves the latest parsed resume profile for the candidate.
 */
const getLatestResume = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    let resumeRecord = null;
    if (getDBStatus()) {
      const [rows] = await getPool().query('SELECT * FROM resumes WHERE user_id = ? ORDER BY id DESC LIMIT 1', [userId]);
      if (rows.length > 0) {
        resumeRecord = rows[0];
      }
    } else {
      const memoryResumes = Resume.getMemoryResumes();
      const userResumes = memoryResumes.filter(r => String(r.userId) === String(userId));
      if (userResumes.length > 0) {
        resumeRecord = userResumes[userResumes.length - 1];
      }
    }

    if (!resumeRecord) {
      return res.json({ success: true, resume: null });
    }

    // Parse structures
    const skills = typeof resumeRecord.skills === 'string' ? JSON.parse(resumeRecord.skills) : (resumeRecord.skills || []);
    const parsedJson = typeof resumeRecord.parsed_json === 'string' ? JSON.parse(resumeRecord.parsed_json) : (resumeRecord.parsedJson || null);
    let questions = [];
    if (resumeRecord.questions) {
      try {
        questions = typeof resumeRecord.questions === 'string' ? JSON.parse(resumeRecord.questions) : resumeRecord.questions;
        if (!Array.isArray(questions)) questions = [];
      } catch (e) { questions = []; }
    }

    res.json({
      success: true,
      resume: {
        id: resumeRecord.id,
        name: resumeRecord.name,
        roleTarget: resumeRecord.role_target || resumeRecord.roleTarget,
        skills: skills,
        experience: resumeRecord.experience,
        projects: parsedJson ? (parsedJson.projects || []) : [],
        education: parsedJson ? (parsedJson.education || '') : '',
        certifications: parsedJson ? (parsedJson.certifications || []) : [],
        questions: questions
      }
    });

  } catch (error) {
    console.error('[RESUME CONTROLLER ERROR] Failed to fetch latest resume:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  uploadResume,
  analyzeResume,
  getLatestResume
};
