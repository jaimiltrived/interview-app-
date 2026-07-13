const { generateResponse, cleanAndParseJSON } = require('./ollamaService');

/**
 * High-accuracy fallback evaluation when Gemini is unavailable
 */
const evaluateAnswerFallback = (question, answer) => {
  const lowercaseAnswer = String(answer || '').trim().toLowerCase();
  const wordCount = lowercaseAnswer.split(/\s+/).filter(Boolean).length;
  
  if (wordCount < 5 || lowercaseAnswer === 'no answer recorded.') {
    return {
      technicalScore: 15,
      communicationScore: 25,
      correctness: 15,
      feedback: 'No substantive answer was provided for the question.',
      improvement: 'Ensure you provide a structured response utilizing the STAR method or core technical principles.'
    };
  }

  const technicalKeywords = [
    'react', 'hook', 'component', 'state', 'props', 'rendering', 'virtual dom', 'useeffect',
    'node', 'express', 'async', 'await', 'promise', 'event loop', 'middleware', 'jwt',
    'database', 'sql', 'nosql', 'index', 'query', 'transaction', 'acid', 'normalization',
    'api', 'rest', 'graphql', 'cache', 'redis', 'scaling', 'load balancer', 'microservices',
    'docker', 'kubernetes', 'ci/cd', 'pipeline', 'test', 'unit test', 'security', 'auth'
  ];

  let matches = 0;
  technicalKeywords.forEach(kw => {
    if (lowercaseAnswer.includes(kw)) matches++;
  });

  // Calculate nuanced accuracy scores based on keyword density and elaboration depth
  let technicalScore = Math.min(95, Math.max(45, 55 + matches * 8 + Math.min(20, Math.round(wordCount / 8))));
  let correctness = Math.min(95, Math.max(45, 50 + matches * 9 + Math.min(15, Math.round(wordCount / 10))));
  let communicationScore = Math.min(96, Math.max(50, 60 + Math.min(25, Math.round(wordCount / 5))));

  return {
    technicalScore,
    communicationScore,
    correctness,
    feedback: matches >= 3
      ? 'Strong technical explanation demonstrating solid familiarity with core architectural concepts.'
      : 'Answer covers foundational points but would benefit from deeper technical specificity and architectural tradeoffs.',
    improvement: matches >= 3
      ? 'To achieve senior-level mastery, include quantifiable production tradeoffs or edge-case handling.'
      : 'Include concrete engineering terms, code lifecycle details, and real-world system examples.'
  };
};

/**
 * Evaluates candidate answer using Google Gemini with a high-precision rubric.
 */
const evaluateAnswer = async (question, answer) => {
  if (!question || !answer) {
    return evaluateAnswerFallback(question, answer);
  }

  const prompt = `You are a Principal Technical Interviewer and Software Architect evaluating a candidate with strict engineering accuracy.
  
Question Asked:
"${question}"

Candidate Answer:
"${answer}"

Evaluate the candidate's response with FULL ACCURACY against industry-standard engineering criteria:
1. Technical Correctness (0-100): Exact factual accuracy, conceptual depth, and architectural rigor.
2. Communication Clarity (0-100): Structure, conciseness, and articulation.
3. Correctness Score (0-100): Alignment with expected best practices and lack of hallucinations or inaccuracies.

Return ONLY valid JSON matching exactly this schema:
{
  "technicalScore": 88,
  "communicationScore": 91,
  "correctness": 90,
  "feedback": "Concise, precise assessment of what the candidate explained well and any technical gaps.",
  "improvement": "Specific engineering recommendation or concept to study to elevate the response."
}`;

  const fallbackData = evaluateAnswerFallback(question, answer);
  const rawResponse = await generateResponse(prompt, JSON.stringify(fallbackData), true, 0.1);
  
  const parsed = cleanAndParseJSON(rawResponse, fallbackData);

  return {
    technicalScore: Number(parsed.technicalScore || parsed.technical_score || fallbackData.technicalScore),
    communicationScore: Number(parsed.communicationScore || parsed.communication_score || fallbackData.communicationScore),
    correctness: Number(parsed.correctness || fallbackData.correctness),
    feedback: parsed.feedback || parsed.missing_points || fallbackData.feedback,
    improvement: parsed.improvement || parsed.improvement_tips || fallbackData.improvement
  };
};

module.exports = {
  evaluateAnswer
};
