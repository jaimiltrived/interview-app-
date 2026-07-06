const mysql = require('mysql2/promise');

let pool = null;
let isConnected = false;

const connectDB = async () => {
  const host = process.env.DB_HOST || 'localhost';
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';
  const port = process.env.DB_PORT || 3306;
  const database = process.env.DB_NAME || 'interview_coach';

  try {
    console.log(`Checking connection to MySQL server at ${host}:${port}...`);
    
    // First establish connection without DB parameter to check/create the DB
    const tempConnection = await mysql.createConnection({
      host,
      user,
      password,
      port,
      connectTimeout: 3000
    });

    console.log('MySQL server detected. Making sure database exists...');
    await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\``);
    await tempConnection.end();

    // Create the connection pool with the database specified
    pool = mysql.createPool({
      host,
      user,
      password,
      database,
      port,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 3000
    });

    // Test pool connection & initialize tables
    const connection = await pool.getConnection();
    console.log(`Connected to MySQL Database: "${database}"`);

    // 1. Create users table first
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        photo_url VARCHAR(255),
        skills JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 2. Create resumes table referencing users
    await connection.query(`
      CREATE TABLE IF NOT EXISTS resumes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        name VARCHAR(255) NOT NULL,
        role_target VARCHAR(255) NOT NULL,
        experience VARCHAR(100),
        skills JSON NULL,
        questions JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 3. Create sessions table referencing users
    await connection.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        role_target VARCHAR(255) NOT NULL,
        overall_score INT NOT NULL,
        technical_score INT NOT NULL,
        communication_score INT NOT NULL,
        avg_wpm INT,
        total_filler INT,
        avg_eye_contact INT,
        expression VARCHAR(100),
        questions JSON NULL,
        answers JSON NULL,
        wpm_history JSON NULL,
        eye_contact_history JSON NULL,
        filler_history JSON NULL,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 4. Create job_roles table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS job_roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(255) NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 5. Create interview_types table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS interview_types (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        duration VARCHAR(100) NOT NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 6. Create notifications table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // --- Schema Migration & Relations Polish ---
    try {
      await connection.query('ALTER TABLE sessions ADD COLUMN user_id INT NULL AFTER id');
    } catch (e) {}

    try {
      await connection.query('ALTER TABLE resumes ADD COLUMN user_id INT NULL AFTER id');
    } catch (e) {}

    // Convert columns to JSON if they are currently TEXT
    try {
      await connection.query('ALTER TABLE users MODIFY COLUMN skills JSON NULL');
      console.log('[MIGRATION] Converted users.skills to JSON.');
    } catch (e) {}

    try {
      await connection.query('ALTER TABLE resumes MODIFY COLUMN skills JSON NULL');
      console.log('[MIGRATION] Converted resumes.skills to JSON.');
    } catch (e) {}

    try {
      await connection.query('ALTER TABLE resumes ADD COLUMN questions JSON NULL AFTER skills');
      console.log('[MIGRATION] Added questions column to resumes.');
    } catch (e) {}

    try {
      await connection.query('ALTER TABLE sessions MODIFY COLUMN questions JSON NULL');
      await connection.query('ALTER TABLE sessions MODIFY COLUMN answers JSON NULL');
      await connection.query('ALTER TABLE sessions MODIFY COLUMN wpm_history JSON NULL');
      await connection.query('ALTER TABLE sessions MODIFY COLUMN eye_contact_history JSON NULL');
      await connection.query('ALTER TABLE sessions MODIFY COLUMN filler_history JSON NULL');
      console.log('[MIGRATION] Converted sessions metric columns to JSON.');
    } catch (e) {}

    try {
      await connection.query('ALTER TABLE sessions ADD CONSTRAINT fk_sessions_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE');
      console.log('[MIGRATION] Checked foreign key fk_sessions_users.');
    } catch (e) {}

    try {
      await connection.query('ALTER TABLE resumes ADD CONSTRAINT fk_resumes_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE');
      console.log('[MIGRATION] Checked foreign key fk_resumes_users.');
    } catch (e) {}

    try {
      await connection.query('CREATE INDEX idx_sessions_user_role ON sessions(user_id, role_target)');
      console.log('[MIGRATION] Created composite index idx_sessions_user_role.');
    } catch (e) {}

    try {
      await connection.query('CREATE INDEX idx_resumes_user_role ON resumes(user_id, role_target)');
      console.log('[MIGRATION] Created composite index idx_resumes_user_role.');
    } catch (e) {}

    // Seed job_roles if empty
    const [rolesCount] = await connection.query('SELECT COUNT(*) as count FROM job_roles');
    if (rolesCount[0].count === 0) {
      await connection.query(`
        INSERT INTO job_roles (title, category) VALUES 
        ('Frontend Developer', 'Engineering'),
        ('Fullstack Engineer', 'Engineering'),
        ('Backend Developer', 'Engineering'),
        ('Data Scientist', 'Data')
      `);
      console.log('Seeded default job roles.');
    }

    // Seed interview_types if empty
    const [typesCount] = await connection.query('SELECT COUNT(*) as count FROM interview_types');
    if (typesCount[0].count === 0) {
      await connection.query(`
        INSERT INTO interview_types (name, duration) VALUES 
        ('Behavioral Mock', '15 mins'),
        ('Technical Mock', '30 mins'),
        ('System Design Mock', '45 mins')
      `);
      console.log('Seeded default interview types.');
    }

    connection.release();
    isConnected = true;
    console.log('MySQL Tables initialized and seeded successfully.');
    return true;
  } catch (error) {
    console.warn(`\n================================================================`);
    console.warn(`[DATABASE WARNING] Could not connect to MySQL server.`);
    console.warn(`Details: ${error.message}`);
    console.warn(`[FALLBACK] Express backend will launch using memory-only mock DB.`);
    console.warn(`================================================================\n`);
    pool = null;
    isConnected = false;
    return false;
  }
};

const getPool = () => pool;
const getDBStatus = () => isConnected;

module.exports = { connectDB, getPool, getDBStatus };
