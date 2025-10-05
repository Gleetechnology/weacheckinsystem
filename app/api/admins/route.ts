import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createPrismaClient } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const prisma = createPrismaClient();
  try {
    const admins = await prisma.admin.findMany({
      select: {
        id: true,
        username: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ admins });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch admins' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
  console.log('Admin creation request received');
  const prisma = createPrismaClient();
  try {
    console.log('Parsing request body');
    const { username, password } = await request.json();
    console.log('Request parsed:', { username: username ? 'provided' : 'missing', password: password ? 'provided' : 'missing' });

    if (!username || !password) {
      console.log('Missing username or password');
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    console.log('Checking for existing admin');
    // Check if admin already exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { username },
    });
    console.log('Existing admin check result:', existingAdmin ? 'exists' : 'not found');

    if (existingAdmin) {
      return NextResponse.json({ error: 'Admin with this username already exists' }, { status: 400 });
    }

    console.log('Hashing password');
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Password hashed successfully');

    console.log('Creating admin in database');
    // Create admin
    const admin = await prisma.admin.create({
      data: {
        username,
        password: hashedPassword,
      },
      select: {
        id: true,
        username: true,
        createdAt: true,
      },
    });
    console.log('Admin created successfully:', admin.id);

    return NextResponse.json({ admin, message: 'Admin created successfully' });
  } catch (error) {
    console.error('Admin creation error:', error);
    return NextResponse.json({ error: 'Failed to create admin' }, { status: 500 });
  } finally {
    console.log('Disconnecting prisma');
    await prisma.$disconnect();
  }
}

export async function DELETE(request: NextRequest) {
  const prisma = createPrismaClient();
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; username: string };
    } catch (jwtError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Admin ID is required' }, { status: 400 });
    }

    // Prevent deleting yourself
    if (id === decoded.id) {
      return NextResponse.json({ error: 'Cannot delete your own admin account' }, { status: 400 });
    }

    // Check if admin exists
    const admin = await prisma.admin.findUnique({
      where: { id },
    });

    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    await prisma.admin.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Admin deleted successfully' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete admin' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}