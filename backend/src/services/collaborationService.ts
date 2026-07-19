import prisma from '../config/db.js';

export class CollaborationService {
  // ==========================================
  // 1. Projects & Kanban Task Management
  // ==========================================
  async createProject(
    societyId: string,
    data: {
      title: string;
      description: string;
      githubUrl?: string;
      demoUrl?: string;
      techStack: string;
      ownerId: string;
    }
  ) {
    const project = await prisma.project.create({
      data: {
        societyId,
        title: data.title,
        description: data.description,
        githubUrl: data.githubUrl,
        demoUrl: data.demoUrl,
        techStack: data.techStack,
      },
    });

    // Add owner as Lead Project Member
    await prisma.projectMember.create({
      data: {
        projectId: project.id,
        memberId: data.ownerId,
        role: 'OWNER',
      },
    });

    // Log default contribution points for project setup
    await this.logContribution(societyId, data.ownerId, 'TECHNICAL', `Created collaboration project: ${data.title}`, 20);

    return project;
  }

  async listProjects(societyId: string) {
    return prisma.project.findMany({
      where: { societyId },
      include: {
        members: {
          include: { member: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getProject(projectId: string, societyId: string) {
    return prisma.project.findFirst({
      where: { id: projectId, societyId },
      include: {
        members: {
          include: { member: true },
        },
        milestones: true,
        tasks: {
          include: { assignee: true },
        },
      },
    });
  }

  async addProjectMember(projectId: string, memberId: string, role: string) {
    return prisma.projectMember.create({
      data: { projectId, memberId, role },
      include: { member: true },
    });
  }

  async addProjectMilestone(projectId: string, title: string, description: string, dueDate: string) {
    return prisma.projectMilestone.create({
      data: {
        projectId,
        title,
        description,
        dueDate: new Date(dueDate),
      },
    });
  }

  async addProjectTask(
    projectId: string,
    data: {
      title: string;
      description?: string;
      priority?: string;
      assigneeId?: string;
      dueDate?: string;
    }
  ) {
    return prisma.projectTask.create({
      data: {
        projectId,
        title: data.title,
        description: data.description,
        priority: data.priority || 'MEDIUM',
        assigneeId: data.assigneeId,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
      },
      include: { assignee: true },
    });
  }

  async updateTaskStatus(taskId: string, status: string) {
    const updated = await prisma.projectTask.update({
      where: { id: taskId },
      data: { status },
      include: { assignee: true, project: true },
    });

    // If completed, award contribution points to assignee
    if (status === 'DONE' && updated.assigneeId) {
      await this.logContribution(
        updated.project.societyId,
        updated.assigneeId,
        'TECHNICAL',
        `Completed Kanban task: "${updated.title}" in project "${updated.project.title}"`,
        10
      );
    }

    return updated;
  }

  // ==========================================
  // 2. Event Lifecycle Management
  // ==========================================
  async createEvent(
    societyId: string,
    data: {
      title: string;
      description: string;
      bannerUrl?: string;
      startDate: string;
      endDate: string;
      location: string;
      budget?: number;
      speakers?: string;
      sponsors?: string;
    }
  ) {
    return prisma.event.create({
      data: {
        societyId,
        title: data.title,
        description: data.description,
        bannerUrl: data.bannerUrl,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        location: data.location,
        budget: data.budget || 0.0,
        speakerInfo: data.speakers,
        sponsorInfo: data.sponsors,
      },
    });
  }

  async listEvents(societyId: string) {
    return prisma.event.findMany({
      where: { societyId },
      include: {
        registrations: true,
      },
      orderBy: { startDate: 'asc' },
    });
  }

  async getEvent(eventId: string, societyId: string) {
    return prisma.event.findFirst({
      where: { id: eventId, societyId },
      include: {
        registrations: {
          include: { member: true },
        },
      },
    });
  }

  async registerForEvent(eventId: string, memberId: string) {
    // Generate secure checkin code
    const checkInCode = 'EV-' + Math.floor(100000 + Math.random() * 900000).toString();

    return prisma.eventRegistration.create({
      data: {
        eventId,
        memberId,
        checkInCode,
      },
      include: { event: true },
    });
  }

  async checkInAttendee(eventId: string, checkInCode: string, societyId: string) {
    const registration = await prisma.eventRegistration.findFirst({
      where: {
        checkInCode,
        eventId,
        event: { societyId },
      },
      include: { member: true, event: true },
    });

    if (!registration) {
      throw new Error('Invalid check-in code reference.');
    }

    if (registration.isCheckedIn) {
      throw new Error('Attendee is already checked-in.');
    }

    await prisma.eventRegistration.update({
      where: { id: registration.id },
      data: {
        isCheckedIn: true,
        checkInTime: new Date(),
      },
    });

    // Award attendance points
    await this.logContribution(
      societyId,
      registration.memberId,
      'VOLUNTEER',
      `Attended society event: "${registration.event.title}"`,
      5
    );

    return registration;
  }

  // ==========================================
  // 3. Portfolios & Contribution Tracker
  // ==========================================
  async updateMemberPortfolio(
    memberId: string,
    data: {
      bio?: string;
      skills?: string;
      githubUrl?: string;
      linkedinUrl?: string;
      resumeUrl?: string;
      portfolioUrl?: string;
      techStack?: string;
    }
  ) {
    return prisma.member.update({
      where: { id: memberId },
      data,
    });
  }

  async getMemberPortfolio(memberId: string) {
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      include: {
        contributions: {
          orderBy: { date: 'desc' },
        },
        projectMembers: {
          include: { project: true },
        },
        awardNominations: {
          where: { status: 'APPROVED' },
          include: { awardRule: true, winner: true },
        },
      },
    });

    if (!member) return null;

    // Calculate total contribution score
    const totalScore = member.contributions.reduce((acc: number, curr: { scorePoints: number }) => acc + curr.scorePoints, 0);

    return {
      ...member,
      totalScore,
    };
  }

  async logContribution(
    societyId: string,
    memberId: string,
    activityType: string,
    description: string,
    scorePoints: number
  ) {
    return prisma.contributionActivity.create({
      data: {
        societyId,
        memberId,
        activityType,
        description,
        scorePoints,
      },
    });
  }
}
