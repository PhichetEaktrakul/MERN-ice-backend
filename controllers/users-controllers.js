import { validationResult } from 'express-validator'; // For input validation
import bcrypt from 'bcryptjs'; // For hashing passwords
import jwt from 'jsonwebtoken'; // For creating JWT tokens
import httpError from '../util/http-error.js'; // Custom error handling
import User from '../models/user.js'; // User model for database interaction

// ---------------- Handler to fetch all users ----------------
const getUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, '-password');
  } catch (err) {
    return next(
      new httpError('Fetching users failed, please try again later.', 500)
    );
  }

  res.json({ users: users.map(user => user.toObject({ getters: true })) });
};

// ---------------- Handler for user signup ----------------
const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new httpError('Invalid inputs passed, please check your data.', 422)
    );
  }

  const { name, email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email });
  } catch (err) {
    return next(
      new httpError('Signing up failed, please try again later.', 500)
    );
  }

  if (existingUser) {
    return next(
      new httpError('User exists already, please login instead.', 422)
    );
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    return next(
      new httpError('Could not create user, please try again.', 500)
    );
  }

  const createdUser = new User({
    name,
    email,
    password: hashedPassword,
    image: 'https://www.google.com/url?sa=i&url=https%3A%2F%2Funsplash.com%2Fs%2Fphotos%2Fimage&psig=AOvVaw3BtqoZKbLX64BME82ADQNt&ust=1744097051296000&source=images&cd=vfe&opi=89978449&ved=0CBEQjRxqFwoTCND72vuxxYwDFQAAAAAdAAAAABAE',
    places: []
  });

  try {
    await createdUser.save();
  } catch (err) {
    return next(
      new httpError('Signing up failed, please try again later.', 500)
    );
  }

  let token;
  try {
    token = jwt.sign(
      { userId: createdUser.id, email: createdUser.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  } catch (err) {
    return next(
      new httpError('Signing up failed, please try again later.', 500)
    );
  }

  res.status(201).json({
    userId: createdUser.id,
    email: createdUser.email,
    token
  });
};

// ---------------- Handler for user login ----------------
const login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;

  try {
    existingUser = await User.findOne({ email });
  } catch (err) {
    return next(
      new httpError('Logging in failed, please try again later.', 500)
    );
  }

  if (!existingUser) {
    return next(
      new httpError('Invalid credentials, could not log you in.', 403)
    );
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    return next(
      new httpError('Could not log you in, please check your credentials and try again.', 500)
    );
  }

  if (!isValidPassword) {
    return next(
      new httpError('Invalid credentials, could not log you in.', 403)
    );
  }

  let token;
  try {
    token = jwt.sign(
      { userId: existingUser.id, email: existingUser.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  } catch (err) {
    return next(
      new httpError('Logging in failed, please try again later.', 500)
    );
  }

  res.json({
    userId: existingUser.id,
    email: existingUser.email,
    token
  });
};

// Export handlers
const usersController = {
  getUsers,
  signup,
  login
};
export default usersController;