const express = require('express');
const multer = require('multer');
const authMiddleware = require('../middleware/auth');
const resumeController = require('../controllers/resumeController');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

router.post('/resume/upload', authMiddleware, upload.single('file'), resumeController.uploadResume);
router.post('/resume/analyze', authMiddleware, resumeController.analyzeResume);
router.get('/resume/latest', authMiddleware, resumeController.getLatestResume);

module.exports = router;
