const { generateResponse, cleanAndParseJSON } = require('./ollamaService');

/**
 * Deterministic fallback report structure when LLM output is malformed or unavailable
 */
const generateFinalReportFallback = ({ avgTech = 75, avgComm = 75, overallScore = 75, qaPairs = [] }) => {
  const strengths = [
    'Responds directly to technical prompts with structured explanations',
    'Demonstrates solid foundational software engineering vocabulary'
  ];

  const weaknesses = [
    'Add more specific code parameter tradeoffs and concrete examples',
    'Avoid occasional repetition or filler words during complex technical answers'
  ];

  if (avgTech >= 85) {
    strengths.unshift('Strong technical depth and accurate conceptual reasoning');
  } else {
    weaknesses.unshift('Strengthen deep system design and framework lifecycle explanations');
  }

  return {
    overallScore,
    technicalScore: avgTech,
    communicationScore: avgComm,
    strengths,
    weaknesses,
    resumeSuggestions: [
      'Emphasize measurable performance metrics and scaling outcomes in project bullet points',
      'Ensure technical keywords match targeted ATS requirements clearly'
    ],
    learningPath: [
      'Study advanced architectural trade-offs and distributed systems patterns',
      'Practice structured STAR methodology frameworks for behavioral questions'
    ]
  };
};

/**
 * Generates a comprehensive final report using pre-computed intermediate answer scores and feedback summaries.
 * Avoids sending heavy raw transcript payloads to lower token consumption and latency.
 */
const generateFinalReport = async ({ avgTech = 75, avgComm = 75, overallScore = 75, qaPairs = [], roleTarget = 'Software Engineer', candidateName = 'Candidate' }) => {
  const fallbackReport = generateFinalReportFallback({ avgTech, avgComm, overallScore, qaPairs });

  // Extract lightweight intermediate evaluation summaries
  const evaluationSummaries = qaPairs.map((pair, index) => ({
    qNo: index + 1,
    type: pair.type || 'technical',
    techScore: pair.score?.technicalScore || 75,
    commScore: pair.score?.communicationScore || 75,
    feedback: pair.feedback || 'Satisfactory explanation provided.'
  }));

  const prompt = `You are a Principal Software Architect and Executive Technical Recruiter.
Evaluate the candidate "${candidateName}" for the target role "${roleTarget}" with FULL ANALYTICAL ACCURACY based on precomputed evaluation data:
- Technical Average Score: ${avgTech}/100
- Communication Average Score: ${avgComm}/100
- Overall Performance Score: ${overallScore}/100

Intermediate Answer Evaluations & Question Feedback:
${JSON.stringify(evaluationSummaries, null, 2)}

Synthesize a high-precision executive report and return ONLY a JSON object matching exactly this schema:
{
  "overallScore": ${overallScore},
  "strengths": ["Specific, verified technical strength demonstrated by the candidate", "Communication or architectural clarity point"],
  "weaknesses": ["Exact engineering or conceptual area needing deeper mastery", "Concrete gap observed during interview answers"],
  "resumeSuggestions": ["Targeted ATS keyword enhancement for ${roleTarget}", "Measurable impact formatting recommendation"],
  "learningPath": ["Advanced architectural topic or pattern tailored to gaps", "Recommended framework or performance optimization concept"]
}
Strict requirement: Output only valid JSON. Ensure points are highly specific to the candidate's actual answers and target role.`;

  try {
    const rawResponse = await generateResponse(prompt, JSON.stringify(fallbackReport), true, 0.1);
    const parsedReport = cleanAndParseJSON(rawResponse, fallbackReport);

    return {
      candidateName: candidateName || 'Candidate',
      roleTarget: roleTarget || 'Software Engineer',
      overallScore: Number(parsedReport.overallScore || overallScore),
      technicalScore: avgTech,
      communicationScore: avgComm,
      strengths: Array.isArray(parsedReport.strengths) && parsedReport.strengths.length > 0 ? parsedReport.strengths : fallbackReport.strengths,
      weaknesses: Array.isArray(parsedReport.weaknesses) && parsedReport.weaknesses.length > 0 ? parsedReport.weaknesses : fallbackReport.weaknesses,
      resumeSuggestions: Array.isArray(parsedReport.resumeSuggestions) && parsedReport.resumeSuggestions.length > 0 ? parsedReport.resumeSuggestions : fallbackReport.resumeSuggestions,
      learningPath: Array.isArray(parsedReport.learningPath) && parsedReport.learningPath.length > 0 ? parsedReport.learningPath : fallbackReport.learningPath
    };
  } catch (error) {
    console.warn('[REPORT SERVICE WARNING] Using deterministic fallback report due to error:', error.message);
    return fallbackReport;
  }
};

module.exports = {
  generateFinalReport,
  generateFinalReportFallback
};
