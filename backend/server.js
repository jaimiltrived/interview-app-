const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const { connectDB } = require('./config/db');
const apiRoutes = require('./routes/api');
const swaggerPaths = require('./config/swaggerPaths');
const errorHandler = require('./middleware/errorHandler');

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
app.use(cors({
  origin: '*', // Allow all origins for local development simplicity
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' })); // Expand payload limits in case of large resume texts
app.use(express.urlencoded({ extended: true }));

// Test Route
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'AI Interview Coach Server is running healthy' });
});

// Swagger API Docs Route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API Routes prefix
app.use('/api', apiRoutes);

// Global Error Handler Middleware
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`================================================================`);
  console.log(` AI Interview Coach Server started successfully!`);
  console.log(` Running on port: ${PORT}`);
  console.log(` Health check URL: http://localhost:${PORT}/health`);
  console.log(` API Documentation: http://localhost:${PORT}/api-docs`);
  console.log(` API endpoints prefix: http://localhost:${PORT}/api`);
  console.log(`================================================================`);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error occurred' });
});
