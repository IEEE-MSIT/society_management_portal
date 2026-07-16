import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import { CollaborationService } from '../services/collaborationService.js';
import { AIHubService } from '../services/aiHubService.js';
import prisma from '../config/db.js';

const collabService = new CollaborationService();
const aiHubService = new AIHubService();

// ==========================================
// 1. Projects & Kanban Task controllers
// ==========================================
export const createProject = async (
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

    // Resolve member id of the current user
    const member = await prisma.member.findUnique({
      where: { userId: req.user!.userId },
    });

    if (!member) {
      res.status(400).json({ success: false, message: 'User is not registered as a member.' });
      return;
    }

    const { title, description, githubUrl, demoUrl, techStack } = req.body;
    const project = await collabService.createProject(societyId, {
      title,
      description,
      githubUrl,
      demoUrl,
      techStack,
      ownerId: member.id,
    });

    res.status(201).json({ success: true, project });
  } catch (error) {
    next(error);
  }
};

export const listProjects = async (
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

    const projects = await collabService.listProjects(societyId);
    res.status(200).json({ success: true, projects });
  } catch (error) {
    next(error);
  }
};

export const getProject = async (
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
    const project = await collabService.getProject(id, societyId);

    if (!project) {
      res.status(404).json({ success: false, message: 'Project not found.' });
      return;
    }

    res.status(200).json({ success: true, project });
  } catch (error) {
    next(error);
  }
};

export const addProjectMember = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params; // project id
    const { memberId, role } = req.body;

    const pm = await collabService.addProjectMember(id, memberId, role);
    res.status(201).json({ success: true, member: pm });
  } catch (error) {
    next(error);
  }
};

export const addProjectMilestone = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params; // project id
    const { title, description, dueDate } = req.body;

    const ms = await collabService.addProjectMilestone(id, title, description, dueDate);
    res.status(201).json({ success: true, milestone: ms });
  } catch (error) {
    next(error);
  }
};

export const addProjectTask = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params; // project id
    const { title, description, priority, assigneeId, dueDate } = req.body;

    const task = await collabService.addProjectTask(id, {
      title,
      description,
      priority,
      assigneeId,
      dueDate,
    });

    res.status(201).json({ success: true, task });
  } catch (error) {
    next(error);
  }
};

export const updateTaskStatus = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    const updated = await collabService.updateTaskStatus(taskId, status);
    res.status(200).json({ success: true, task: updated });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 2. Events controllers
// ==========================================
export const createEvent = async (
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

    const { title, description, bannerUrl, startDate, endDate, location, budget, speakers, sponsors } = req.body;

    const event = await collabService.createEvent(societyId, {
      title,
      description,
      bannerUrl,
      startDate,
      endDate,
      location,
      budget: Number(budget),
      speakers,
      sponsors,
    });

    res.status(201).json({ success: true, event });
  } catch (error) {
    next(error);
  }
};

export const listEvents = async (
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

    const events = await collabService.listEvents(societyId);
    res.status(200).json({ success: true, events });
  } catch (error) {
    next(error);
  }
};

export const getEvent = async (
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
    const event = await collabService.getEvent(id, societyId);

    if (!event) {
      res.status(404).json({ success: false, message: 'Event not found.' });
      return;
    }

    res.status(200).json({ success: true, event });
  } catch (error) {
    next(error);
  }
};

export const registerForEvent = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const member = await prisma.member.findUnique({
      where: { userId: req.user?.userId },
    });

    if (!member) {
      res.status(400).json({ success: false, message: 'User is not registered as a member.' });
      return;
    }

    const { id } = req.params; // event id
    const registration = await collabService.registerForEvent(id, member.id);

    res.status(201).json({ success: true, registration });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Already registered or failed to register.',
    });
  }
};

export const checkInAttendee = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const societyId = req.user?.societyId;
    const userId = req.user?.userId;
    if (!societyId || !userId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params; // event id
    const { checkInCode } = req.body;

    const member = await prisma.member.findUnique({
      where: { userId },
    });

    if (!member) {
      res.status(400).json({ success: false, message: 'User is not registered as a member.' });
      return;
    }

    const registration = await collabService.checkInAttendee(id, checkInCode, societyId);
    res.status(200).json({
      success: true,
      message: `Checked in attendee: ${registration.member.firstName} ${registration.member.lastName}`,
      registration,
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message || 'Checkin failed.' });
  }
};

// ==========================================
// 3. Portfolios controllers
// ==========================================
export const updatePortfolio = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const member = await prisma.member.findUnique({
      where: { userId: req.user?.userId },
    });

    if (!member) {
      res.status(400).json({ success: false, message: 'User is not registered as a member.' });
      return;
    }

    const { bio, skills, githubUrl, linkedinUrl, resumeUrl, portfolioUrl, techStack } = req.body;
    const updated = await collabService.updateMemberPortfolio(member.id, {
      bio,
      skills,
      githubUrl,
      linkedinUrl,
      resumeUrl,
      portfolioUrl,
      techStack,
    });

    res.status(200).json({ success: true, portfolio: updated });
  } catch (error) {
    next(error);
  }
};

export const getPortfolio = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params; // member id
    const portfolio = await collabService.getMemberPortfolio(id);

    if (!portfolio) {
      res.status(404).json({ success: false, message: 'Portfolio not found.' });
      return;
    }

    res.status(200).json({ success: true, portfolio });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 4. AI Hub controllers
// ==========================================
export const aiEventPlanner = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { title, description } = req.body;
    const plan = await aiHubService.eventPlanner(title, description);
    res.status(200).json({ success: true, plan });
  } catch (error) {
    next(error);
  }
};

export const aiResumeReview = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { skills, bio, techStack } = req.body;
    const review = await aiHubService.resumeReviewer(skills, bio, techStack);
    res.status(200).json({ success: true, review });
  } catch (error) {
    next(error);
  }
};

export const aiGenerateWriting = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { type, prompt } = req.body;
    const result = await aiHubService.generateWriting(type, prompt);
    res.status(200).json({ success: true, result });
  } catch (error) {
    next(error);
  }
};
