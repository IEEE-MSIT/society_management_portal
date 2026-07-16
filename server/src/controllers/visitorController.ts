import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import { VisitorService } from '../services/visitorService.js';

const visitorService = new VisitorService();

export const preRegisterVisitor = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const societyId = req.user?.societyId;
    if (!societyId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { name, phone, purpose } = req.body;
    if (!name || !phone || !purpose) {
      res.status(400).json({
        success: false,
        message: 'Name, phone, and purpose of visit are required.',
      });
      return;
    }

    const visitor = await visitorService.preRegister(societyId, name, phone, purpose);

    res.status(201).json({
      success: true,
      message: 'Visitor pre-registered successfully. QR/OTP gate pass generated.',
      visitor,
    });
  } catch (error) {
    next(error);
  }
};

export const verifyVisitorEntry = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const societyId = req.user?.societyId;
    if (!societyId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { otpCode } = req.body;
    if (!otpCode) {
      res.status(400).json({ success: false, message: 'OTP code is required for gate entry.' });
      return;
    }

    const result = await visitorService.verifyEntry(societyId, otpCode);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to verify entry.',
    });
  }
};

export const verifyVisitorExit = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const societyId = req.user?.societyId;
    if (!societyId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    if (!id) {
      res.status(400).json({ success: false, message: 'Visitor ID is required.' });
      return;
    }

    const result = await visitorService.verifyExit(societyId, id);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to verify exit.',
    });
  }
};

export const getVisitors = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const societyId = req.user?.societyId;
    if (!societyId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const visitors = await visitorService.getVisitors(societyId);

    res.status(200).json({
      success: true,
      visitors,
    });
  } catch (error) {
    next(error);
  }
};

export const cancelVisitorPass = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const societyId = req.user?.societyId;
    if (!societyId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    if (!id) {
      res.status(400).json({ success: false, message: 'Visitor pass ID is required.' });
      return;
    }

    const result = await visitorService.cancelPass(societyId, id);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to cancel visitor pass.',
    });
  }
};
