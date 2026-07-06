const { getPool, getDBStatus } = require('../config/db');

let memoryResumes = [];

class Resume {
  static getMemoryResumes() { return memoryResumes; }

  static async create({ userId, name, roleTarget, experience, skills, questions }) {
    const skillsJson = JSON.stringify(skills);
    const questionsJson = JSON.stringify(questions);
    if (getDBStatus()) {
      const [result] = await getPool().query(
        'INSERT INTO resumes (user_id, name, role_target, experience, skills, questions) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, name, roleTarget, experience, skillsJson, questionsJson]
      );
      return result.insertId;
    } else {
      const id = memoryResumes.length + 1;
      memoryResumes.push({ id, userId, name, roleTarget, experience, skills, questions });
      return id;
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
