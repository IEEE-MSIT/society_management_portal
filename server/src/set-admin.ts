import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
const prisma = new PrismaClient();

async function main() {
  const email = 'gou4371@gmail.com';
  const password = 'Gou@302005';
  
  console.log(`Ensuring society and admin role exist...`);
  
  const society = await prisma.society.findFirst({
    where: { name: 'Greenwood Society' }
  });
  
  if (!society) {
    throw new Error('Greenwood Society not found. Please run seed first.');
  }
  
  const role = await prisma.role.findFirst({
    where: {
      name: 'Core Admin',
      societyId: society.id
    }
  });
  
  if (!role) {
    throw new Error('Core Admin role not found. Please run seed first.');
  }

  console.log(`Setting password and admin role for ${email} in local database...`);
  const passwordHash = await bcrypt.hash(password, 10);

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  let userId: string;

  if (existingUser) {
    const updated = await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        passwordHash,
        roleId: role.id,
        societyId: society.id,
        status: 'ACTIVE'
      },
    });
    userId = updated.id;
    console.log(`Updated existing user ${email} to Core Admin!`);
  } else {
    const created = await prisma.user.create({
      data: {
        email,
        passwordHash,
        roleId: role.id,
        societyId: society.id,
        status: 'ACTIVE'
      }
    });
    userId = created.id;
    console.log(`Created new user ${email} as Core Admin!`);
  }

  // Ensure member record exists
  const existingMember = await prisma.member.findUnique({
    where: { userId }
  });

  if (existingMember) {
    await prisma.member.update({
      where: { id: existingMember.id },
      data: {
        firstName: 'Gourav',
        lastName: 'Admin',
        unitNumber: 'A-100',
        societyId: society.id
      }
    });
    console.log(`Updated member record for Gourav Admin.`);
  } else {
    await prisma.member.create({
      data: {
        userId,
        societyId: society.id,
        firstName: 'Gourav',
        lastName: 'Admin',
        unitNumber: 'A-100'
      }
    });
    console.log(`Created member record for Gourav Admin.`);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

