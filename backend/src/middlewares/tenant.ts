import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.js';

/**
 * Middleware to enforce that a tenant context is established.
 * Assumes the request has already passed through the authenticate middleware.
 */
export const requireTenant = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const societyId = req.user?.societyId;

  if (!societyId) {
    res.status(403).json({
      success: false,
      message: 'Access Forbidden: Tenant identification missing.',
    });
    return;
  }

  next();
};
