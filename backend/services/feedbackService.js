const { generateResponse, cleanAndParseJSON } = require('./ollamaService');

/**
 * Fallback static final feedback in case Ollama fails
 */
const generateFinalFeedbackFallback = (questions, answers) => {
  return {
    summary: 'The candidate demonstrated a solid foundational grasp of the core target role requirements. Vocabulary usage indicates familiarity with technical frameworks. Pacing is in line with expectations.',
    strengths: [
      'Addresses queries directly and targets key technical terms.',
      'Demonstrates practical familiarity with development concepts.'
    ],
    improvements: [
      'Provide more details regarding system scaling considerations.',
      'Incorporate structured STAR frameworks to explain past experiences.'
    ]
  };
};

/**
 * Evaluates full interview questions and responses and provides aggregated final report details.
 */
const generateFinalFeedback = async (questions = [], answers = []) => {
  if (!questions.length || !answers.length) {
    return generateFinalFeedbackFallback(questions, answers);
  }

  const prompt = `Based on these interview questions and candidate answers, generate constructive feedback for the candidate.
  Questions: ${JSON.stringify(questions)}
  Answers: ${JSON.stringify(answers)}
  
  Provide a JSON response format:
  {
    "summary": "Overall assessment feedback rating detail",
    "strengths": ["Strength 1", "Strength 2"],
    "improvements": ["Improvement Area 1", "Improvement Area 2"]
  }
  Only output valid JSON.`;

  const fallbackData = generateFinalFeedbackFallback(questions, answers);
  // Pass jsonMode = true (third argument) for forced formatting speed up
  const rawResponse = await generateResponse(prompt, JSON.stringify(fallbackData), true);
  
  return cleanAndParseJSON(rawResponse, fallbackData);
};

module.exports = {
  generateFinalFeedback
};
