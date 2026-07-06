const swaggerPaths = {
  // 1. Authentication APIs
  "/api/auth/register": {
    "post": {
      "tags": ["Authentication"],
      "summary": "Register User",
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "name": { "type": "string" },
                "email": { "type": "string" },
                "password": { "type": "string" }
              }
            }
          }
        }
      },
      "responses": { "201": { "description": "Success" } }
    }
  },
  "/api/auth/login": {
    "post": {
      "tags": ["Authentication"],
      "summary": "Login User",
      "requestBody": {
        "required": true,
        "content": {
          "application/json": {
            "schema": {
              "type": "object",
              "properties": {
                "email": { "type": "string" },
                "password": { "type": "string" }
              }
            }
          }
        }
      },
      "responses": { "200": { "description": "Success" } }
    }
  },
  "/api/auth/logout": {
    "post": {
      "tags": ["Authentication"],
      "summary": "Logout User",
      "responses": { "200": { "description": "Success" } }
    }
  },
  "/api/auth/refresh-token": {
    "post": {
      "tags": ["Authentication"],
      "summary": "Refresh JWT Token",
      "responses": { "200": { "description": "Success" } }
    }
  },
  "/api/auth/forgot-password": {
    "post": {
      "tags": ["Authentication"],
      "summary": "Forgot Password Request",
      "responses": { "200": { "description": "Success" } }
    }
  },
  "/api/auth/reset-password": {
    "post": {
      "tags": ["Authentication"],
      "summary": "Reset Password",
      "responses": { "200": { "description": "Success" } }
    }
  },
  "/api/auth/verify-email": {
    "get": {
      "tags": ["Authentication"],
      "summary": "Verify Email address",
      "responses": { "200": { "description": "Success" } }
    }
  },
  "/api/auth/change-password": {
    "post": {
      "tags": ["Authentication"],
      "summary": "Change password for logged user",
      "responses": { "200": { "description": "Success" } }
    }
  },

  // 2. User Profile APIs
  "/api/profile": {
    "get": {
      "tags": ["User Profile"],
      "summary": "Get Profile Details",
      "security": [{ "bearerAuth": [] }],
      "responses": { "200": { "description": "Success" } }
    }
  },
  "/api/profile/update": {
    "put": {
      "tags": ["User Profile"],
      "summary": "Update Profile Details",
      "security": [{ "bearerAuth": [] }],
      "responses": { "200": { "description": "Success" } }
    }
  },
  "/api/profile/upload-photo": {
    "post": {
      "tags": ["User Profile"],
      "summary": "Upload Profile Photo",
      "security": [{ "bearerAuth": [] }],
      "responses": { "200": { "description": "Success" } }
    }
  },
  "/api/profile/delete-photo": {
    "delete": {
      "tags": ["User Profile"],
      "summary": "Delete Profile Photo",
      "security": [{ "bearerAuth": [] }],
      "responses": { "200": { "description": "Success" } }
    }
  },
  "/api/profile/update-skills": {
    "put": {
      "tags": ["User Profile"],
      "summary": "Update Profile Skills list",
      "security": [{ "bearerAuth": [] }],
      "responses": { "200": { "description": "Success" } }
    }
  },
  "/api/profile/delete-account": {
    "delete": {
      "tags": ["User Profile"],
      "summary": "Delete User Account",
      "security": [{ "bearerAuth": [] }],
      "responses": { "200": { "description": "Success" } }
    }
  },

  // 3. Resume APIs
  "/api/resume/upload": {
    "post": {
      "tags": ["Resume"],
      "summary": "Upload Resume",
      "security": [{ "bearerAuth": [] }],
      "responses": { "200": { "description": "Success" } }
    }
  },
  "/api/resume/list": {
    "get": {
      "tags": ["Resume"],
      "summary": "List Uploaded Resumes",
      "security": [{ "bearerAuth": [] }],
      "responses": { "200": { "description": "Success" } }
    }
  },
  "/api/resume/{id}": {
    "get": {
      "tags": ["Resume"],
      "summary": "Get Resume Details",
      "security": [{ "bearerAuth": [] }],
      "parameters": [{ "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }],
      "responses": { "200": { "description": "Success" } }
    }
  },
  "/api/resume/delete/{id}": {
    "delete": {
      "tags": ["Resume"],
      "summary": "Delete Resume",
      "parameters": [{ "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }],
      "responses": { "200": { "description": "Success" } }
    }
  },
  "/api/resume/parse": {
    "post": {
      "tags": ["Resume"],
      "summary": "Parse Resume Content",
      "responses": { "200": { "description": "Success" } }
    }
  },
  "/api/resume/analyze": {
    "post": {
      "tags": ["Resume"],
      "summary": "Analyze Resume Score and Keywords",
      "responses": { "200": { "description": "Success" } }
    }
  },
  "/api/resume/score/{id}": {
    "get": {
      "tags": ["Resume"],
      "summary": "Get Resume Score by ID",
      "parameters": [{ "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }],
      "responses": { "200": { "description": "Success" } }
    }
  },

  // 4. Job Role APIs
  "/api/job-roles": {
    "get": {
      "tags": ["Job Role"],
      "summary": "Get all Job Roles",
      "responses": { "200": { "description": "Success" } }
    }
  },
  "/api/job-role/{id}": {
    "get": {
      "tags": ["Job Role"],
      "summary": "Get Job Role details by ID",
      "parameters": [{ "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }],
      "responses": { "200": { "description": "Success" } }
    },
    "put": {
      "tags": ["Job Role"],
      "summary": "Update Job Role details",
      "parameters": [{ "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }],
      "responses": { "200": { "description": "Success" } }
    },
    "delete": {
      "tags": ["Job Role"],
      "summary": "Delete Job Role",
      "parameters": [{ "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }],
      "responses": { "200": { "description": "Success" } }
    }
  },
  "/api/job-role": {
    "post": {
      "tags": ["Job Role"],
      "summary": "Create new Job Role",
      "responses": { "200": { "description": "Success" } }
    }
  },

  // 5. Interview Type APIs
  "/api/interview-types": {
    "get": {
      "tags": ["Interview Type"],
      "summary": "List all Interview Types",
      "responses": { "200": { "description": "Success" } }
    }
  },
  "/api/interview-type": {
    "post": {
      "tags": ["Interview Type"],
      "summary": "Create new Interview Type",
      "responses": { "200": { "description": "Success" } }
    }
  },
  "/api/interview-type/{id}": {
    "put": {
      "tags": ["Interview Type"],
      "summary": "Update Interview Type by ID",
      "parameters": [{ "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }],
      "responses": { "200": { "description": "Success" } }
    },
    "delete": {
      "tags": ["Interview Type"],
      "summary": "Delete Interview Type by ID",
      "parameters": [{ "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }],
      "responses": { "200": { "description": "Success" } }
    }
  },

  // 6. Interview Session APIs
  "/api/interview/start": {
    "post": {
      "tags": ["Interview Session"],
      "summary": "Start Interview Session",
      "responses": { "200": { "description": "Success" } }
    }
  },
  "/api/interview/{id}": {
    "get": {
      "tags": ["Interview Session"],
      "summary": "Get Interview Session Details",
      "parameters": [{ "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }],
      "responses": { "200": { "description": "Success" } }
    }
  },
  "/api/interview/next-question": {
    "post": {
      "tags": ["Interview Session"],
      "summary": "Fetch Next Question",
      "responses": { "200": { "description": "Success" } }
    }
  },
  "/api/interview/submit-answer": {
    "post": {
      "tags": ["Interview Session"],
      "summary": "Submit Candidate Answer",
      "responses": { "200": { "description": "Success" } }
    }
  },
  "/api/interview/skip-question": {
    "post": {
      "tags": ["Interview Session"],
      "summary": "Skip Current Question",
      "responses": { "200": { "description": "Success" } }
    }
  },
  "/api/interview/end": {
    "post": {
      "tags": ["Interview Session"],
      "summary": "End Practice Session",
      "responses": { "200": { "description": "Success" } }
    }
  },
  "/api/interview/history": {
    "get": {
      "tags": ["Interview Session"],
      "summary": "List User Practice History",
      "security": [{ "bearerAuth": [] }],
      "responses": { "200": { "description": "Success" } }
    }
  },
  "/api/interview/delete/{id}": {
    "delete": {
      "tags": ["Interview Session"],
      "summary": "Delete Practice Session",
      "parameters": [{ "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }],
      "responses": { "200": { "description": "Success" } }
    }
  },

  // 7. AI Question APIs
  "/api/ai/generate-question": {
    "post": {
      "tags": ["AI Question"],
      "summary": "Generate AI Question",
      "responses": { "200": { "description": "Success" } }
    }
  },
  "/api/ai/follow-up-question": {
    "post": {
      "tags": ["AI Question"],
      "summary": "Generate AI Follow-up Question",
      "responses": { "200": { "description": "Success" } }
    }
  },
  "/api/ai/company-question": {
    "post": {
      "tags": ["AI Question"],
      "summary": "Generate AI Company-Specific Question",
      "responses": { "200": { "description": "Success" } }
    }
  },
  "/api/ai/technical-question": {
    "post": {
      "tags": ["AI Question"],
      "summary": "Generate AI Technical Domain Question",
      "responses": { "200": { "description": "Success" } }
    }
  },

  // 8. Speech APIs
  "/api/speech-to-text": {
    "post": {
      "tags": ["Speech Analysis"],
      "summary": "Convert speech to text",
      "responses": { "200": { "description": "Success" } }
    }
  },
  "/api/text-to-speech": {
    "post": {
      "tags": ["Speech Analysis"],
      "summary": "Convert text to speech audio",
      "responses": { "200": { "description": "Success" } }
    }
  },
  "/api/speech/analyze": {
    "post": {
      "tags": ["Speech Analysis"],
      "summary": "Analyze speech clarity and pacing",
      "responses": { "200": { "description": "Success" } }
    }
  },

  // 9. Face Analysis APIs
  "/api/face/detect": {
    "post": {
      "tags": ["Face Analysis"],
      "summary": "Detect face landmarks in frame",
      "responses": { "200": { "description": "Success" } }
    }
  },
  "/api/face/eye-contact": {
    "post": {
      "tags": ["Face Analysis"],
      "summary": "Assess eye contact rating",
      "responses": { "200": { "description": "Success" } }
    }
  },
  "/api/face/head-pose": {
    "post": {
      "tags": ["Face Analysis"],
      "summary": "Assess head pose positioning",
      "responses": { "200": { "description": "Success" } }
    }
  },
  "/api/face/emotion": {
    "post": {
      "tags": ["Face Analysis"],
      "summary": "Analyze candidate emotion expressiveness",
      "responses": { "200": { "description": "Success" } }
    }
  },

  // 10. Voice Analysis APIs
  "/api/voice/analyze": {
    "post": {
      "tags": ["Voice Analysis"],
      "summary": "Analyze voice tone parameters",
      "responses": { "200": { "description": "Success" } }
    }
  },
  "/api/voice/filler-words": {
    "post": {
      "tags": ["Voice Analysis"],
      "summary": "Count filler word usage details",
      "responses": { "200": { "description": "Success" } }
    }
  },
  "/api/voice/confidence-score": {
    "post": {
      "tags": ["Voice Analysis"],
      "summary": "Assess spoken voice confidence",
      "responses": { "200": { "description": "Success" } }
    }
  },
  "/api/voice/speaking-speed": {
    "post": {
      "tags": ["Voice Analysis"],
      "summary": "Measure speaking pace speed (WPM)",
      "responses": { "200": { "description": "Success" } }
    }
  },

  // 11. AI Evaluation APIs
  "/api/ai/evaluate-answer": {
    "post": {
      "tags": ["AI Evaluation"],
      "summary": "Evaluate candidate answer response",
      "responses": { "200": { "description": "Success" } }
    }
  },
  "/api/ai/technical-score": {
    "post": {
      "tags": ["AI Evaluation"],
      "summary": "Generate standalone technical score",
      "responses": { "200": { "description": "Success" } }
    }
  },
  "/api/ai/communication-score": {
    "post": {
      "tags": ["AI Evaluation"],
      "summary": "Generate standalone communication score",
      "responses": { "200": { "description": "Success" } }
    }
  },
  "/api/ai/overall-score": {
    "post": {
      "tags": ["AI Evaluation"],
      "summary": "Generate aggregated overall score",
      "responses": { "200": { "description": "Success" } }
    }
  },

  // 12. Report APIs
  "/api/report/{interviewId}": {
    "get": {
      "tags": ["Report"],
      "summary": "Get Report details",
      "parameters": [{ "name": "interviewId", "in": "path", "required": true, "schema": { "type": "string" } }],
      "responses": { "200": { "description": "Success" } }
    }
  },
  "/api/report/download/{interviewId}": {
    "get": {
      "tags": ["Report"],
      "summary": "Download Report PDF URL",
      "parameters": [{ "name": "interviewId", "in": "path", "required": true, "schema": { "type": "string" } }],
      "responses": { "200": { "description": "Success" } }
    }
  },
  "/api/report/resume/{resumeId}": {
    "get": {
      "tags": ["Report"],
      "summary": "Get Resume Analysis Report",
      "parameters": [{ "name": "resumeId", "in": "path", "required": true, "schema": { "type": "string" } }],
      "responses": { "200": { "description": "Success" } }
    }
  },
  "/api/report/progress": {
    "get": {
      "tags": ["Report"],
      "summary": "Get candidate progress metrics history",
      "responses": { "200": { "description": "Success" } }
    }
  },

  // 13. Dashboard APIs
  "/api/dashboard": {
    "get": {
      "tags": ["Dashboard"],
      "summary": "Get Dashboard overview profile",
      "security": [{ "bearerAuth": [] }],
      "responses": { "200": { "description": "Success" } }
    }
  },
  "/api/dashboard/stats": {
    "get": {
      "tags": ["Dashboard"],
      "summary": "Get Dashboard metrics stats",
      "security": [{ "bearerAuth": [] }],
      "responses": { "200": { "description": "Success" } }
    }
  },
  "/api/dashboard/performance": {
    "get": {
      "tags": ["Dashboard"],
      "summary": "Get Dashboard performance timeline charts",
      "security": [{ "bearerAuth": [] }],
      "responses": { "200": { "description": "Success" } }
    }
  },
  "/api/dashboard/recent-interviews": {
    "get": {
      "tags": ["Dashboard"],
      "summary": "List Dashboard recent interviews list",
      "security": [{ "bearerAuth": [] }],
      "responses": { "200": { "description": "Success" } }
    }
  },
  "/api/dashboard/recommendations": {
    "get": {
      "tags": ["Dashboard"],
      "summary": "Get personalized practice recommendations",
      "responses": { "200": { "description": "Success" } }
    }
  },

  // 14. Admin APIs
  "/api/admin/login": {
    "post": {
      "tags": ["Admin Console"],
      "summary": "Admin Login",
      "responses": { "200": { "description": "Success" } }
    }
  },
  "/api/admin/dashboard": {
    "get": {
      "tags": ["Admin Console"],
      "summary": "Get Admin Dashboard metrics summary",
      "responses": { "200": { "description": "Success" } }
    }
  },
  "/api/admin/users": {
    "get": {
      "tags": ["Admin Console"],
      "summary": "List all registered candidate accounts",
      "responses": { "200": { "description": "Success" } }
    }
  },
  "/api/admin/user/{id}/status": {
    "put": {
      "tags": ["Admin Console"],
      "summary": "Change User account status",
      "parameters": [{ "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }],
      "responses": { "200": { "description": "Success" } }
    }
  },
  "/api/admin/user/{id}": {
    "delete": {
      "tags": ["Admin Console"],
      "summary": "Delete candidate account completely",
      "parameters": [{ "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }],
      "responses": { "200": { "description": "Success" } }
    }
  },
  "/api/admin/interviews": {
    "get": {
      "tags": ["Admin Console"],
      "summary": "List all system interview sessions",
      "responses": { "200": { "description": "Success" } }
    }
  },
  "/api/admin/reports": {
    "get": {
      "tags": ["Admin Console"],
      "summary": "List all compiled report metrics",
      "responses": { "200": { "description": "Success" } }
    }
  },
  "/api/admin/job-role": {
    "post": {
      "tags": ["Admin Console"],
      "summary": "Admin create job role taxonomy",
      "responses": { "200": { "description": "Success" } }
    }
  },
  "/api/admin/company": {
    "post": {
      "tags": ["Admin Console"],
      "summary": "Admin add company profile mock targeting",
      "responses": { "200": { "description": "Success" } }
    }
  },
  "/api/admin/analytics": {
    "get": {
      "tags": ["Admin Console"],
      "summary": "Get aggregate system performance analytics",
      "responses": { "200": { "description": "Success" } }
    }
  },
  "/api/admin/settings": {
    "put": {
      "tags": ["Admin Console"],
      "summary": "Admin update global application configs",
      "responses": { "200": { "description": "Success" } }
    }
  },
  "/api/admin/logs": {
    "get": {
      "tags": ["Admin Console"],
      "summary": "List administrative security audit logs",
      "responses": { "200": { "description": "Success" } }
    }
  },

  // 15. Notification APIs
  "/api/notifications": {
    "get": {
      "tags": ["Notifications"],
      "summary": "List all Notifications",
      "responses": { "200": { "description": "Success" } }
    }
  },
  "/api/notifications/read/{id}": {
    "put": {
      "tags": ["Notifications"],
      "summary": "Mark Notification as read",
      "parameters": [{ "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }],
      "responses": { "200": { "description": "Success" } }
    }
  },
  "/api/notifications/{id}": {
    "delete": {
      "tags": ["Notifications"],
      "summary": "Delete Notification",
      "parameters": [{ "name": "id", "in": "path", "required": true, "schema": { "type": "string" } }],
      "responses": { "200": { "description": "Success" } }
    }
  },

  // 16. Feedback APIs
  "/api/feedback/generate": {
    "post": {
      "tags": ["Feedback"],
      "summary": "Generate AI Feedback based on answers",
      "responses": { "200": { "description": "Success" } }
    }
  },
  "/api/feedback/{interviewId}": {
    "get": {
      "tags": ["Feedback"],
      "summary": "Get Feedback details by Interview ID",
      "parameters": [{ "name": "interviewId", "in": "path", "required": true, "schema": { "type": "string" } }],
      "responses": { "200": { "description": "Success" } }
    }
  },
  "/api/feedback/improvement-plan": {
    "post": {
      "tags": ["Feedback"],
      "summary": "Generate improvement plan recommendations",
      "responses": { "200": { "description": "Success" } }
    }
  },
  "/api/feedback/practice-questions": {
    "get": {
      "tags": ["Feedback"],
      "summary": "List practice questions suggested",
      "responses": { "200": { "description": "Success" } }
    }
  },

  // 17. FastAPI AI Endpoints
  "/api/ai/parse-resume": {
    "post": {
      "tags": ["AI FastAPI Endpoints"],
      "summary": "Extract resume data structure using Gemini",
      "responses": { "200": { "description": "Success" } }
    }
  },
  "/api/ai/analyze-resume": {
    "post": {
      "tags": ["AI FastAPI Endpoints"],
      "summary": "Analyze resume structure and keywords",
      "responses": { "200": { "description": "Success" } }
    }
  },
  "/api/ai/speech-to-text": {
    "post": {
      "tags": ["AI FastAPI Endpoints"],
      "summary": "Transcribe speech waveform to text",
      "responses": { "200": { "description": "Success" } }
    }
  },
  "/api/ai/text-to-speech": {
    "post": {
      "tags": ["AI FastAPI Endpoints"],
      "summary": "Synthesize spoken narration from text",
      "responses": { "200": { "description": "Success" } }
    }
  },
  "/api/ai/analyze-face": {
    "post": {
      "tags": ["AI FastAPI Endpoints"],
      "summary": "Analyze eye contact alignment, head pose, and candidate emotions",
      "responses": { "200": { "description": "Success" } }
    }
  },
  "/api/ai/analyze-voice": {
    "post": {
      "tags": ["AI FastAPI Endpoints"],
      "summary": "Analyze voice rate speed, vocal clarity, and filler words list",
      "responses": { "200": { "description": "Success" } }
    }
  },
  "/api/ai/generate-feedback": {
    "post": {
      "tags": ["AI FastAPI Endpoints"],
      "summary": "Create final aggregated feedback scorecard",
      "responses": { "200": { "description": "Success" } }
    }
  },
  "/api/ai/recommend-practice": {
    "post": {
      "tags": ["AI FastAPI Endpoints"],
      "summary": "Suggest targeted training areas and practice topics",
      "responses": { "200": { "description": "Success" } }
    }
  }
};

module.exports = swaggerPaths;
