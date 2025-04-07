function httpError(message, statusCode) {
  const error = new Error(message);
  error.code = statusCode || 500;
  return error;
}

export default httpError;