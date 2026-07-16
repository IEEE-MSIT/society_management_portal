import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import { BookingService } from '../services/bookingService.js';

const bookingService = new BookingService();

export const createFacility = async (
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

    const { name, description, costPerHour } = req.body;
    if (!name) {
      res.status(400).json({ success: false, message: 'Facility name is required.' });
      return;
    }

    const facility = await bookingService.createFacility(
      societyId,
      name,
      description,
      costPerHour ? parseFloat(costPerHour.toString()) : 0.0
    );

    res.status(201).json({
      success: true,
      message: 'Facility created successfully.',
      data: facility,
    });
  } catch (error) {
    next(error);
  }
};

export const getFacilities = async (
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

    const facilities = await bookingService.getFacilities(societyId);

    res.status(200).json({
      success: true,
      facilities,
    });
  } catch (error) {
    next(error);
  }
};

export const bookFacility = async (
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

    const { facilityId, startTime, endTime } = req.body;
    if (!facilityId || !startTime || !endTime) {
      res.status(400).json({
        success: false,
        message: 'Facility ID, startTime, and endTime are required.',
      });
      return;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    const booking = await bookingService.bookFacility(societyId, facilityId, start, end);

    res.status(201).json({
      success: true,
      message: 'Facility booked successfully.',
      data: booking,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to book facility.',
    });
  }
};

export const getBookings = async (
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

    const bookings = await bookingService.getBookings(societyId);

    res.status(200).json({
      success: true,
      bookings,
    });
  } catch (error) {
    next(error);
  }
};

export const cancelBooking = async (
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
    const result = await bookingService.cancelBooking(id, societyId);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};
