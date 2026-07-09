const { getPool, getDBStatus } = require('../config/db');

let memoryQuestions = [];

class InterviewQuestion {
  static getMemoryQuestions() { return memoryQuestions; }

  static async create({ userId, question, type }) {
    if (getDBStatus()) {
      const [result] = await getPool().query(
        'INSERT INTO interview_questions (user_id, question, type) VALUES (?, ?, ?)',
        [userId, question, type]
      );
      return result.insertId;
    } else {
      const id = memoryQuestions.length + 1;
      const record = { id, userId, question, type, created_at: new Date() };
      memoryQuestions.push(record);
      return id;
    }
  }

  static async bulkCreate(questions) {
    if (!questions || !questions.length) return [];
    
    if (getDBStatus()) {
      const results = [];
      for (const q of questions) {
        const [result] = await getPool().query(
          'INSERT INTO interview_questions (user_id, question, type) VALUES (?, ?, ?)',
          [q.userId, q.question, q.type]
        );
        results.push({ id: result.insertId, ...q });
      }
      return results;
    } else {
      const results = [];
      for (const q of questions) {
        const id = memoryQuestions.length + 1;
        const record = { id, ...q, created_at: new Date() };
        memoryQuestions.push(record);
        results.push(record);
      }
      return results;
    }
  }

  static async listByUser(userId) {
    if (getDBStatus()) {
      const [rows] = await getPool().query(
        'SELECT * FROM interview_questions WHERE user_id = ? ORDER BY id ASC',
        [userId]
      );
      return rows;
    } else {
      return memoryQuestions.filter(q => q.userId === userId);
    }
  }

  static async delete(id) {
    if (getDBStatus()) {
      await getPool().query('DELETE FROM interview_questions WHERE id = ?', [id]);
    } else {
      memoryQuestions = memoryQuestions.filter(q => String(q.id) !== String(id));
    }
  }
}

module.exports = InterviewQuestion;
