const { getPool, getDBStatus } = require('../config/db');
const bcrypt = require('bcryptjs');

let memoryUsers = [
  { id: 1, name: 'Super Admin', email: 'superadmin@prepcoach.ai', password: bcrypt.hashSync('Password123', 10), photo_url: null, skills: ['Management', 'Strategy'], role: 'super_admin' },
  { id: 2, name: 'Admin User', email: 'admin@prepcoach.ai', password: bcrypt.hashSync('Password123', 10), photo_url: null, skills: ['Coordination'], role: 'admin' },
  { id: 3, name: 'SmartLearning Admin', email: 'admin@smartlearning.com', password: bcrypt.hashSync('Password123', 10), photo_url: null, skills: ['SmartLearning'], role: 'admin' },
  { id: 4, name: 'Content Manager', email: 'content@prepcoach.ai', password: bcrypt.hashSync('Password123', 10), photo_url: null, skills: ['Writing'], role: 'content_manager' },
  { id: 5, name: 'Jane Doe', email: 'jane@example.com', password: bcrypt.hashSync('SecurePassword123', 10), photo_url: null, skills: ['React', 'Node', 'SQL'], role: 'candidate' }
];

class User {
  static getMemoryUsers() { return memoryUsers; }
  static setMemoryUsers(newUsers) { memoryUsers = newUsers; }

  static async findByEmail(email) {
    if (getDBStatus()) {
      const [rows] = await getPool().query('SELECT * FROM users WHERE email = ?', [email]);
      return rows[0] || null;
    } else {
      return memoryUsers.find(u => u.email === email) || null;
    }
  }

  static async findById(id) {
    if (getDBStatus()) {
      const [rows] = await getPool().query('SELECT * FROM users WHERE id = ?', [id]);
      return rows[0] || null;
    } else {
      return memoryUsers.find(u => u.id === Number(id)) || null;
    }
  }

  static async create({ name, email, password, role = 'candidate' }) {
    if (getDBStatus()) {
      const [result] = await getPool().query(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        [name, email, password, role]
      );
      return result.insertId;
    } else {
      const id = memoryUsers.length + 1;
      memoryUsers.push({ id, name, email, password, photo_url: null, skills: null, role });
      return id;
    }
  }

  static async update(id, { name, email }) {
    if (getDBStatus()) {
      await getPool().query('UPDATE users SET name = ?, email = ? WHERE id = ?', [name, email, id]);
    } else {
      const user = memoryUsers.find(u => u.id === Number(id));
      if (user) {
        user.name = name;
        user.email = email;
      }
    }
  }

  static async updateSkills(id, skills) {
    const skillsJson = JSON.stringify(skills);
    if (getDBStatus()) {
      await getPool().query('UPDATE users SET skills = ? WHERE id = ?', [skillsJson, id]);
    } else {
      const user = memoryUsers.find(u => u.id === Number(id));
      if (user) user.skills = skills;
    }
  }
}

module.exports = User;
