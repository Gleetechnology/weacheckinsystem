import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Test database connection
    await prisma.$connect();

    // Check if admin exists
    const adminCount = await prisma.admin.count();

    // Get admin details (without password)
    const admins = await prisma.admin.findMany({
      select: {
        id: true,
        username: true,
        createdAt: true,
      }
    });

    return NextResponse.json({
      debug: {
        databaseConnected: true,
        adminCount,
        admins,
      },
      success: true,
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return NextResponse.json(
      {
        error: 'Database connection failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}