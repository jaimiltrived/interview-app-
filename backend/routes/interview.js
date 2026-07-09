const express = require('express');
const authMiddleware = require('../middleware/auth');
const interviewController = require('../controllers/interviewController');

const router = express.Router();

router.post('/interview/generate', authMiddleware, interviewController.generateQuestions);
router.post('/interview/start', authMiddleware, interviewController.startInterview);
router.post('/interview/answer', authMiddleware, interviewController.submitAnswer);
router.post('/interview/report', authMiddleware, interviewController.generateReport);

module.exports = router;
