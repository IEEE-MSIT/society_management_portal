import { Request, Response } from 'express';
import prisma from '../config/db.js';
import { z } from 'zod';

export const createAnnouncement = async (req: Request, res: Response) => {
  try {
    const { title, content, isPinned, resourceLinks } = req.body;
    const societyId = req.user?.societyId;
    const authorId = req.user?.userId;

    if (!societyId || !authorId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        isPinned,
        societyId,
        authorId,
        resourceLinks: {
          create: resourceLinks || [],
        },
      },
      include: {
        resourceLinks: true,
      },
    });

    res.status(201).json({
      success: true,
      data: announcement,
    });
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const getAnnouncements = async (req: Request, res: Response) => {
  try {
    const societyId = req.user?.societyId;

    if (!societyId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const announcements = await prisma.announcement.findMany({
      where: { societyId },
      include: {
        author: {
          select: {
            id: true,
            member: {
              select: {
                firstName: true,
                lastName: true,
              }
            }
          }
        },
        resourceLinks: true,
      },
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    res.status(200).json({
      success: true,
      data: announcements,
    });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const getAnnouncementById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const societyId = req.user?.societyId;

    const announcement = await prisma.announcement.findFirst({
      where: { id, societyId },
      include: {
        resourceLinks: true,
        author: {
          select: {
            id: true,
            member: {
              select: {
                firstName: true,
                lastName: true,
              }
            }
          }
        }
      },
    });

    if (!announcement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    res.status(200).json({
      success: true,
      data: announcement,
    });
  } catch (error) {
    console.error('Error fetching announcement:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const updateAnnouncement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content, isPinned, resourceLinks } = req.body;
    const societyId = req.user?.societyId;

    const existingAnnouncement = await prisma.announcement.findFirst({
      where: { id, societyId },
    });

    if (!existingAnnouncement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    const updatedAnnouncement = await prisma.$transaction(async (tx) => {
      // If resourceLinks provided, delete old and create new
      if (resourceLinks !== undefined) {
        await tx.resourceLink.deleteMany({
          where: { announcementId: id },
        });
      }

      return tx.announcement.update({
        where: { id },
        data: {
          title,
          content,
          isPinned,
          resourceLinks: resourceLinks !== undefined ? {
            create: resourceLinks,
          } : undefined,
        },
        include: {
          resourceLinks: true,
        },
      });
    });

    res.status(200).json({
      success: true,
      data: updatedAnnouncement,
    });
  } catch (error) {
    console.error('Error updating announcement:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const deleteAnnouncement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const societyId = req.user?.societyId;

    const existingAnnouncement = await prisma.announcement.findFirst({
      where: { id, societyId },
    });

    if (!existingAnnouncement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    await prisma.announcement.delete({
      where: { id },
    });

    res.status(200).json({
      success: true,
      message: 'Announcement deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const togglePinAnnouncement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const societyId = req.user?.societyId;

    const existingAnnouncement = await prisma.announcement.findFirst({
      where: { id, societyId },
    });

    if (!existingAnnouncement) {
      return res.status(404).json({ success: false, message: 'Announcement not found' });
    }

    const updatedAnnouncement = await prisma.announcement.update({
      where: { id },
      data: {
        isPinned: !existingAnnouncement.isPinned,
      },
    });

    res.status(200).json({
      success: true,
      data: updatedAnnouncement,
    });
  } catch (error) {
    console.error('Error pinning announcement:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
