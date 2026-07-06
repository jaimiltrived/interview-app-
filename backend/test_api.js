const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}/api`;

async function runTests() {
  console.log('====================================================');
  console.log(' STARTING COMPREHENSIVE AI COACH API TEST SUITE');
  console.log('====================================================\n');

  let token = '';
  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = 'Password123!';

  // Helper to assert responses
  const assertResponse = async (name, res, expectedStatus = 200) => {
    const status = res.status;
    let data;
    try {
      data = await res.json();
    } catch (e) {
      data = null;
    }

    if (status === expectedStatus) {
      console.log(`[PASS] ${name} (${status})`);
      return data;
    } else {
      console.error(`[FAIL] ${name} (Expected ${expectedStatus}, Got ${status})`);
      if (data) console.error('Details:', data);
      throw new Error(`Test failed: ${name}`);
    }
  };

  try {
    // 1. Auth Module: Register
    console.log('--- Testing Authentication Module ---');
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'John Test Account',
        email: testEmail,
        password: testPassword
      })
    });
    await assertResponse('POST /auth/register', regRes, 201);

    // 2. Auth Module: Login
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword
      })
    });
    const loginData = await assertResponse('POST /auth/login', loginRes, 200);
    token = loginData.token;

    if (!token) throw new Error('Token was not returned in login payload');

    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // 3. Profile Module
    console.log('\n--- Testing Profile Module ---');
    const profileRes = await fetch(`${BASE_URL}/profile`, { headers: authHeaders });
    await assertResponse('GET /profile (Authenticated)', profileRes, 200);

    const updateProfileRes = await fetch(`${BASE_URL}/profile/update`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        name: 'John Updated Name',
        email: testEmail
      })
    });
    await assertResponse('PUT /profile/update', updateProfileRes, 200);

    // 4. Resume Module
    console.log('\n--- Testing Resume Module ---');
    const uploadRes = await fetch(`${BASE_URL}/resume/upload`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        fileName: 'resume.txt',
        fileContent: 'Experienced Frontend Developer. Skills: React, JavaScript, HTML5, CSS3. Target role: React Developer.'
      })
    });
    const uploadData = await assertResponse('POST /resume/upload', uploadRes, 200);

    const listResumeRes = await fetch(`${BASE_URL}/resume/list`, { headers: authHeaders });
    await assertResponse('GET /resume/list', listResumeRes, 200);

    // 5. Dashboard Module
    console.log('\n--- Testing Dashboard Module ---');
    const dashRes = await fetch(`${BASE_URL}/dashboard`, { headers: authHeaders });
    await assertResponse('GET /dashboard', dashRes, 200);

    const statsRes = await fetch(`${BASE_URL}/dashboard/stats`, { headers: authHeaders });
    await assertResponse('GET /dashboard/stats', statsRes, 200);

    // 6. Interview Session Module
    console.log('\n--- Testing Interview Session Module ---');
    const submitSessRes = await fetch(`${BASE_URL}/interview/submit`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        roleTarget: uploadData.profile.roleTarget || 'React Developer',
        questions: uploadData.profile.questions || ['Question 1'],
        answers: ['I use React Hooks and Virtual DOM for state rendering.'],
        wpmHistory: [120],
        eyeContactHistory: [95],
        fillerHistory: [1]
      })
    });
    const sessionData = await assertResponse('POST /interview/submit', submitSessRes, 200);

    const historyRes = await fetch(`${BASE_URL}/history`, { headers: authHeaders });
    await assertResponse('GET /history', historyRes, 200);

    const sessionDetailRes = await fetch(`${BASE_URL}/history/${sessionData.session.id}`, { headers: authHeaders });
    await assertResponse(`GET /history/${sessionData.session.id} (Detail)`, sessionDetailRes, 200);

    // 6.5. AI Question Module (Auth required)
    console.log('\n--- Testing AI Question Generation ---');
    const genQRes = await fetch(`${BASE_URL}/ai/generate-question`, {
      method: 'POST',
      headers: authHeaders
    });
    await assertResponse('POST /ai/generate-question', genQRes, 200);

    const followUpRes = await fetch(`${BASE_URL}/ai/follow-up-question`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ lastQuestion: 'Explain React state', lastAnswer: 'I use hooks.' })
    });
    await assertResponse('POST /ai/follow-up-question', followUpRes, 200);

    // 7. General Helper APIs
    console.log('\n--- Testing Utility Modules (No Auth) ---');
    const statusRes = await fetch(`${BASE_URL}/status`);
    await assertResponse('GET /status', statusRes, 200);

    const rolesRes = await fetch(`${BASE_URL}/job-roles`);
    await assertResponse('GET /job-roles', rolesRes, 200);

    const typesRes = await fetch(`${BASE_URL}/interview-types`);
    await assertResponse('GET /interview-types', typesRes, 200);

    const notifRes = await fetch(`${BASE_URL}/notifications`);
    await assertResponse('GET /notifications', notifRes, 200);

    // 8. FastAPI AI Equivalent Endpoints
    console.log('\n--- Testing FastAPI AI Equivalent Endpoints ---');
    const parseResumeRes = await fetch(`${BASE_URL}/ai/parse-resume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileContent: 'Resume Text content' })
    });
    await assertResponse('POST /ai/parse-resume', parseResumeRes, 200);

    const speechToTextRes = await fetch(`${BASE_URL}/ai/speech-to-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    await assertResponse('POST /ai/speech-to-text', speechToTextRes, 200);

    const textToSpeechRes = await fetch(`${BASE_URL}/ai/text-to-speech`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    await assertResponse('POST /ai/text-to-speech', textToSpeechRes, 200);

    const faceRes = await fetch(`${BASE_URL}/ai/analyze-face`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    await assertResponse('POST /ai/analyze-face', faceRes, 200);

    const voiceRes = await fetch(`${BASE_URL}/ai/analyze-voice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    await assertResponse('POST /ai/analyze-voice', voiceRes, 200);

    const feedbackRes = await fetch(`${BASE_URL}/ai/generate-feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questions: ['Q'], answers: ['A'] })
    });
    await assertResponse('POST /ai/generate-feedback', feedbackRes, 200);

    console.log('\n====================================================');
    console.log(' ALL CORE API MODULE INTEGRATION TESTS PASSED!');
    console.log('====================================================');

  } catch (error) {
    console.error('\n====================================================');
    console.error(' TEST SUITE EXECUTION FAILED');
    console.error('====================================================');
    console.error(error.message);
    process.exit(1);
  }
}

runTests();
