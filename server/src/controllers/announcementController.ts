import { Request, Response } from 'express';
import prisma from '../config/db.js';

export const createAnnouncement = async (req: Request, res: Response) => {
  try {
    const { title, content, isPinned } = req.body;
    const societyId = req.user?.societyId;

    if (!societyId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const notice = await prisma.notice.create({
      data: {
        title,
        content,
        isPinned: isPinned || false,
        societyId,
      },
    });

    res.status(201).json({
      success: true,
      data: notice,
    });
  } catch (error) {
    console.error('Error creating notice:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const getAnnouncements = async (req: Request, res: Response) => {
  try {
    const societyId = req.user?.societyId;

    if (!societyId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const notices = await prisma.notice.findMany({
      where: { societyId },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    res.status(200).json({
      success: true,
      data: notices,
    });
  } catch (error) {
    console.error('Error fetching notices:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const getAnnouncementById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const societyId = req.user?.societyId;

    if (!societyId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const notice = await prisma.notice.findFirst({
      where: { id, societyId },
    });

    if (!notice) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    res.status(200).json({
      success: true,
      data: notice,
    });
  } catch (error) {
    console.error('Error fetching notice:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const updateAnnouncement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content, isPinned } = req.body;
    const societyId = req.user?.societyId;

    const existingNotice = await prisma.notice.findFirst({
      where: { id, societyId },
    });

    if (!existingNotice) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    const updatedNotice = await prisma.notice.update({
      where: { id },
      data: {
        title,
        content,
        isPinned,
      },
    });

    res.status(200).json({
      success: true,
      data: updatedNotice,
    });
  } catch (error) {
    console.error('Error updating notice:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const deleteAnnouncement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const societyId = req.user?.societyId;

    const existingNotice = await prisma.notice.findFirst({
      where: { id, societyId },
    });

    if (!existingNotice) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    await prisma.notice.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: 'Announcement deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting notice:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const togglePinAnnouncement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const societyId = req.user?.societyId;

    const existingNotice = await prisma.notice.findFirst({
      where: { id, societyId },
    });

    if (!existingNotice) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    const updatedNotice = await prisma.notice.update({
      where: { id },
      data: {
        isPinned: !existingNotice.isPinned,
      },
    });

    res.status(200).json({
      success: true,
      data: updatedNotice,
    });
  } catch (error) {
    console.error('Error pinning notice:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
