import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
import { createPrismaClient } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const prisma = createPrismaClient();
  try {
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