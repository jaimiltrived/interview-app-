const { generateResponse, cleanAndParseJSON } = require('./ollamaService');

/**
 * Fallback static evaluation rules in case Ollama fails
 */
const evaluateAnswerFallback = (question, answer) => {
  const lowercaseAnswer = String(answer || '').toLowerCase();
  
  const technicalKeywords = [
    'react', 'hook', 'component', 'state', 'props', 'rendering', 'virtual dom',
    'laravel', 'php', 'middleware', 'database', 'eloquent', 'query', 'relations', 'n+1',
    'api', 'fastapi', 'async', 'await', 'asynchronous', 'security', 'sql', 'index',
    'design', 'optimize', 'scalability', 'performance', 'flexbox', 'grid', 'responsive'
  ];

  let matches = 0;
  technicalKeywords.forEach(kw => {
    if (lowercaseAnswer.includes(kw)) matches++;
  });

  const wordCount = lowercaseAnswer.split(/\s+/).filter(Boolean).length;

  let technicalScore = 60;
  let correctness = 60;

  if (matches >= 4) {
    technicalScore = 90;
    correctness = 90;
  } else if (matches >= 2) {
    technicalScore = 80;
    correctness = 75;
  } else if (wordCount < 10) {
    technicalScore = 40;
    correctness = 35;
  }

  const communicationScore = Math.min(95, Math.max(50, 60 + Math.round(wordCount / 3)));

  return {
    technicalScore,
    communicationScore,
    correctness,
    feedback: 'Answer provides a high-level summary but lacks specific system architectural details and code parameters.',
    improvement: 'Elaborate on database indexing, scaling mechanisms, or framework lifecycle details.'
  };
};

/**
 * Evaluates candidate answer and gives scores and suggestions.
 */
const evaluateAnswer = async (question, answer) => {
  if (!question || !answer) {
    return evaluateAnswerFallback(question, answer);
  }

  const prompt = `You are a Senior Technical Interviewer.
  
  Question:
  ${question}
  
  Candidate Answer:
  ${answer}
  
  Evaluate the response and return ONLY a JSON response matching exactly this format:
  {
    "technicalScore": 88,
    "communicationScore": 91,
    "correctness": 90,
    "feedback": "Good explanation but mention missing details.",
    "improvement": "Add specific architectural or coding examples."
  }
  Only output valid JSON.`;

  const fallbackData = evaluateAnswerFallback(question, answer);
  // Pass jsonMode = true (third argument) for forced formatting speed up
  const rawResponse = await generateResponse(prompt, JSON.stringify(fallbackData), true);
  
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
