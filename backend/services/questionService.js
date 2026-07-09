const { generateResponse, cleanAndParseJSON } = require('./ollamaService');

/**
 * Generates structured mock interview questions in batches (3 HR, 3 Tech, 2 Project, 2 Behavioral).
 * Number of questions is optimized to minimize local LLM token generation speed lags.
 */
const generateStructuredQuestions = async ({ name = 'Candidate', roleTarget = 'Software Engineer', skills = [], projects = [] }) => {
  const sessionSeed = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const prompt = `You are a Senior Software Engineer and Technical Recruiter.
  Session Token: ${sessionSeed} (Ensure you generate a completely unique, fresh set of questions that are different from any previous sessions).
  
  Candidate Name: ${name}
  Target Role: ${roleTarget}
  Candidate Skills: ${JSON.stringify(skills)}
  Candidate Projects: ${JSON.stringify(projects)}

  Generate:
  - 3 HR Questions (cultural alignment, background, salary)
  - 3 Technical Questions (focused strictly on their listed skills: ${JSON.stringify(skills)})
  - 2 Project Questions (inquiring about architectural tradeoffs or hurdles of their listed projects: ${JSON.stringify(projects)})
  - 2 Behavioral Questions (team conflicts, deadlines using STAR method)

  Return ONLY a JSON response matching exactly this format:
  {
    "hr": ["Q1", "Q2", "Q3"],
    "technical": ["Q1", "Q2", "Q3"],
    "project": ["Q1", "Q2"],
    "behavioral": ["Q1", "Q2"]
  }
  Only output valid JSON.`;

  const fallbackQuestions = {
    hr: [
      "Tell me about yourself and your background.",
      "Why are you interested in joining our company?",
      "How do you handle working under high-pressure environments with tight deadlines?"
    ],
    technical: [
      "Explain the differences between client-side rendering and server-side rendering.",
      "What is the significance of middleware in an Express application and how does it execute?",
      "How do indexes optimize database lookups and what are their storage implications in MySQL?"
    ],
    project: [
      `Could you describe the system architecture of your project: "${projects[0] || 'Personal Portfolio'}"?`,
      `What were the major technical hurdles you faced when building: "${projects[0] || 'Personal Portfolio'}" and how did you resolve them?`
    ],
    behavioral: [
      "Describe a time you encountered a significant conflict with a developer inside your team. How did you handle it?",
      "Tell me about a time you failed to meet a target deadline. How did you communicate this to stakeholders and recover?"
    ]
  };

  // Pass jsonMode = true (third argument) and high temperature = 0.85 (fourth argument) for layout variety
  const rawResponse = await generateResponse(prompt, JSON.stringify(fallbackQuestions), true, 0.85);
  const parsed = cleanAndParseJSON(rawResponse, fallbackQuestions);

  return {
    hr: Array.isArray(parsed.hr) && parsed.hr.length > 0 ? parsed.hr : fallbackQuestions.hr,
    technical: Array.isArray(parsed.technical) && parsed.technical.length > 0 ? parsed.technical : fallbackQuestions.technical,
    project: Array.isArray(parsed.project) && parsed.project.length > 0 ? parsed.project : fallbackQuestions.project,
    behavioral: Array.isArray(parsed.behavioral) && parsed.behavioral.length > 0 ? parsed.behavioral : fallbackQuestions.behavioral
  };
};

/**
 * Legacy support: Generates a flat list of questions based on candidate details.
 */
const generateQuestions = async ({ name = 'Candidate', roleTarget = 'Software Engineer', experience = '1-2 Years', skills = '', count = 3 }) => {
  const sessionSeed = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
  const prompt = `You are a senior software interviewer.
  Session Token: ${sessionSeed} (Ensure you generate a completely unique, fresh set of questions that are different from any previous sessions).
  Candidate Name: ${name}
  Target Role: ${roleTarget}
  Experience Level: ${experience}
  Skills: ${skills}

  Generate exactly ${count} highly technical interview questions tailored specifically to these skills and level.
  
  Output a valid JSON response format:
  {
    "questions": ["Q1", "Q2", "Q3"]
  }
  Only output valid JSON.`;

  const fallbackQuestions = [
    `Can you describe a challenging technical problem you solved using ${skills || 'your programming skills'}?`,
    `How do you optimize performance and manage state rendering in a large scale ${roleTarget} application?`,
    `Explain the database design guidelines and indexes you employ to minimize query latency.`
  ].slice(0, count);

  const rawResponse = await generateResponse(prompt, JSON.stringify({ questions: fallbackQuestions }), true, 0.85);
  const parsed = cleanAndParseJSON(rawResponse, { questions: fallbackQuestions });
  
  return Array.isArray(parsed.questions) && parsed.questions.length > 0 ? parsed.questions : fallbackQuestions;
};

/**
 * Generates a single domain-specific technical question.
 */
const generateTechnicalQuestion = async (domain = 'JavaScript') => {
  const prompt = `You are a technical interviewer. Generate a single highly technical interview question about the domain: "${domain}".
  Do not write introductory text, just output the question itself.`;

  const defaultQuestion = `Can you describe a race condition, and how you resolve it in ${domain}?`;
  return await generateResponse(prompt, defaultQuestion);
};

/**
 * Generates a single behavioral question.
 */
const generateBehavioralQuestion = async () => {
  const prompt = `You are an interviewer. Generate a single behavioral interview question assessing soft skills, teamwork, conflict resolution, or challenge handling (STAR methodology).
  Do not write introductory text, just output the question itself.`;

  const defaultQuestion = 'Tell me about a time you had to deal with conflict inside a development team. How did you handle it and what was the outcome?';
  return await generateResponse(prompt, defaultQuestion);
};

/**
 * Generates a single HR interview question.
 */
const generateHRQuestion = async () => {
  const prompt = `You are an HR recruiter. Generate a single professional HR culture-fit interview question (e.g. alignment with values, future goals, salary discussions, workplace preferences).
  Do not write introductory text, just output the question itself.`;

  const defaultQuestion = 'Why are you interested in joining our company, and where do you see your career path progressing in the next three years?';
  return await generateResponse(prompt, defaultQuestion);
};

/**
 * Generates a single company-specific interview question.
 */
const generateCompanyQuestion = async (company = 'Google', role = 'Software Engineer') => {
  const prompt = `Generate a single interview question asked during hiring at "${company}" for the role of "${role}".
  Do not write introductory text, just output the question itself.`;

  const defaultQuestion = `How would you design a distributed key-value cache system scaling to millions of active users?`;
  return await generateResponse(prompt, defaultQuestion);
};

/**
 * Generates a single follow-up question based on the previous question and answer.
 */
const generateFollowUpQuestion = async (lastQuestion = '', lastAnswer = '') => {
  const prompt = `You are a technical interviewer. The candidate was asked: "${lastQuestion}"
  They answered: "${lastAnswer}"
  Based on their response, ask a single relevant follow-up question to probe deeper into their technical understanding.
  Do not write introductory text, just output the question itself.`;

  const defaultQuestion = 'How does that approach handle edge cases or concurrent writes safely?';
  return await generateResponse(prompt, defaultQuestion);
};

module.exports = {
  generateStructuredQuestions,
  generateQuestions,
  generateTechnicalQuestion,
  generateBehavioralQuestion,
  generateHRQuestion,
  generateCompanyQuestion,
  generateFollowUpQuestion
};
