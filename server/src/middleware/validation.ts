import expressValidator from 'express-validator';
const { body, validationResult } = (expressValidator as any);
import { Request, Response, NextFunction } from 'express';

export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  return res.status(400).json({ 
    success: false, 
    errors: errors.array().map((err: any) => ({ field: err.path, message: err.msg })) 
  });
};

export const registerValidation = [
  body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('name').trim().notEmpty().withMessage('Name is required').escape(),
  body('role').isIn(['entrepreneur', 'investor']).withMessage('Invalid role'),
];

export const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

export const paymentValidation = [
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('description').optional().trim().escape(),
];

export const transferValidation = [
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('recipientEmail').isEmail().withMessage('Please provide a valid recipient email').normalizeEmail(),
  body('description').optional().trim().escape(),
];
