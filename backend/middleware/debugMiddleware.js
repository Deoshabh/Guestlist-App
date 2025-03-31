/**
 * Debug middleware to log API requests and responses
 * Helps identify issues with malformed responses or missing functions
 */

const debugMiddleware = (req, res, next) => {
  // Skip logging for health checks and static assets
  if (req.path.includes('/health') || req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico)$/)) {
    return next();
  }

  const start = Date.now();
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Request body:', JSON.stringify(req.body).substring(0, 200) + 
      (JSON.stringify(req.body).length > 200 ? '...' : ''));
  }

  // Capture and log the response
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] Response ${res.statusCode} - ${duration}ms ${req.method} ${req.originalUrl}`);
    
    // Check for potentially problematic responses that might cause frontend errors
    if (data && typeof data === 'string' && data.length < 5) {
      console.warn(`Warning: Suspiciously short response for ${req.originalUrl}:`, data);
    }
    
    return originalSend.call(this, data);
  };

  next();
};

module.exports = debugMiddleware;
