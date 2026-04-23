const crypto = require('crypto');

/**
 * Correlation ID Middleware
 * 
 * Reads 'x-correlation-id' from incoming request headers.
 * If not present, generates a new UUID.
 * Attaches it to req.correlationId and sets it on the response header.
 * 
 * This allows tracing a single request across all microservices.
 */
function correlationId(req, res, next) {
  const id = req.headers['x-correlation-id'] || crypto.randomUUID();
  req.correlationId = id;
  res.setHeader('x-correlation-id', id);
  next();
}

module.exports = { correlationId };
