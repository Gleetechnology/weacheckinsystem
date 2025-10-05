import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

async function seedAdmin() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DIRECT_URL,
      },
    },
  });
  try {
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
  } finally {
    await prisma.$disconnect();
  }
}

seedAdmin().catch(console.error);