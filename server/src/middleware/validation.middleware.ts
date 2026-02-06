import { body, ContextRunner, param, query, Result, validationResult, ValidationError } from 'express-validator';
import { AppError } from './error.middleware.ts';
import { NextFunction, Request, Response } from 'express';

export const validate = (validations: ContextRunner[]) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        // Run all validations
        await Promise.all(validations.map(validation => validation.run(req)));

        const errors: Result<ValidationError>= validationResult(req);
        if (errors.isEmpty()) {
            return next();
        }

        const extractedErrors = errors.array().map(err => {
            if (err.type === 'field') {
                return {
                    field: err.path,
                    message: err.msg
                };
            }
        })
       return {field: "unknown", message: "Validation error"};

       
    };
};

// Common validation chains
export const commonValidations = {
    pagination: [
        query('page')
            .optional()
            .isInt({ min: 1 })
            .withMessage('Page must be a positive integer'),
        query('limit')
            .optional()
            .isInt({ min: 1, max: 100 })
            .withMessage('Limit must be between 1 and 100')
    ],
    
    objectId: (field: string | string[] | undefined) => 
        param(field)
            .isMongoId()
            .withMessage(`Invalid ${field} ID format`),

    email: 
        body('email')
            .isEmail()
            .normalizeEmail()
            .withMessage('Please provide a valid email'),

    password: 
        body('password')
            .isLength({ min: 8 })
            .withMessage('Password must be at least 8 characters long')
            .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/)
            .withMessage('Password must contain at least one number, one uppercase letter, one lowercase letter, and one special character'),

    name:
        body('name')
            .trim()
            .isLength({ min: 2, max: 50 })
            .withMessage('Name must be between 2 and 50 characters')
            .matches(/^[a-zA-Z\s]*$/)
            .withMessage('Name can only contain letters and spaces'),

    price:
        body('price')
            .isFloat({ min: 0 })
            .withMessage('Price must be a positive number'),

    url:
        body('url')
            .isURL()
            .withMessage('Please provide a valid URL')
};

// User validation chains
export const validateSignup = validate([
    commonValidations.name,
    commonValidations.email,
    commonValidations.password
]);

export const validateSignin = validate([
    commonValidations.email,
    body('password')
        .notEmpty()
        .withMessage('Password is required')
]);

export const validatePasswordChange = validate([
    body('currentPassword')
        .notEmpty()
        .withMessage('Current password is required'),
    body('newPassword')
        .notEmpty()
        .withMessage('New password is required')
        .custom((value, { req }) => {
            if (value === req.body.currentPassword) {
                throw new Error('New password must be different from current password');
            }
            return true;
        })
        .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])/)
        .withMessage('Password must contain at least one number, one uppercase letter, one lowercase letter, and one special character')
]);
