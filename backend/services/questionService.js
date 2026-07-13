const { generateResponse, cleanAndParseJSON } = require('./ollamaService');
const { getStructuredFallback, getFlatFallback, getTechnicalFallback, pickRandom, questionBank } = require('./questionBank');

/**
 * Generates structured mock interview questions in batches (3 HR, 3 Tech, 2 Project, 2 Behavioral).
 * Uses a large randomized question bank as fallback to ensure unique questions every session.
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

  // Randomized fallback — different questions every time
  const fallbackQuestions = getStructuredFallback(skills, projects);

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
 * Uses randomized question bank as fallback for unique questions every session.
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

  // Randomized fallback — different questions every time, matched to candidate skills
  const fallbackQuestions = getFlatFallback(skills, count);

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

/**
 * Adaptive AI-first question generation: Generates ONE tailored question at a time.
 * Adapts based on candidate step index, resume skills, and previous answer evaluation.
 */
const generateNextQuestion = async ({
  stepIndex = 0,
  roleTarget = 'Software Engineer',
  skills = [],
  projects = [],
  previousQuestion = '',
  previousAnswer = '',
  previousEvaluation = null
}) => {
  const primarySkill = skills.length > 0 ? skills[0] : 'JavaScript';
  const typeMap = ['hr', 'technical', 'technical', 'project', 'behavioral', 'technical'];
  const targetType = typeMap[stepIndex % typeMap.length];

  let prompt = '';
  let fallbackQuestion = '';

  if (stepIndex === 0) {
    prompt = `You are an executive interviewer hiring for a "${roleTarget}".
    Candidate skills: ${JSON.stringify(skills)}
    Generate a single professional opening interview question tailored to their background.
    Return ONLY valid JSON matching exactly:
    {
      "question": "Opening interview question text here",
      "type": "hr"
    }`;
    fallbackQuestion = `Welcome! Could you briefly walk me through your background with ${primarySkill} and why you're interested in the ${roleTarget} role?`;
  } else if (previousEvaluation && (previousEvaluation.technicalScore < 70 || previousEvaluation.correctness < 70)) {
    prompt = `You are a technical interviewer for "${roleTarget}".
    Previously asked: "${previousQuestion}"
    Candidate answered: "${previousAnswer}"
    Interviewer feedback: "${previousEvaluation.feedback || 'Needed improvement'}"
    
    Generate a constructive follow-up or clarifying technical question to help probe their conceptual understanding of ${primarySkill}.
    Return ONLY valid JSON matching exactly:
    {
      "question": "Follow-up question text here",
      "type": "technical"
    }`;
    fallbackQuestion = `Could you elaborate on how you handle error handling or state consistency when working with ${primarySkill}?`;
  } else {
    prompt = `You are a senior interviewer for "${roleTarget}".
    Candidate skills: ${JSON.stringify(skills)}
    Candidate projects: ${JSON.stringify(projects)}
    Generate the next distinct "${targetType}" interview question challenging their skills.
    Return ONLY valid JSON matching exactly:
    {
      "question": "Next interview question text here",
      "type": "${targetType}"
    }`;
    fallbackQuestion = targetType === 'project'
      ? `Can you discuss a technical challenge or architectural tradeoff you faced while developing one of your projects?`
      : `What are some best practices you follow to optimize performance and maintainability in ${primarySkill} applications?`;
  }

  const fallbackData = { question: fallbackQuestion, type: targetType, stepIndex };

  try {
    const rawResponse = await generateResponse(prompt, JSON.stringify(fallbackData), true);
    const parsed = cleanAndParseJSON(rawResponse, fallbackData);

    return {
      question: parsed.question || fallbackQuestion,
      type: parsed.type || targetType,
      stepIndex
    };
  } catch (error) {
    console.warn('[QUESTION SERVICE WARNING] Falling back to deterministic adaptive question:', error.message);
    return fallbackData;
  }
};

module.exports = {
  generateStructuredQuestions,
  generateQuestions,
  generateTechnicalQuestion,
  generateBehavioralQuestion,
  generateHRQuestion,
  generateCompanyQuestion,
  generateFollowUpQuestion,
  generateNextQuestion
};
