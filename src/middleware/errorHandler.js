// src/middleware/errorHandler.js
import logger from '../utils/logger.js';

export default function errorHandler(err, req, res, next) {
  logger.error('Unhandled error', {
    err,
    requestId: req.id,
    method: req.method,
    url: req.originalUrl,
    body: req.body,
    query: req.query,
  });

  if (res.headersSent) return next(err);
  res.status(500).json({ message: 'Internal Server Error', requestId: req.id });
}
