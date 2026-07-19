import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import { ComplaintService } from '../services/complaintService.js';

const complaintService = new ComplaintService();

export const createComplaint = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { title, description } = req.body;
    const user = req.user;

    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const complaint = await complaintService.createComplaint({
      societyId: user.societyId,
      creatorId: user.userId,
      title,
      description,
    });

    res.status(201).json({
      success: true,
      message: 'Complaint submitted and analyzed by AI successfully.',
      complaint,
    });
  } catch (error) {
    next(error);
  }
};

export const getComplaints = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { category, priority, status } = req.query;

    const complaints = await complaintService.listComplaints(user.societyId, {
      category: category as string,
      priority: priority as string,
      status: status as string,
    });

    // Map creator details into a member object for frontend compatibility
    const formattedComplaints = complaints.map((c: any) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      category: c.category,
      priority: c.priority,
      status: c.status,
      createdAt: c.createdAt,
      member: {
        firstName: c.creator?.member?.firstName || 'Resident',
        lastName: c.creator?.member?.lastName || '',
      },
    }));

    res.status(200).json({
      success: true,
      complaints: formattedComplaints,
    });
  } catch (error) {
    next(error);
  }
};

export const updateComplaintStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const user = req.user;

    if (!user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    // Verify the complaint belongs to this society
    const complaint = await complaintService.getComplaint(id, user.societyId);
    if (!complaint) {
      res.status(404).json({ success: false, message: 'Complaint not found.' });
      return;
    }

    const updated = await complaintService.updateComplaintStatus(id, user.societyId, status);

    res.status(200).json({
      success: true,
      message: 'Complaint status updated successfully.',
      complaint: updated,
    });
  } catch (error) {
    next(error);
  }
};
