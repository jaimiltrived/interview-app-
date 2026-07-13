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

    // 7. Create interview_results table referencing users
    await connection.query(`
      CREATE TABLE IF NOT EXISTS interview_results (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        ai_feedback TEXT NULL,
        technical_score INT NOT NULL,
        communication_score INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 8. Create interview_questions table referencing users
    await connection.query(`
      CREATE TABLE IF NOT EXISTS interview_questions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        question TEXT NOT NULL,
        type VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 9. Create interview_answers table referencing interview_questions
    await connection.query(`
      CREATE TABLE IF NOT EXISTS interview_answers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        question_id INT NOT NULL,
        answer TEXT NOT NULL,
        score JSON NULL,
        feedback TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (question_id) REFERENCES interview_questions(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 10. Create interview_reports table referencing users
    await connection.query(`
      CREATE TABLE IF NOT EXISTS interview_reports (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        overall_score INT NOT NULL,
        technical_score INT NOT NULL,
        communication_score INT NOT NULL,
        report_json JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // --- Schema Migration & Relations Polish ---
    try {
      await connection.query("ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'candidate' AFTER email");
      console.log('[MIGRATION] Added role column to users.');
    } catch(e) { console.warn('[MIGRATION WARNING]', e.message); }

    try {
      await connection.query('ALTER TABLE sessions ADD COLUMN user_id INT NULL AFTER id');
    } catch(e) { console.warn('[MIGRATION WARNING]', e.message); }

    try {
      await connection.query('ALTER TABLE resumes ADD COLUMN user_id INT NULL AFTER id');
    } catch(e) { console.warn('[MIGRATION WARNING]', e.message); }

    // Add resume_text and parsed_json to resumes table
    try {
      await connection.query('ALTER TABLE resumes ADD COLUMN resume_text LONGTEXT NULL AFTER name');
      console.log('[MIGRATION] Added resume_text column to resumes.');
    } catch(e) { console.warn('[MIGRATION WARNING]', e.message); }

    try {
      await connection.query('ALTER TABLE resumes ADD COLUMN parsed_json JSON NULL AFTER resume_text');
      console.log('[MIGRATION] Added parsed_json column to resumes.');
    } catch(e) { console.warn('[MIGRATION WARNING]', e.message); }

    // Convert columns to JSON if they are currently TEXT
    try {
      await connection.query('ALTER TABLE users MODIFY COLUMN skills JSON NULL');
      console.log('[MIGRATION] Converted users.skills to JSON.');
    } catch(e) { console.warn('[MIGRATION WARNING]', e.message); }

    try {
      await connection.query('ALTER TABLE resumes MODIFY COLUMN skills JSON NULL');
      console.log('[MIGRATION] Converted resumes.skills to JSON.');
    } catch(e) { console.warn('[MIGRATION WARNING]', e.message); }

    try {
      await connection.query('ALTER TABLE resumes ADD COLUMN questions JSON NULL AFTER skills');
      console.log('[MIGRATION] Added questions column to resumes.');
    } catch(e) { console.warn('[MIGRATION WARNING]', e.message); }

    try {
      await connection.query('ALTER TABLE sessions MODIFY COLUMN questions JSON NULL');
      await connection.query('ALTER TABLE sessions MODIFY COLUMN answers JSON NULL');
      await connection.query('ALTER TABLE sessions MODIFY COLUMN wpm_history JSON NULL');
      await connection.query('ALTER TABLE sessions MODIFY COLUMN eye_contact_history JSON NULL');
      await connection.query('ALTER TABLE sessions MODIFY COLUMN filler_history JSON NULL');
      console.log('[MIGRATION] Converted sessions metric columns to JSON.');
    } catch(e) { console.warn('[MIGRATION WARNING]', e.message); }

    try {
      await connection.query('ALTER TABLE sessions ADD CONSTRAINT fk_sessions_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE');
      console.log('[MIGRATION] Checked foreign key fk_sessions_users.');
    } catch(e) { console.warn('[MIGRATION WARNING]', e.message); }

    try {
      await connection.query('ALTER TABLE resumes ADD CONSTRAINT fk_resumes_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE');
      console.log('[MIGRATION] Checked foreign key fk_resumes_users.');
    } catch(e) { console.warn('[MIGRATION WARNING]', e.message); }

    try {
      await connection.query('CREATE INDEX idx_sessions_user_role ON sessions(user_id, role_target)');
      console.log('[MIGRATION] Created composite index idx_sessions_user_role.');
    } catch(e) { console.warn('[MIGRATION WARNING]', e.message); }

    try {
      await connection.query('CREATE INDEX idx_resumes_user_role ON resumes(user_id, role_target)');
      console.log('[MIGRATION] Created composite index idx_resumes_user_role.');
    } catch(e) { console.warn('[MIGRATION WARNING]', e.message); }

    // --- Admin Tables Creation ---
    await connection.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS question_bank (
        id INT AUTO_INCREMENT PRIMARY KEY,
        question TEXT NOT NULL,
        type VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS skills (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS feedback (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        message TEXT NOT NULL,
        reply TEXT NULL,
        is_resolved BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key_name VARCHAR(255) PRIMARY KEY,
        value_data TEXT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        action VARCHAR(255) NOT NULL,
        details TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS ai_prompts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        content TEXT NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS email_templates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        subject VARCHAR(255) NOT NULL,
        body TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS system_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        level VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS api_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        method VARCHAR(10) NOT NULL,
        url VARCHAR(255) NOT NULL,
        status INT NOT NULL,
        response_time_ms INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS security_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        event VARCHAR(100) NOT NULL,
        ip_address VARCHAR(50) NULL,
        username VARCHAR(255) NULL,
        details TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Seed default admin accounts
    const seedAdmin = async (name, email, password, role) => {
      const [rows] = await connection.query('SELECT * FROM users WHERE email = ?', [email]);
      if (rows.length === 0) {
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(password, 10);
        await connection.query('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)', [name, email, hashedPassword, role]);
        console.log(`Seeded default account: ${email} (${role})`);
      }
    };
    const defaultPassword = process.env.ADMIN_PASSWORD || 'Password123';
    await seedAdmin('Super Admin', 'superadmin@prepcoach.ai', defaultPassword, 'super_admin');
    await seedAdmin('Admin User', 'admin@prepcoach.ai', defaultPassword, 'admin');
    await seedAdmin('SmartLearning Admin', process.env.ADMIN_EMAIL || 'admin@smartlearning.com', defaultPassword, 'admin');
    await seedAdmin('Content Manager', 'content@prepcoach.ai', defaultPassword, 'content_manager');
    await seedAdmin('Jane Doe', 'jane@example.com', 'SecurePassword123', 'candidate');

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

    // Seed companies if empty
    const [companiesCount] = await connection.query('SELECT COUNT(*) as count FROM companies');
    if (companiesCount[0].count === 0) {
      await connection.query(`
        INSERT INTO companies (name) VALUES 
        ('Google'), ('Amazon'), ('Microsoft'), ('Meta'), ('Apple'), 
        ('TCS'), ('Infosys'), ('Deloitte'), ('Accenture')
      `);
      console.log('Seeded default companies.');
    }

    // Seed skills if empty
    const [skillsCount] = await connection.query('SELECT COUNT(*) as count FROM skills');
    if (skillsCount[0].count === 0) {
      await connection.query(`
        INSERT INTO skills (name) VALUES 
        ('React'), ('Angular'), ('Vue'), ('Laravel'), ('Node.js'), 
        ('Java'), ('Spring Boot'), ('Python'), ('Docker'), ('Kubernetes'), 
        ('AWS'), ('Azure')
      `);
      console.log('Seeded default skills.');
    }

    // Seed ai_prompts if empty
    const [promptsCount] = await connection.query('SELECT COUNT(*) as count FROM ai_prompts');
    if (promptsCount[0].count === 0) {
      await connection.query(`
        INSERT INTO ai_prompts (name, content) VALUES 
        ('Resume Analysis Prompt', 'You are an ATS resume reviewer. Analyze the resume text, score it against standard technical roles, list missing skills, and give improvement tips.'),
        ('Technical Interview Prompt', 'You are a technical interviewer. Generate demanding technical interview questions based on the candidate\\'s skills and job description.'),
        ('HR Prompt', 'You are an HR Manager. Ask behavioral and cultural fit questions using standard STAR methodology.'),
        ('Behavior Prompt', 'Analyze candidate\\'s answers for behavioral patterns, emotional stability, and professional boundaries.'),
        ('Feedback Prompt', 'Construct comprehensive, constructive score cards on their technical precision and communication pacing.')
      `);
      console.log('Seeded default AI prompts.');
    }

    // Seed question_bank if empty
    const [qbCount] = await connection.query('SELECT COUNT(*) as count FROM question_bank');
    if (qbCount[0].count === 0) {
      await connection.query(`
        INSERT INTO question_bank (question, type) VALUES 
        ('What are the primary differences between virtual DOM and real DOM in React?', 'Technical'),
        ('Explain the execution context and event loop structure in Node.js.', 'Technical'),
        ('Describe a time when you had to resolve a conflict within a cross-functional dev team.', 'Behavioral'),
        ('Why do you want to join our company and how does this role fit your career path?', 'HR'),
        ('What is your methodology for optimizing slow database queries in production?', 'Technical')
      `);
      console.log('Seeded default question bank.');
    }

    // Seed settings if empty
    const [settingsCount] = await connection.query('SELECT COUNT(*) as count FROM settings');
    if (settingsCount[0].count === 0) {
      await connection.query(`
        INSERT INTO settings (key_name, value_data) VALUES 
        ('app_name', 'PrepFlow AI'),
        ('logo_url', '/logo.png'),
        ('email_settings', '{"smtp_host":"smtp.mailtrap.io","smtp_port":2525}'),
        ('ai_model', 'Llama 3.2'),
        ('ollama_url', 'http://localhost:11434'),
        ('api_keys', '{"gemini_api_key":"MOCK_KEY_FOR_TESTING"}'),
        ('upload_limits_mb', '5'),
        ('max_interview_duration_mins', '30'),
        ('session_timeout_mins', '60'),
        ('password_policy', '{"minLength":8,"requireNumbers":true}')
      `);
      console.log('Seeded default settings.');
    }

    // Seed feedback if empty
    const [feedbackCount] = await connection.query('SELECT COUNT(*) as count FROM feedback');
    if (feedbackCount[0].count === 0) {
      await connection.query(`
        INSERT INTO feedback (user_id, message, reply, is_resolved) VALUES 
        (1, 'The audio visualizer works wonderfully, but it would be nice to have a darker theme.', 'Thanks! We are adding dark mode control settings soon.', 1),
        (1, 'Could you add Java Spring Boot mock practice questions set?', NULL, 0)
      `);
      console.log('Seeded default user feedback items.');
    }

    // Seed email_templates if empty
    const [emailTemplatesCount] = await connection.query('SELECT COUNT(*) as count FROM email_templates');
    if (emailTemplatesCount[0].count === 0) {
      await connection.query(`
        INSERT INTO email_templates (name, subject, body) VALUES 
        ('Welcome Email', 'Welcome to PrepFlow AI!', 'Hi {{name}},\n\nWelcome to PrepFlow! We are excited to support your mock interview preparation journeys. Upload your resume to start customized mock coaching.'),
        ('OTP Email', 'Your OTP Verification Code', 'Hi {{name}},\n\nYour OTP code is {{otp}}. This verification code is valid for 10 minutes. Do not share this code with anyone.'),
        ('Password Reset', 'Password Reset Request', 'Hi {{name}},\n\nWe received a password reset request. Click the link to reset your account password: {{reset_link}}'),
        ('Interview Complete', 'Mock Practice Session Finished', 'Hi {{name}},\n\nCongratulations! You have completed your mock session for {{role}}. Your performance details are being analyzed.'),
        ('Report Ready', 'AI Performance Report Available', 'Hi {{name}},\n\nYour detailed interview scorecard is compiled! Open your dashboard to view technical and pacing metric grades.')
      `);
      console.log('Seeded default email templates.');
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
