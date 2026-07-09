const { getPool, getDBStatus } = require('../config/db');

let memoryReports = [];

class InterviewReport {
  static getMemoryReports() { return memoryReports; }

  static async create({ userId, overallScore, technicalScore, communicationScore, reportJson }) {
    const reportStr = reportJson ? JSON.stringify(reportJson) : null;
    if (getDBStatus()) {
      const [result] = await getPool().query(
        `INSERT INTO interview_reports 
        (user_id, overall_score, technical_score, communication_score, report_json) 
        VALUES (?, ?, ?, ?, ?)`,
        [userId, overallScore, technicalScore, communicationScore, reportStr]
      );
      return result.insertId;
    } else {
      const id = memoryReports.length + 1;
      const record = {
        id,
        userId,
        overallScore,
        technicalScore,
        communicationScore,
        reportJson,
        created_at: new Date()
      };
      memoryReports.push(record);
      return id;
    }
  }

  static async listByUser(userId) {
    if (getDBStatus()) {
      const [rows] = await getPool().query(
        'SELECT * FROM interview_reports WHERE user_id = ? ORDER BY created_at DESC',
        [userId]
      );
      return rows.map(r => ({
        id: r.id,
        userId: r.user_id,
        overallScore: r.overall_score,
        technicalScore: r.technical_score,
        communicationScore: r.communication_score,
        reportJson: r.report_json ? JSON.parse(r.report_json) : null,
        created_at: r.created_at
      }));
    } else {
      return memoryReports.filter(r => r.userId === userId);
    }
  }

  static async findByIdAndUser(id, userId) {
    if (getDBStatus()) {
      const [rows] = await getPool().query(
        'SELECT * FROM interview_reports WHERE id = ? AND user_id = ?',
        [id, userId]
      );
      if (rows.length === 0) return null;
      const r = rows[0];
      return {
        id: r.id,
        userId: r.user_id,
        overallScore: r.overall_score,
        technicalScore: r.technical_score,
        communicationScore: r.communication_score,
        reportJson: r.report_json ? JSON.parse(r.report_json) : null,
        created_at: r.created_at
      };
    } else {
      return memoryReports.find(r => String(r.id) === String(id) && r.userId === userId) || null;
    }
  }
}

module.exports = InterviewReport;
