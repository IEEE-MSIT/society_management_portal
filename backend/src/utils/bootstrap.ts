import prisma from '../config/db.js';
import bcrypt from 'bcrypt';

export async function bootstrapDatabase() {
  try {
    console.log('🔄 Bootstrapping default roles and permissions...');

    // 1. Create permissions
    const permissionNames = [
      'member:read', 'member:create', 'member:update', 'member:delete',
      'complaint:read', 'complaint:create', 'complaint:update', 'complaint:delete',
      'notice:read', 'notice:create', 'notice:update', 'notice:delete',
      'booking:read', 'booking:create', 'booking:update', 'booking:delete',
      'visitor:read', 'visitor:create', 'visitor:update', 'visitor:delete'
    ];

    const permissionsMap: Record<string, any> = {};
    for (const name of permissionNames) {
      let perm = await prisma.permission.findUnique({ where: { name } });
      if (!perm) {
        perm = await prisma.permission.create({
          data: { name, description: `Allows action ${name}` }
        });
      }
      permissionsMap[name] = perm;
    }

    // 2. Ensure default society
    let defaultSociety = await prisma.society.findFirst();
    if (!defaultSociety) {
      defaultSociety = await prisma.society.create({
        data: { name: 'Default Society' }
      });
      console.log('👉 Created Default Society');
    }

    // 3. Ensure default roles for default society
    const rolesToCreate = [
      { name: 'Core Admin', desc: 'Administrator with full management privileges', perms: Object.keys(permissionsMap) },
      {
        name: 'Core Team Lead',
        desc: 'Team leader with write privileges',
        perms: [
          'member:read', 'member:create', 'member:update',
          'complaint:read', 'complaint:create', 'complaint:update',
          'notice:read', 'notice:create', 'notice:update',
          'booking:read', 'booking:create', 'booking:update',
          'visitor:read', 'visitor:create', 'visitor:update'
        ]
      },
      {
        name: 'General Member',
        desc: 'Standard member with read-only access',
        perms: [
          'member:read', 'complaint:read', 'complaint:create',
          'notice:read', 'booking:read', 'booking:create',
          'visitor:read', 'visitor:create'
        ]
      }
    ];

    for (const roleInfo of rolesToCreate) {
      let role = await prisma.role.findFirst({
        where: { name: roleInfo.name, societyId: defaultSociety.id }
      });
      if (!role) {
        role = await prisma.role.create({
          data: {
            name: roleInfo.name,
            description: roleInfo.desc,
            societyId: defaultSociety.id
          }
        });
        console.log(`👉 Created default role: ${roleInfo.name}`);
      }

      // Sync permissions to this role
      for (const pName of roleInfo.perms) {
        const perm = permissionsMap[pName];
        if (perm) {
          const existingRp = await prisma.rolePermission.findUnique({
            where: {
              roleId_permissionId: {
                roleId: role.id,
                permissionId: perm.id
              }
            }
          });
          if (!existingRp) {
            await prisma.rolePermission.create({
              data: {
                roleId: role.id,
                permissionId: perm.id
              }
            });
          }
        }
      }
    }

    // 4. Ensure admin user gou4371@gmail.com exists with Core Admin role
    const adminEmail = 'gou4371@gmail.com';
    const adminPassword = 'Gou@302005';
    const saltRounds = 10;
    const adminPasswordHash = await bcrypt.hash(adminPassword, saltRounds);

    const adminRole = await prisma.role.findFirst({
      where: { name: 'Core Admin', societyId: defaultSociety.id }
    });

    if (adminRole) {
      const existingUser = await prisma.user.findUnique({
        where: { email: adminEmail }
      });

      if (!existingUser) {
        const newUser = await prisma.user.create({
          data: {
            email: adminEmail,
            passwordHash: adminPasswordHash,
            status: 'ACTIVE',
            societyId: defaultSociety.id,
            roleId: adminRole.id
          }
        });
        await prisma.member.create({
          data: {
            userId: newUser.id,
            societyId: defaultSociety.id,
            firstName: 'Gourav',
            lastName: 'Admin',
            phone: '0000000000',
            unitNumber: 'Admin-1',
          }
        });
        console.log(`👉 Created admin user: ${adminEmail}`);
      } else {
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            passwordHash: adminPasswordHash,
            roleId: adminRole.id,
            status: 'ACTIVE'
          }
        });
        console.log(`👉 Updated existing user to Core Admin: ${adminEmail}`);
      }
    }

    console.log('✅ Database bootstrap completed successfully.');
  } catch (error) {
    console.error('❌ Error during database bootstrap:', error);
  }
}
