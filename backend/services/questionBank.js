// Question bank for randomized fallback when LLM services are offline
// Each category has a large pool of questions to pick from randomly

const questionBank = {
  hr: [
    "Tell me about yourself and what motivated you to pursue a career in software development.",
    "Why are you interested in this particular role and what excites you about it?",
    "How do you handle working under high-pressure environments with tight deadlines?",
    "Where do you see yourself professionally in the next 3-5 years?",
    "What is your biggest professional achievement so far and why does it matter to you?",
    "How do you prioritize your tasks when you have multiple competing deadlines?",
    "Describe your ideal work environment and team culture.",
    "What are your salary expectations for this role and how did you arrive at that number?",
    "Why are you considering leaving your current position?",
    "How do you stay motivated when working on repetitive or tedious tasks?",
    "What do you know about our company and why do you want to work here?",
    "How do you handle feedback and criticism from your peers or managers?",
    "What is one weakness you are actively working to improve?",
    "Describe a situation where you went above and beyond your job responsibilities.",
    "How do you maintain work-life balance in a demanding tech role?",
    "What professional development activities have you pursued recently?",
    "Tell me about a time you had to adapt to a major change in your workplace.",
    "How would your previous manager describe your work style?",
    "What role do you typically play in a team setting — leader, supporter, or mediator?",
    "If hired, what would your first 90 days look like in this role?"
  ],

  technical: {
    'React': [
      "Explain the difference between useEffect and useLayoutEffect and when you would use each.",
      "How does React's reconciliation algorithm work and what role do keys play in lists?",
      "What are the trade-offs between using Context API versus Redux for state management?",
      "Explain React.memo, useMemo, and useCallback. When should you avoid them?",
      "How would you implement code splitting and lazy loading in a React application?",
      "What is the purpose of React Suspense and how does it work with data fetching?",
      "Explain the virtual DOM diffing process and how React batches state updates.",
      "How do you handle error boundaries in React and what lifecycle methods are involved?",
      "What are controlled vs uncontrolled components? When would you prefer one over the other?",
      "How would you optimize a React component that re-renders thousands of list items?",
      "Explain the React Fiber architecture and how it enables concurrent rendering.",
      "How do you manage side effects cleanup in React hooks to prevent memory leaks?",
      "What is the difference between server components and client components in React?",
      "How would you implement infinite scrolling with virtualization in React?",
      "Explain how React portals work and provide a real-world use case."
    ],
    'JavaScript': [
      "Explain the event loop in JavaScript and how microtasks differ from macrotasks.",
      "What is the difference between var, let, and const in terms of hoisting and scope?",
      "How do closures work in JavaScript and what are common use cases for them?",
      "Explain prototypal inheritance and how it differs from classical inheritance.",
      "What are generators and iterators in JavaScript? Provide a practical use case.",
      "How does the 'this' keyword behave differently in arrow functions vs regular functions?",
      "Explain WeakMap and WeakSet — when and why would you use them over Map and Set?",
      "What are Proxy and Reflect in JavaScript and how can they be used for meta-programming?",
      "How do you handle deep cloning of objects that contain circular references?",
      "Explain the difference between Promise.all, Promise.allSettled, Promise.race, and Promise.any.",
      "What is debouncing vs throttling and when would you apply each technique?",
      "How does JavaScript handle memory management and garbage collection?",
      "Explain optional chaining and nullish coalescing operators with real-world examples.",
      "What are Tagged Template Literals and how can they be used for DSL creation?",
      "How would you implement a custom iterable object in JavaScript?"
    ],
    'Node.js': [
      "How does the Node.js event loop differ from the browser's event loop?",
      "Explain the difference between worker threads and child processes in Node.js.",
      "How would you handle uncaught exceptions and unhandled promise rejections in production?",
      "What is the purpose of the cluster module and how does it improve performance?",
      "Explain streams in Node.js — what are the four types and when would you use each?",
      "How do you prevent memory leaks in a long-running Node.js server?",
      "What is middleware chaining in Express and how does next() propagate errors?",
      "How would you implement rate limiting in a Node.js API without external libraries?",
      "Explain the differences between CommonJS require() and ES Module import.",
      "How do you securely manage environment variables and secrets in a Node.js app?",
      "What are buffer objects in Node.js and when would you use them over strings?",
      "How would you implement a job queue with retry logic in Node.js?",
      "Explain how connection pooling works for database connections in Node.js.",
      "What strategies would you use to scale a Node.js application horizontally?",
      "How do you implement graceful shutdown in a Node.js server?"
    ],
    'Laravel': [
      "Explain the Laravel service container and how dependency injection works.",
      "How do Eloquent relationships handle eager loading vs lazy loading?",
      "What is the difference between Laravel queues and events? When would you use each?",
      "How does Laravel's middleware pipeline process incoming HTTP requests?",
      "Explain the repository pattern and how you would implement it in Laravel.",
      "How do Laravel migrations handle rollbacks and what are the best practices?",
      "What is the purpose of Laravel Sanctum vs Passport for API authentication?",
      "How would you optimize a slow Eloquent query that joins multiple tables?",
      "Explain how Laravel's task scheduling works under the hood.",
      "What are Laravel policies and gates? How do they differ in authorization logic?",
      "How do you implement multi-tenancy in a Laravel application?",
      "Explain the observer pattern in Laravel and provide a practical example.",
      "How would you handle database transactions with nested savepoints in Laravel?",
      "What caching strategies does Laravel support and how do you invalidate cached data?",
      "How do you implement API versioning in a Laravel application?"
    ],
    'Python': [
      "Explain the Global Interpreter Lock (GIL) and how it affects multi-threading.",
      "What are decorators in Python and how do they work under the hood?",
      "How does Python's garbage collector handle reference cycles?",
      "Explain the difference between asyncio, threading, and multiprocessing in Python.",
      "What are metaclasses in Python and when would you use them?",
      "How would you implement a custom context manager using __enter__ and __exit__?",
      "Explain list comprehensions vs generator expressions — when would you prefer one?",
      "How does FastAPI's dependency injection system work compared to Flask?",
      "What are dataclasses and how do they differ from named tuples?",
      "How would you optimize a Python script that processes a 10GB CSV file?"
    ],
    'MySQL': [
      "Explain the difference between InnoDB and MyISAM storage engines.",
      "How do composite indexes work and what is the leftmost prefix rule?",
      "What is a covering index and how does it eliminate table lookups?",
      "Explain the difference between INNER JOIN, LEFT JOIN, RIGHT JOIN, and CROSS JOIN.",
      "How do you optimize a slow SQL query — walk me through your diagnostic process.",
      "What is a deadlock in MySQL and how would you detect and resolve it?",
      "Explain transaction isolation levels — READ UNCOMMITTED through SERIALIZABLE.",
      "How does MySQL's query optimizer decide which index to use?",
      "What are window functions in MySQL and provide a practical use case.",
      "How would you design a database schema for a multi-tenant SaaS application?"
    ],
    'CSS': [
      "Explain the CSS box model and how border-box differs from content-box.",
      "How does CSS specificity work and how do you resolve specificity conflicts?",
      "What is the difference between Flexbox and CSS Grid? When would you use each?",
      "How do CSS custom properties (variables) work and what are their scoping rules?",
      "Explain the CSS cascade and how the browser resolves conflicting declarations.",
      "How would you implement a responsive layout that works from mobile to 4K screens?",
      "How do CSS animations differ from CSS transitions in terms of performance?",
      "Explain the contain property and how it can improve rendering performance."
    ],
    'Firebase': [
      "Explain the differences between Firestore and Realtime Database.",
      "How do Firestore security rules work and what are common security pitfalls?",
      "What is the difference between Firebase Auth custom claims and Firestore roles?",
      "How would you structure Firestore data to minimize read costs in a chat app?",
      "Explain Firebase Cloud Functions triggers and how they handle cold starts.",
      "How do you implement offline persistence with Firestore?"
    ],
    'default': [
      "Explain the principles of clean code and how you apply them in your daily work.",
      "What is the difference between monolithic and microservices architectures?",
      "How do you approach debugging a production issue that you cannot reproduce locally?",
      "Explain RESTful API design principles and how they differ from GraphQL.",
      "What is CI/CD and how would you set up a deployment pipeline for a web application?",
      "How do you handle API versioning and backward compatibility?",
      "Explain the SOLID principles with practical examples from your experience.",
      "What is technical debt and how do you decide when to address it?",
      "How would you design a scalable notification system for a million users?",
      "Explain the CAP theorem and how it applies to distributed systems.",
      "What are design patterns you use most frequently and why?",
      "How do you approach performance testing and what tools do you use?",
      "Explain the difference between horizontal and vertical scaling.",
      "How do you handle data migrations in a zero-downtime deployment?",
      "What security best practices do you follow when building web APIs?"
    ]
  },

  project: [
    "Walk me through the system architecture of your most complex project. What were the key design decisions?",
    "What was the most difficult technical challenge you faced in a project and how did you solve it?",
    "How did you decide on the tech stack for your project? What alternatives did you consider?",
    "Describe a time when you had to refactor a significant portion of a project. What triggered it?",
    "How did you handle scalability concerns in your project as the user base grew?",
    "What testing strategies did you implement in your project and how did they catch real bugs?",
    "How did you manage deployment and CI/CD for your project?",
    "Tell me about a feature you built that you're particularly proud of. Why?",
    "How did you handle database design and data modeling in your project?",
    "What would you do differently if you had to rebuild your project from scratch?",
    "How did you handle authentication and authorization in your project?",
    "Describe how you optimized the performance of a slow feature in your project.",
    "How did you handle error logging and monitoring in your production project?",
    "What API design choices did you make and how did they affect client integration?",
    "How did you manage state across different components or services in your project?",
    "Describe a time when a production deployment went wrong. How did you recover?",
    "How did you handle third-party API integrations and their reliability in your project?",
    "What accessibility considerations did you implement in your project?",
    "How did you collaborate with designers or non-technical stakeholders on your project?",
    "What security measures did you implement to protect user data in your project?"
  ],

  behavioral: [
    "Describe a time you had a significant disagreement with a team member about a technical approach. How did you resolve it?",
    "Tell me about a time you failed to meet a deadline. How did you communicate it and what did you learn?",
    "Give an example of when you had to quickly learn a new technology to complete a project.",
    "Describe a situation where you had to mentor or help a junior developer improve their skills.",
    "Tell me about a time you identified a critical bug in production. What was your immediate response?",
    "How have you handled a situation where requirements changed significantly mid-project?",
    "Describe a time you had to push back on a stakeholder's request. What was your reasoning?",
    "Tell me about a time you took ownership of a problem that wasn't your responsibility.",
    "Give an example of when you improved a process or workflow that benefited your entire team.",
    "Describe a time when you had to make a difficult decision with incomplete information.",
    "Tell me about a time you received harsh feedback. How did you process it and what changed?",
    "Describe a situation where you had to balance code quality with delivery speed.",
    "Tell me about a time you successfully convinced your team to adopt a new tool or technology.",
    "Give an example of how you handled a situation with conflicting priorities from different managers.",
    "Describe a time you underestimated the complexity of a task. What happened and what did you learn?",
    "Tell me about your approach to code reviews — both giving and receiving feedback.",
    "Describe a situation where you had to work with a difficult colleague. How did you handle it?",
    "Tell me about a time you automated a tedious manual process. What was the impact?",
    "Give an example of when you had to present technical information to a non-technical audience.",
    "Describe a time when you had to make a trade-off between two equally valid technical solutions."
  ]
};

/**
 * Randomly picks `count` unique items from an array using Fisher-Yates shuffle.
 */
const pickRandom = (arr, count) => {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
};

/**
 * Gets technical questions tailored to the candidate's skills.
 * Pulls from skill-specific pools when available, falls back to default pool.
 */
const getTechnicalFallback = (skills = [], count = 3) => {
  const pool = [];
  const skillsList = Array.isArray(skills) ? skills : String(skills).split(',').map(s => s.trim());
  
  for (const skill of skillsList) {
    const key = Object.keys(questionBank.technical).find(
      k => k.toLowerCase() === skill.toLowerCase() || 
           skill.toLowerCase().includes(k.toLowerCase()) ||
           k.toLowerCase().includes(skill.toLowerCase())
    );
    if (key) {
      pool.push(...questionBank.technical[key]);
    }
  }

  // If no skill-specific questions matched, use the default pool
  if (pool.length === 0) {
    pool.push(...questionBank.technical['default']);
  }

  return pickRandom(pool, count);
};

/**
 * Builds a complete randomized fallback question set for structured generation.
 */
const getStructuredFallback = (skills = [], projects = []) => {
  return {
    hr: pickRandom(questionBank.hr, 3),
    technical: getTechnicalFallback(skills, 3),
    project: pickRandom(questionBank.project, 2),
    behavioral: pickRandom(questionBank.behavioral, 2)
  };
};

/**
 * Builds a flat randomized fallback question list for legacy generation.
 */
const getFlatFallback = (skills = [], count = 3) => {
  const techQs = getTechnicalFallback(skills, Math.ceil(count / 2));
  const behavQs = pickRandom(questionBank.behavioral, Math.floor(count / 2));
  return [...techQs, ...behavQs].slice(0, count);
};

module.exports = {
  questionBank,
  pickRandom,
  getTechnicalFallback,
  getStructuredFallback,
  getFlatFallback
};
