import { Request, Response, NextFunction } from 'express';

export const checkPermission = (requiredPermission: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized. Authentication required.',
      });
      return;
    }

    const { roleName, permissions } = req.user;

    // Core Admin bypasses all checks (super admin privilege)
    if (roleName === 'Core Admin') {
      next();
      return;
    }

    // Check if the user has the required permission or wildcard
    if (permissions.includes('*') || permissions.includes(requiredPermission)) {
      next();
      return;
    }

    res.status(403).json({
      success: false,
      message: 'Forbidden. You do not have permission to perform this action.',
    });
  };
};
