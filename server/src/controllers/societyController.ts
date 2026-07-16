import { Request, Response, NextFunction } from 'express';
import { SocietyService } from '../services/societyService.js';

const societyService = new SocietyService();

export const registerSociety = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      societyName,
      address,
      city,
      state,
      zipCode,
      adminEmail,
      adminPassword,
      adminFirstName,
      adminLastName,
      unitNumber,
      phone,
    } = req.body;

    if (!societyName || !adminEmail || !adminFirstName || !adminLastName || !unitNumber) {
      res.status(400).json({
        success: false,
        message: 'Missing required onboarding details. Ensure societyName, adminEmail, adminFirstName, adminLastName, and unitNumber are provided.',
      });
      return;
    }

    const data = await societyService.register({
      societyName,
      address,
      city,
      state,
      zipCode,
      adminEmail,
      adminPassword,
      adminFirstName,
      adminLastName,
      unitNumber,
      phone,
    });

    // Set refresh token in HTTP-only cookie
    res.cookie('refreshToken', data.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      success: true,
      message: 'Society and administrator onboarded successfully.',
      accessToken: data.accessToken,
      user: data.user,
      society: data.society,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to register society.',
    });
  }
};
