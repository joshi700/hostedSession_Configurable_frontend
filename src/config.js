// API Configuration for Frontend
// This allows switching between development and production automatically

const config = {
  // API Base URL - uses environment variable or falls back to localhost
  API_URL: process.env.REACT_APP_API_URL || 'http://localhost:3001',
  
  // Environment flags
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  
  // API Endpoints (optional - for consistency)
  endpoints: {
    createSession: '/create-session',
    initiateAuth: '/api/initiate-authentication',
    authenticatePayer: '/api/authenticate-payer',
    authorizePay: '/api/authorize-pay',
    retrieveTransaction: '/retrieve-transaction',
    health: '/health'
  }
};

// Log configuration in development mode
if (config.isDevelopment) {
  console.log('🔧 API Configuration:', {
    API_URL: config.API_URL,
    Environment: process.env.NODE_ENV
  });
}

export default config;
