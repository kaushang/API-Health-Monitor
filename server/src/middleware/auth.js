const { requireAuth } = require('@clerk/express');

// Middleware to protect routes and ensure the user is authenticated.
// It will verify the JWT token from the Authorization header and attach `req.auth`.
// If not authenticated, it automatically returns a 401 Unauthorized response.
const authMiddleware = requireAuth();

module.exports = authMiddleware;
