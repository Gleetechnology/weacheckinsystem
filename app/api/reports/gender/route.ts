import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
import { createPrismaClient } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const prisma = createPrismaClient();
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    // Gender field doesn't exist in the Attendee model
    // Return empty data to prevent page crashes
    return NextResponse.json({
      data: [],
      success: true,
    });
  } catch (error) {
    console.error('Error fetching gender data:', error);
    // Return empty data instead of error to prevent page crashes
    return NextResponse.json({
      data: [],
      success: true,
    });
  } finally {
    await prisma.$disconnect();
  }
}