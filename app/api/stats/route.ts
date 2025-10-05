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
    const [total, checkedIn] = await Promise.all([
      prisma.attendee.count(),
      prisma.attendee.count({ where: { checkedIn: true } }),
    ]);
    const pending = total - checkedIn;

    return NextResponse.json({ total, checkedIn, pending });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}