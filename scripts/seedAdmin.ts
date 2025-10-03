import bcrypt from 'bcryptjs';
import { prisma } from '../app/src/lib/prisma';

async function seedAdmin() {
  const existingAdmin = await prisma.admin.findUnique({ where: { username: 'admin' } });
  if (existingAdmin) {
    console.log('Admin already exists');
    return;
  }

  const hashedPassword = await bcrypt.hash('password', 10);
  await prisma.admin.create({
    data: {
      username: 'admin',
      password: hashedPassword,
    },
  });

  console.log('Admin created');
}

seedAdmin().catch(console.error);