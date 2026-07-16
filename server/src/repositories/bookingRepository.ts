import prisma from '../config/db.js';

export interface CreateBookingInput {
  societyId: string;
  facilityId: string;
  startTime: Date;
  endTime: Date;
  status?: string;
}

export class BookingRepository {
  async create(data: CreateBookingInput) {
    return prisma.booking.create({
      data,
    });
  }

  async findConflictingBookings(facilityId: string, startTime: Date, endTime: Date) {
    return prisma.booking.findMany({
      where: {
        facilityId,
        status: 'CONFIRMED',
        AND: [
          {
            startTime: {
              lt: endTime,
            },
          },
          {
            endTime: {
              gt: startTime,
            },
          },
        ],
      },
    });
  }

  async findMany(societyId: string) {
    return prisma.booking.findMany({
      where: { societyId },
      include: {
        facility: true,
      },
      orderBy: { startTime: 'desc' },
    });
  }

  async updateStatus(id: string, societyId: string, status: string) {
    return prisma.booking.updateMany({
      where: { id, societyId },
      data: { status },
    });
  }
}
