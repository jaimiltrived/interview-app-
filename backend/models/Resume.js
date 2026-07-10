const { getPool, getDBStatus } = require('../config/db');

let memoryResumes = [];

class Resume {
  static getMemoryResumes() { return memoryResumes; }

  static async create({ userId, name, roleTarget, experience, skills, questions, resumeText = null, parsedJson = null }) {
    const skillsJson = skills ? JSON.stringify(skills) : null;
    const questionsJson = questions ? JSON.stringify(questions) : null;
    const parsedStr = parsedJson ? JSON.stringify(parsedJson) : null;

    if (getDBStatus()) {
      const [result] = await getPool().query(
        `INSERT INTO resumes 
        (user_id, name, role_target, experience, skills, questions, resume_text, parsed_json) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, name || 'Candidate', roleTarget || 'Software Engineer', experience || '1-2 Years', skillsJson, questionsJson, resumeText, parsedStr]
      );
      return result.insertId;
    } else {
      const id = memoryResumes.length + 1;
      const record = { id, userId, name, roleTarget, experience, skills, questions, resumeText, parsedJson, created_at: new Date() };
      memoryResumes.push(record);
      return id;
    }
  }

  static async latestByUserId(userId) {
    if (getDBStatus()) {
      const [rows] = await getPool().query('SELECT * FROM resumes WHERE user_id = ? ORDER BY id DESC LIMIT 1', [userId]);
      return rows[0] || null;
    } else {
      const userResumes = memoryResumes.filter(r => String(r.userId) === String(userId));
      return userResumes.length > 0 ? userResumes[userResumes.length - 1] : null;
    }
  }

  static async listByCandidate(candidateName) {
    if (getDBStatus()) {
      const [rows] = await getPool().query('SELECT * FROM resumes WHERE name = ? ORDER BY id DESC', [candidateName]);
      return rows;
    } else {
      return memoryResumes.filter(r => r.name === candidateName);
    }
  }

  static async findByIdAndCandidate(id, candidateName) {
    if (getDBStatus()) {
      const [rows] = await getPool().query('SELECT * FROM resumes WHERE id = ? AND name = ?', [id, candidateName]);
      return rows[0] || null;
    } else {
      return memoryResumes.find(r => String(r.id) === String(id) && r.name === candidateName) || null;
    }
  }

  static async delete(id, candidateName) {
    if (getDBStatus()) {
      await getPool().query('DELETE FROM resumes WHERE id = ? AND name = ?', [id, candidateName]);
    } else {
      memoryResumes = memoryResumes.filter(r => !(String(r.id) === String(id) && r.name === candidateName));
    }
  }
}

module.exports = Resume;
