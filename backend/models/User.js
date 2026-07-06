const { getPool, getDBStatus } = require('../config/db');

let memoryUsers = [
  { id: 1, name: 'Jane Doe', email: 'jane@example.com', password: 'SecurePassword123', photo_url: null, skills: ['React', 'Node', 'SQL'] }
];

class User {
  static getMemoryUsers() { return memoryUsers; }

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

  static async create({ name, email, password }) {
    if (getDBStatus()) {
      const [result] = await getPool().query(
        'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
        [name, email, password]
      );
      return result.insertId;
    } else {
      const id = memoryUsers.length + 1;
      memoryUsers.push({ id, name, email, password, photo_url: null, skills: null });
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
