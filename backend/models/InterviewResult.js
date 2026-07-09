const { getPool, getDBStatus } = require('../config/db');

let memoryInterviewResults = [];

class InterviewResult {
  static getMemoryResults() { return memoryInterviewResults; }

  static async create({ userId, question, answer, aiFeedback, technicalScore, communicationScore }) {
    if (getDBStatus()) {
      const [result] = await getPool().query(
        `INSERT INTO interview_results 
        (user_id, question, answer, ai_feedback, technical_score, communication_score) 
        VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, question, answer, aiFeedback, technicalScore, communicationScore]
      );
      return result.insertId;
    } else {
      const id = memoryInterviewResults.length + 1;
      const record = {
        id,
        userId,
        question,
        answer,
        aiFeedback,
        technicalScore,
        communicationScore,
        created_at: new Date()
      };
      memoryInterviewResults.push(record);
      return id;
    }
  }

  static async listByUser(userId) {
    if (getDBStatus()) {
      const [rows] = await getPool().query(
        'SELECT * FROM interview_results WHERE user_id = ? ORDER BY created_at DESC', 
        [userId]
      );
      return rows;
    } else {
      return memoryInterviewResults.filter(r => r.userId === userId);
    }
  }

  static async delete(id) {
    if (getDBStatus()) {
      await getPool().query('DELETE FROM interview_results WHERE id = ?', [id]);
    } else {
      memoryInterviewResults = memoryInterviewResults.filter(r => String(r.id) !== String(id));
    }
  }
}

module.exports = InterviewResult;
