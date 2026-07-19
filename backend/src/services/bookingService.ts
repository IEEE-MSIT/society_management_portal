import { FacilityRepository } from '../repositories/facilityRepository.js';
import { BookingRepository } from '../repositories/bookingRepository.js';

const facilityRepo = new FacilityRepository();
const bookingRepo = new BookingRepository();

export class BookingService {
  async createFacility(societyId: string, name: string, description?: string, costPerHour?: number) {
    return facilityRepo.create({
      societyId,
      name,
      description,
      costPerHour,
    });
  }

  async getFacilities(societyId: string) {
    return facilityRepo.findMany(societyId);
  }

  async bookFacility(societyId: string, facilityId: string, start: Date, end: Date) {
    // 1. Verify facility exists
    const facility = await facilityRepo.findById(facilityId, societyId);
    if (!facility) {
      throw new Error('Facility not found in your society.');
    }

    // 2. Validate booking window
    if (start >= end) {
      throw new Error('Booking start time must be before the end time.');
    }

    if (start < new Date()) {
      throw new Error('Cannot book facilities in the past.');
    }

    // 3. Conflict / overlap verification
    const conflicts = await bookingRepo.findConflictingBookings(facilityId, start, end);
    if (conflicts.length > 0) {
      throw new Error('Conflict detected: This facility is already booked for the selected time window.');
    }

    // 4. Create booking
    const booking = await bookingRepo.create({
      societyId,
      facilityId,
      startTime: start,
      endTime: end,
      status: 'CONFIRMED',
    });

    return booking;
  }

  async getBookings(societyId: string) {
    return bookingRepo.findMany(societyId);
  }

  async cancelBooking(bookingId: string, societyId: string) {
    await bookingRepo.updateStatus(bookingId, societyId, 'CANCELLED');
    return { message: 'Booking cancelled successfully.' };
  }
}
