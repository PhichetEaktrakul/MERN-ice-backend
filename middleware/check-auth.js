import jwt from 'jsonwebtoken';
import httpError from '../util/http-error.js';

const getTokenFromHeader = (authorizationHeader) => {
  if (!authorizationHeader) {
    throw new Error('Authorization header is missing');
  }
  const tokenParts = authorizationHeader.split(' ');
  if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
    throw new Error('Token format is incorrect');
  }
  return tokenParts[1];
};

const checkAuth = (req, res, next) => {
  if (req.method === 'OPTIONS') {
    return next();
  }

  try {
    const token = getTokenFromHeader(req.headers.authorization);
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    req.userData = { userId: decodedToken.userId };
    next();
  } catch (err) {
    return next(new httpError('Authentication failed!', 403));
  }
};

export default checkAuth;