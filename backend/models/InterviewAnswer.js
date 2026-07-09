const { getPool, getDBStatus } = require('../config/db');

let memoryAnswers = [];

class InterviewAnswer {
  static getMemoryAnswers() { return memoryAnswers; }

  static async create({ questionId, answer, score, feedback }) {
    const scoreJson = score ? JSON.stringify(score) : null;
    if (getDBStatus()) {
      const [result] = await getPool().query(
        'INSERT INTO interview_answers (question_id, answer, score, feedback) VALUES (?, ?, ?, ?)',
        [questionId, answer, scoreJson, feedback]
      );
      return result.insertId;
    } else {
      const id = memoryAnswers.length + 1;
      const record = { id, questionId, answer, score, feedback, created_at: new Date() };
      memoryAnswers.push(record);
      return id;
    }
  }

  static async listByQuestion(questionId) {
    if (getDBStatus()) {
      const [rows] = await getPool().query(
        'SELECT * FROM interview_answers WHERE question_id = ? ORDER BY id ASC',
        [questionId]
      );
      return rows.map(r => ({ ...r, score: r.score ? JSON.parse(r.score) : null }));
    } else {
      return memoryAnswers.filter(a => String(a.questionId) === String(questionId));
    }
  }

  static async listByUser(userId) {
    if (getDBStatus()) {
      const [rows] = await getPool().query(
        `SELECT ia.* FROM interview_answers ia
         INNER JOIN interview_questions iq ON ia.question_id = iq.id
         WHERE iq.user_id = ? ORDER BY ia.id ASC`,
        [userId]
      );
      return rows.map(r => ({ ...r, score: r.score ? JSON.parse(r.score) : null }));
    } else {
      // In-memory join
      const InterviewQuestion = require('./InterviewQuestion');
      const userQuestions = InterviewQuestion.getMemoryQuestions().filter(q => q.userId === userId);
      const questionIds = userQuestions.map(q => q.id);
      return memoryAnswers.filter(a => questionIds.includes(a.questionId));
    }
  }
}

module.exports = InterviewAnswer;
