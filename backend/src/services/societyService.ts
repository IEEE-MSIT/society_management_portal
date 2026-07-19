import bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import prisma from '../config/db.js';
import { SocietyRepository } from '../repositories/societyRepository.js';
import { UserRepository } from '../repositories/userRepository.js';
import { MemberRepository } from '../repositories/memberRepository.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.js';

const societyRepo = new SocietyRepository();
const userRepo = new UserRepository();
const memberRepo = new MemberRepository();

export interface RegisterSocietyInput {
  societyName: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  adminEmail: string;
  adminPassword?: string;
  adminFirstName: string;
  adminLastName: string;
  unitNumber: string;
  phone?: string;
}

export class SocietyService {
  async register(input: RegisterSocietyInput) {
    const {
      societyName,
      address,
      city,
      state,
      zipCode,
      adminEmail,
      adminPassword = 'Password123',
      adminFirstName,
      adminLastName,
      unitNumber,
      phone,
    } = input;

    // 1. Validations
    const existingSociety = await societyRepo.findByName(societyName);
    if (existingSociety) {
      throw new Error(`Society with name "${societyName}" already exists.`);
    }

    const existingUser = await userRepo.findByEmail(adminEmail);
    if (existingUser) {
      throw new Error(`User with email "${adminEmail}" already registered.`);
    }

    const passwordHash = await bcrypt.hash(adminPassword, 10);

    // 2. Database transaction to create everything
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // a. Create Society
      const society = await tx.society.create({
        data: {
          name: societyName,
          address,
          city,
          state,
          zipCode,
        },
      });

      // b. Create default Roles
      const adminRole = await tx.role.create({
        data: { name: 'Core Admin', description: 'Administrator with full management privileges', societyId: society.id },
      });
      const leadRole = await tx.role.create({
        data: { name: 'Core Team Lead', description: 'Team leader with write privileges', societyId: society.id },
      });
      const memberRole = await tx.role.create({
        data: { name: 'General Member', description: 'Standard member with read-only access', societyId: society.id },
      });

      // c. Create standard Permissions (idempotently lookup or create)
      const permissionNames = [
        'member:read', 'member:create', 'member:update', 'member:delete',
        'complaint:read', 'complaint:create', 'complaint:update', 'complaint:delete',
        'notice:read', 'notice:create', 'notice:update', 'notice:delete',
        'booking:read', 'booking:create', 'booking:update', 'booking:delete',
        'visitor:read', 'visitor:create', 'visitor:update', 'visitor:delete'
      ];

      const permissions = await Promise.all(
        permissionNames.map(async (name) => {
          let p = await tx.permission.findUnique({ where: { name } });
          if (!p) {
            p = await tx.permission.create({ data: { name, description: `Access permission for ${name}` } });
          }
          return p;
        })
      );

      // d. Assign permissions to Admin role
      await tx.rolePermission.createMany({
        data: permissions.map((p) => ({
          roleId: adminRole.id,
          permissionId: p.id,
        })),
      });

      // e. Assign read permissions to General Member
      const readPermissions = permissions.filter((p) => 
        ['member:read', 'complaint:create', 'complaint:read', 'notice:read', 'booking:create', 'booking:read', 'visitor:create', 'visitor:read'].includes(p.name)
      );
      await tx.rolePermission.createMany({
        data: readPermissions.map((p) => ({
          roleId: memberRole.id,
          permissionId: p.id,
        })),
      });

      // f. Create Admin User
      const user = await tx.user.create({
        data: {
          email: adminEmail,
          passwordHash,
          roleId: adminRole.id,
          societyId: society.id,
          status: 'ACTIVE',
        },
      });

      // g. Create Member record
      const member = await tx.member.create({
        data: {
          userId: user.id,
          societyId: society.id,
          firstName: adminFirstName,
          lastName: adminLastName,
          unitNumber,
          phone,
        },
      });

      return { society, user, member, adminRole };
    });

    // 3. Generate tokens for onboarding login
    const tokenPayload = {
      userId: result.user.id,
      email: result.user.email,
      roleId: result.user.roleId,
      roleName: result.adminRole.name,
      societyId: result.society.id,
      permissions: ['*'], // Admin has wildcard
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken({
      userId: result.user.id,
      email: result.user.email,
      roleId: result.user.roleId,
      roleName: result.adminRole.name,
      societyId: result.society.id,
    });

    return {
      society: result.society,
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.member.firstName,
        lastName: result.member.lastName,
        role: result.adminRole.name,
      },
      accessToken,
      refreshToken,
    };
  }
}
