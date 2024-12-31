// errorHandling.js

import { logError } from './logging.js'; // Assuming you have a separate logging file

// Custom error class for API-related issues
class APIError extends Error {
  constructor(message, statusCode, quotaExceeded = false) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.quotaExceeded = quotaExceeded;
  }
}

// Centralized error handling with detailed logging
function handleError(error, message) {
  if (
    error.response &&
    error.response.data &&
    error.response.data.error.code === 403 &&
    error.response.data.error.errors[0].reason === 'quotaExceeded'
  ) {
    logError(
      'Quota exceeded. You have exceeded the daily API quota limit during',
      message,
    );
    throw new APIError('Quota exceeded', 403, true);
  } else {
    if (error.response) {
      logError(`Response Data: ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      logError(`Request made but no response received`);
    } else {
      logError(`Error Type: ${error.name}`);
    }
    logError(message + ' : ', error.message);
    throw new APIError(message, error.response?.status || 500);
  }
}

export { APIError, handleError };
