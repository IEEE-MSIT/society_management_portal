import { ComplaintRepository } from '../repositories/complaintRepository.js';
import { AIService } from './aiService.js';
import { emitToSociety } from '../config/socket.js';
import { mailQueue } from '../utils/queue.js';

export class ComplaintService {
  private complaintRepo = new ComplaintRepository();
  private aiService = new AIService();

  async createComplaint(data: {
    societyId: string;
    creatorId: string;
    title: string;
    description: string;
  }) {
    // 1. Run Gemini AI classification
    console.log(`Analyzing complaint with AI: "${data.title}"`);
    const aiResult = await this.aiService.classifyComplaint(data.title, data.description);
    
    // 2. Persist in database with AI tags
    const complaint = await this.complaintRepo.create({
      societyId: data.societyId,
      creatorId: data.creatorId,
      title: data.title,
      description: data.description,
      category: aiResult.category,
      priority: aiResult.priority,
      status: 'OPEN',
    });

    const firstName = complaint.creator?.member?.firstName || 'Resident';
    const lastName = complaint.creator?.member?.lastName || '';

    // 3. Broadcast real-time Socket.IO alert
    emitToSociety(data.societyId, 'complaint_created', {
      id: complaint.id,
      title: complaint.title,
      description: complaint.description,
      category: complaint.category,
      priority: complaint.priority,
      status: complaint.status,
      createdAt: complaint.createdAt,
      member: {
        firstName,
        lastName,
      },
    });

    // 4. Queue background email notification to admin/treasurer
    await mailQueue.add('sendComplaintAlert', {
      email: 'admin@greenwood.com', // fallback mock notification target
      complaintTitle: complaint.title,
    });

    return complaint;
  }

  async getComplaint(id: string, societyId: string) {
    return this.complaintRepo.findById(id, societyId);
  }

  async listComplaints(societyId: string, filters: { category?: string; priority?: string; status?: string }) {
    return this.complaintRepo.list(societyId, filters);
  }

  async updateComplaintStatus(id: string, societyId: string, status: string) {
    const updated = await this.complaintRepo.update(id, societyId, { status });

    // Broadcast status change real-time
    emitToSociety(societyId, 'complaint_status_changed', {
      id: updated.id,
      status: updated.status,
    });

    return updated;
  }
}
