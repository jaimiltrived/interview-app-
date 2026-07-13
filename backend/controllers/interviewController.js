const questionService = require('../services/questionService');
const evaluationService = require('../services/evaluationService');
const feedbackService = require('../services/feedbackService');
const reportService = require('../services/reportService');
const { generateResponse, cleanAndParseJSON } = require('../services/ollamaService');

const InterviewQuestion = require('../models/InterviewQuestion');
const InterviewAnswer = require('../models/InterviewAnswer');
const InterviewReport = require('../models/InterviewReport');

const { getPool, getDBStatus } = require('../config/db');

/**
 * Endpoint to generate structured questions batch (HR, Tech, Project, Behavioral)
 */
const generateQuestions = async (req, res) => {
  try {
    const { name, roleTarget, skills = [], projects = [] } = req.body;
    const candidateName = name || (req.user ? req.user.name : 'Candidate');
    const role = roleTarget || 'Software Engineer';

    const questions = await questionService.generateStructuredQuestions({
      name: candidateName,
      roleTarget: role,
      skills,
      projects
    });

    res.json({
      success: true,
      questions
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Adaptive AI-first question generation endpoint (one question at a time)
 */
const getNextQuestion = async (req, res) => {
  try {
    const {
      stepIndex = 0,
      roleTarget = 'Software Engineer',
      skills = [],
      projects = [],
      previousQuestion = '',
      previousAnswer = '',
      previousEvaluation = null
    } = req.body;

    const nextQuestion = await questionService.generateNextQuestion({
      stepIndex,
      roleTarget,
      skills,
      projects,
      previousQuestion,
      previousAnswer,
      previousEvaluation
    });

    res.json({
      success: true,
      message: 'Next adaptive question generated successfully',
      data: nextQuestion
    });
  } catch (error) {
    console.error('[INTERVIEW CONTROLLER ERROR] Failed to generate next question:', error.message);
    res.status(500).json({
      success: false,
      message: error.message,
      errorCode: 'NEXT_QUESTION_ERROR'
    });
  }
};

/**
 * Initializes and starts the mock session by saving the generated questions in DB.
 */
const startInterview = async (req, res) => {
  try {
    const { questions = [] } = req.body; // Array of { question: "...", type: "hr|technical|project|behavioral" }
    const userId = req.user ? req.user.id : null;

    if (!questions.length) {
      return res.status(400).json({ success: false, error: 'Questions list cannot be empty' });
    }

    const payload = questions.map(q => ({
      userId,
      question: q.question,
      type: q.type
    }));

    const savedQuestions = await InterviewQuestion.bulkCreate(payload);
    res.json({
      success: true,
      message: 'Interview session initialized successfully',
      questions: savedQuestions
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Submits a candidate answer, runs LLM evaluation, and stores logs in database.
 */
const submitAnswer = async (req, res) => {
  try {
    const { questionId, answer } = req.body;
    if (!questionId || !answer) {
      return res.status(400).json({ success: false, error: 'questionId and answer are required' });
    }

    // 1. Fetch question text to provide context for LLM evaluation
    let questionText = 'Explain this engineering concept.';
    if (getDBStatus()) {
      const [rows] = await getPool().query('SELECT question FROM interview_questions WHERE id = ?', [questionId]);
      if (rows.length > 0) {
        questionText = rows[0].question;
      }
    } else {
      const found = InterviewQuestion.getMemoryQuestions().find(q => String(q.id) === String(questionId));
      if (found) {
        questionText = found.question;
      }
    }

    // 2. Perform AI answer evaluation
    const evaluation = await evaluationService.evaluateAnswer(questionText, answer);

    // 3. Save evaluation metrics to DB
    const scorePayload = {
      technicalScore: evaluation.technicalScore,
      communicationScore: evaluation.communicationScore,
      correctness: evaluation.correctness
    };

    const feedbackText = `Feedback: ${evaluation.feedback} | Improvements: ${evaluation.improvement}`;

    const answerId = await InterviewAnswer.create({
      questionId,
      answer,
      score: scorePayload,
      feedback: feedbackText
    });

    res.json({
      success: true,
      answerId,
      evaluation: {
        technicalScore: evaluation.technicalScore,
        communicationScore: evaluation.communicationScore,
        correctness: evaluation.correctness,
        feedback: evaluation.feedback,
        improvement: evaluation.improvement
      }
    });

  } catch (error) {
    console.error('[INTERVIEW CONTROLLER ERROR] Failed to evaluate answer:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Aggregates answer scores, generates summary report, and saves to DB.
 */
const generateReport = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User registration required for reports' });
    }

    // 1. Retrieve all questions and answers for this user
    let qaPairs = [];
    if (getDBStatus()) {
      const [rows] = await getPool().query(
        `SELECT iq.question, iq.type, ia.answer, ia.score, ia.feedback 
         FROM interview_questions iq
         INNER JOIN interview_answers ia ON iq.id = ia.question_id
         WHERE iq.user_id = ? ORDER BY iq.id ASC`,
        [userId]
      );
      qaPairs = rows.map(r => ({
        question: r.question,
        type: r.type,
        answer: r.answer,
        score: r.score ? (typeof r.score === 'string' ? JSON.parse(r.score) : r.score) : null,
        feedback: r.feedback
      }));
    } else {
      const userQuestions = InterviewQuestion.getMemoryQuestions().filter(q => q.userId === userId);
      const userAnswers = InterviewAnswer.getMemoryAnswers();
      qaPairs = userQuestions.map(q => {
        const ans = userAnswers.find(a => String(a.questionId) === String(q.id));
        return {
          question: q.question,
          type: q.type,
          answer: ans ? ans.answer : '',
          score: ans ? ans.score : null,
          feedback: ans ? ans.feedback : ''
        };
      }).filter(pair => pair.answer !== '');
    }

    if (!qaPairs.length) {
      return res.status(400).json({ success: false, error: 'No practice sessions logged. Complete an interview first.' });
    }

    // 2. Compute average metrics
    let totalTech = 0;
    let totalComm = 0;
    let totalCorrectness = 0;
    let evaluatedCount = 0;

    qaPairs.forEach(pair => {
      if (pair.score) {
        totalTech += pair.score.technicalScore || 0;
        totalComm += pair.score.communicationScore || 0;
        totalCorrectness += pair.score.correctness || 0;
        evaluatedCount++;
      }
    });

    const avgTech = evaluatedCount ? Math.round(totalTech / evaluatedCount) : 75;
    const avgComm = evaluatedCount ? Math.round(totalComm / evaluatedCount) : 75;
    const avgCorrectness = evaluatedCount ? Math.round(totalCorrectness / evaluatedCount) : 75;
    
    // Overall score weights: 40% Technical, 40% Communication, 20% Correctness
    const overallScore = Math.round((avgTech * 0.4) + (avgComm * 0.4) + (avgCorrectness * 0.2));

    // 3. Delegate to dedicated lightweight AI reportService
    const parsedReport = await reportService.generateFinalReport({
      avgTech,
      avgComm,
      overallScore,
      qaPairs,
      roleTarget: req.body.roleTarget || 'Software Engineer'
    });

    // 4. Save report record in MySQL
    const reportId = await InterviewReport.create({
      userId,
      overallScore,
      technicalScore: avgTech,
      communicationScore: avgComm,
      reportJson: parsedReport
    });

    res.json({
      success: true,
      message: 'Final interview report generated successfully',
      data: {
        reportId,
        report: parsedReport
      }
    });

  } catch (error) {
    console.error('[INTERVIEW CONTROLLER ERROR] Failed to generate report:', error.message);
    res.status(500).json({
      success: false,
      message: error.message,
      errorCode: 'REPORT_GENERATION_ERROR'
    });
  }
};

module.exports = {
  generateQuestions,
  getNextQuestion,
  startInterview,
  submitAnswer,
  generateReport
};
