import { body, param, query, validationResult } from 'express-validator';

// Handle validation errors
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// Auth validators
export const signupValidator = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores')
    .toLowerCase(),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('displayName')
    .trim()
    .notEmpty().withMessage('Display name is required')
    .isLength({ max: 50 }).withMessage('Display name cannot exceed 50 characters'),
  body('role')
    .optional()
    .isIn(['consumer', 'creator']).withMessage('Role must be consumer or creator'),
  handleValidationErrors
];

export const loginValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required'),
  handleValidationErrors
];

// User validators
export const updateProfileValidator = [
  body('displayName')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Display name cannot exceed 50 characters'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 150 }).withMessage('Bio cannot exceed 150 characters'),
  body('website')
    .optional()
    .trim()
    .isURL().withMessage('Please enter a valid URL'),
  body('isPrivate')
    .optional()
    .isBoolean().withMessage('isPrivate must be a boolean'),
  handleValidationErrors
];

export const usernameValidator = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters')
    .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores')
    .toLowerCase(),
  handleValidationErrors
];

// Post validators
export const createPostValidator = [
  body('caption')
    .optional()
    .trim()
    .isLength({ max: 2200 }).withMessage('Caption cannot exceed 2200 characters'),
  body('location')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Location cannot exceed 100 characters'),
  handleValidationErrors
];

export const commentValidator = [
  body('text')
    .trim()
    .notEmpty().withMessage('Comment text is required')
    .isLength({ max: 500 }).withMessage('Comment cannot exceed 500 characters'),
  handleValidationErrors
];

// Message validators
export const messageValidator = [
  body('text')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Message cannot exceed 1000 characters'),
  handleValidationErrors
];

// Param validators
export const mongoIdValidator = (paramName = 'id') => [
  param(paramName)
    .isMongoId().withMessage('Invalid ID format'),
  handleValidationErrors
];

// Query validators
export const paginationValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  handleValidationErrors
];

export const searchValidator = [
  query('q')
    .trim()
    .notEmpty().withMessage('Search query is required')
    .isLength({ min: 1, max: 100 }).withMessage('Search query must be 1-100 characters'),
  handleValidationErrors
];

export default {
  handleValidationErrors,
  signupValidator,
  loginValidator,
  updateProfileValidator,
  usernameValidator,
  createPostValidator,
  commentValidator,
  messageValidator,
  mongoIdValidator,
  paginationValidator,
  searchValidator
};
