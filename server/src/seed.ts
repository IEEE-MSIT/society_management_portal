import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with new multi-tenant schema...');

  // 1. Clean existing records (in reverse order of dependencies)
  console.log('Cleaning old records...');
  await prisma.auditLog.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.facility.deleteMany({});
  await prisma.transaction.deleteMany({});
  await prisma.complaintTask.deleteMany({});
  await prisma.attachment.deleteMany({});
  await prisma.complaint.deleteMany({});
  await prisma.visitor.deleteMany({});
  await prisma.member.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.rolePermission.deleteMany({});
  await prisma.permission.deleteMany({});
  await prisma.role.deleteMany({});
  await prisma.society.deleteMany({});

  const passwordHash = await bcrypt.hash('Password123', 10);

  // 2. Create Global System Permissions
  console.log('Creating global permissions...');
  const permissionNames = [
    'member:read', 'member:create', 'member:update', 'member:delete',
    'complaint:read', 'complaint:create', 'complaint:update', 'complaint:delete',
    'notice:read', 'notice:create', 'notice:update', 'notice:delete',
    'booking:read', 'booking:create', 'booking:update', 'booking:delete',
    'visitor:read', 'visitor:create', 'visitor:update', 'visitor:delete'
  ];

  const permissionsMap: Record<string, any> = {};
  for (const name of permissionNames) {
    const permission = await prisma.permission.create({
      data: {
        name,
        description: `Allows action ${name}`,
      },
    });
    permissionsMap[name] = permission;
  }

  // 3. Create Society A: Greenwood Society
  console.log('Creating societies...');
  const greenwood = await prisma.society.create({
    data: {
      name: 'Greenwood Society',
      address: '123 Forest Hill Road',
      city: 'Delhi',
      state: 'Delhi',
      zipCode: '110001',
    },
  });

  // Create Society B: Skyline Residency
  const skyline = await prisma.society.create({
    data: {
      name: 'Skyline Residency',
      address: '456 Cyber City Boulevard',
      city: 'Gurugram',
      state: 'Haryana',
      zipCode: '122002',
    },
  });

  const societies = [greenwood, skyline];

  for (const society of societies) {
    console.log(`Setting up Roles, Permissions, and Users for: ${society.name}`);

    // 4. Create Society-specific Roles
    const rAdmin = await prisma.role.create({
      data: { name: 'Core Admin', description: 'Administrator with full management privileges', societyId: society.id },
    });
    const rLead = await prisma.role.create({
      data: { name: 'Core Team Lead', description: 'Team leader with write privileges', societyId: society.id },
    });
    const rMember = await prisma.role.create({
      data: { name: 'General Member', description: 'Standard member with read-only access', societyId: society.id },
    });

    // 5. Map permissions to roles
    // Admin gets all permissions
    await prisma.rolePermission.createMany({
      data: Object.values(permissionsMap).map((p) => ({
        roleId: rAdmin.id,
        permissionId: p.id,
      })),
    });

    // Lead gets read, create, update permissions
    const leadPermissionNames = [
      'member:read', 'member:create', 'member:update',
      'complaint:read', 'complaint:create', 'complaint:update',
      'notice:read', 'notice:create', 'notice:update',
      'booking:read', 'booking:create', 'booking:update',
      'visitor:read', 'visitor:create', 'visitor:update'
    ];
    await prisma.rolePermission.createMany({
      data: leadPermissionNames.map((name) => ({
        roleId: rLead.id,
        permissionId: permissionsMap[name].id,
      })),
    });

    // Member gets read-only and booking/visitor creations
    const memberPermissionNames = [
      'member:read', 'complaint:read', 'complaint:create',
      'notice:read', 'booking:read', 'booking:create',
      'visitor:read', 'visitor:create'
    ];
    await prisma.rolePermission.createMany({
      data: memberPermissionNames.map((name) => ({
        roleId: rMember.id,
        permissionId: permissionsMap[name].id,
      })),
    });

    // 6. Create Users & Members
    const domain = society.id === greenwood.id ? 'greenwood.com' : 'skyline.com';

    // Admin User
    const uAdmin = await prisma.user.create({
      data: {
        email: `admin@${domain}`,
        passwordHash,
        status: 'ACTIVE',
        roleId: rAdmin.id,
        societyId: society.id,
      },
    });

    await prisma.member.create({
      data: {
        userId: uAdmin.id,
        societyId: society.id,
        firstName: 'Amit',
        lastName: society.id === greenwood.id ? 'Sharma' : 'Verma',
        phone: society.id === greenwood.id ? '9876543210' : '9876543211',
        unitNumber: 'A-101',
        avatarUrl: null,
      },
    });

    // Team Lead User
    const uLead = await prisma.user.create({
      data: {
        email: `lead@${domain}`,
        passwordHash,
        status: 'ACTIVE',
        roleId: rLead.id,
        societyId: society.id,
      },
    });

    await prisma.member.create({
      data: {
        userId: uLead.id,
        societyId: society.id,
        firstName: 'Priya',
        lastName: society.id === greenwood.id ? 'Patel' : 'Rao',
        phone: society.id === greenwood.id ? '9876543220' : '9876543221',
        unitNumber: 'B-202',
        avatarUrl: null,
      },
    });

    // General Member User
    const uMember = await prisma.user.create({
      data: {
        email: `member@${domain}`,
        passwordHash,
        status: 'ACTIVE',
        roleId: rMember.id,
        societyId: society.id,
      },
    });

    await prisma.member.create({
      data: {
        userId: uMember.id,
        societyId: society.id,
        firstName: 'Rahul',
        lastName: society.id === greenwood.id ? 'Kumar' : 'Gupta',
        phone: society.id === greenwood.id ? '9876543230' : '9876543231',
        unitNumber: 'C-303',
        avatarUrl: null,
      },
    });

    // Seeding 12 mock members (Greenwood only)
    if (society.id === greenwood.id) {
      console.log('Seeding additional mock members for pagination testing...');
      const firstNames = [
        'Aakash', 'Neha', 'Rohan', 'Anjali', 'Vikram',
        'Sneha', 'Siddharth', 'Divya', 'Karan', 'Aditi',
        'Vijay', 'Pooja'
      ];
      const lastNames = [
        'Singh', 'Joshi', 'Mehta', 'Nair', 'Chawla',
        'Kapoor', 'Reddy', 'Bose', 'Sen', 'Dutta',
        'Mishra', 'Trivedi'
      ];

      for (let i = 0; i < 12; i++) {
        const uTemp = await prisma.user.create({
          data: {
            email: `resident${i + 1}@greenwood.com`,
            passwordHash,
            status: i % 5 === 0 ? 'INACTIVE' : 'ACTIVE',
            roleId: rMember.id,
            societyId: greenwood.id,
          },
        });

        await prisma.member.create({
          data: {
            userId: uTemp.id,
            societyId: greenwood.id,
            firstName: firstNames[i],
            lastName: lastNames[i],
            phone: `90000000${i.toString().padStart(2, '0')}`,
            unitNumber: `D-${101 + i}`,
            avatarUrl: null,
          },
        });
      }
    }
  }

  console.log('Database seeded successfully with new schema models!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
