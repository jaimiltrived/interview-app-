const { getPool, getDBStatus } = require('../config/db');

let memorySessions = [];

class Session {
  static getMemorySessions() { return memorySessions; }

  static async create({
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
    fillerHistory
  }) {
    if (getDBStatus()) {
      const [result] = await getPool().query(
        `INSERT INTO sessions (
          user_id, role_target, overall_score, technical_score, communication_score,
          avg_wpm, total_filler, avg_eye_contact, expression,
          questions, answers, wpm_history, eye_contact_history, filler_history
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId, roleTarget, overallScore, technicalScore, communicationScore,
          avgWpm, totalFiller, avgEyeContact, expression,
          JSON.stringify(questions), JSON.stringify(answers), JSON.stringify(wpmHistory),
          JSON.stringify(eyeContactHistory), JSON.stringify(fillerHistory)
        ]
      );
      return result.insertId;
    } else {
      const id = memorySessions.length + 1;
      const sessionRecord = {
        id,
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
      return id;
    }
  }

  static async listByUser(userId) {
    if (getDBStatus()) {
      const [rows] = await getPool().query('SELECT * FROM sessions WHERE user_id = ? ORDER BY date DESC', [userId]);
      return rows;
    } else {
      return memorySessions.filter(s => s.userId === userId);
    }
  }

  static async findByIdAndUser(id, userId) {
    if (getDBStatus()) {
      const [rows] = await getPool().query('SELECT * FROM sessions WHERE id = ? AND user_id = ?', [id, userId]);
      return rows[0] || null;
    } else {
      return memorySessions.find(s => String(s.id) === String(id) && s.userId === userId) || null;
    }
  }

  static async delete(id) {
    if (getDBStatus()) {
      await getPool().query('DELETE FROM sessions WHERE id = ?', [id]);
    } else {
      memorySessions = memorySessions.filter(s => String(s.id) !== String(id));
    }
  }
}

module.exports = Session;
