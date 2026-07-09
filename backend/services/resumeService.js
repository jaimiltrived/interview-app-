const { generateResponse, cleanAndParseJSON } = require('./ollamaService');

/**
 * Keyword-based fallback parsing in case LLM parsing fails or is bypassed
 */
const parseResumeFallback = (fileContent) => {
  const textToAnalyze = String(fileContent || '').toLowerCase();
  let inferredRole = 'Software Engineer';
  let skills = [];
  let experience = '1-2 Years';
  let projects = ['Personal Portfolio Website'];
  let education = 'Bachelor of Science in Computer Science';
  let certifications = [];

  const techSkills = {
    'React': ['react', 'react.js', 'redux', 'hooks', 'jsx', 'frontend'],
    'JavaScript': ['javascript', 'js', 'es6', 'typescript', 'ts'],
    'Laravel': ['laravel', 'php', 'composer', 'eloquent'],
    'Python': ['python', 'fastapi', 'flask', 'django'],
    'MySQL': ['mysql', 'sql', 'database', 'postgresql'],
    'Firebase': ['firebase', 'firestore', 'auth'],
    'Tailwind CSS': ['tailwind', 'css', 'flexbox', 'grid'],
    'Node.js': ['node', 'node.js', 'express', 'backend']
  };

  for (const [skill, keywords] of Object.entries(techSkills)) {
    if (keywords.some(kw => textToAnalyze.includes(kw))) {
      skills.push(skill);
    }
  }

  if (skills.length === 0) {
    skills = ['React.js', 'JavaScript', 'CSS Grid'];
  }

  if (skills.includes('Laravel')) {
    inferredRole = 'Fullstack Engineer (Laravel & React)';
    projects = ['E-commerce Platform', 'Billing System'];
  } else if (skills.includes('React') || skills.includes('JavaScript')) {
    inferredRole = 'Frontend Developer (React)';
    projects = ['AI Mock Interview Room', 'Analytics Dashboard'];
  } else if (skills.includes('Python')) {
    inferredRole = 'Backend Python Developer';
    projects = ['Data Classification API', 'FastAPI Webhook Service'];
  }

  if (textToAnalyze.includes('senior') || textToAnalyze.includes('lead') || textToAnalyze.includes('5 years') || textToAnalyze.includes('6 years')) {
    experience = '5+ Years (Senior)';
  } else if (textToAnalyze.includes('3 years') || textToAnalyze.includes('4 years')) {
    experience = '3-4 Years (Mid-level)';
  } else {
    experience = '1-2 Years (Associate)';
  }

  return {
    name: 'Candidate',
    skills,
    projects,
    education,
    experience,
    certifications,
    roleTarget: inferredRole
  };
};

/**
 * Sends extracted resume text to local Ollama (Llama 3.2) to structure candidate metadata.
 */
const parseResume = async (resumeText) => {
  if (!resumeText || !resumeText.trim()) {
    return parseResumeFallback('');
  }

  const prompt = `You are an experienced technical interviewer.
  Analyze the following resume text.
  
  Resume:
  ${resumeText}
  
  Extract and return ONLY a JSON response matching exactly this format:
  {
    "name": "Candidate Full Name",
    "skills": ["Skill1", "Skill2"],
    "projects": ["Project1", "Project2"],
    "education": "Education Degree/Details",
    "experience": "Experience range description",
    "certifications": ["Cert1", "Cert2"],
    "roleTarget": "Inferred Target Role Title"
  }
  Only output valid JSON.`;

  const fallbackData = parseResumeFallback(resumeText);
  // Pass jsonMode = true (third argument) for forced formatting speed up
  const rawResponse = await generateResponse(prompt, JSON.stringify(fallbackData), true);
  const parsed = cleanAndParseJSON(rawResponse, fallbackData);

  return {
    name: parsed.name || fallbackData.name,
    skills: Array.isArray(parsed.skills) && parsed.skills.length > 0 ? parsed.skills : fallbackData.skills,
    projects: Array.isArray(parsed.projects) && parsed.projects.length > 0 ? parsed.projects : fallbackData.projects,
    education: parsed.education || fallbackData.education,
    experience: parsed.experience || fallbackData.experience,
    certifications: Array.isArray(parsed.certifications) ? parsed.certifications : fallbackData.certifications,
    roleTarget: parsed.roleTarget || fallbackData.roleTarget
  };
};

/**
 * Computes ATS analysis report score and lists missing skills
 */
const analyzeResume = async (roleTarget, skills = []) => {
  const prompt = `You are an ATS (Applicant Tracking System) recruiter. Analyze this candidate's target role and skills list.
  Target Role: ${roleTarget}
  Skills: ${JSON.stringify(skills)}

  Evaluate the profile and return:
  1. ATS score rating from 0 to 100
  2. List of typical missing critical skills/keywords for this role (limit to 3-4 items)
  3. Readability / compatibility score rating from 0 to 100

  Output a valid JSON response format:
  {
    "resumeScore": 85,
    "missingSkillsKeywords": ["Skill1", "Skill2"],
    "readabilityScore": 90
  }
  Only output valid JSON.`;

  const fallbackData = {
    resumeScore: 82,
    missingSkillsKeywords: ['System Design', 'Cloud Deployment'],
    readabilityScore: 88
  };

  // Pass jsonMode = true (third argument) for forced formatting speed up
  const rawResponse = await generateResponse(prompt, JSON.stringify(fallbackData), true);
  return cleanAndParseJSON(rawResponse, fallbackData);
};

module.exports = {
  parseResume,
  analyzeResume
};
