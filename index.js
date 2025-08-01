const express = require('express');
require('dotenv').config();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const userRouter = require('./src/routes/userRouter');
const permission_Router = require('./src/routes/permission_Router');
const permissionDashboard_Router = require('./src/routes/permission_dashboard_Router');

// 👇 NEW: Logger, middleware
const morgan = require('morgan');
const logger = require('./src/utils/logger');
const requestId = require('./src/middleware/requestId');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();
const port = process.env.PORT || 5200;

// Database configuration
require('./src/config/db');

// Middleware configuration
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static('uploads'));
app.use('/omca_crm/api/omca_crm/exports', express.static(path.join(__dirname, 'exports')));

// Add request ID to every request
app.use(requestId);

// 👇 Winston + Morgan request logs
app.use(
  morgan(
    ':method :url :status :response-time ms - :res[content-length] ":user-agent" (reqId=:req[id])',
    {
      stream: {
        write: (msg) => logger.http(msg.trim()),
      },
    }
  )
);

// Basic route
app.get('/', (req, res) => {
  res.send('Welcome to OMCA Family');
});

// CORS headers (already handled by cors(), but leaving your code intact)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  );
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  next();
});

// Routers
app.use('/api', userRouter);
app.use('/api', permission_Router);
app.use('/api', permissionDashboard_Router);

// Catch 404
app.use((req, res) => {
  logger.warn('Route not found', {
    method: req.method,
    url: req.originalUrl,
    requestId: req.id,
  });
  res.status(404).json({ message: 'Not Found', requestId: req.id });
});

// Error handler (Winston logs it)
app.use(errorHandler);

// Process-level crash logging
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection', { reason });
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', { err });
  process.exit(1); // optional: restart by PM2
});

// Start server
app.listen(port, () => {
  logger.info(`Server is running on PORT: ${port}`);
});
