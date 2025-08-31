// Authentication middleware for API endpoints
export function validateApiKey(req) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      isValid: false,
      error: {
        status: 401,
        message: 'Missing or invalid Authorization header. Expected: Bearer <API_KEY>'
      }
    };
  }
  
  const apiKey = authHeader.substring(7); // Remove 'Bearer ' prefix
  const validApiKey = process.env.API_KEY;
  
  if (!validApiKey) {
    return {
      isValid: false,
      error: {
        status: 500,
        message: 'Server configuration error: API key not configured'
      }
    };
  }
  
  if (apiKey !== validApiKey) {
    return {
      isValid: false,
      error: {
        status: 401,
        message: 'Invalid API key'
      }
    };
  }
  
  return { isValid: true };
}

export function createResponse(status, data, message = null) {
  return {
    status,
    message: message || (status >= 400 ? 'Error' : 'Success'),
    data: data || null,
    timestamp: new Date().toISOString()
  };
}

export function handleError(error) {
  console.error('API Error:', error);
  
  if (error.status) {
    return error;
  }
  
  return {
    status: 500,
    message: 'Internal server error',
    data: null,
    timestamp: new Date().toISOString()
  };
}