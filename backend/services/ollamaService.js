const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Helper to call Google Gemini API as fallback
const callGeminiFallback = async (prompt, fallbackText) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('[OLLAMA-FALLBACK] Gemini API key not found. Using local static fallback.');
    return fallbackText;
  }

  try {
    // Workaround for corporate proxy / SSL inspection environments
    if (process.env.NODE_ENV === 'development') {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    }

    console.log('[OLLAMA-FALLBACK] Directing request to Google Gemini API (gemini-2.0-flash)...');
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': apiKey
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`[OLLAMA-FALLBACK] Gemini API returned status ${response.status}: ${errText}`);
      return fallbackText;
    }

    const data = await response.json();
    const result = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (result) return result.trim();
  } catch (err) {
    console.error('[OLLAMA-FALLBACK] Gemini API failed:', err.message);
  }
  return fallbackText;
};

/**
 * Sends a prompt to the local LLM server (either vLLM or Ollama).
 * Falls back to Google Gemini if local server is offline/fails.
 */
const generateResponse = async (prompt, fallbackText = '', jsonMode = false, temperature = 0.2) => {
  const provider = (process.env.LLM_PROVIDER || 'ollama').toLowerCase();

  if (provider === 'gemini') {
    return await callGeminiFallback(prompt, fallbackText);
  }

  if (provider === 'vllm') {
    const host = process.env.VLLM_HOST || 'http://localhost:8000';
    const model = process.env.VLLM_MODEL || 'llama3.2';

    try {
      console.log(`[vLLM] Calling vLLM chat completions at ${host} with model: ${model} (jsonMode: ${jsonMode}, temp: ${temperature})...`);
      
      const requestBody = {
        model: model,
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: temperature,
        max_tokens: jsonMode ? 512 : 256
      };

      if (jsonMode) {
        requestBody.response_format = { type: 'json_object' };
      }

      // Format API URL
      let apiUrl = host;
      if (!apiUrl.endsWith('/')) {
        apiUrl += '/';
      }
      if (apiUrl.includes('/v1/')) {
        apiUrl += 'chat/completions';
      } else {
        apiUrl += 'v1/chat/completions';
      }

      // Set up a 120-second abort timeout for local generation speed
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`vLLM returned status ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        return content.trim();
      }
      throw new Error('Invalid response structure from vLLM');
    } catch (error) {
      console.warn(`[vLLM WARNING] Connection failed: ${error.message}. Routing to fallback...`);
      return await callGeminiFallback(prompt, fallbackText);
    }
  } else {
    // Ollama connection logic
    const host = process.env.OLLAMA_HOST || 'http://localhost:11434';
    const model = process.env.OLLAMA_MODEL || 'llama3.2';

    try {
      console.log(`[OLLAMA] Calling Ollama generate at ${host} with model: ${model} (jsonMode: ${jsonMode}, temp: ${temperature})...`);
      
      const requestBody = {
        model: model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: temperature,
          top_p: 0.8,
          num_predict: jsonMode ? 512 : 256
        }
      };

      if (jsonMode) {
        requestBody.format = 'json';
      }

      // Set up a 120-second abort timeout for local generation speed
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);

      const response = await fetch(`${host}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Ollama returned status ${response.status}`);
      }

      const data = await response.json();
      if (data && data.response) {
        return data.response.trim();
      }
      throw new Error('Invalid response structure from Ollama');
    } catch (error) {
      console.warn(`[OLLAMA WARNING] Connection failed: ${error.message}. Routing to fallback...`);
      return await callGeminiFallback(prompt, fallbackText);
    }
  }
};

/**
 * Extracts and parses JSON from raw LLM output.
 * Handles markdown wrapping blocks and general prefix/suffix text.
 */
const cleanAndParseJSON = (rawText, defaultObject = {}) => {
  if (!rawText) return defaultObject;

  let cleaned = rawText.trim();

  // 1. Remove markdown block markers ```json ... ```
  if (cleaned.includes('```json')) {
    const startIdx = cleaned.indexOf('```json') + 7;
    const endIdx = cleaned.indexOf('```', startIdx);
    if (endIdx !== -1) {
      cleaned = cleaned.substring(startIdx, endIdx).trim();
    }
  } else if (cleaned.includes('```')) {
    const startIdx = cleaned.indexOf('```') + 3;
    const endIdx = cleaned.indexOf('```', startIdx);
    if (endIdx !== -1) {
      cleaned = cleaned.substring(startIdx, endIdx).trim();
    }
  }

  // 2. Locate first '{' and last '}' to strip surrounding conversational chatter
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1).trim();
  }

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('[OLLAMA JSON PARSING ERROR] Failed to parse JSON string:', cleaned);
    console.error(error);
    return defaultObject;
  }
};

module.exports = {
  generateResponse,
  cleanAndParseJSON
};
