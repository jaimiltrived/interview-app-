const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const { connectDB } = require('./config/db');
const apiRoutes = require('./routes/api');
const resumeRoutes = require('./routes/resume');
const interviewRoutes = require('./routes/interview');
const swaggerPaths = require('./config/swaggerPaths');
const errorHandler = require('./middleware/errorHandler');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Swagger Configuration Setup
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AI Interview Coach API Documentation',
      version: '1.0.0',
      description: 'Interactive API documentation details for candidates profile matching, resume parses, interview room metrics scoring, and practice logs.'
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development local server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    paths: swaggerPaths
  },
  apis: [] // Disable file scanning so only our unified 95 paths list is displayed cleanly
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Connect to Database
connectDB();

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/login', authLimiter);
app.use('/api/register', authLimiter);
app.use('/api/admin-login', authLimiter);
app.use(express.json({ limit: '10mb' })); // Expand payload limits in case of large resume texts
app.use(express.urlencoded({ extended: true }));

// Test Route
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'AI Interview Coach Server is running healthy' });
});

// Swagger API Docs Route (Only in development)
if (process.env.NODE_ENV === 'development') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

// API Routes prefix
// Mount specific modules first to prevent wildcard parameter interception (e.g. /resume/:id in apiRoutes)
app.use('/api', resumeRoutes);
app.use('/api', interviewRoutes);
app.use('/api', apiRoutes);

// Global Error Handler Middleware
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`================================================================`);
  console.log(` AI Interview Coach Server started successfully!`);
  console.log(` Running on port: ${PORT}`);
  console.log(` Health check URL: http://localhost:${PORT}/health`);
  if (process.env.NODE_ENV === 'development') {
    console.log(` API Documentation: http://localhost:${PORT}/api-docs`);
  }
  console.log(` API endpoints prefix: http://localhost:${PORT}/api`);
  console.log(`================================================================`);
});

// Global unhandled promise rejection / uncaught exception handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Ideally gracefully shutdown here
});
