import { VisitorRepository } from '../repositories/visitorRepository.js';
import { emitToSociety } from '../config/socket.js';

const visitorRepo = new VisitorRepository();

export class VisitorService {
  async preRegister(societyId: string, name: string, phone: string, purpose: string) {
    // Generate a 6-digit secure numeric OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const qrCodeUrl = `${backendUrl}/api/v1/visitors/verify-qr?otp=${otpCode}&societyId=${societyId}`;

    const visitor = await visitorRepo.create({
      societyId,
      name,
      phone,
      purpose,
      otpCode,
      qrCodeUrl,
    });

    return visitor;
  }

  async verifyEntry(societyId: string, otpCode: string) {
    const visitor = await visitorRepo.findByOtp(otpCode, societyId);

    if (!visitor) {
      throw new Error('Visitor pass not found or invalid OTP code.');
    }

    if (visitor.status !== 'PENDING') {
      throw new Error(`Visitor has already checked in or pass is invalid (current status: ${visitor.status}).`);
    }

    const checkInTime = new Date();
    await visitorRepo.update(visitor.id, societyId, {
      status: 'APPROVED',
      checkIn: checkInTime,
    });

    // Broadcast check-in real-time
    emitToSociety(societyId, 'visitor_status_changed', {
      id: visitor.id,
      status: 'APPROVED',
      checkIn: checkInTime.toISOString(),
      checkOut: null,
    });

    return {
      message: 'Entry check-in verified successfully.',
      visitorName: visitor.name,
      checkInTime,
    };
  }

  async verifyExit(societyId: string, visitorId: string) {
    const visitor = await visitorRepo.findById(visitorId, societyId);

    if (!visitor) {
      throw new Error('Visitor records not found.');
    }

    if (visitor.status !== 'APPROVED') {
      throw new Error(`Cannot verify exit: visitor is not currently checked-in (current status: ${visitor.status}).`);
    }

    const checkOutTime = new Date();
    await visitorRepo.update(visitorId, societyId, {
      status: 'COMPLETED',
      checkOut: checkOutTime,
    });

    // Broadcast check-out real-time
    emitToSociety(societyId, 'visitor_status_changed', {
      id: visitorId,
      status: 'COMPLETED',
      checkIn: visitor.checkIn ? visitor.checkIn.toISOString() : null,
      checkOut: checkOutTime.toISOString(),
    });

    return {
      message: 'Exit check-out verified successfully.',
      visitorName: visitor.name,
      checkOutTime,
    };
  }

  async cancelPass(societyId: string, visitorId: string) {
    const visitor = await visitorRepo.findById(visitorId, societyId);

    if (!visitor) {
      throw new Error('Visitor records not found.');
    }

    if (visitor.status !== 'PENDING') {
      throw new Error(`Cannot cancel pass: visitor status is already ${visitor.status}.`);
    }

    await visitorRepo.update(visitorId, societyId, {
      status: 'CANCELLED',
    });

    // Broadcast cancel update real-time
    emitToSociety(societyId, 'visitor_status_changed', {
      id: visitorId,
      status: 'CANCELLED',
      checkIn: null,
      checkOut: null,
    });

    return {
      message: 'Visitor pass cancelled successfully.',
      visitorId,
    };
  }

  async getVisitors(societyId: string) {
    return visitorRepo.findMany(societyId);
  }
}
