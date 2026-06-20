/**
 * Utility functions for handling API errors consistently
 */

/**
 * Extract meaningful error message from API response
 * @param {Error} error - The error from axios
 * @param {string} defaultMessage - Default message if extraction fails
 * @returns {string} - Error message to display to user
 */
export const getErrorMessage = (error, defaultMessage = "An error occurred") => {
  // Check various error response formats
  if (error?.response?.data?.detail) {
    return error.response.data.detail;
  }
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (error?.response?.data?.errors?.[0]?.message) {
    return error.response.data.errors[0].message;
  }
  if (error?.response?.data?.errors?.[0]) {
    return error.response.data.errors[0];
  }
  if (error?.message) {
    return error.message;
  }
  return defaultMessage;
};

/**
 * Check if error is a network/connection error
 * @param {Error} error 
 * @returns {boolean}
 */
export const isNetworkError = (error) => {
  return !error?.response && (error?.message === "Network Error" || error?.code === "ECONNABORTED");
};

/**
 * Check if error is a validation error (400)
 * @param {Error} error 
 * @returns {boolean}
 */
export const isValidationError = (error) => {
  return error?.response?.status === 400;
};

/**
 * Check if error is unauthorized (401)
 * @param {Error} error 
 * @returns {boolean}
 */
export const isUnauthorized = (error) => {
  return error?.response?.status === 401;
};

/**
 * Check if error is forbidden (403)
 * @param {Error} error 
 * @returns {boolean}
 */
export const isForbidden = (error) => {
  return error?.response?.status === 403;
};

/**
 * Check if error is not found (404)
 * @param {Error} error 
 * @returns {boolean}
 */
export const isNotFound = (error) => {
  return error?.response?.status === 404;
};

/**
 * Check if error is server error (5xx)
 * @param {Error} error 
 * @returns {boolean}
 */
export const isServerError = (error) => {
  return error?.response?.status >= 500;
};

/**
 * Get all validation errors from response
 * @param {Error} error 
 * @returns {Array} - Array of error messages
 */
export const getValidationErrors = (error) => {
  if (error?.response?.data?.errors && Array.isArray(error.response.data.errors)) {
    return error.response.data.errors.map(e => typeof e === 'string' ? e : e.message);
  }
  return [];
};
