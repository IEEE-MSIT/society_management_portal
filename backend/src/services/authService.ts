import bcrypt from 'bcrypt';
import { UserRepository } from '../repositories/userRepository.js';
import { SessionRepository } from '../repositories/sessionRepository.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt.js';

const userRepo = new UserRepository();
const sessionRepo = new SessionRepository();

export class AuthService {
  async login(email: string, passwordString: string, deviceInfo?: string) {
    const user = await userRepo.findByEmail(email);

    if (!user || user.deletedAt) {
      throw new Error('Invalid email or password.');
    }

    if (user.status !== 'ACTIVE') {
      throw new Error('Your account is inactive. Please contact your administrator.');
    }

    if (!user.passwordHash) {
      throw new Error('Password credentials not configured for this user.');
    }

    const isPasswordValid = await bcrypt.compare(passwordString, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password.');
    }

    // Extract permissions
    const permissions = user.role.permissions.map((rp: { permission: { name: string } }) => rp.permission.name);

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      roleId: user.roleId,
      roleName: user.role.name,
      societyId: user.societyId,
      permissions,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      roleId: user.roleId,
      roleName: user.role.name,
      societyId: user.societyId,
    });

    // Create session in database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

    await sessionRepo.create({
      userId: user.id,
      token: refreshToken,
      expiresAt,
      deviceInfo,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        status: user.status,
        societyId: user.societyId,
        societyName: user.society.name,
        role: {
          id: user.role.id,
          name: user.role.name,
        },
        permissions,
        member: user.member
          ? {
              id: user.member.id,
              firstName: user.member.firstName,
              lastName: user.member.lastName,
              unitNumber: user.member.unitNumber,
              avatarUrl: user.member.avatarUrl,
            }
          : null,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    // 1. Verify Refresh Token signature
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (err) {
      throw new Error('Invalid or expired refresh token.');
    }

    // 2. Check session in database
    const session = await sessionRepo.findByToken(refreshToken);
    if (!session || session.expiresAt < new Date()) {
      if (session) {
        await sessionRepo.delete(refreshToken); // Clean up expired
      }
      throw new Error('Session has expired or been revoked.');
    }

    // 3. Retrieve fresh permissions
    const permissions = session.user.role.permissions.map((rp: { permission: { name: string } }) => rp.permission.name);

    const tokenPayload = {
      userId: session.user.id,
      email: session.user.email,
      roleId: session.user.roleId,
      roleName: session.user.role.name,
      societyId: session.user.societyId,
      permissions,
    };

    const newAccessToken = generateAccessToken(tokenPayload);

    return {
      accessToken: newAccessToken,
    };
  }

  async logout(refreshToken: string) {
    try {
      await sessionRepo.delete(refreshToken);
    } catch (err) {
      // Ignore if session not found
    }
  }

  async logoutAll(userId: string) {
    await sessionRepo.deleteAllForUser(userId);
  }
}
