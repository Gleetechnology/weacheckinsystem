import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
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
  }
}

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    // Check if admin already exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { username },
    });

    if (existingAdmin) {
      return NextResponse.json({ error: 'Admin with this username already exists' }, { status: 400 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

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

    return NextResponse.json({ admin, message: 'Admin created successfully' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create admin' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Admin ID is required' }, { status: 400 });
    }

    // Check if admin exists
    const admin = await prisma.admin.findUnique({
      where: { id },
    });

    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    // Don't allow deleting the current admin (you'd need to get current admin from token)
    // For now, just delete
    await prisma.admin.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Admin deleted successfully' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete admin' }, { status: 500 });
  }
}